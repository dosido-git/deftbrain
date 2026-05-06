# backend_audit_v1.py
# v1.5 · 2026-05-06 · two scoping fixes:
#                     (1) S7.1 withLanguage import requirement now gated on
#                         actual Anthropic usage. Previously fired on every
#                         route file — wrong for ElevenLabs/image/etc.
#                         third-party API wrappers that don't need locale.
#                     (2) S7.4 withLanguage call-count parity now compares
#                         against Anthropic call count, not route count.
#                         Multi-route tools where only some routes call
#                         Anthropic (the-final-word: 10 routes, 3 API calls)
#                         no longer false-positive on the 7 non-API routes.
# v1.4 · 2026-05-06 · S7.4a JSON.parse peephole extended to recognize
#                     transitively-clean variables. Catches sophisticated
#                     retry-with-repair patterns (e.g. `const repaired =
#                     repairJSON(cleaned); JSON.parse(repaired)`) and method
#                     access on clean idents (`JSON.parse(cleaned.slice(...))`).
#                     Builds a fixpoint set of clean vars in the lookback
#                     window — direct cleanJsonResponse assignments seed it,
#                     derived assignments iterate to convergence.
# v1.3 · 2026-05-06 · S7.1 unused-import check now exempts the required-presence
#                     imports (`withLanguage`, `cleanJsonResponse`). Pre-v1.3 the
#                     audit was internally inconsistent: it recommended removing
#                     these when unused, then flagged them as missing if removed.
#                     Their actual usage is enforced separately by S7.4 call-count
#                     parity (withLanguage) and S7.4a wrap check (cleanJsonResponse).
# v1.2 · 2026-05-06 · S7.4a JSON.parse check now recognizes the two-step
#                     idiom (`const cleaned = cleanJsonResponse(text);
#                     JSON.parse(cleaned)`) as safe. v1.1 flagged these as
#                     unwrapped because the captured arg `cleaned` doesn't
#                     contain the text `cleanJsonResponse` — produced ~56
#                     false positives across the catalog. New peephole
#                     mirrors the logic in wrap_json_parse.py v1.1: bare
#                     identifier args whose nearest prior assignment within
#                     40 lines was `<name> = cleanJsonResponse(...)` are
#                     exempt.
# v1.1 · 2026-05-04 · two false-positive corrections after first catalog run:
#                     (1) DROPPED the ${lang}/${langDirective} interpolation
#                     check entirely. The codebase has TWO sanctioned conventions
#                     for plumbing locale through to prompts:
#                         Pattern A (decision-coach):
#                           const lang = withLanguage(locale);
#                           prompt = `...${lang}`;
#                         Pattern B (apology-calibrator):
#                           system: withLanguage(systemPrompt, userLanguage)
#                     Pattern A interpolates ${lang}; Pattern B wraps the prompt
#                     inline at the system param. Both are correct. The
#                     withLanguage() call-count parity check (still present)
#                     already verifies that the function is invoked once per
#                     route — that's the actual semantic requirement.
#                     (2) MODEL STRING — replaced single-string mandate with
#                     an allowlist + deprecation tier. Sonnet 4 (the checklist
#                     v4.39 mandated string `claude-sonnet-4-20250514`) is now
#                     deprecated per Anthropic's docs. The allowlist accepts
#                     all current-generation strings and soft-warns on
#                     deprecated ones. Catches typos via the allowlist, doesn't
#                     punish deliberate Haiku-for-cost choices.
# v1.0 · 2026-05-04 · initial release. Mirrors audit_v2-3-2.py's structure for
#                     consistency: argv files, per-file violation collection,
#                     same emoji-decorated final output. Covers Section 7 of
#                     tool-audit-checklist-v4_39.md (S7.1–S7.7).
#
# Usage:
#   python3 backend_audit_v1.py path/to/route.js
#   python3 backend_audit_v1.py backend/routes/*.js          # multi-file
#   for f in backend/routes/*.js; do python3 backend_audit_v1.py "$f"; done
#
# Exit code: 0 if all files clean, 1 if any file has violations.
#
# ────────────────────────────────────────────────────────────────────────────
# What this script enforces (per checklist v4.39 Section 7)
# ────────────────────────────────────────────────────────────────────────────
#
# S7.1 — Imports
#   • cleanJsonResponse imported from ../lib/claude (required if file uses JSON.parse)
#   • withLanguage imported from ../lib/claude
#   • No unused destructured imports — every name in require() destructure must
#     appear ≥1 time outside the import line
#
# S7.2 — Route Registration
#   • module.exports = router present
#   • All router.post/get routes use rateLimit() — count parity check
#     (both rateLimit() and rateLimit(DEFAULT_LIMITS) shapes accepted per
#      Session 2026-05-02 design call)
#
# S7.3 — Input Validation
#   • Every route has ≥1 status(400) guard OR uses no req.body fields in prompts
#     (heuristic — full per-field analysis is judgment-required)
#
# S7.4 — API Call Pattern
#   • Model string is in ALLOWED_MODELS allowlist (multiple current models accepted)
#     — DEPRECATED_MODELS produce soft warnings, not hard fails
#   • cleanJsonResponse wraps every JSON.parse call
#   • withLanguage called once per route (covers both Pattern A and Pattern B
#     calling conventions — see v1.1 changelog)
#   • max_tokens specified on every API call
#   (Both anthropic.messages.create and callClaudeWithRetry sanctioned —
#    see S7.4 wrapper-sanction note in checklist v1.3.)
#
# S7.5 — Cite Tag Stripping
#   • If web_search tool is used, stripCites function must be defined and
#     applied to JSON.parse output before res.json
#
# S7.6 — Prompt Quality
#   • "CRITICAL: Return ONLY valid JSON." appears once per route
#   • No ${/* comment */ ''} template-comment anti-pattern
#
# S7.7 — Error Handling
#   • Every router.post/get is wrapped in try/catch (} catch count parity)
#   • Every catch block calls res.status(5xx).json
#   • res.status(400) exists if any validation logic is present
#
# ────────────────────────────────────────────────────────────────────────────
# Out of scope (judgment-required, manual checklist only)
# ────────────────────────────────────────────────────────────────────────────
#
#   • Per-field input validation completeness — automating requires parsing
#     each prompt template and identifying which interpolations are unguarded.
#     Heuristic check above catches "no validation at all"; full audit is manual.
#   • max_tokens *value* appropriateness for output type (S7.4 table).
#     Script confirms presence; value review is manual.
#   • Prompt schema vs frontend field-access alignment (S7.6 first item) —
#     requires cross-file inspection with frontend component.
#   • Optional-field conditional interpolation (S7.6 third item) —
#     judgment-required.

