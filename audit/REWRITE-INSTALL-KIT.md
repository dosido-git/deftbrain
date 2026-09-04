# Installing a supplied tool rewrite (the checklist)

For the recurring job: an owner-supplied rewrite arrives as a zip or a spec —
frontend, backend route, i18n additions, or some combination — and it has to
land without breaking anything.

Every item below is a trap that actually fired during an install, with the
detection command. Written 2026-08-31 after three in one day (Heckler Prep,
Hobby Match, Concept Coach), each of which hit several.

**The governing rule: a supplied rewrite is a draft, not a patch.** It was
written without the repo in front of it, so it will not know about the dynamic
import, the name-keyed audits, the thirteen-language catalog, or the gates. Read
it before copying it in, and diff it against what is there.

---

## 0 — Before copying anything

**Diff it against the current file.** A rewrite that claims to change one thing
usually changes several, and occasionally is byte-identical to what is already
committed (both HecklerPrep.js and HobbyMatch.js arrived unchanged).

```bash
diff -q supplied/Tool.js src/tools/Tool.js && echo "IDENTICAL — nothing to do"
diff supplied/tool.js backend/routes/tool.js | head -40
```

**Check what the rewrite silently drops.** Prompt rules, deterministic checkers
and token budgets accumulated over previous sessions live in the file being
replaced. Grep the outgoing file for the things you know are load-bearing before
overwriting it — enum pinning, the no-double-quote rule, `withLanguage` /
`withLocaleContext`, per-stakes `max_tokens`, `router.outputGuard`.

---

## 1 — The filename is load-bearing

`ToolRenderer` resolves components dynamically:

```js
import(`../tools/${toolId}.js`)
```

The file **must** be named for the catalog `id`. A rewrite named for the tool's
new display name (`ConceptCoach.js` while the id is still `IdeaAutopsy`) does not
fail loudly — it falls into the import's `.catch()` and renders the fallback.

`audit_v2-3-2.py` rule **S1.7** keys `displayName` on the same name, so it
catches the mismatch:

```bash
python3 scripts/diff-audit.py src/tools/<Tool>.js   # "S1.7: displayName not set"
```

---

## 2 — Does the backend actually read the new field?

**The one that cost the most.** Concept Coach's rewrite added a prominent
"Anything you've tested or learned so far?" textarea. The route never
destructured `evidenceSoFar`, so every answer was posted and dropped: the
visitor typed their customer research into a box that changed nothing.

Nothing catches this. No gate compares the frontend's payload to the route's
destructuring. Do it by hand, every time:

```bash
# every field the frontend sends
grep -A20 "callToolEndpoint(" src/tools/<Tool>.js | grep -oE "^\s+[a-zA-Z]+:" 
# every field the route reads
grep -n "req.body" backend/routes/<tool>.js
```

Then confirm the field reaches the prompt, not just the destructuring — and
prove it with a live call whose output changes when the field changes.

---

## 3 — i18n: the new keys are the easy half

Two separate jobs, and the second one is invisible:

1. **New keys** need all 13 languages.
2. **Keys whose ENGLISH changed** leave the other twelve holding a translation
   of the old wording. Gate 5 checks existence, not agreement, so it says
   nothing. Concept Coach shipped 5 new keys and **13 changed ones** — twelve
   languages still said "Run the Autopsy" for a button now labelled
   "Stress-Test My Idea".

```bash
# what is new vs what merely changed underneath
node -e '
const add=require("./supplied/additions.en.json");
const src=require("fs").readFileSync("src/i18n/locales/tools/<tool>.js","utf8");
const ev=s=>{const m=s.match(/export\s+const\s+(\w+)\s*=/);return new Function(s.replace(/\bexport\s+const\b/g,"const")+";return "+m[1]+";")()};
const o=ev(src);
for(const [k,v] of Object.entries(add))
  console.log((!(k in o.en) ? "NEW     " : o.en[k]!==v ? "CHANGED " : "same    ")+k);
'
```

**Validate translations before applying**, not after: right script per language,
no stray CJK in non-CJK languages, no banned address forms (您 / あなた / 당신 /
ты / Ihnen / tu / usted / ครับ). Then `npm run build:locales` or the new keys
render as their own names until the dev server restarts.

