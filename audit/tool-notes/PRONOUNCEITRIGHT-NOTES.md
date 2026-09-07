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

## Output standard: stayed on FROZEN_V1, did not declare v2

Touching this route triggered `output-standard-audit`, which requires either a v2 declaration
(with a real `runOutputGuard` enforcement profile) or membership in `FROZEN_V1`. Tried v2 first
— wired `runOutputGuard` in with a tool-specific `outputGuard.prohibit`/`require` list and an
explicit "what NOT to flag" instruction (twice, tightening it the second time). Live-tested
against the real endpoint both times:

- It flagged genuine phonetic description — a sound comparison, an articulation instruction —
  as `invented_fact` on most calls, even after the second, much more explicit "this is domain
  expertise, not a claim about the visitor" instruction.
- Its repair pass then hedged real guidance into uselessness: a `sounds_like` field that
  actually said "the ny in canyon, followed by..." came back as "how this is pronounced cannot
  be determined from the spelling alone" — the opposite of the tool's job.
- One repair run corrupted `reading_status` into `"NEEDS_CONTEXT"`, a value that only exists in
  the *batch* schema's enum, not the single endpoint's five values — and flipped
  `audio.reading_is_constrained` to `true` on a word with two established readings, which is
  exactly the audio/written-guide disagreement this whole rewrite exists to prevent.

**Conclusion: this is a reference/knowledge-lookup tool (same category as `decoder-ring`,
`markup-detective`, `tip-of-tongue` — all already in `FROZEN_V1`), not a tool reasoning about
the visitor's own situation. The generic v2 checker can only ask a Haiku-tier model "is this
phonetic/etymological claim invented?" — a question it cannot answer any more reliably than the
model that generated the claim — so its verdict is closer to noise than signal here, and
blindly trusting a FAIL verdict actively degrades the answer.** Added `pronounce-it-right` to
`FROZEN_V1` in `backend/lib/outputStandard.js` instead, with the reasoning recorded there. This
tool's honesty is enforced the way it already is — `reading_status`/`needs_context`/`variants`
in the prompt itself — verified live against the real endpoint, not by a generic post-hoc
checker.

**If revisiting this later:** a tool-specific deterministic check (regex/structural, not another
model call) — e.g. flagging IPA fields that look like a respelling, or `context_info.background`
non-empty on a `PERSON_SPECIFIC` name — would fit this domain better than the generic
fact-invention guard. That is real future work, not an excuse; it just is not what shipped here.

## V2.1 (2026-09-07, same day) — audio synthesized from IPA, not guessed from spelling

The original V2 audio contract gated "Hear it" on the model's own guess about whether a
generic multilingual TTS voice, given only the raw spelling, would say the same thing as the
written guide. That made audio nearly useless — it was withheld for almost every name, brand,
or multi-reading word, which is a large share of what this tool is for.

Turns out ElevenLabs' `eleven_v3` model reads genuine IPA directly out of the text when it's
wrapped in slashes (`/ˈɲɔkːi/`) — no SSML/XML needed. See
[best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)
and [pronunciation dictionaries](https://elevenlabs.io/docs/cookbooks/text-to-speech/pronunciation-dictionaries)
(80-90% consistency, not 100%). Since this tool already generates genuine IPA as a hard
requirement (empty string rather than a fake one), audio can now be synthesized from *that
exact string* instead of guessing independently from the spelling — so the written guide and
the audio can no longer disagree, because the audio is voicing the same claim shown on screen,
not a second one.

**What changed:**
- `backend/routes/pronounce-it-right-audio.js`: when `ipa` is supplied, uses
  `model_id: 'eleven_v3'` and sends `text: '/${ipa}/'`; falls back to the original
  `eleven_multilingual_v2` + raw word when no IPA is available. Accepts `ipa` and
  `target_language_or_locale` (best-effort ISO 639-1 extraction) in addition to `source_text`.
- `backend/routes/pronounce-it-right.js`: removed the `audio{safe_to_offer,language_or_locale,
  reading_is_constrained}` object from the schema — there's no separate safety judgment left to
  make; withholding is now just "did I have confident enough IPA to write one". Added an
  explicit instruction to include primary (ˈ) and secondary (ˌ) stress marks in IPA, since that
  transcription is now what gets spoken, not just displayed.
- `src/tools/PronounceItRight.js`: `audioSafe` now derives from
  `!!results.pronunciation?.ipa && results.reading_status !== 'UNCERTAIN'` instead of the old
  `audio.safe_to_offer && audio.reading_is_constrained`. `fetchAudio` sends `ipa` to the audio
  route instead of `selected_reading`.
- Golden re-recorded again (single-case output shape changed: `audio` key gone).

**Verified live:** "Worcestershire" produced `/ˈwʊstərˌʃɛri/` and a real 21KB MP3 via
`eleven_v3`; the no-IPA fallback path still works; clicked "Hear it" through the actual running
UI (not just curl) and watched the real fetch go out and return 200. "Siobhan" — a name, which
never got audio under V2 — now does, since we're voicing "a common pronunciation is X" (which
the text already asserts), not a stronger claim than what's on screen.