import os, re, sys

# ────────────────────────────────────────────────────────────────────────────
# Constants
# ────────────────────────────────────────────────────────────────────────────

# Currently-allowed Anthropic model strings. Update as new models ship and
# old ones are deprecated. Verify against https://platform.claude.com/docs/
# Models in DEPRECATED_MODELS are still accepted (no hard fail) but trigger
# a soft warning encouraging migration before Anthropic removes them.
ALLOWED_MODELS = {
    'claude-opus-4-7',                # April 2026 flagship
    'claude-opus-4-6',                # Feb 2026, previous flagship
    'claude-sonnet-4-6',              # Feb 2026, recommended default
    'claude-haiku-4-5-20251001',      # Oct 2025, fast/cheap tier
    'claude-sonnet-4-20250514',       # legacy Sonnet 4 (deprecated, see DEPRECATED_MODELS)
}
DEPRECATED_MODELS = {
    'claude-sonnet-4-20250514',       # superseded by claude-sonnet-4-6
    'claude-opus-4-5',                # superseded by claude-opus-4-6/4-7
}

# ────────────────────────────────────────────────────────────────────────────
# Detection — is this a backend route file?
# ────────────────────────────────────────────────────────────────────────────

def is_route_file(content):
    """A file qualifies as a route file if it constructs an express.Router()
    AND exports it. This excludes lib/, middleware files that import Router
    types but don't construct one, and pure-utility files."""
    return (
        re.search(r'express\.Router\s*\(\s*\)', content) is not None
        and re.search(r'module\.exports\s*=\s*router\b', content) is not None
    )


def is_index_router(filepath, content):
    """index.js in routes/ is the auto-discovery dispatcher — no actual routes,
    no rate-limiting needed. Skip the audit on these."""
    if os.path.basename(filepath) == 'index.js':
        # Confirm: no router.post/get of its own
        if not re.search(r'router\.(post|get)\b', content):
            return True
    return False


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

