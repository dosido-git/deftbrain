# NoiseCanceler — display name "Cut to the Chase" (`noisecanceler-v1`)

**Renamed 2026-07-16: display title "Noise Canceler" → "Cut to the Chase."** Catalog `id`
(`NoiseCanceler`), URL (`/NoiseCanceler`), backend route file/endpoint (`noise-canceler.js` /
`/noise-canceler`), i18n filename/prefix (`noise-canceler.js` / `nc_`), and golden sample all
**deliberately kept unchanged** — this was a display-copy-only rename (title, tagline's SEO title,
description, guide prose, icon `🔇`→`✂️`), not a route rename, so it didn't need the
naming-consistency pass documented in `audit/AUDIT-KIT.md`. Reasoning: "Noise Canceler" tested
badly with the user directly ("I read the name and didn't have a clue what it does") — the
noise-canceling-headphones metaphor requires an extra translation step (audio noise → information
noise) that didn't land, and the word "noise" was already doing a different job on
`SignalVsNoise`. Landed on "Cut to the Chase" after ruling out `Essence Extractor` (too abstract,
sounds like a generic summarizer — collides conceptually with Recall/Plain Talk/The Debrief) and
confirming this tool is NOT redundant with **Jargon Assassin** (language comprehension — full
plain-English rewrite, no personalization) or **Plain Talk** (broader text-structure/rhetorical
analysis, explicitly recommends other tools) — this tool's unique mechanic is that it's the only
one of the three that takes the reader's personal situation as input and filters for personal
relevance (costs/requires action/buried), not language or structure. Also fixed the `seoTitle`
along the way — it said "Summarize Long Documents," directly contradicting this tool's own guide
copy ("Not a summarizer — a personalized relevance filter").

## Original lock notes ("What Actually Affects Me?")

Personal relevance filter — pastes a dense bureaucratic document + your situation, extracts only what
affects you (actions, costs, savings, buried items, questions). **Frontend:** `src/tools/NoiseCanceler.js`.
**Backend:** `backend/routes/noise-canceler.js` (1 endpoint, `MODELS.SMART`, **max_tokens 3500**).
**Golden:** `audit/noise-canceler-golden-sample.json` (1 dense DE lease case). Verify: `npm run check:golden noise-canceler`.

## Audit fixes locked here (2026-07-14)
1. **🐛 `effort` enum degradation.** Schema was `"quick (< 5 min) | moderate (30 min) | involved (1+
   hour)"`; the frontend does strict `e === 'quick'` / `=== 'moderate'` for the effort badge → the
   parentheticals meant every effort fell through to the "involved" label. **Fix:** bare
   `"quick | moderate | involved"`. Verified DE: quick/moderate emitted clean.
2. **🐛 Truncation on the tool's own target inputs.** 7 uncapped arrays at `max_tokens 2000` — a
   dense German lease/EOB (exactly what this tool is for) truncated → parse fail → 500. **Fix:** cap
   all 7 arrays (action ≤5, costs ≤5, saves ≤4, affects ≤4, buried ≤4, consult ≤3, questions ≤5) +
   `max_tokens 3500`. Verified DE dense lease: ~1372 tok, 4/3/3/3 items.
3. **⚠️ amount fields.** Rendered raw; carried a `(number)` annotation. **Fix:** stripped + "short
   values in the user's local currency". Verified DE: "+85 EUR/Monat" etc.
4. **⚠️→cleaned:** 23 annotation leaks (`— one sentence` ×20, `(number)` ×2, `— 3-6 words`); cleaned
   the `confidence` enum; added the no-inner-double-quote rule (quoted document phrases in German).

## DO NOT silently reverse
- Clean pipe enums (`effort`/`confidence`/`priority`); the 7 array caps + `max_tokens 3500`;
  local-currency amounts; the no-inner-double-quote rule; no annotation suffixes.