## V2.2 (2026-09-07, same day) — internal consistency + a real model upgrade

An owner-supplied test caught a genuine correctness bug: the Hermès result had phonetic
respelling, IPA, sounds_like, and watch_out_for all independently reinforcing the same wrong
final consonant (voiced /z/; correct French is voiceless /s/ — confirmed against Wikipedia's
own IPA transcription).

**Prompt fixes (all live-verified):**
- Establish one canonical reading before generating any pronunciation field; the final
  self-check now explicitly asks whether respelling/IPA/sounds_like/mouth_guide/watch_out_for
  describe the exact same sounds.
- Schema reordered so `ipa` precedes `phonetic` and the respelling is explicitly written to
  match it — English spelling intuition (a post-vowel "s" reads as voiced, as in "days") was
  the actual mechanism pulling the respelling toward "z" independently of a correct IPA.
- A general linguistic rule, not a per-word memorized fact: French normally drops a word-final
  consonant; an accent added purely to force it to be pronounced (fils, hélas, Hermès) does not
  thereby make it voiced — a different rule (intervocalic single-consonant voicing, as in
  "maison") only applies to a consonant sitting between two vowels, a different position.
- French (and similarly non-lexical-stress languages) now get `prosody_label: RHYTHM` with
  phrase-prominence framing instead of an asserted "stressed syllable" that isn't a real feature.
- Banned: a rhyme that doesn't preserve the target vowel; a vague adjective ("softer"/"harder")
  without the concrete articulation behind it; a variants entry without a genuinely distinct
  reading (also filtered defensively on the frontend — `realVariants` requires non-empty
  `phonetic`); population generalizations ("most people", "no one") anywhere, including a
  trailing sentence tacked onto `confirmation_script`.

**What prompting alone could NOT fix — the model upgrade:** repeated live testing on Haiku
(`MODELS.FAST`) showed it wasn't simplifying for ease, it was genuinely unstable about this
specific fact — 5 identical calls produced /z/, /s/ (correct), and a fully-dropped consonant,
all with `reading_status: CLEAR` (the model doesn't reliably know when it doesn't know this
class of exception). Isolated the variable: the identical prompt on Sonnet (`MODELS.SMART`) got
it right, including the new RHYTHM framing, on its first try. Both endpoints now use
`MODELS.SMART` — higher cost/latency than Haiku, but this tool's entire premise is not asserting
pronunciation facts it doesn't actually have; a fast/cheap model that's confidently unstable
about real linguistic exceptions undermines that. **Do not revert to `MODELS.FAST` without
re-verifying this exact class of fact** (a Latin-script loanword with an orthographic exception
that contradicts the general rule of its source language).

**Two more bugs surfaced by this same live-testing pass, unrelated to the original report:**
1. One batch call wrapped a respelling in `**markdown bold**` containing a stray Cyrillic "К"
   standing in for Latin "K" — added a deterministic `stripMarkdown()` backstop (safe
   regardless of script) plus an explicit "no markdown, no script substitution" prompt rule.
2. My own new "never substitute a visually similar script" wording was briefly overbroad: one
   run had the model flatten German umlauts to ASCII (`gleichmaessig`, `franzoesische`) instead
   of a wrong-script substitution — a real regression from that instruction, not what it asked
   for. Fixed the wording to distinguish "wrong script" (never) from "real accented Latin
   letters — ä/ö/ü/ß/ç/é" (always keep them), and added "check every one of the 5 batch guides,
   not just the first" after the flattening showed up on only some items in one response.
   Verified clean across 2 consecutive German batch calls after the fix.

## V2.3 (2026-09-07, same day) — a second owner correction pass, general discipline this time