**An empty string is not a translation.** `ia_ex_evidence: ""` failed the smoke
test in twelve languages. An example that demonstrates a field must have
content; filling it is the fix, not silencing the gate.

**Renaming a tool file drops it off the Gate 5 allowlist**, which is keyed by
path (`scripts/localization-audit.js`). The count goes 125 → 124 and nothing
fails, because a tool that is absent is not a tool that is failing. Watch the
number.

---

## 4 — Dead code fails the build

A rewrite that supersedes a mechanism often leaves it defined and uncalled.
HecklerPrep v3 shipped 259 lines of unreferenced two-pass editor: one
`no-unused-vars` warning against a `--max-warnings=0` gate.

Deleting it is usually right, but **say what capability goes with it**. Those
259 lines contained deterministic checkers a model judge does not replace.

---

## 5 — The gates that fire on a touched route

| Gate | Trips when | Fix |
| --- | --- | --- |
| `output-standard-audit` | you touch a route that declares no `outputStandard` | review it against `lib/outputStandard.js` and declare v2 — or `OUTPUT_STANDARD_SKIP=1` if the edit was mechanical and **no review happened**. Do not declare a standard you did not verify. |
| `diff-audit.py` S7.6 | a prompt lacks `Return ONLY ... JSON` | add the phrase; without it the model may wrap the response in markdown |
| `check:golden` | the output **shape** changed | re-record, and update `_meta` to say what changed and why |
| `scan-guard-keys` | a guard keys a field that is nullable or nested | guard a top-level always-present field |

The v2 gate recognises a fixed set of check-function names
(`runOutputGuard`, `checkAgainstSupplied`, `enforceEnvelope`,
`enforceSuppliedFacts`, `validateAndRepair`, `deterministicViolations`). A
rewrite that invents a new name reads as having no check at all — teach the gate
the name rather than renaming the function to satisfy it.

---

## 6 — Read the supplied code for bugs; it has them

Three found in one file:

- an example referencing an id that does not exist in its own enum list
  (`focusAreas: [...,'next']`) — selected a pill that could not render and
  posted an unknown value to the backend
- a stray `};;`
- a supplied i18n key that nothing rendered (`ia_desc_help`) — a
  label/placeholder/help triple missing its help line

None of these fail a gate.

---

## 7 — Renaming a tool touches more than the catalog

Full checklist, learned by getting it wrong twice on one rename:

1. `title` + `description` in `src/data/tools.js` — and any **prose** in that
   entry naming the tool (`guide.overview` said "IdeaAutopsy acts as…")
2. The display-name i18n key in **all 13** languages
3. `src/tools/<id>.js` filename, component name, `displayName`, `pickExample` id
4. **`backend/server.js`** — this is the one that matters in production:
   - add the new id to `TOOL_IDS`, or the slug is unknown to the server and
     falls through to "serve the React app with a 404 status"
   - add the old slugs to `LEGACY_REDIRECTS` for real `301`s — every previous
     rename is there. A client-side `<Navigate>` does **nothing** for this.
   - single hop, no chain: take the old id **out** of `TOOL_IDS` so it does not
     301 to itself first
5. `TOOL_ALIASES` in `ToolRenderer.js` for the in-app case
6. `src/data/tool-og-slugs.json` — keyed by id
7. Cross-reference links in `public/guides/**/*.html` (552 of them)
8. **`public/llms.txt` and `llms-full.txt`** — generated; run
   `node scripts/generate-llms.js`
9. The Gate 5 allowlist path (§3)
10. `audit/tool-notes/<TOOL>-NOTES.md` — record the rename and what kept the old
    name

**Deliberately keep the old name**: the i18n prefix, the localStorage keys, and
the backend endpoint. They are internal; renaming them buys nothing and breaks
saved state.

Verify with real HTTP status codes against the running server, not the dev SPA:

```bash
for u in /NewName /newname /OldName /oldname; do
  printf "%-16s " "$u"
  curl -s -o /dev/null -D - "http://localhost:3001$u" |
    awk 'NR==1{c=$2} /^[Ll]ocation:/{l=$2} END{printf "%s%s\n", c, (l?" -> "l:" (served)")}'
done
```

