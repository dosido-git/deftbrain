# ScamRadar (Scam Radar) — architecture & lock notes (`scamradar-v2.2`)

**Known-good:** tag `scamradar-v2.2` · golden `audit/scam-radar-golden-sample.json`
(3 cases, verified 2026-09-09 after the v2.2 final-corrections pass)
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

## V2.1 refinement pass (2026-09-09, owner review of the V2 rewrite)

The owner approved the V2 architecture but caught one real bug during review
plus several pattern-vs-fact leaks in the wording. All eight fixes, live
verified:

1. **🐛 The tool trusted the "already done?" radio button over contradicting
   evidence in the visitor's own pasted transcript.** Repro: the transcript
   contains `[after reply]` and `[three days of friendly conversation
   later]`, but the visitor selected "No — I haven't interacted." The tool
   said "you have not shared anything or clicked anything" — flatly
   contradicting the transcript it had just been given. Fixed with a new
   **RECONCILE CONFLICTING INPUTS** prompt section plus a new top-level
   output field, `input_conflict: { detected, note }`, populated before
   `what_to_do_now`/`if_you_already_interacted` are generated. When the
   transcript establishes more happened than the selection says, the model
   now says so explicitly (in the visitor's own words: "Your pasted
   conversation suggests you replied... although you selected 'I haven't
   interacted.' That difference matters for the next steps.") and bases the
   rest of the response on the transcript's own evidence, not the stale
   selection. Frontend renders this as its own callout (⚖️, `c.warning`
   styling) directly under THE READ, before the disclaimer — visible before
   any advice, matching the owner's "reconcile before advising" instruction.
   New i18n key `scam_input_conflict` (all 13 languages).
2. **Sender intent vs. observable wording.** "'Is this still your number?' —
   a message designed to get a reply from anyone" asserted the sender's
   design intent as fact. Now: "...is a low-friction opener that can elicit
   a reply without requiring the sender to establish much first" — describes
   effect, not claimed intent.
3. **No more "genuine people typically..." claims.** "A genuine wrong number
   typically ends when corrected" was a categorical, unsupported rule. Now
   the prompt requires analyzing the specific sequence in front of it
   instead.
4. **No more certain next-stage predictions.** "If the platform were
   introduced now, that would complete the sequence" implied the tool knows
   what happens next. Now conditional: "If the sender next introduces a
   trading platform... that would add another strong warning sign."
5. **An offered platform is not a controlled platform.** "An invitation to
   engage with a trading interface the sender controls or promotes" upgraded
   an offer into a fact about control/operation/fraud. New **PLATFORMS AND
   TOOLS OFFERED IN A MESSAGE** section: the offer is the only established
   fact; who operates it is explicitly unknown; the "fraudulent platform
   introduced after trust-building" claim stays labeled as general pattern
   knowledge, never fact about this platform.
6. **Continued conversation is not itself financial exposure.** "Engaging at
   that stage is where financial exposure begins" mischaracterized ordinary
   social engagement as exposure. New **TIE ADVICE TO CONSEQUENTIAL ACTIONS**
   section: exposure comes from sending money, credentials, identity
   documents, or using an introduced platform — not from talking.
7. **No empty bullets, ever — enforced twice.** The prompt already said to
   omit sections that don't apply, but a live case still produced an empty
   bullet inside an otherwise-populated `what_doesnt_settle_it` array. Fixed
   two ways, deliberately not relying on the model alone: (a) prompt now
   explicitly forbids a blank item inside a populated list ("remove that
   single item — never leave a gap"), and (b) a new code-side
   `stripEmptyItems()` runs **after** `runOutputGuard`, not before — the
   guard mutates its argument in place, and its repair pass can blank a
   flagged field instead of substituting it (found live on Sensory Scout's
   near-identical code the same day; fixed here to match) — recursively
   strips blank strings out of every array, and drops an array item that's
   an object unless **every** one of its own string fields is non-blank
   (a half-populated object is as useless as a fully-blank one). **Keep
   both, and keep the ordering** — the prompt instruction alone
   already failed once live.
8. **Pattern knowledge stays labeled as pattern knowledge.** "This is how
   this fraud type is scripted" states a known script as fact about this
   sender. New **PATTERN KNOWLEDGE STAYS LABELED AS PATTERN KNOWLEDGE**
   section spells out the exact distinction: "THIS MESSAGE SHOWS X" +
   "KNOWN SCAM PATTERNS CAN ALSO CONTAIN X" — never "THEREFORE THIS SENDER
   IS FOLLOWING A SCRIPT WE KNOW."

**`router.outputGuard.prohibit` gained 7 entries**, one per rule above except
#7 (which got the code-side backstop instead of relying on the guard) and #8
(extended the pre-existing `general_scam_pattern_stated_as_fact_about_this_
specific_sender` entry rather than adding a new one):
`sender_intent_or_design_purpose_asserted_as_established_fact`,
`categorical_claim_about_how_genuine_senders_typically_behave`,
`future_scam_stage_predicted_as_certain_rather_than_conditional`,
`offered_platform_upgraded_to_sender_controls_or_operates_it`,
`continued_conversation_itself_framed_as_financial_exposure`,
`empty_bullet_placeholder_or_blank_list_item_rendered`,
`checkbox_selection_trusted_over_contradicting_pasted_evidence`.

**Live re-verification:** re-ran all 3 golden cases against the local
backend. The exact repro scenario (case 3, `interactionStatus: "none"` +
conflicting transcript) now correctly returns `input_conflict.detected:
true` with the required phrasing, and every one of rules 2–8 held across all
3 fresh captures on the first attempt — no retries needed for correctness
(one DE capture was discarded and re-run for an unrelated quality nit, a
near-duplicate `what_doesnt_settle_it` bullet — not a rule violation, just
sampling noise not worth enshrining in a "known good" reference).
`npm run check:golden scam-radar` → 3/3 PASS. Golden sample fully re-recorded
(all 3 cases now carry `input_conflict`, including the two with
`detected: false`).

## V2.2 final-corrections pass (2026-09-09, second owner review)

Same day as v2.1, a second review of live output on the PayPal phishing
example caught three overclaiming sentences the model was still producing —
each one asserted more than the tool actually knows, even though the
underlying verdict and evidence were sound. Two more corrections reinforced
existing rules with sharper worked examples rather than fixing new bugs.

1. **An independent account check doesn't prove who sent a message.**
   "If your account is fine when you log in through the real site, the
   email was not from PayPal" treats an absent alert as proof of sender
   identity. New **DO NOT OVERSTATE WHAT AN INDEPENDENT CHECK PROVES**
   section: "if your account shows no matching alert... that is additional
   reason not to trust the email" — the check adds to the evidence, it
   doesn't settle who sent anything.
2. **Don't assert what a legitimate account "would" show.** "If your
   account were genuinely suspended, it would show in your account status"
   claims verified knowledge of PayPal's own system behavior. Same new
   section: recommend checking directly, without promising what the check
   will reveal.
3. **Don't assert what's "normal" for a category of notification.** "The
   threat of legal action in a routine account-verification email is not a
   feature of standard account notifications from financial services" is
   an unsourced industry-practice claim — the same failure mode
   `BRAND / ORGANIZATION CLAIMS` already covered for claims naming a
   specific company, just not yet for claims about a *category* of
   organization or notification. Added directly to that section: "the
   legal-action threat adds pressure but does not provide evidence that
   the message is genuine."
4. **Reinforced OBSERVED vs. PATTERN KNOWLEDGE** with a worked example
   added to `EVIDENCE MODEL` itself, built on the actual PayPal case:
   listing exactly what's OBSERVED (the lookalike domains, the specific
   information requested, the deadline, the threats) against what's PATTERN
   KNOWLEDGE (lookalike domains/urgency/sensitive-info-requests are known
   phishing features) — "this combination is consistent with a well-known
   phishing pattern," never "we know this sender is following that
   phishing script."
5. **Explicitly protected the strong verdict.** None of the above should
   soften `LIKELY_SCAM` when the evidence genuinely supports it — added a
   paragraph directly under the `LIKELY_SCAM` definition: convergence of
   concrete, observable warning signs earns the strong verdict regardless
   of whether sender identity is independently proven; the verdict is an
   evidence-based assessment, not a forensic identity claim.

New `outputGuard.prohibit` entry for #1/#2 (a genuinely new failure
category, not a phrasing gap in an existing one):
`absence_or_presence_of_an_account_alert_treated_as_proof_of_sender_identity`.
#3 relies on the pre-existing `unsourced_brand_policy_or_company_behavior_
stated_as_fact` entry — extending the prompt's own examples was the fix,
not the guard.

**Live re-verification**: re-ran the exact PayPal phishing scenario from the
owner's review. All 5 corrections held on the first attempt — `how_to_verify`
now says "if your account shows no matching alert, that is further reason to
distrust this message," the legal-action line says "provides no evidence the
message is genuine," `scam_pattern.explanation` and `why_concerning` stay in
"is a common feature of / is a high-risk pattern" language throughout, and
the verdict stayed `LIKELY_SCAM` with a confidently-worded explanation.
`npm run check:golden scam-radar` → 3/3 PASS, no golden re-record needed
(no schema change, only prompt wording).

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
- **The `input_conflict` field and its RECONCILE CONFLICTING INPUTS prompt
  section** — this is the fix for a real, 100%-reproducible bug (the tool
  contradicting the visitor's own pasted transcript). Removing either
  reintroduces it.
- **`stripEmptyItems()` in the route handler, called AFTER `runOutputGuard`**
  — the prompt's own "never render an empty bullet" instruction already
  failed once live, and cleaning BEFORE the guard also failed live (the
  guard mutates its argument in place and its repair pass can introduce a
  blank). Both the backstop and its position after the guard are load-
  bearing, not redundant.
- The five v2.1 outputGuard prohibit entries (sender intent, categorical
  genuine-sender claims, certain-next-stage predictions, platform
  control/operation, conversation-as-exposure) — each pairs with a prompt
  section of the same name; keep both or neither, not one without the other.
- **DO NOT OVERSTATE WHAT AN INDEPENDENT CHECK PROVES** and its
  `absence_or_presence_of_an_account_alert_treated_as_proof_of_sender_
  identity` guard entry — an absent account alert is additional evidence,
  never proof of who sent a message. This is a distinct failure from the
  brand-policy rule below; don't fold it back in or drop it as apparently
  redundant.
- **The strong-verdict protection paragraph under `LIKELY_SCAM`** — every
  overclaiming fix in this tool trims the READ down toward hedged language;
  this paragraph exists specifically to stop that trend from also quietly
  weakening a verdict the evidence actually supports. Convergence of
  concrete, observable signs earns `LIKELY_SCAM` even with sender identity
  unconfirmed — that's the intended behavior, not a gap to close.
- **The `BRAND / ORGANIZATION CLAIMS` section covers claims about a
  *category* of organization/notification, not just a named company** — "no
  legitimate company ever..." and "that's not how financial-service
  notifications work" are the same failure mode; don't reduce the section
  back to only naming specific brands.
