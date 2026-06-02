#!/usr/bin/env python3
# v1.0 · 2026-05-29 · runtime contract harness (executes routes; not a linter)
"""
DeftBrain runtime smoke harness.

Unlike audit_v2-3-2.py / backend_audit_v1_7.py / schema_contract.py / ux-smoke.py
— which are STATIC text scanners that check whether code is *shaped* right — this
tool *runs* each route against a real payload and checks whether it *behaves* right:

    200 OK  +  body parses as JSON  +  every expected top-level key is present (non-null)

That is the act you currently perform by hand when you test a tool individually.
This automates it across the catalog.

────────────────────────────────────────────────────────────────────────────
WHAT IT DOES
  1. DISCOVER  — parse backend routes for router.post paths + action-dispatch
                 cases; parse expected keys from each route's response guard
                 (if (!parsed.X)) and prose/JSON schema; parse required fields
                 from 400-guards (if (!field)). Parse src/tools/*.js for the
                 actual callToolEndpoint(route, {...}) payloads the UI sends.
  2. FIXTURES  — merge discovered payloads with a hand-written fixtures file
                 (fixtures override/augment — this is where you put REALISTIC and
                 ADVERSARIAL inputs: long arrays, unicode, the real Try-Example).
  3. RUN       — POST each route/action to BASE_URL, optionally sweeping --langs
                 and repeating --repeat times to surface nondeterminism.
  4. REPORT    — GREEN/RED per route/action with the failure reason. Exit code =
                 red count, so CI can gate on it.

USAGE
  # discovery only (no server needed) — emits a fixtures skeleton:
  python3 smoke_runtime.py --discover --backend backend/routes --frontend src/tools \
      --emit-fixtures smoke_fixtures.json

  # run against a local dev server:
  python3 smoke_runtime.py --backend backend/routes --frontend src/tools \
      --base-url http://localhost:3001 --fixtures smoke_fixtures.json

  # stress + multi-language + repeat (the coverage knobs that fight under-sampling):
  python3 smoke_runtime.py ... --stress --langs en,es,ar,zh,ja --repeat 3

  # machine-readable for CI:
  python3 smoke_runtime.py ... --json
"""

import argparse, json, os, re, sys, time, urllib.request, urllib.error

# ── route prefix on the server (adjust if your Express mounts elsewhere) ──
DEFAULT_PREFIX = "/api"

# ─────────────────────────────────────────────────────────────────────────
# DISCOVERY
# ─────────────────────────────────────────────────────────────────────────

def discover_backend(backend_dir):
    """
    Returns: { route_path: {
        'file': str,
        'actions': [str] or [None],          # None = no action dispatch (1 call/req)
        'expected_keys': set(str),           # from response guards (high confidence)
        'required_fields': set(str),         # from 400-guards (if (!field))
        'reads_body': set(str),              # from req.body destructure
    }}
    """
    routes = {}
    for fn in sorted(os.listdir(backend_dir)):
        if not fn.endswith(".js"):
            continue
        src = open(os.path.join(backend_dir, fn)).read()

        # router.post('/route-path', ...) — capture every mounted path in this file
        for rm in re.finditer(r"router\.(?:post|get)\s*\(\s*['\"]([^'\"]+)['\"]", src):
            path = rm.group(1)
            routes.setdefault(path, {
                "file": fn, "actions": set(), "expected_keys": set(),
                "required_fields": set(), "reads_body": set(),
            })

        # action-dispatch: switch(action){ case 'x': ...}  → actions for THIS file's routes
        actions = set(re.findall(r"case\s+['\"]([a-zA-Z][\w-]*)['\"]\s*:", src))
        # response guards: if (!parsed.X)  → X is an expected top-level key
        guards = set(re.findall(r"if\s*\(\s*!\s*parsed\.([a-zA-Z_]\w*)", src))
        # 400 required-field guards: if (!field ...) return res.status(400)
        required = set()
        for gm in re.finditer(r"if\s*\(\s*!\s*([a-zA-Z_]\w*)[^)]*\)\s*\{?\s*[^}]*status\(400\)", src):
            required.add(gm.group(1))
        # req.body destructure
        body = set()
        for bm in re.finditer(r"const\s*\{([^}]+)\}\s*=\s*req\.body", src):
            for part in bm.group(1).split(","):
                nm = part.strip().split(":")[0].split("=")[0].strip().lstrip(".")
                if re.match(r"^[a-zA-Z_]\w*$", nm):
                    body.add(nm)

        # attach to every route mounted in this file (best-effort; multi-route files share)
        for path, info in routes.items():
            if info["file"] != fn:
                continue
            info["actions"] |= actions
            info["expected_keys"] |= guards
            info["required_fields"] |= required
            info["reads_body"] |= body

    # normalise
    out = {}
    for path, info in routes.items():
        out[path] = {
            "file": info["file"],
            "actions": sorted(info["actions"]) or [None],
            "expected_keys": sorted(info["expected_keys"]),
            "required_fields": sorted(info["required_fields"] - {"action"}),
            "reads_body": sorted(info["reads_body"]),
        }
    return out