A `404` on the new canonical URL usually means `build/<NewName>.html` does not
exist yet — a missing prerender falls through to the same 404 path. Run
`node scripts/prerender.js` and re-check.

---

## 8 — Verify in the browser, not by reasoning

Two traps in the preview pane specifically:

- it can render at **0×0** when hidden, which makes every line wrap to one
  character, balloons the page to 40,000px, and makes any layout assertion
  meaningless. Check `window.innerWidth` before trusting a measurement.
- `requestAnimationFrame` **never fires in a hidden tab**, and
  `scrollIntoView({behavior:'smooth'})` does not animate there. Instrument
  `Element.prototype.scrollIntoView` to prove the call happened rather than
  inferring it from a scroll position that cannot change.

---

## 9 — Rewriting a route's SCHEMA, not just its prompt

Added 2026-09-04 after five rewrites in a row (Justify My Meeting, Meeting Hijack
Stopper, Micro-Adventure Mapper, Money Diplomat, and the Meeting BS Detector
rename). Every trap below fired during those, most of them more than once. They
are not about installing supplied code — they are about what breaks when the
SHAPE of a response changes.

**Sweep every guard against the schema it now returns.** This is the single most
reliable bug in the codebase. A route keeps `if (!parsed.verdict)` while its new
schema emits `recommendation`, and it 500s on every call. It fired ten times in
one Money Diplomat pass and once in Justify My Meeting, each time on the first
live probe.

```bash
python3 - <<'EOF'
import io, re, sys
# Two things this has to get right, both learned by getting them wrong:
#
#   1. Guards use three different variable names here — `parsed` (336 uses),
#      `data` (19) and `result` (8). A sweep that knows only `parsed` prints a
#      clean bill of health for a route it never looked at.
#   2. Schema keys are collected FILE-wide, not from the route body. Many routes
#      declare their schema as a module-level const above the handler, so a
#      route-scoped search finds none of its keys and flags every correct guard.
#
# File-scoping trades precision for silence: in an action-dispatch route with
# several schemas, a guard naming a field that belongs to a DIFFERENT branch
# still looks fine. What this catches reliably is the common case — a guard
# naming a field that no longer exists anywhere.
GUARD = re.compile(r'if \(!(?:parsed|data|result)\.([A-Za-z_]+)')
for fp in sys.argv[1:]:
    s = io.open(fp, encoding='utf-8').read()
    keys = set(re.findall(r'^\s*"([a-z_]+)"\s*:', s, re.M))
    hits = bad = 0
    for g in GUARD.finditer(s):
        hits += 1
        if g.group(1) not in keys:
            bad += 1
            line = s[:g.start()].count('\n') + 1
            print(f'MISMATCH {fp}:{line} guard=!{g.group(1)} — no such key in this file')
    print(f'{fp.split("/")[-1]:38} guards inspected: {hits}  mismatches: {bad}')
EOF
```

Run it as `python3 sweep.py backend/routes/<route>.js`. **If it reports zero
guards inspected, the sweep did not pass — it failed to run.** The first version
of this script knew only `parsed.` and scoped keys to the route body; it called
Micro-Adventure Mapper clean because it found no guards at all, then called it
broken because it found no schema. Both readings were the script's fault.

Guard a field the schema ALWAYS emits, never a nullable or nested one.

**Bump the persisted key in the same commit.** A v1 result restored into a v2
renderer crashes the tool for every existing user — Magic Mouth did exactly
that. `usePersistentState('tool-results', …)` → `'tool-results-v2'`.

**A normaliser keyed on field NAME alone will eventually corrupt a route.**
Money Diplomat's `pinEnums` pinned `recommendation` — a four-value enum in
Lending, free prose in Family and Donations — on every response, so two routes
had their answer replaced by a Lending verdict. It was recorded that way and
`check:golden` passed on it for a full cycle: a structural check sees that a
field holds a value, not that the value is the wrong KIND. Scope such helpers per
route.

**Re-record the goldens, and declare `optionalSections`.** The thin-result metric
reads its expected shape from the golden files, so a stale golden makes every
live call look half-empty on the dashboard. And a case that asserts a
sometimes-empty array is non-empty fails at random — declare those arrays rather
than re-running until it passes.

---

## 10 — Deterministic checkers (`validateResult` and friends)

