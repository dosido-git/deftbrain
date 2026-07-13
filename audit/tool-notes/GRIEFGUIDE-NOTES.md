# GriefGuide — architecture & lock notes (`griefguide-v1`)

Compassionate grief guidance (self / helping-someone modes): warm opening, what's-normal, 3-4
guidance sections, what-to-say/not-say, when-to-seek-help, support resources. **SENSITIVE DOMAIN.**
**Frontend:** `src/tools/GriefGuide.js` (in `LOCALIZED_TOOLS`, `gg_` keys). **Backend:**
`backend/routes/grief-guide.js` (single endpoint `/grief-guide/stream` — misnamed, plain JSON).
**Golden:** `audit/grief-guide-golden-sample.json` (2 DE cases). Verify: `npm run check:golden grief-guide`.

## Shape
1 endpoint, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 5500`**, via `callClaudeWithRetry`
+ `withLanguage` + `withLocaleContext`. Guard `!parsed.opening || !Array.isArray(parsed.guidance)` ✅.

## Audit fixes locked here (2026-07-13)
1. **🐛 SAFETY — no crisis path (top priority).** The tool had 0 crisis handling: `when_to_seek_help`
   was steered "non-alarmist, normalizing," no 988/hotline/disclaimer anywhere. An acute self-harm
   input got a warm grief reply with no resources. **Fix (defense in depth):**
   - **Static crisis banner** in `gg_intro` — appended a short crisis line (US/Canada 988; UK/Ireland
     Samaritans 116 123; or local emergency number) to `gg_intro` in **all 13 languages**, and it now
     renders on **both** the input AND results screens. This is the **model-independent safety net**.
   - **System-prompt SAFETY OVERRIDE** (absolute priority) + acute-risk rule + a `crisis_support`
     top-level field (rendered FIRST in a `c.danger` box when present).
   - ⚠️ The model reliably leads `opening` with safety AND surfaces the CORRECT localized crisis line
     (e.g. Germany's Telefonseelsorge — better than a hardcoded 988), but does **not always populate
     the dedicated `crisis_support` field** (it routes crisis into opening/support_resources). That's
     why the static banner is the primary net; `crisis_support` is a bonus prominent surface.
2. **⚠️ Truncation risk.** `guidance` uncapped (2-3 paragraph bodies) at `max_tokens 4000`. **Fix:**
   `guidance` AT MOST 4 + 1-2 paragraph bodies + `max_tokens` → **5500**.
3. **⚠️ Frontend:** duplicate DifficultTalkCoach cross-ref link removed. Annotations were already clean.

## DO NOT silently reverse
1. The **static `gg_intro` crisis line in all 13 languages**, rendered on input AND results — the
   model-independent safety net for a sensitive-domain tool.
2. The system-prompt SAFETY OVERRIDE + acute-risk rule + `crisis_support` field/render.
3. `guidance` ≤4 + `max_tokens 5500`.

## Known / accepted
- `crisis_support` fires inconsistently (model prefers opening/support_resources) — acceptable given
  the static banner + the model's reliably safe acute handling. Verify safety via the acute-de case.