def discover_frontend_payloads(frontend_dir):
    """
    Parse callToolEndpoint('route-name', { ...payload... }) across src/tools/*.js.
    Returns { route_name: [raw_payload_object_text, ...] }.
    These are the REAL payloads the UI sends — the best fixture seed available.
    """
    payloads = {}
    if not frontend_dir or not os.path.isdir(frontend_dir):
        return payloads
    for fn in sorted(os.listdir(frontend_dir)):
        if not fn.endswith(".js"):
            continue
        src = open(os.path.join(frontend_dir, fn)).read()
        for cm in re.finditer(r"callToolEndpoint\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*\{", src):
            route = cm.group(1)
            # crude brace-match to grab the payload object text (best-effort, for human review)
            start = cm.end() - 1
            depth, i = 0, start
            while i < len(src):
                if src[i] == "{": depth += 1
                elif src[i] == "}":
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            payloads.setdefault(route, []).append(src[start:i + 1])
    return payloads


# ─────────────────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────────────────

PLACEHOLDER_HINTS = {
    "url": "https://example.com/product",
    "text": "x" * 400, "reviews": "Great product. Works as described. " * 30,
    "reviewText": "Great product. Works as described. " * 30,
    "amount": 100, "budget": 500, "price": 50, "hours": 5,
    "category": "Electronics", "airport": "JFK", "duration": 5,
}

def synth_payload(info, action):
    """Best-effort auto payload from required fields + body reads. Realistic VALUES
    are the job of the fixtures file; this just keeps a route from 400ing on shape."""
    p = {}
    for f in sorted(set(info["required_fields"]) | set(info["reads_body"])):
        if f in ("userLanguage", "userLocale", "userCurrency", "userRegion"):
            continue
        lower = f.lower()
        val = None
        for hint, hv in PLACEHOLDER_HINTS.items():
            if hint.lower() in lower:
                val = hv; break
        if val is None:
            val = f"test {f}"
        p[f] = val
    if action:
        p["action"] = action
    return p


def build_jobs(backend, fixtures, langs):
    """One job per (route, action, lang). Fixtures override synth payloads."""
    jobs = []
    for path, info in backend.items():
        route_name = path.lstrip("/")  # e.g. 'buy-wise' or 'buy-wise/quote'
        for action in info["actions"]:
            fx_key = f"{route_name}::{action}" if action else route_name
            fx = fixtures.get(fx_key) or fixtures.get(route_name)
            payload = dict(fx) if fx else synth_payload(info, action)
            if action and "action" not in payload:
                payload["action"] = action
            for lang in langs:
                jp = dict(payload); jp.setdefault("userLanguage", lang)
                jobs.append({
                    "route": path, "route_name": route_name, "action": action,
                    "lang": lang, "payload": jp,
                    "expected_keys": info["expected_keys"], "fixture": bool(fx),
                })
    return jobs


# ─────────────────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────────────────

def post(base_url, prefix, route, payload, timeout):
    url = base_url.rstrip("/") + prefix + route
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode(errors="replace")
            return r.status, body, time.time() - t0, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode(errors="replace"), time.time() - t0, None
    except Exception as e:
        return None, "", time.time() - t0, str(e)


def check(status, body, expected_keys):
    """Return (ok, reason). The three assertions that define 'behaves right'."""
    if status is None:
        return False, "no response (server down / timeout / connection error)"
    if status != 200:
        snippet = body[:160].replace("\n", " ")
        return False, f"HTTP {status} — {snippet}"
    try:
        parsed = json.loads(body)
    except Exception:
        return False, f"200 but body is not JSON — {body[:120]!r}"
    if isinstance(parsed, dict) and parsed.get("error"):
        return False, f"200 with error field: {parsed['error']!r}"
    missing = [k for k in expected_keys
               if not (isinstance(parsed, dict) and parsed.get(k) is not None)]
    if missing:
        return False, f"missing/null expected keys: {missing}"
    return True, "ok"