**Test in BOTH directions, every time.** A bad form the rule must catch, and a
good form it must not blank. Every regex written across these five rewrites
passed its first bad-form test and still had holes.

**A rule that never fires is indistinguishable from a rule that passes.** One
`INFERRED_PREFERENCE` pattern used `\p{L}` while carrying only the `i` flag —
without `u`, `\p{…}` is not a unicode property escape at all, it matches a
literal `p`. The pattern looked correct, matched nothing, and passed its own test
only because a different alternative in the same regex caught the string. Sweep
for it:

```bash
grep -n "p{" backend/routes/*.js | grep -v "'u'" | grep -v "'iu'"
```

**A hedge-spare is not automatic.** Most detectors should spare a hedged sentence,
because a hedge usually means the model is proposing rather than asserting. Not
always: "**If** a door is propped open, you're welcome to look" and "you
**might** catch artists mid-project" both open with a hedge and are both claims
about a place nobody can see. Decide per rule whether the hedge is doing
epistemic work or rhetorical work.

**Words are not always adjacent.** A pattern requiring noun and verb to touch let
"many artists **in Pilsen** are generous with their time" straight through.

**Blank a named field; PRUNE an array item.** An empty bullet reads worse than no
bullet. And arrays are objects — `Object.entries` enumerates their indices, so a
walk with an early return for arrays silently skips every array-of-strings field.

---

## 11 — Two audit anchors that move under you

`audit_v2-3-2.py` finds the results region by looking for the LAST `return (` in
the file and a `{renderResults()}` call in the JSX after it. Two consequences,
both of which cost a debugging cycle:

- **Declare a new helper component ABOVE the main component** if it contains a
  `return (`. Putting `GroundedResult` below moved the anchor past the
  `renderResults()` call and collapsed the post-result region to nothing, so
  S5.5 could not pass however many cross-refs were present.
- **Render results through a `renderResults()` helper, not inline.** Inline gives
  the check nothing to split on and the post-result half fails permanently.

Also: PF-16 and S5.5 split on `results\s*&&`, and `{!results && (` matches that
too. Name a guard `hasOutput` / `canReset` / `hasAnswer` when it must sit on the
pre-result side.

---

## 12 — i18n keys are not only in `t()` calls

Collecting keys with `grep "t('md_"` alone dropped 112 live keys from Money
Diplomat and the scenario picker rendered raw key names, because option labels
are referenced as string literals:

```js
const SITUATIONS = [{ id: 'tip', labelKey: 'md_sit_tip_label' }];  // then t(s.labelKey)
```

Collect every `'<prefix>_…'` literal in the tool file, not just the calls:

```bash
grep -oE "'(<prefix>_[a-z0-9_]+)'" src/tools/<Tool>.js | tr -d "'" | sort -u
```

**A catalog tagline that opens with an emoji doubles** against the header's
`tool?.icon`. Use `toolTagline()` from `src/utils/toolTagline.js` rather than
editing the owner's wording.

---

## 13 — When the copy outlives the tool

A rewrite changes what the tool does; the words describing it elsewhere do not
follow on their own. After any rewrite, grep for the tool and re-read:

- `src/data/tools.js` — `description`, `tagline`, `seoDescription`, `primer`,
  `guide.*`. Justify My Meeting's catalog still promised a confidence score.
- `guides/**/*.js` — CTA `body` text. Twelve guides were still selling
  "permission to decline" and "managing dominators" after both were removed.
- `src/data/toolFinderMetadata.js` — `problems`, `capabilities`, `notFor`.

The rule: if the rewrite removed a promise, find every place that still makes it.

---

## Order of work

1. Diff supplied vs current; read for bugs (§0, §6)
2. Install; fix what the repo requires (§1, §4)
3. Three-way sync: does every new input reach the prompt? (§2)
4. i18n: new keys + changed English, all 13, validated (§3)
5. Gates: syntax, eslint, guard-keys, localization, diff-audit, golden (§5)
6. Live runs — including one in German for headroom
7. Browser check (§8)
8. Commit with what was fixed **and what was found broken**

When the rewrite changes a response SHAPE rather than only its prompt, §9–§13
apply on top: sweep the guards, bump the storage key, re-record the goldens,
test the detectors both ways, and chase the copy that still describes the old
tool.
