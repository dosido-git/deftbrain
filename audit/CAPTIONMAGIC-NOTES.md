# CaptionMagic — architecture & lock notes (`captionmagic-v1`)

Generates social captions from an image or description: 3 tone-varied caption variations with categorized hashtags, alt-text, posting-schedule, engagement tips; plus revise / multi-platform adapt / remix. **Frontend:** `src/tools/CaptionMagic.js`. **Backend:** `backend/routes/caption-magic.js` (4 endpoints). **Golden:** `audit/caption-magic-golden-sample.json` (3 cases). Verify: `npm run check:golden caption-magic` (needs local backend; haiku — fast, ~3–16s/case).

## Shape
- **4 endpoints**, ALL `claude-haiku-4-5` (`MODELS.FAST`) via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext` (locale ctx is appended to the user content, not `system:` — pre-existing, works):
  - `/caption-magic` (main, `max_tokens 4000`) — **vision-capable** (image content-block); output `image_read`, `captions[3]{tone,text,hashtags[{tag,category}],char_count,why_it_works,best_for}`, `alt_text`, `posting_schedule{best_days,best_hours,why}`, `engagement_tips[]`, `avoid[]`.
  - `/caption-magic/revise` (4000) `revised_text` · `/caption-magic/adapt` (**3000**) `adaptations[]` · `/caption-magic/remix` (4000) `remixed_caption`.
- Input guards on missing image/caption (400). No post-parse success guard — frontend is null-safe and `callClaudeWithRetry` now turns parse/truncation failures into clean retried errors.
- In `LOCALIZED_TOOLS` (`cm_` prefix). Frontend renders primary fields **raw**: caption `text`, `tone` pill (l.776/714), hashtags as `#{tag}` (l.380/439/589), `platform_name || platform` badge (l.830).

## Audit fixes locked here (2026-07-11)

1. **🛡️ Robustness — all 4 endpoints had a local `withRetry` that only retried on 529 overload** (no parse-retry, no truncation detection). A malformed/truncated haiku response → immediate 500 with no recovery; an over-budget output → slow gateway 502 with no actionable error. **Fix: switched all 4 to `callClaudeWithRetry`** (`{model: MODELS.FAST, max_tokens, messages}`) — verified it forwards `.model` and passes the **image content-block** through, so even the vision main endpoint adopts it. This is a strict superset of the old resilience (parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry) and matches the rest of the codebase. Removed the dead `withRetry` helper + now-unused `anthropic`/`cleanJsonResponse` imports.
2. **⚠️→cleaned: 21 annotation leaks stripped** — `— one sentence` ×19, `— 1-2 sentences` ×1, `— 3-6 words` ×1 — glued onto the **primary output**: caption `text`, each `hashtag.tag` (would render `#hashtag1 — one sentence`), `tone`, and the `platform_name`/`platform` badge. Didn't echo in tests (latent), but these are the most-visible surfaces (BatchFlow class).
3. **`adapt` `max_tokens` 2000 → 3000** — `adaptations[]` scales with target-platform count (up to 6); held at 6/German in testing, bumped for headroom (and `callClaudeWithRetry` now fails fast if it ever truncates).

## DO NOT silently reverse
1. **`callClaudeWithRetry` on all 4** — don't revert to bare `anthropic.messages.create`; that drops parse-retry + truncation fail-fast. Keep `model: MODELS.FAST` (haiku — deliberate: fast + concise).
2. **Stripped annotations** — don't re-add `— one sentence` etc. to any field; **check-golden checks STRUCTURE not content**, so a re-introduced leak won't be caught — eyeball output after prompt edits.
3. **`adapt` max_tokens 3000** — don't lower; adaptations scale with target count.

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues (backend audit re-verified clean after the refactor — model refs use `MODELS.FAST`).
- All arrays in the golden are always-populated (captions 3, engagement_tips, avoid, adaptations, hashtags) — none neutralized.
- Live EN+DE verified clean on all 4 endpoints post-refactor (main EN/DE, revise DE, adapt DE 6 platforms, remix DE) — 200, no leaks, no truncation.
