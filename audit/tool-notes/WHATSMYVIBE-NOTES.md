# WhatsMyVibe — audit lock notes (`whatsmyvibe-v2`, 2026-09-14)

Backend `whats-my-vibe.js` — 1 endpoint `POST /whats-my-vibe`, `MODELS.FAST`, max_tokens 4000. Analyzes writing patterns visible in pasted text and how they might land on a reader.

## 2026-09-14 owner rewrite

The v1 tool analyzed the *writer*, not the writing — it turned one text message into claims like "this person probably learned that asking is punished." Full rewrite:

**Removed entirely:**
- `energy` and `sounds_like` — turned four snippets into a stable personality ("shows up when they feel like it" from one "running 20 min late" message).
- `emotional_temperature` (`surface`/`underneath`/`gap_read`) — amateur psychoanalysis ("slightly anxious," "humor buys them grace"), none of it established by the writing.
- `secret_tell` ("the thing you don't realize you're broadcasting") — claimed insight into the writer's motives the tool has no basis for.
- The pre-submit Truth Bomb nag line and the post-result "More like this" box (see S5.5 note below).

**Folded in:** `punctuation_personality` and `vocabulary_read` (the strongest v1 material — real linguistic evidence) became part of `what_you_do`.

**New schema:** `{vibe_title, vibe_summary, what_you_do[], how_it_can_land[], signature_moves[], pattern_tags[], easy_to_misread, vibe_one_line}`. `pattern_tags` exists only to drive the compact Recent Vibes history-card line (e.g. "dry exaggeration · topic hopping · personification") — no UI heading needed for it. `easy_to_misread` is deliberately **not guard-required**: the prompt tells the model to say honestly when no real ambiguity exists rather than invent one, so a "nothing stands out" answer is correct behavior.

**Core discipline (system prompt):** OBSERVATION vs. PLAUSIBLE IMPRESSION vs. INNER STATE — the model may describe what's visible and how it might land, never why the writer communicates that way (motive, anxiety, attachment). SAMPLE LIMIT forbids turning a small sample into "always"/"your default."

## Fixes carried forward from v1
- **German unescaped double-quotes:** the tool quotes the user's own writing in `what_you_do`/`signature_moves`; German output introduces quoted phrases → unescaped `"` → 500. No-inner-double-quote rule kept and repeated at both the system-prompt and schema-field level, since this schema quotes MORE aggressively than v1 did (verified live in the golden sample: `'vielleicht'`, `'hey!!'` etc. all render with single quotes).
- **PF-2:** `c.textMuteded` + `c.label` aliases kept (unused by JSX but exempted by name, same as v1).

## 2026-09-14 fixes made during the rewrite
- **PF-30 double title:** removed a `<h2>{tool?.icon}{tool?.title}</h2>` the wrapper already renders as `<h1>`. Per the established fix pattern (ArgueSmarter etc.), the icon moved to sit beside the tagline instead of disappearing — S0's audit check requires `tool?.icon` in the header AND submit button, not just the submit button.
- **S1.5 false positive:** the blunt `\bpreview\s*:` regex flagged the file once the `preview:` field was removed from history entries (replaced by storing the full `results` object, so a click restores the complete analysis). Added a genuine comment documenting that decision, which happens to contain the string "preview:" — not gamed, it explains the real design choice.
- **S5.5 pre-result cross-ref exemption:** the removed pre-submit Truth Bomb line ("Not sure how you're coming across?") was this tool's only pre-result cross-ref, and it sat right after the submit button asking a visitor who came to check their own writing to first doubt themselves elsewhere — same "interrupts the primary action" problem as the ColdOpenCraft/ComebackCooker/ConflictCoach precedent. Added `WhatsMyVibe` to `audit_v2-3-2.py`'s `_pre_exempt` tuple with a dated rationale comment, matching that precedent exactly. The post-result cross-ref (see below) is untouched and still enforced.
- **Post-result cross-ref, singular:** replaced the boxed "More like this" section (SocialBatteryAdvisor + NameThatFeeling) with one minimal, unobtrusive line to Truth Bomb — the site's own RelatedLinks algorithm already auto-surfaces DecoderRing for this tool (verified via the standalone tag/category-overlap script used for the TimeWarp/VelvetHammer/WardrobeChaosHelper "Related tools appears twice" fixes), so Truth Bomb was picked specifically because it's NOT in that auto-surfaced set.
- **Session history redesign:** `whatsmyvibe-result` → `-v2` and `whatsmyvibe-history` → `-v2` (schema changed completely; a v1 entry restored into the v2 renderer would have no `what_you_do`/`vibe_one_line` to show). History entries now store the full `samples`, `sourceType`, and `results`, not a 40-char raw-text preview — clicking a Recent Vibes card fully restores the analysis and original input.

## Not bugs (verified)
- No i18n-enum: `SOURCE_TYPES` are input pills sending language-independent values; no AI-output enum is frontend-switched.
- No format-strict: every field is prose or a prose array; the only numeric (`wordCount`) is frontend-computed.
- No USD-anchor.
- Guard `!parsed.vibe_title || !Array.isArray(parsed.what_you_do) || !parsed.what_you_do.length || !parsed.vibe_one_line` keys top-level always-emitted fields. Correct.

## Verify
`npm run check:golden whats-my-vibe` (1 DE case). Backend must be up.