ROUTE_DEF_RE = re.compile(r'router\.(post|get)\s*\(', re.MULTILINE)


def count_routes(content):
    """Return the number of router.post() and router.get() definitions."""
    return len(ROUTE_DEF_RE.findall(content))


def strip_comments(content):
    """Strip // line comments and /* */ block comments to avoid matching
    keywords inside comments. Conservative — preserves strings/templates."""
    # Block comments first (non-greedy)
    out = re.sub(r'/\*[\s\S]*?\*/', '', content)
    # Line comments — only strip from // to end of line, but not inside strings
    # Simple heuristic: only strip lines that begin with whitespace + //
    out = re.sub(r'^\s*//.*$', '', out, flags=re.MULTILINE)
    return out


def get_destructured_names(content, pkg):
    """For a require() destructure like:
       const { foo, bar, baz } = require('../lib/claude');
       return ['foo', 'bar', 'baz'].
       Returns empty list if no destructure for that pkg.
    """
    pattern = (
        r'const\s*\{\s*([^}]+)\s*\}\s*=\s*require\([\'"]'
        + re.escape(pkg)
        + r'[\'"]\s*\)'
    )
    m = re.search(pattern, content)
    if not m:
        return []
    raw = m.group(1)
    # Split on commas, strip whitespace, drop empties
    return [n.strip() for n in raw.split(',') if n.strip()]


# ────────────────────────────────────────────────────────────────────────────
# Per-file audit
# ────────────────────────────────────────────────────────────────────────────

