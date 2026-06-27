# FinalWish — architecture & lock notes

**Known-good:** tag `finalwish-v1` · golden `audit/final-wish-golden-sample.json`
**Verify:** `npm run check:golden final-wish` (backend up: `npm run dev:backend`)

## What it is
A digital-legacy / end-of-life planning tool (sensitive domain). Frontend
`src/tools/FinalWish.js` (~1990 lines): multi-screen wizard (welcome → chapter / interview /
direct / emergency → delivery), auto-saving draft, and three standalone HTML deliverables —
plain export, **passphrase-encrypted** export (self-decrypting HTML), and a printable QR access
card — plus a JSON backup. Backend `backend/routes/final-wish.js`: **one endpoint, 7 modes**,
all `claude-sonnet-4-6`, **stateless**:
`parse-accounts` · `parse-financial` (return JSON arrays) · `generate-message` · `adjust-message`
· `interview-question` · `smart-gaps` · `translate-message` (return objects).

## DO NOT silently reverse (the locked fixes)
1. **Encrypted-export decryptor must slice the salt as `d.slice(0, 16)`.** `encryptText` writes a
   16-byte salt at bytes `[0,16)`, the 12-byte IV at `[16,28)`, ciphertext at `[28,)`. The
   embedded decryptor used `slice(0, 6)` → wrong salt → PBKDF2 derives the wrong key → AES-GCM
   fails **even with the correct passphrase**. This silently made every passphrase-protected
   document permanently unopenable — catastrophic for this tool. Verified by a crypto round-trip
   (slice(0,6) → OperationError; slice(0,16) → decrypts). Old already-downloaded files embed the
   buggy script and must be re-exported.
2. **`cleanJsonResponse` (shared `backend/lib/claude.js`) must stay array-aware.** It was
   object-only (trim to first `{` / last `}`), which stripped a top-level array's `[ ]`, turning
   `[{...},{...}]` into `{...},{...}` → `JSON.parse` throws → HTTP 500. That broke
   `parse-accounts` + `parse-financial` (the tool's headline "describe it, AI extracts it"
   feature) for any multi-item list. Fix: a `startsWith('[')` branch that trims to the outer
   `[ ]` and still runs `repairJsonStrings`. Object responses never enter this branch, so all
   other tools are unaffected (verified: laundro-mat golden still 3/3). The golden's
   parse-accounts + parse-financial cases guard this.
3. **All user content in the 3 HTML generators is escaped via `esc()`.** `generateExportHTML`,
   the encrypted decryptor page, and the QR card interpolate names/notes/messages/hints into raw
   HTML. Without escaping, a stray `<`, `&`, or `</script>` in any field corrupts the deliverable
   (or injects markup). `esc()` is applied to every user-entered value; keep it that way when
   adding fields.
4. **Privacy is stated in-tool** (`fws_privacy_note`, welcome screen): processed in the browser,
   sent to the AI only to organize, never stored on our servers, draft saved only on this device.
   This is accurate — backend is stateless; the only persistence is the `localStorage` draft
   (`deftbrain_finalwish_draft`). Keep the claim honest if the data flow changes.
5. **All 7 modes on `claude-sonnet-4-6`.** Each parse mode retries 3× inline; parse failure →
   top-level 500.

## Deliberate design (don't "fix")
- **Custom `window.open` print + hardcoded branding divs** (audit S1.4e ×2, pre-existing): these
  are CORRECT — the exported document / QR card are standalone HTML files that must embed their
  own print trigger and branding. ActionBar can't drive them. Accept these two audit flags.
- Only **hints** are stored, never secrets: `accessNotes` ("NOT actual passwords" per the prompt)
  and `passphraseHint` (not the passphrase). The footer carries a legal disclaimer ("not a legal
  will — consult an attorney").

## Mobile (render-layer, NOT in golden)
- Welcome + chapter screens clean at 375px (no overflow/crush). The added privacy line wraps
  fine. Tool's category/type/role `<select>`s are 12px (iOS-zoom, catalog-wide pattern).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden final-wish` runs 3 cases sequentially and fits.
- **`cleanJsonResponse` is shared** — any change there is a catalog-wide regression surface;
  re-run `check:golden` on a couple of object-returning locked tools after touching it.
- Fully localized (in `LOCALIZED_TOOLS`); `fws_*` keys in `src/i18n/locales/tools/final-wish.js`
  across 13 languages (incl. the new `fws_privacy_note`).
