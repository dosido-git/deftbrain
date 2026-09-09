# ScamRadar (Scam Radar) — architecture & lock notes (`scamradar-v2`)

**Known-good:** tag `scamradar-v2` · golden `audit/scam-radar-golden-sample.json`
(3 cases, live-captured 2026-09-09)
**Verify:** `npm run check:golden scam-radar` (backend up: `npm run dev:backend`)

## What it is

Paste a suspicious message → a plain-language read (LIKELY_SCAM / VERIFY_FIRST /
NO_CLEAR_SCAM_SIGNS / NOT_ENOUGH_TO_TELL), why it looks concerning, what to do
right now, and — the architectural addition — guidance branched on whether the
visitor has already clicked, replied, entered a password, shared information,
or sent money. **Frontend:** `src/tools/ScamRadar.js` (`scam_*` keys, fully
localized). **Backend:** `backend/routes/scam-radar.js` (1 endpoint
`/scam-radar/stream` — misnamed, does not actually stream; left as-is, not part
of this pass's scope). `MODELS.SMART`, `max_tokens: 5000`, `router.outputStandard
= 'v2'` with `router.outputGuard` + `runOutputGuard`.

## V2 rewrite (2026-09-09, full owner-supplied spec)

The v1 tool was pitched and written as a confident verdict engine: it promised
to "identify" whether a message is a scam, rendered a fabricated numeric
confidence score (`SCAM — 99% confidence`), called a domain "spoofed" or
"fraudulent" from text analysis alone, and had no output guard at all — nothing
ever checked its own claims against what was actually supplied. It also had no
idea whether the visitor had merely received the message or had already handed
over a password, so `what_to_do` was generated from the message content alone.

**Installed per `audit/REWRITE-INSTALL-KIT.md`, not copied verbatim** — the
supplied prompt spec had two real bugs caught before install (§6, "read the
supplied code for bugs; it has them"):

- **Enum inconsistency.** The VERDICT section listed spaced human-readable
  strings ("LIKELY SCAM", "SUSPICIOUS — VERIFY FIRST") while the OUTPUT JSON
  schema section listed different underscored tokens ("LIKELY_SCAM",
  "VERIFY_FIRST") for the same four values. Standardized on the JSON schema's
  tokens everywhere in the prompt, since that's what `parsed.verdict` actually
  has to equal and what the frontend switches on.
- **Missing NO_QUOTE_RULE and missing non-translation instruction.** The
  supplied spec never mentions escaping quotes or pinning the verdict token —
  exactly the two things that took v1 down in all 12 non-English languages
  (see "Audit fixes locked here (2026-07-14)" below, kept for history). Both
  added before the first live call, not discovered by breaking again.

**What shipped:**

- **No message-type taxonomy.** The old required "Message type" pill row
  (email/SMS/DM/phone/invoice/social/other) is gone from both the UI and the
  prompt — the visitor pastes the actual material; the model infers context
  from content. `messageType` no longer exists anywhere in this tool.
- **"Have you already done anything?"** — single-select radio (not pills;
  these are mutually exclusive facts, not a preference toggle), 8 options
  mapped to a fixed English `INTERACTION_LABELS` map in the backend (never
  translated — same reasoning as the verdict enum) that the prompt's WHAT THE
  VISITOR ALREADY DID section branches on directly. "Something else" reveals
  a free-text elaboration field (`interactionOther`) — **this input and its
  placeholder were not in the supplied spec**, added because a bare "other"
  with zero elaboration gives the model nothing to work with; flagged here so
  it isn't mistaken for something the owner explicitly asked for.
- **No numeric confidence, ever.** Verdict is one of 4 fixed English tokens,
  pinned and never translated (see DO NOT REVERSE).
- **No fixed message-type/technique enum requirement.** `scam_pattern.label`
  is descriptive prose now, not a picklist value with a per-type icon lookup —
  deliberately NOT guarded/pinned, since the prompt explicitly prefers "this
  resembles an account-impersonation attempt" over forcing a precise category.
- **Output order changed**: THE READ → disclaimer → WHAT TO DO RIGHT NOW → WHY
  THIS LOOKS CONCERNING → HOW TO VERIFY IT → IF YOU ALREADY INTERACTED (only
  when `relevant: true`) → WHAT DOESN'T SETTLE IT → AVOID → MORE ABOUT THIS
  PATTERN (collapsed — `scam_pattern` + `important_unknowns` together, since
  both are "context, not the first screen"). v1 buried the action after a
  verdict banner, a scam-type explainer, and up to 8 red flags.
- **Neutral (non-green) styling for NO_CLEAR_SCAM_SIGNS and
  NOT_ENOUGH_TO_TELL.** Both verdicts explicitly are not a safety finding —
  the prompt says so in both cases — so neither gets the old emerald/checkmark
  "LIKELY SAFE" treatment; a green banner would visually contradict the text
  sitting inside it.
- **`router.outputGuard` added** (v1 had none): prohibits numeric confidence,
  unverified fraud/legitimacy claims about a domain or sender, unsourced brand
  policy, HTTP/HTTPS treated as proof, polish/grammar treated as decisive,
  verification recommended via the message's own channel, invented reporting
  contacts, promised institutional action (reversal/recovery/freeze), "no red
  flags" read as verified-safe, and attacker psychology stated as fact. This
  list is drawn directly from the owner's own supplied "FINAL AUDIT" checklist
  — it names the same failure modes, just as guard prohibitions instead of a
  reviewer's checklist.
- **`max_tokens` 4000 → 5000** for the larger nested schema (arrays of
  `{action, reason}` / `{observation, why_it_matters}` objects cost more per
  item than v1's flat string arrays) plus non-English expansion headroom.
- **Persisted keys bumped**: `scamradar-results` → `scamradar-results-v2`,
  `scamradar-history` → `scamradar-history-v2` — the result shape changed
  completely (no `confidence`/`scam_type`/`red_flags`/`green_flags`/
  `what_to_do`/`do_not`), so a v1 result restored into the v2 renderer would
  have crashed for every existing user.
- **Catalog rewritten** (`src/data/tools.js`): description, tagline
  (`🎣 Spot the warning signs before you click, pay, or reply.` — emoji kept
  in the catalog field per `toolTagline()` convention; the in-app i18n
  `scam_tagline` key is emoji-free since the header already renders
  `tool.icon` in its own span right before it — including the emoji in both
  would double it, exactly the bug `src/utils/toolTagline.js` documents),
  `guide.overview`/`howToUse`/`tips`/`example`, `primer` — all previously
  described the message-type selector and numeric confidence.
- **i18n**: 23 new keys + 23 keys reused verbatim from v1 (title/tagline
  wording, disclaimer, error strings, cross-ref labels — genuinely unchanged
  meaning) across all 13 languages; 23 v1-only keys dropped (message-type
  labels, `scam_confidence`, `red_flags`/`green_flags`/`techniques_used`
  labels, all `scam_copy_*` fields tied to the old schema). Verified with
  `i18n-convention-audit.js --strict` and `localization-audit.js`.

## Live verification (2026-09-09)

Three cases captured against the real endpoint, replacing the single v1 case
(golden sample is a full re-record, not a diff against v1 — schema is
unrelated):

1. **EN, `interactionStatus: entered_password`** — confirms the core new
   feature: `if_you_already_interacted.relevant: true` with password-specific
   guidance (change it on the real site, check for reuse, review account
   security), correctly distinct from the generic "verify independently"
   advice a `none` interaction gets.
2. **DE, no interaction, message contains a literal doubly-quoted phrase**
   (`Ihre "Kreditkartendaten"`) — the exact shape of input that took v1 down.
   Returned valid JSON with `verdict: "LIKELY_SCAM"` — the bare English token,
   unchanged, inside an otherwise fully German response. Confirms both fixes
   (NO_QUOTE_RULE, enum pinning) actually hold under the real failure
   condition, not just in the abstract.
3. **EN, romance/pig-butchering scenario, no explicit money request yet** —
   confirms the tool commits to `LIKELY_SCAM` on a well-established multi-stage
   pattern before a financial ask appears, rather than hedging to
   `NOT_ENOUGH_TO_TELL` just because the final step hasn't happened.

`runOutputGuard` caught and repaired 4 real violations on the DE call
(`general_scam_pattern_stated_as_fact_about_this_specific_sender`,
`http_vs_https_treated_as_proof_of_legitimacy_or_fraud` ×1,
`manipulation_intent_stated_as_known_attacker_psychology`, `invented_fact`) —
the golden output is the POST-repair version. The EN cases passed with 0
flagged fields. Also browser-verified live: no message-type selector, all 8
interaction radios render, "Something else" reveals its free-text field, full
result renders in the documented order with the collapsed pattern section
working, and `npm run check:golden scam-radar` passes 3/3 against the live
backend.

## Audit fixes locked here (2026-07-14) — kept for history, both reconfirmed live 2026-09-09

1. **🐛 DOWN in ALL 12 non-English languages — 500 every call.** The guard
   `VALID_VERDICTS.includes(parsed.verdict)` checked English literals, but
   `withLanguage` instructs the model to *translate JSON string values* →
   German verdict "BETRUG" failed `.includes()` → 500. Fixed then by pinning
   the enum; the underlying trap resurfaced verbatim in the 2026-09-09
   supplied spec (see above) and was fixed again before install this time.
2. **🐛 German quote-citation 500.** Unescaped double-quotes in a cited phrase
   → invalid JSON → 500. Same trap resurfaced in the supplied spec (no
   NO_QUOTE_RULE at all) and was added before install.
3. **⚠️ `techniques_used` uncapped** — moot in v2 (no `techniques_used` field;
   manipulation techniques are folded into `why_concerning` observations,
   capped at 2-6 items by the prompt).
4. **🛡️ `scam_disclaimer`** — kept verbatim in v2, same placement under the verdict.

## DO NOT silently reverse

- The verdict token pin (`LIKELY_SCAM|VERIFY_FIRST|NO_CLEAR_SCAM_SIGNS|
  NOT_ENOUGH_TO_TELL`) plus the explicit non-translation instruction sitting
  directly beside the enum list in the prompt — this exact class of bug has
  now taken this tool down twice.
- `NO_QUOTE_RULE` (from `backend/lib/factCheck.js`) appended to the system
  prompt — same reasoning, same tool, second time.
- `router.outputStandard = 'v2'` + `router.outputGuard` — v1 shipped with
  zero output checking on a tool whose entire job is telling someone whether
  to trust a message; don't regress to an unguarded route.
- Neutral (non-green) styling on `NO_CLEAR_SCAM_SIGNS` / `NOT_ENOUGH_TO_TELL`
  — neither is a safety finding.
- No message-type selector — don't reintroduce it as a "quick win" for
  categorization; the model infers context from the pasted content.
- `scamradar-results-v2` / `scamradar-history-v2` persisted keys — don't drop
  the `-v2` suffix on a future edit without checking whether the shape changed
  again.
- `scam_disclaimer` line under the verdict banner.
