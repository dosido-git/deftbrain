# RentersDepositSaver — architecture & lock notes (v1, 2026-07-02)

3-step move-in documentation coach: room-by-room walkthrough → property details → SSE-streamed 5-section report (condition report, landlord letter, photo list, deposit rights, move-out tips) via 3 parallel `claude-sonnet-4-6` calls. Plus a quick rights lookup. Money + legal-adjacent; the codebase's print-pattern reference. In `LOCALIZED_TOOLS`.

- **Endpoints:** `POST /api/renters-deposit-saver/rights` (JSON) + `POST /api/renters-deposit-saver/stream` (SSE).
- **Golden:** `audit/renters-deposit-saver-golden-sample.json` (rights case only — **the SSE stream route cannot be harness-checked**; check-golden expects JSON, not event-stream. Exercise /stream manually when it changes). Verify: `npm run check:golden renters-deposit-saver`.

## DO NOT silently reverse
1. **The `/rights` endpoint exists** (schema: `rights_summary`, `key_rights[]`, `caution`). The old sequential route serving `action:'rights-only'` was deleted in `b3a3295` and the frontend kept posting to it — a headline feature of a legal/money tool **404'd for ~8 weeks**. The frontend consumes exactly those three fields (render + copy).
2. **`deposit_rights` in the stream schema is "5-8 short bullet points"** naming statutes only if certain — commit `00e1a67` once appended `— one sentence` to this full report section (the annotation-sweep fix applied in reverse), gutting the legal deliverable.
3. The four walkthrough controls keep their emoji glyphs (➕ add-room in a `flex gap-2` row, ⧉ duplicate visible on mobile, ✕ checkpoint-remove, ✕ rights-close) — a lucide purge once left them as invisible empty buttons.
4. Try Example region is `'California'` (full state name — the option values are full names, not codes).
5. No content-array-in-withLanguage bug here; no `$` exemplars; jurisdiction handling genuinely international (10-country picker + OTHER). Keep it that way.