def audit_file(filepath):
    """Return list of violation strings for one file."""
    fails = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return [f'IO: cannot read file — {e}']

    if not is_route_file(content):
        # Not a route file — skip silently. The caller decides whether to warn.
        return ['_NOT_A_ROUTE_FILE_']

    if is_index_router(filepath, content):
        # Auto-discovery dispatcher — out of scope
        return ['_INDEX_ROUTER_OUT_OF_SCOPE_']

    no_comments = strip_comments(content)
    route_count = count_routes(no_comments)

    if route_count == 0:
        fails.append('S7.0: file constructs Router but defines no routes — dead file?')
        return fails

    # ───────────────────────────────────────────────────────────────────────
    # S7.1 · Imports
    # ───────────────────────────────────────────────────────────────────────

    # Whether the route uses JSON.parse — only then is cleanJsonResponse required
    uses_json_parse = re.search(r'\bJSON\.parse\b', no_comments) is not None

    # Whether the file calls Anthropic at all — only then is withLanguage required.
    # Routes that wrap third-party APIs (ElevenLabs, image generation, etc.) don't
    # need locale plumbing.
    uses_anthropic = bool(re.search(
        r'\banthropic\.messages\.create\b|\bcallClaudeWithRetry\b',
        no_comments,
    ))

    if uses_json_parse and 'cleanJsonResponse' not in no_comments:
        fails.append('S7.1: cleanJsonResponse not imported — JSON.parse will crash on markdown-fenced responses')

    if uses_anthropic and 'withLanguage' not in no_comments:
        fails.append('S7.1: withLanguage not imported — required for locale support')

    # Unused destructured imports — check the common packages.
    # NOTE: required-presence imports (withLanguage, cleanJsonResponse) are
    # exempt from this check because removing them creates an S7.1 "not
    # imported" violation. Their actual usage is enforced separately by
    # S7.4 call-count parity for withLanguage and S7.4a wrap check for
    # cleanJsonResponse. Pre-v1.2 the audit recommended removing them when
    # unused, then flagged them as missing — internally inconsistent.
    REQUIRED_PRESENCE_IMPORTS = {'withLanguage', 'cleanJsonResponse'}
    for pkg in ['../lib/claude', '../lib/rateLimiter']:
        names = get_destructured_names(no_comments, pkg)
        for name in names:
            if name in REQUIRED_PRESENCE_IMPORTS:
                continue
            # Count occurrences of the bare identifier (word-boundary match)
            occurrences = len(re.findall(r'\b' + re.escape(name) + r'\b', no_comments))
            # Should appear at least twice: once in import, once in use
            if occurrences < 2:
                fails.append(f'S7.1: "{name}" imported from {pkg} but never used — remove from destructure')

    # ───────────────────────────────────────────────────────────────────────
    # S7.2 · Route Registration
    # ───────────────────────────────────────────────────────────────────────

    if not re.search(r'module\.exports\s*=\s*router\s*;?\s*$', content.rstrip()):
        # Existence already confirmed by is_route_file; this checks "at end"
        # which is the auto-discovery contract.
        # Allow it if it's near the end (within last 200 chars).
        tail = content[-200:]
        if 'module.exports = router' not in tail:
            fails.append('S7.2: module.exports = router must be at end of file (auto-discovery contract)')

    # rateLimit() count parity — both rateLimit() and rateLimit(DEFAULT_LIMITS)
    # are sanctioned shapes per Session 2026-05-02 design call.
    rate_limit_count = len(re.findall(r'\brateLimit\s*\(', no_comments))
    if rate_limit_count < route_count:
        fails.append(
            f'S7.2: {route_count} route(s) defined but only {rate_limit_count} rateLimit() call(s) — '
            f'every route must be rate-limited'
        )

    # ───────────────────────────────────────────────────────────────────────
    # S7.3 · Input Validation (heuristic)
    # ───────────────────────────────────────────────────────────────────────
    #
    # Full per-field validation is judgment-required. Heuristic check:
    # if the file uses req.body in any prompt template, status(400) must
    # appear at least once. Catches "no validation at all" cases.

    uses_req_body = re.search(r'\breq\.body\b', no_comments) is not None
    has_400_guard = re.search(r'\.status\s*\(\s*400\s*\)', no_comments) is not None

    if uses_req_body and not has_400_guard:
        fails.append(
            'S7.3: req.body fields used but no status(400) validation guard found — '
            'every required field must be checked before prompt construction'
        )

    # ───────────────────────────────────────────────────────────────────────
    # S7.4 · API Call Pattern
    # ───────────────────────────────────────────────────────────────────────

    # Detect API-calling routes — either anthropic.messages.create OR callClaudeWithRetry.
    has_messages_create = re.search(r'anthropic\.messages\.create\s*\(', no_comments) is not None
    has_wrapper = re.search(r'callClaudeWithRetry\s*\(', no_comments) is not None
    is_api_caller = has_messages_create or has_wrapper

    if not is_api_caller:
        # Non-API route (maybe a webhook handler or telemetry). Skip S7.4 checks
        # but warn if route count > 0 and no API call — likely an oversight.
        # We don't fail; it's a legitimate pattern.
        pass
    else:
        # Model string check — must be in ALLOWED_MODELS allowlist.
        # Files in DEPRECATED_MODELS get a soft warning (still passes audit).
        model_lines = re.findall(r'model\s*:\s*[\'"`]([^\'"`]+)[\'"`]', no_comments)
        unknown_models = [m for m in model_lines if m not in ALLOWED_MODELS]
        deprecated_models = [m for m in model_lines if m in DEPRECATED_MODELS]
        if unknown_models:
            fails.append(
                f'S7.4: model string not in allowlist — found {sorted(set(unknown_models))[:3]}, '
                f'allowed: {sorted(ALLOWED_MODELS)}'
            )
        if deprecated_models:
            fails.append(
                f'S7.4 [warning]: deprecated model string {sorted(set(deprecated_models))} — '
                f'migrate to a current model before Anthropic removes it'
            )
        if not model_lines:
            fails.append('S7.4: no model: field on API call — uses API default, may drift')

        # cleanJsonResponse wrapping every JSON.parse
        if uses_json_parse:
            # Count bare JSON.parse calls (not wrapped by cleanJsonResponse).
            #
            # A call is considered safe if EITHER:
            #   (a) literal: JSON.parse(cleanJsonResponse(...))
            #   (b) two-step idiom: a bare identifier whose nearest prior
            #       assignment in the file was `<name> = cleanJsonResponse(...)`
            #       — common pattern: `const cleaned = cleanJsonResponse(text);
            #                          const parsed  = JSON.parse(cleaned);`
            # The two-step is functionally equivalent — the cleaning happened
            # before parse. v1.1 of wrap_json_parse.py preserves this idiom;
            # the audit must recognize it too or it generates false positives.
            BARE_IDENT = re.compile(r'^[A-Za-z_$][\w$]*$')
            CLEAN_VAR_LOOKBACK_LINES = 40

            def _arg_is_clean_var(arg, parse_pos_in_no_comments):
                """Return True if `arg` is provably clean — i.e. derived
                (possibly transitively) from a cleanJsonResponse call.

                Recognizes:
                  (a) bare ident assigned `<id> = cleanJsonResponse(...)`
                  (b) bare ident transitively derived from a clean var,
                      e.g. `const repaired = repairJSON(cleaned)` where
                      `cleaned` is itself clean
                  (c) method/property access on a clean ident, e.g.
                      `cleaned.slice(...)`, `cleaned.trim()`, `cleaned[0]`
                """
                arg = arg.strip()
                head = no_comments[:parse_pos_in_no_comments]
                lines = head.split('\n')
                window = (lines[-CLEAN_VAR_LOOKBACK_LINES:]
                          if len(lines) > CLEAN_VAR_LOOKBACK_LINES else lines)

                # Build set of clean vars in scope by sweeping the window.
                # Seed with direct cleanJsonResponse assignments.
                clean = set()
                direct_re = re.compile(
                    r'\b([A-Za-z_$][\w$]*)\s*=\s*cleanJsonResponse\s*\('
                )
                for line in window:
                    for m in direct_re.finditer(line):
                        clean.add(m.group(1))

                # Then iterate adding derived vars: any `X = <expr>` where
                # <expr> contains a clean var as a bare token. Iterate to
                # fixpoint to handle chains like A→B→C.
                deriv_re = re.compile(
                    r'\b([A-Za-z_$][\w$]*)\s*=\s*([^;]+);?'
                )
                for _ in range(5):  # cap iterations
                    changed = False
                    for line in window:
                        for m in deriv_re.finditer(line):
                            lhs, rhs = m.group(1), m.group(2)
                            if lhs in clean or 'cleanJsonResponse' in rhs:
                                continue
                            # Tokenize RHS and check if any token is a clean var
                            tokens = re.findall(r'\b[A-Za-z_$][\w$]*\b', rhs)
                            if any(t in clean for t in tokens):
                                clean.add(lhs)
                                changed = True
                    if not changed:
                        break

                # Now check the arg
                if BARE_IDENT.match(arg):
                    return arg in clean
                # Method/property access: leading ident before . or [
                m = re.match(r'^([A-Za-z_$][\w$]*)[\.\[]', arg)
                if m:
                    return m.group(1) in clean
                return False

            unwrapped = 0
            for m in re.finditer(r'JSON\.parse\s*\(\s*([^)]{0,120})', no_comments):
                captured = m.group(1)
                if 'cleanJsonResponse' in captured:
                    continue
                if _arg_is_clean_var(captured, m.start()):
                    continue
                unwrapped += 1
            if unwrapped:
                fails.append(
                    f'S7.4: {unwrapped} JSON.parse call(s) not wrapped in cleanJsonResponse — '
                    f'will crash on markdown-fenced responses'
                )

        # withLanguage call count vs API call count
        # NOTE (v1.5): compare against api_call_count, not route_count.
        # Some routes don't call Anthropic (e.g. /room/create dispatchers in
        # multi-role tools, third-party-API wrappers) and don't need
        # withLanguage. The semantic requirement is "every Anthropic call
        # has locale plumbing."
        # NOTE (v1.1): this single check subsumes both calling conventions:
        #   Pattern A (decision-coach):   const lang = withLanguage(locale)
        #   Pattern B (apology-calibrator): system: withLanguage(systemPrompt, userLanguage)
        api_call_count = len(re.findall(r'(?:anthropic\.messages\.create|callClaudeWithRetry)\s*\(', no_comments))
        with_lang_calls = len(re.findall(r'\bwithLanguage\s*\(', no_comments))
        if with_lang_calls < api_call_count:
            fails.append(
                f'S7.4: {api_call_count} Anthropic call(s) but only {with_lang_calls} withLanguage() call(s) — '
                f'every API call must wrap its prompt with withLanguage'
            )

        # max_tokens presence on every API call
        max_tokens_count = len(re.findall(r'max_tokens\s*:', no_comments))
        if max_tokens_count < api_call_count:
            fails.append(
                f'S7.4: {api_call_count} API call(s) but only {max_tokens_count} max_tokens declaration(s) — '
                f'every call must specify max_tokens'
            )

    # ───────────────────────────────────────────────────────────────────────
    # S7.5 · Cite Tag Stripping
    # ───────────────────────────────────────────────────────────────────────

    if 'web_search' in no_comments:
        # Web search route — must strip cite tags
        if not re.search(r'\bstripCites\b|\.replace\([^)]*<cite', no_comments):
            fails.append(
                'S7.5: web_search tool used but no stripCites function found — '
                'cite tags will appear in frontend output'
            )

    # ───────────────────────────────────────────────────────────────────────
    # S7.6 · Prompt Quality
    # ───────────────────────────────────────────────────────────────────────

    if is_api_caller:
        # "CRITICAL: Return ONLY valid JSON." count parity — compare against
        # the number of API calls, not the route count. Non-API routes have
        # no prompts and therefore no place for this directive (v1.5 scope fix).
        return_only_count = len(re.findall(r'Return ONLY[^\n]{0,40}JSON', no_comments))
        if return_only_count < api_call_count:
            fails.append(
                f'S7.6: {api_call_count} API call(s) but only {return_only_count} prompt(s) include '
                f'"Return ONLY ... JSON" — model may wrap responses in markdown without this'
            )

    # Template comment anti-pattern: ${/* ... */ ''}
    template_comments = re.findall(r'\$\{\s*/\*[^*]*\*/', content)
    if template_comments:
        fails.append(
            f'S7.6: {len(template_comments)} template-comment anti-pattern(s) found '
            f'(${{/* ... */ \'\'}}) — move comment to its own line'
        )

    # ───────────────────────────────────────────────────────────────────────
    # S7.7 · Error Handling
    # ───────────────────────────────────────────────────────────────────────

    catch_count = len(re.findall(r'\}\s*catch\b', no_comments))
    if catch_count < route_count:
        fails.append(
            f'S7.7: {route_count} route(s) but only {catch_count} catch block(s) — '
            f'every route must be wrapped in try/catch'
        )

    # 5xx response count — should have at least one per catch
    # (split out: some files may have multiple 500s per catch, that's fine)
    status_5xx = len(re.findall(r'\.status\s*\(\s*5\d\d\s*\)', no_comments))
    if catch_count > 0 and status_5xx == 0:
        fails.append(
            f'S7.7: {catch_count} catch block(s) but no res.status(5xx) calls — '
            f'errors must respond with 500'
        )

    # Validation 400 already checked in S7.3 — skip duplicate check here

    return fails


