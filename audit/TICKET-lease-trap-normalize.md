# Cleanup: normalize `lease-trap-detector.js` handlers 1–7 to house prompt pattern

**Priority:** Low — optional polish, not a fix. Nothing is broken; lint is green.
**Type:** Refactor / consistency
**Files:** `backend/routes/lease-trap-detector.js`

## Context

The locale-wiring task is **complete** — `withLocaleContext(userLocale, userCurrency, userRegion)` is already on every `system:` prompt across `money-diplomat.js`, `skill-gap-map.js`, `lease-trap-detector.js`, and `subscription-guilt-trip.js`, and the ~93 locale warnings are cleared (`npm run audit` exits 0).

While verifying, a separate inconsistency surfaced in `lease-trap-detector.js`: in handlers 1–7 the **role prompt lives in the user message**, and `system:` carries **only** the locale block. The rest of the codebase puts the base prompt, language wrapper, and locale context together in `system:`.

Repo state at discovery: `main` @ `1721f8c`; file last touched by `0ac707c` ("clean audit, all files", 2026-06-07).

## Current shape (handler 1, `/lease-trap-detector`)

- Role prompt is built into the user-message template (`const prompt = "You are an expert tenant rights attorney…"`, ~line 53) and pushed into the user `contentBlocks` array (~line 250).
- `system:` is just `withLocaleContext(userLocale, userCurrency, userRegion)` (~lines 255–259) — role is **not** in system.

## Target shape (house pattern)

Same pattern handler 8 (`/missing`) already uses at ~`:905`:

```
const systemPrompt = 'You are an expert tenant rights attorney with deep knowledge of state and local landlord-tenant law.';
...
system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
messages: [{ role: 'user', content: withLanguage(contentBlocks, userLanguage) }]
```

## Scope & sequencing

Do this as **two passes**, not one:

1. **Handlers 2–7 first.** These are the simple case: user prompt is a plain string with the role at the top. Lift the role into a `systemPrompt` const, build `system:` from it, and strip the now-duplicated role sentence from the user prompt.
2. **Handler 1 separately.** It's the awkward one: user content is a `contentBlocks` array (may carry a PDF document block) and the role sentence is fused with `${leaseType}` / `${location}` / lease-text in one template. Decide per-handler whether to strip the duplicated role sentence from the user prompt or leave it in both places.

## ⚠️ Verification — gates are NOT enough here

This changes what gets sent to the model, so **the four pre-push gates won't catch a regression** — they check structure, not output quality, and will stay green even if responses degrade.

Required before committing:
1. Run all four gates (`check:syntax`, `audit`, `scan-guard-keys.js`, `diff-audit.py`).
2. **Manually run 2–3 of the affected tools** and compare output quality before vs. after. This is the real test.

## Definition of done

- Handlers 1–7 use `system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(...)`, matching handler 8.
- No duplicated role sentence left unintentionally in both system and user prompt.
- All four gates pass.
- Output spot-checked on at least two handlers; no quality regression.
