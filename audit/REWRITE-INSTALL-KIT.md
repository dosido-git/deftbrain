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

## Order of work

1. Diff supplied vs current; read for bugs (§0, §6)
2. Install; fix what the repo requires (§1, §4)
3. Three-way sync: does every new input reach the prompt? (§2)
4. i18n: new keys + changed English, all 13, validated (§3)
5. Gates: syntax, eslint, guard-keys, localization, diff-audit, golden (§5)
6. Live runs — including one in German for headroom
7. Browser check (§8)
8. Commit with what was fixed **and what was found broken**