# ────────────────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print('Usage: python3 backend_audit_v1.py <route_file.js> [more files...]', file=sys.stderr)
    sys.exit(2)

# Expand globs (since Windows shells don't, and this saves typing)
import glob
filepaths = []
for arg in sys.argv[1:]:
    expanded = glob.glob(arg) if '*' in arg or '?' in arg else [arg]
    if not expanded:
        print(f'⚠️  no files match {arg}', file=sys.stderr)
        continue
    filepaths.extend(expanded)

results = {}
skipped_non_route = []
skipped_index = []

for fp in filepaths:
    if not os.path.isfile(fp):
        print(f'⚠️  file not found: {fp}', file=sys.stderr)
        continue
    name = os.path.basename(fp).replace('.js', '')
    fails = audit_file(fp)
    if fails == ['_NOT_A_ROUTE_FILE_']:
        skipped_non_route.append(fp)
        continue
    if fails == ['_INDEX_ROUTER_OUT_OF_SCOPE_']:
        skipped_index.append(fp)
        continue
    results[name] = fails

total_fails = 0
clean = []
for name, fails in results.items():
    if fails:
        print(f"\n{'=' * 55}")
        print(f"❌ {name} — {len(fails)} issue(s):")
        for f in fails:
            print(f'   • {f}')
        total_fails += len(fails)
    else:
        clean.append(name)

print(f"\n{'=' * 55}")
if clean:
    print(f"✅ CLEAN: {', '.join(clean)}")
else:
    print('✅ CLEAN: (none)')

if skipped_non_route:
    print(f'\nℹ️  Skipped (not route files): {len(skipped_non_route)}')
if skipped_index:
    print(f'ℹ️  Skipped (index dispatcher): {len(skipped_index)}')

print(f'\nTOTAL: {total_fails} issues across {sum(1 for f in results.values() if f)} routes')

sys.exit(1 if total_fails > 0 else 0)