def stress(payload):
    """Adversarial amplification — the knob that fights single-fixture under-sampling."""
    out = {}
    for k, v in payload.items():
        if isinstance(v, str) and len(v) > 40:
            out[k] = v * 6
        elif isinstance(v, list) and v:
            out[k] = (v * 20)[:200]
        else:
            out[k] = v
    return out


def main():
    ap = argparse.ArgumentParser(description="DeftBrain runtime smoke harness")
    ap.add_argument("--backend", default="backend/routes")
    ap.add_argument("--frontend", default="src/tools")
    ap.add_argument("--base-url", help="e.g. http://localhost:3001 (omit for --discover)")
    ap.add_argument("--prefix", default=DEFAULT_PREFIX)
    ap.add_argument("--fixtures", help="JSON file of {route or route::action: payload}")
    ap.add_argument("--emit-fixtures", help="write a fixtures skeleton here and exit")
    ap.add_argument("--discover", action="store_true", help="discovery only, no HTTP")
    ap.add_argument("--stress", action="store_true")
    ap.add_argument("--langs", default="en")
    ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    backend = discover_backend(args.backend)
    fe_payloads = discover_frontend_payloads(args.frontend)
    langs = [x.strip() for x in args.langs.split(",") if x.strip()]

    fixtures = {}
    if args.fixtures and os.path.exists(args.fixtures):
        fixtures = json.load(open(args.fixtures))

    # ── emit fixtures skeleton ──
    if args.emit_fixtures or args.discover:
        skel = {}
        for path, info in backend.items():
            rn = path.lstrip("/")
            for action in info["actions"]:
                key = f"{rn}::{action}" if action else rn
                skel[key] = {
                    "_required_fields": info["required_fields"],
                    "_expected_keys": info["expected_keys"],
                    "_ui_sends": fe_payloads.get(rn, ["<frontend not parsed>"])[:1],
                    "payload": synth_payload(info, action),
                }
        if args.emit_fixtures:
            json.dump(skel, open(args.emit_fixtures, "w"), indent=2)
            print(f"Wrote fixtures skeleton: {args.emit_fixtures} ({len(skel)} entries)")
        else:
            n_routes = len(backend)
            n_jobs = sum(len(i["actions"]) for i in backend.values())
            print(f"Discovered {n_routes} route paths, {n_jobs} route/action units.")
            no_keys = [p for p, i in backend.items() if not i["expected_keys"]]
            print(f"  Units with NO discoverable expected-key guard (weak assertion): {len(no_keys)}")
            for p in no_keys[:12]:
                print(f"    {p}")
        return 0

    if not args.base_url:
        print("ERROR: --base-url required to run (or use --discover).", file=sys.stderr)
        return 2

    jobs = build_jobs(backend, fixtures, langs)
    results = []
    for job in jobs:
        payload = stress(job["payload"]) if args.stress else job["payload"]
        worst = None
        for _ in range(args.repeat):
            status, body, dt, err = post(args.base_url, args.prefix, job["route"],
                                          payload, args.timeout)
            ok, reason = check(status, body, job["expected_keys"])
            if not ok:
                worst = (ok, reason, dt); break
            worst = (ok, reason, dt)
        ok, reason, dt = worst
        results.append({**{k: job[k] for k in ("route", "action", "lang", "fixture")},
                        "ok": ok, "reason": reason, "secs": round(dt, 1)})

    reds = [r for r in results if not r["ok"]]
    if args.json:
        print(json.dumps({"total": len(results), "red": len(reds), "results": results}, indent=2))
    else:
        for r in results:
            tag = "🟢" if r["ok"] else "🔴"
            unit = f"{r['route']}" + (f" [{r['action']}]" if r["action"] else "")
            fxt = "" if r["fixture"] else " (synth payload — weak)"
            line = f"{tag} {unit} ({r['lang']}, {r['secs']}s){fxt}"
            if not r["ok"]:
                line += f"\n      → {r['reason']}"
            print(line)
        print(f"\n{len(results) - len(reds)}/{len(results)} green · {len(reds)} red")
        if reds:
            print("RED — your real bug list:")
            for r in reds:
                unit = f"{r['route']}" + (f" [{r['action']}]" if r["action"] else "")
                print(f"  {unit} ({r['lang']}): {r['reason']}")
    return len(reds)


if __name__ == "__main__":
    sys.exit(main())
