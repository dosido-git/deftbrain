# WrongAnswersOnly — audit lock notes (`wronganswersonly-v1`, 2026-07-14)

Backend `wrong-answers-only.js` — 1 endpoint `POST /wrong-answers-only`, `MODELS.FAST`, max_tokens 2000→**3000**. Comedy tool: confidently-incorrect answers.

## 🐛 Format-strict — `wrongness_level` broke the meter
Schema described `wrongness_level` as prose (`"1-10 scale of how wrong… — one sentence"`), but the frontend consumes it as a **number**: `wrongnessWidth = ${Math.min(wrongnessLevel*10,100)}%` (CSS width) and `{wrongnessLevel}/10`. A string/prose value → `NaN%` (bar collapses) + garbage meter text.
**Fix:** schema value is now the literal integer `7` + rule: *"wrongness_level MUST be a bare integer from 1 to 10 — no text, no scale description, no quotes."* Verified live: returns `9` (int).

## Other fixes
- **German unescaped double-quotes:** entire output is quotable punchlines + fake citations (`'Dr. Helena Marchetti, University of Turin, 2019'`); German quoted speech → unescaped `"` → 500. Added the no-inner-double-quote rule (RoastMe class).
- **Truncation:** max_tokens 2000→3000 + `EXACTLY 2-3 supporting_evidence` cap (unhinged German is the most verbose path).
- **Annotation leaks:** stripped 8 `— one sentence` suffixes (reached cards + copy output) + global brevity rule.
- **PF-2:** normalized `c.label = c.labelText` alias spacing (`labelText` already in c block).

## Not bugs
- `category`/`seriousness` are English input params (from pill state), sent to backend and never touched by `withLanguage` → no i18n-enum mismatch.
- Guard `!parsed.confident_answer` keys a top-level always-emitted field. Correct.
- `sessionHistory` key `wronganswersonly-history`, capped 6 — self-contained.

## Verify
`npm run check:golden wrong-answers-only` (1 DE unhinged case). Backend must be up.

## 2026-08-21 — it was a configuration panel for something that should be a button

- **CATEGORY removed** (control, state, payload, six locale keys, six prompt
  hints). "Why is the sky blue?" is science; the model works it out. Asking the
  visitor to label their own question is the visitor doing the model's job, and
  here it also costs the whole feel of the thing.
- **"How serious?" -> "HOW WRONG?"** — the one control the model cannot infer,
  and now part of the joke.
- **Ten example chips -> four, drawn at random from a pool of sixteen.**
  Vaccines and the First World War are OUT: the conceit is authoritative
  misinformation delivered straight, and it only works where believing it costs
  nobody anything. Replaced with flamingos, yawning, doughnut holes, dogs
  circling, popcorn, eyebrows, tennis balls, onions.
- **CTA**: "Wrong Answers Only" (the tool's own name) -> "Give me the wrong answer".
- **Plot Twist moved out of the top of the form.** Advertising the next ride to
  someone queuing for this one. It sits in the results cross-refs, plus a quiet
  PF-33 line at the FOOT of the form.
- **"Recent sessions" -> "Previously wrong"** so the history joins in.
- **NO HEDGING, EVER** in the system prompt. This is the one tool on the site
  where uncertainty is the enemy: no "perhaps", no "might", no "one possibility".
  The comedy is the gap between confidence and content and a single qualifier
  collapses it. Verified: zero hedges across deadpan and unhinged.
- **A safety boundary that stays in character.** `decline_reason` — set only when
  a wrong answer could get someone hurt (doses, allergies, gas and electrics,
  mixing chemicals, emergencies, children), every other field null. Verified on
  insulin dosing, chemical mixing and a swallowed button battery: all three
  declined, one line each. The model correctly broke character slightly on the
  battery to give real emergency numbers — that is the right instinct, left alone.
- **✓ COMPLETELY VERIFIED** stamp on the answer, with "*not remotely verified"
  underneath. The comedy is dead-serious presentation of nonsense, so the UI
  plays it straight and the asterisk does the work.

**Gotcha for the next editor:** audit S5.5 splits pre/post cross-refs on the
regex `results\s*&&\s*[(<]`. `{results && !results.decline_reason && (` does not
match it, so the whole results block reads as pre-result and BOTH halves of S5.5
fire in turn. The fix is a single `{results && (cond ? A : B)}` block, which is
better code anyway.

