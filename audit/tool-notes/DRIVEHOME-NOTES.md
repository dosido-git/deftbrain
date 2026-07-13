# DriveHome — architecture & lock notes (v1, 2026-07-02)

Solo-drive safety companion: pre-drive AI assessment (`claude-sonnet-4-6` + web_search, max_tokens 4000, bounded arrays) + check-in timer → "Are you safe?" → 30s auto-alarm → emergency overlay (siren, geolocation, SMS composer, emergency call). In `LOCALIZED_TOOLS`.

- **Golden:** `audit/drive-home-golden-sample.json` (assess). Verify: `npm run check:golden drive-home`.

## DO NOT silently reverse
1. **Contacts storage key is `safewalk-contacts`** — shared with SafeWalk, as the UI promises in 13 languages. DriveHome once used its own `deftbrain-safety-contacts` → contacts set in SafeWalk never appeared here and emergency alerts fell to clipboard-only.
2. **Emergency call is region-aware** via `src/utils/emergencyNumber.js` (`getEmergencyNumber(userRegion)` → 911/112/000/999/…, default 112) + `dh_call_emergency` (`{{num}}`) ×13. It was `tel:911` hardcoded in every language. The href is precomputed (`emergencyHref`) — an inline template href trips the S5.5 scanner. **SafeWalk still hardcodes 911** (locked tool — fix separately with its golden regression).
3. **Timer reconciler handles the already-expired persisted state**: `!running && remainingSec <= 0 && lastTick → setTimerExpired(true)`. A reload after expiry previously showed a frozen 0:00 ring with no "Are you safe?" prompt and no auto-alarm — the safety net silently disarmed exactly when the driver stopped responding.
4. **"Alert sent" wording stays honest** — `dh_alert_sent_to` ×13 says the message was *opened* and SEND must be pressed. Only an SMS composer opens (programmatic click inside a geolocation callback; may be gesture-blocked); claiming delivery to an incapacitated driver's contact is the worst possible overclaim.
5. Try Example uses real option ids (`evening`/`rain`/`mixed`) + gate-passing locations ("…, WA").
6. No success guard by design (frontend fully null-safe); enums clean (risk_level/severity/priority ===-switched).