Not a new factual bug — the owner's Siobhan result was correct, just carrying some habits that
undercut the tool even when the pronunciation itself was right:

- **Invented spelling rules.** `watch_out_for` explained the sound by chunking the word into
  letter-groups and mapping each to an English sound ("Siobh makes a shiv sound, an sounds like
  awn") — a fabricated decoding rule, not a description of the actual sound. Fixed: `sounds_like`
  /`mouth_guide`/`watch_out_for` now must describe how the whole syllable/word actually sounds,
  not assign a rule to a letter-group unless that's a genuine orthographic rule of the language.
- **False precision on articulation.** `mouth_guide` said an "aw" vowel was "held slightly
  longer" with no real basis — inventing vowel length the same way an earlier pass caught
  inventing stress. Fixed: don't claim length/lengthening/clipping unless it's a real, confident
  feature (ideally `prosody_label: VOWEL_LENGTH`).
- **Approximation presented as exact.** No dedicated rule previously distinguished "a workable
  English-friendly respelling" from "the literal source-language sound" when they diverge.
  Added: keep the approximation prominent, but say so when it materially differs rather than
  implying equivalence — the genuine IPA carries the precise version.
- **CAPS implying real stress on non-stress languages.** Capitalization is fine as a navigation
  aid for any prosody type, but only means an actual stress contrast when `prosody_label` is
  `STRESS` — for RHYTHM/TONE/VOWEL_LENGTH languages the prosody text must say so plainly (not
  just capitalize and imply English-style punch).
- **`what_it_is` scope creep.** Only `background` had the "reliable and needed" bar before; now
  `what_it_is` carries the same standard — no name meaning, equivalent-name-in-another-language,
  or history unless it's actually needed to identify which reading is intended.
- **Triple-repeated uncertainty.** For a `PERSON_SPECIFIC` name, the "may differ" caveat appeared
  in the status badge AND `useful_in_context` AND a preamble to `confirmation_script` — the same
  point three times in different words. Fixed at both the prose-rule and schema-description
  level: say it once (the status badge), leave `useful_in_context` empty unless it's genuinely
  new, and `confirmation_script` is the ask alone, not a second justification for asking.
- **Section-earning discipline, restated as a literal question**: "does this help the visitor
  pronounce THIS target?" added directly to OUTPUT DEPTH and the final self-check.

**Verified live on the reported case (Siobhan):** `watch_out_for` no longer decomposes into
letter-group rules ("just say shih-VAWN" instead of "Siobh makes a shiv sound"); no invented
vowel length; `useful_in_context` correctly empty instead of repeating the person-specific
caveat.

**Known residual, not chased further** (diminishing returns on prompt-only iteration, and
further live-testing has real API cost): `confirmation_script` sometimes still appends one
reasoning clause after the ask itself ("...is the only way to be certain of their individual
pronunciation") rather than being purely the ask; and `sounds_like`/`mouth_guide` can pick two
English comparison words that don't rhyme in every dialect (e.g. "gone" vs "dawn") even though
each individually approximates the target vowel reasonably. Worth another pass if either recurs
on a live report — not worth burning more calls chasing on a single sample.

## DO NOT silently reverse
- The V2 schema and its honesty rules (reading_status, needs_context, audio gating) —
  reverting to always-confident output reintroduces the exact problem this rewrite fixed.
- The no-double-quote rule in the single endpoint's **user** prompt (not just system prompt) —
  removing it reintroduces the German 500 above.
- Batch guard `!parsed.guides?.length`; single endpoint guard `!parsed.pronunciation`
  (top-level); single `max_tokens` 3500 + batch cap 8; no annotation suffixes; the PlainTalk
  cross-ref stays in the main render tree (S5.5).
- The audio gate (V2.1): never render "Hear it" without genuine `pronunciation.ipa` present
  (and `reading_status !== 'UNCERTAIN'`) — and never feed the audio route raw spelling when IPA
  is available, or the written guide and audio can disagree again.
- MODELS.SMART on both endpoints (V2.2) — see above; this was proven necessary, not a
  precautionary default.
- The IPA-precedes-phonetic field order and the "write phonetic to match the IPA above" framing
  — reverting the order reopens the exact respelling-vs-IPA disagreement this fixed.
- `stripMarkdown()` on `pronunciation.phonetic`, `syllables`, `variants[].phonetic`, and
  `guides[].phonetic` — cheap, safe regardless of script, and already caught one real glitch.
