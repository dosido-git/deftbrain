# PronounceItRight — architecture & lock notes (`pronounceitright-v2`)

Pronunciation coach — single-word full guide + batch mode + an ElevenLabs TTS audio route.
**Frontend:** `src/tools/PronounceItRight.js`. **Backend:** `backend/routes/pronounce-it-right.js`
(2 LLM endpoints, `MODELS.FAST`) + `backend/routes/pronounce-it-right-audio.js` (TTS → audio/mpeg).
**Golden:** `audit/pronounce-it-right-golden-sample.json` — re-recorded 2026-09-07 against the
live V2 endpoints. Verify: `npm run check:golden pronounce-it-right`.

## V2 rewrite (2026-09-07) — disciplined pronunciation, not fabricated certainty

The v1 promise ("never mispronounce anything again") and result shape forced trivia into
every answer even when the spelling didn't support it — most visibly a brand's "official"
pronunciation framed as fact and a "pro tip" claiming a certain reading "will mark you as
someone who knows the language" (a status claim, not a fact). A name's spelling was also
treated as settling how a specific person says their own name, which it never does.

**What changed:**
1. **Catalog copy** (`src/data/tools.js`): dropped the "never mispronounce anything again"
   tagline/description; replaced with "we'll give you the clearest guidance we can from the
   spelling and context you provide" — an honest claim instead of an absolute one. `guide.*`
   updated to match (no more promising a #1-mistake list or a confidence score).
2. **Backend schema** (both endpoints), fully replaced:
   - Old: `category_detected`, `language_of_origin`, `common_mistakes[]{wrong,why,fix}`,
     `dont_confuse_with[]`, `regional_variants[]`, `fun_fact`, `context_info.origin_story`,
     `context_info.pro_tip`, `context_info.use_in_sentence`.
   - New: `reading_status` (CLEAR / MULTIPLE_ESTABLISHED_READINGS / CONTEXT_DEPENDENT /
     PERSON_SPECIFIC / UNCERTAIN — the model must say when a spelling doesn't settle a
     reading, never guess), `language` (replaces `language_of_origin`),
     `pronunciation.prosody_label` + `prosody` (STRESS/TONE/RHYTHM/VOWEL_LENGTH/NONE — not
     every language organizes around stress), `variants[]{label,phonetic,ipa,when_used}`
     (only genuinely established alternatives), `watch_out_for[]{trap,fix}` (no "why" framed
     as sociology), `context_info{what_it_is,useful_in_context,background}` (all optional,
     `background` only when confident — no forced origin story), `confirmation_script`,
     `needs_context{needed,reason,helpful_context}`, `audio{safe_to_offer,language_or_locale,
     reading_is_constrained}`.
   - Guard changed from `!parsed.pronunciation && !parsed.phonetic` to `!parsed.pronunciation`
     (top-level, always-present per the new schema — do not key on a nested/nullable field).
   - Batch schema dropped `ipa`, `syllables`, `what_it_is`, `fun_fact` entirely — batch mode
     is fast pronunciation, not eight miniature encyclopedia entries. New:
     `reading_status` (CLEAR/MULTIPLE/NEEDS_CONTEXT/PERSON_SPECIFIC/UNCERTAIN),
     `context_needed`.
3. **Audio contract** (`pronounce-it-right-audio.js`): the frontend now gates the "Hear it"
   button on `audio.safe_to_offer && audio.reading_is_constrained` from the main endpoint —
   names, brands, places, acronyms, and anything with more than one established reading
   default to no audio rather than risk the written guide and the TTS reading disagreeing.
   The route itself accepts `source_text`/`target_language_or_locale`/`selected_reading`
   (aliases `word`/`languageOfOrigin` still work) but is HONEST in its own comment that
   `eleven_multilingual_v2` cannot actually be forced to a specific reading yet — the
   frontend gate, not this route, is what keeps the two from disagreeing today.
4. **Frontend** (`src/tools/PronounceItRight.js`): input reordered to word → category
   (optional) → native language (required, with a "why we ask" hint) → extra context
   (optional, with a "why" hint + 4 example phrases) → CTA "Show Me How to Say It →". Result
   reordered to hero (only rendered when a phonetic exists) → reading-status badge for
   non-CLEAR statuses → needs-context callout → syllables → sounds-like/mouth-guide/prosody
   → watch-out-for → variants → context info → confirmation script. Persisted result key
   bumped `pronounce-it-right-results` → `pronounce-it-right-results-v2` (shape changed).
5. **i18n**: `pronounce-it-right.js` rewritten for all 13 languages — 10 changed keys
   (`pir_tagline`, `pir_word_hint`, `pir_what_say_right`, `pir_native_lang`, `pir_cta`,
   `pir_cat_science`, `pir_sounds_like`, `pir_mouth_guide`, `pir_unsure_moment`,
   `pir_audio_note`) + 23 new keys, 8 removed (`pir_common_mistakes`, `pir_dont_confuse`,
   `pir_regional_variants`, `pir_origin`, `pir_use_in_sentence`, `pir_pro_tip`,
   `pir_copy_stress`, `pir_copy_fun_fact`). `npm run build:locales` re-run — 13 languages, no
   key mismatches. Two new Hindi strings also needed the anusvara→chandrabindu fix
   (`pir_cta`, `pir_mouth_guide`: -एं → -एँ) to clear `i18n-convention-audit`.

## 🐛 Bug found and fixed during this rewrite: German 500 on the single endpoint

**Symptom:** every call to `/api/pronounce-it-right` with `userLanguage: "de"` (any locale
combination) 500'd — `[pronounce-it-right] All 3 attempts failed... Expected ',' or '}' after
property value in JSON`. The batch endpoint was unaffected.

**Cause:** this is the recurring "German-unescaped-double-quote" bug class (see also
BillRescue's notes). Under locale pressure the model wrote a quoted phrase someone would say
aloud (`confirmation_script`, `useful_in_context`, `watch_out_for`) using a literal ASCII `"`
character inside the JSON string value. The shared `repairJsonStrings()` in `backend/lib/
claude.js` toggles an in-string flag on every bare `"` — it cannot tell a real string
terminator from a quote-character-as-content, so it "closed" the string early and the rest of
the object failed to parse. The "no double-quote inside string values" rule *was* present in
this route's `SYSTEM_PROMPT`, but only there — the working batch endpoint already carried the
same rule in its **user** prompt, right next to its schema, and only the single endpoint was
missing that placement.

**Fix:** added the rule to the single endpoint's user prompt too ("use single quotes ' …
never a double-quote (") character inside any string value, in any language"), right after
the schema. Verified with 4 consecutive live German calls (the golden's ambiguous-reading food
case, plus a name case run 3×) — all HTTP 200, model switched to `'…'`/`‚…'`-style quoting on
its own.

**Lesson for future prompts on this tool (and generally): a system-prompt-only rule is not
reliable under locale pressure — put format-breaking constraints in the user prompt, next to
the schema they protect, not just in the system prompt.**

## DO NOT silently reverse
- The V2 schema and its honesty rules (reading_status, needs_context, audio gating) —
  reverting to always-confident output reintroduces the exact problem this rewrite fixed.
- The no-double-quote rule in the single endpoint's **user** prompt (not just system prompt) —
  removing it reintroduces the German 500 above.
- Batch guard `!parsed.guides?.length`; single endpoint guard `!parsed.pronunciation`
  (top-level); single `max_tokens` 3500 + batch cap 8; no annotation suffixes; the PlainTalk
  cross-ref stays in the main render tree (S5.5).
- The audio gate: never render "Hear it" without `audio.safe_to_offer &&
  audio.reading_is_constrained` both true.
