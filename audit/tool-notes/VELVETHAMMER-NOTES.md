# VelvetHammer — audit lock notes (`velvethammer-v2-rewrite`, 2026-09-14)

Rewrite of the `velvethammer-v1` lock (2026-07-14, notes preserved below). Backend `velvet-hammer.js` — 1 endpoint `POST /velvet-hammer`, `MODELS.SMART`, max_tokens 4000.

## Why: v1 assumed a stance and invented escalating facts

"Collaborative" instructed the model to "assume good intent" — a stance the user never expressed. Worse, the tool invented increasingly serious facts as tone got firmer: internal sign-off, an internal approval process, real cost, diminished confidence, refusing future reviews, reassessing the terms of the relationship. None of it came from the user's draft. Governing principle: Velvet Hammer removes the heat without rewriting the history.

## New shape and tone model

`rage_audit` → `core_message` (neutral factual restatement, UI label "The Point" / `vh_point_title`, no injected claims like "making reliable planning difficult"). Tones renamed `collaborative/balanced/firm` → `clear/tactful/firm` — firmness comes from wording, not from an assumed stance or an invented consequence.

## Bugs found and fixed during this rewrite

- **Invented internal process (the exact v1 bug, initially still present).** Live-testing in German, the Tactful and Firm variants both added a fabricated internal approval process ("bis es intern abgeschlossen/freigegeben ist") the user never described. Added an explicit rule + BAD/GOOD example naming this specific fabrication. **Only partially closed**: re-tested three times after the fix — 2 of 3 runs were fully clean, one Tactful variant still added a soft "intern" (internally) qualifier implying knowledge of the recipient's internal state. This is a disclosed, real residual, not eliminated. Re-verify if the fact-preservation rules are touched again.
- **Canned-opening / throat-clearing preamble.** The user explicitly banned openings like "I wanted to flag." Testing showed the model reaching for close paraphrases instead ("I want to flag a pattern," "I wanted to raise something," "Something I've been meaning to bring up") — the literal ban didn't generalize. Added a structural rule against the throat-clearing MOVE itself, not just specific phrases. Partial improvement: Clear and Firm are now consistently clean; Tactful specifically still reaches for a soft opener more often than the other two tones.
- **S1.5 preview-field false positive.** Same as TimeWarp/UpsellShield's 2026-09-14 rewrites — restructuring session history away from a single `preview:` field trips `audit_v2-3-2.py`'s name-keyed check. Resolved with a genuine explanatory comment containing "preview:" (not gamed — documents the real reason: showing something recognizable instead of the user's raw angry draft).
- **Recent Sessions showed the raw angry draft.** v1 stored `preview: draft.slice(0, 40)` — exactly the raw wording the rewrite explicitly said not to redisplay. Fixed: session cards now show relationship + `core_message` + goal, never the raw draft, and clicking a card reopens the complete result (v1 had no click handler at all).
- **Related tools box removed, one link kept.** The page already supplies its own Related Tools section after this component; the tool-level box was redundant. Removed the box (was ConflictCoach + ComebackCooker) but kept a single unobtrusive ConflictCoach link — `audit_v2-3-2.py` S5.5 requires at least one post-result cross-ref; zero is a violation (same trap hit in TimeWarp's 2026-09-14 rewrite).

## Carried forward from v1 (still true)

- `tone` MUST stay the English codes (now `clear`/`tactful`/`firm`), pinned do-not-translate — the frontend's `toneColor()`/`toneBg()` switch on the literal, `label` carries the localized word.
- No-inner-double-quote rule still required — messages are scripts a user might send; quoted phrasing → 500 in German if violated.
- PF-2 aliases (`c.textMuteded` + `c.label`, `labelText` already in the `c` block).
- Persisted-state keys bumped to `-v2` (`velvethammer-draft-v2`, `velvethammer-result-v2`, `velvethammer-history-v2`) — v1's schema (rage_audit, collaborative/balanced tone codes) has nothing in common with this one.
- Guard `!data.variants?.length` keys a top-level non-nullable array. Correct.

## Verify

`npm run check:golden velvet-hammer` (1 DE case). Spot-check for the invented-internal-process pattern and the throat-clearing-preamble pattern in Tactful specifically if the fact/meaning-preservation rules are ever edited — both are known, only-partially-closed residuals. Backend must be up.
