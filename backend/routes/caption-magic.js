const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

// ── Helper: extract base64 and media type from data URL ──
function parseDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  // Strict base64 validation: a corrupted upload used to sail through to the
  // API, get a non-retryable 400 on every attempt, and surface as a hard 500
  // (audit 2026-07-19). Reject it here so the route can 400 with a friendly
  // "re-upload" message instead.
  const data = match[2].replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) return null;
  return { media_type: match[1], data };
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases in caption text plainly or with single quotes, or it breaks the JSON.';

// ── Platform character limits ──
const PLATFORM_LIMITS = {
  instagram: 2200,
  linkedin: 3000,
  facebook: 63206,
  twitter: 280,
  tiktok: 2200,
  threads: 500,
};

const PLATFORM_NAMES = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  threads: 'Threads',
};

// ════════════════════════════════════════════
// EVIDENCE ENVELOPE
// ════════════════════════════════════════════
// not_sure_about was prose, and prose is advisory: the model produced an
// accurate list and then contradicted it three sentences later, repeatedly and
// across four prompt rewrites. The fix is not another sentence asking it to
// mean the list. It is to stop the generator being able to see anything the
// list does not cover.
//
//   image → envelope → generation (NO IMAGE) → validation (NO IMAGE) → render
//
// Stage 2 and stage 3 never receive the picture. That is the whole mechanism.
// A generator that cannot see the scene cannot invent a detail from it, and a
// validator that cannot see the scene cannot quietly agree with a claim by
// looking at the image and finding it plausible — it has only the envelope to
// check against, which is exactly the comparison we want made.

// Model-generated lists keep omitting the things that are not visible, because
// the model builds them by looking. Authorship kept falling out of
// not_sure_about for exactly this reason. These are supplied by code so they
// cannot be forgotten; the observer adds scene-specific ones on top.
const NEVER_INFERABLE = [
  'who anyone pictured is, and how they are related to each other or to the poster',
  'whose things these are — whether the poster owns, made, found or bought anything pictured',
  'where this is, beyond what is actually legible in the frame',
  'when it happened — date, day, time of day, season, or how recently',
  'what happened before or after: what someone had just finished doing, or was about to do',
  'the history, provenance, price, age or condition of anything pictured',
  'what a real person actually felt or thought, reported as fact',
  'what viewers will do, feel, notice or how they will respond to the post',
];

function renderEnvelope(env) {
  const list = (a) => (Array.isArray(a) && a.length ? a.map(x => `- ${x}`).join('\n') : '- (none)');
  return `EVIDENCE ENVELOPE

OBSERVED:
${list(env.observed)}

UNCERTAIN:
${list(env.uncertain)}

PROHIBITED INFERENCES:
${list(env.prohibited_inferences)}

OBSERVED is your raw material. Play with it freely — that is what it is for.

UNCERTAIN is what the picture cannot settle. Write about these things all you like; just don't state the answer as fact.

PROHIBITED INFERENCES are concrete claims about the real situation behind the photo that the photo cannot establish.

THE LINE IS BETWEEN INVENTING A VOICE AND INVENTING A FACT.

Invent freely: jokes, absurdity, metaphor, personification, attitude, rhetorical exaggeration, an imagined inner monologue, an unexpected angle on what is in frame. "The cactus remains neutral. The cup knows nothing." invents nothing about the world — nobody reads it as a report on a cactus's mental state. "Me wondering what any of this has to do with anything" is caption voice, not testimony. Neither is a violation and neither should be softened.

Do not invent: who these people are, how they are related, whose things these are, where this is, when it happened, what happened just before or after. "My grandmother gave me this cactus", "first morning in our new apartment", "after three hours of repotting this thing", "she had no idea I was taking this" — each of these would be read as true, and each would be false.

The test is what a reasonable reader comes away believing. If they would believe something untrue about the real situation, it is a violation. If they would only come away smiling, it is the product working.`;
}

// Targeted repair addresses one field. Paths are a closed vocabulary the
// validator is given verbatim, so this parser only ever sees shapes it knows.
function getByPath(obj, path) {
  const m = String(path).match(/^([a-z_]+)(?:\[(\d+)\])?(?:\.([a-z_]+))?$/);
  if (!m) return undefined;
  const [, key, idx, sub] = m;
  let cur = obj[key];
  if (idx !== undefined) cur = Array.isArray(cur) ? cur[Number(idx)] : undefined;
  if (sub) cur = cur && typeof cur === 'object' ? cur[sub] : undefined;
  return cur;
}

function setByPath(obj, path, value) {
  const m = String(path).match(/^([a-z_]+)(?:\[(\d+)\])?(?:\.([a-z_]+))?$/);
  if (!m) return false;
  const [, key, idx, sub] = m;
  if (idx === undefined) {
    if (!(key in obj)) return false;
    obj[key] = value; return true;
  }
  if (!Array.isArray(obj[key])) return false;
  const i = Number(idx);
  if (i < 0 || i >= obj[key].length) return false;
  if (!sub) { obj[key][i] = value; return true; }
  if (!obj[key][i] || typeof obj[key][i] !== 'object') return false;
  obj[key][i][sub] = value; return true;
}

// ════════════════════════════════════════════
// MAIN ENDPOINT: Generate captions
// ════════════════════════════════════════════
router.post('/caption-magic', rateLimit(), async (req, res) => {
  try {
    const { imageBase64, imageDescription, platform, tones, context, captionLength, userLanguage } = req.body;

    if (!imageBase64 && !imageDescription) {
      return res.status(400).json({ error: 'Provide an image or image description' });
    }

    const platformName = platform || 'instagram';
    const charLimit = PLATFORM_LIMITS[platformName] || 2200;
    const toneList = Array.isArray(tones) && tones.length > 0 ? tones.join(', ') : 'casual & authentic';
    const lengthPref = captionLength || 'medium';
    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = parseDataUrl(imageBase64);
    if (imageBase64 && !parsed && !imageDescription) {
      return res.status(400).json({ error: "That image didn't upload correctly — try re-uploading it." });
    }

    // ── STAGE 1 — OBSERVE ─────────────────────────────────────────────
    let envelope;
    if (parsed) {
      const observePrompt = `You are looking at an image for a captioning tool. You are not writing captions. Your only job is to say what is in the picture and what is not knowable from it.

${imageDescription ? `The person also described it: ${imageDescription}` : ''}
${context ? `And gave this context: ${context}` : ''}
Anything the person told you is established fact. It belongs in observed, never in uncertain — you cannot doubt what you were told, only what you are looking at.

OBSERVED is what you could point at: objects, materials, colours, counts, setting, text you can read. Short noun phrases, not sentences. Nothing about cause, purpose, history or feeling.

The test is whether the word names a CAUSE for what you can see. "Bright highlight on the upper surface" is observed; "glowing" is not, because it says the object is producing the light, and a flat picture cannot show you that. The same applies in every language and to every word of that kind in it — lit, wet, warm, heavy, old, handmade, expensive, used. Whether something emits light, what it is made of, how old it is and whether anyone has touched it are never observable from a photograph. If it matters, put the QUESTION in uncertain; never put the answer in observed.

This field is the tool's ground truth. Everything after it is written by someone who cannot see the picture and must take this list as fact, so a cause smuggled in here is not corrected later — it becomes true.

UNCERTAIN is what you can see but cannot identify, where getting it wrong would change a caption. Short noun phrases naming the open question — "countertop material", "whether the sphere emits light" — not sentences about your confidence. Empty array if the image is unambiguous.

PROHIBITED_INFERENCES is what this particular picture invites someone to assume and cannot support. Add only what is specific to this scene; the general ones are already handled.

OUTPUT (JSON only):
{
  "observed": ["short noun phrase", "short noun phrase"],
  "uncertain": ["short noun phrase naming the open question"],
  "prohibited_inferences": ["scene-specific assumption this image invites but cannot support"]
}

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

      const obs = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 1500,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: parsed.media_type, data: parsed.data } },
          { type: 'text', text: withLanguage(observePrompt, userLanguage) + locale },
        ] }],
      }, { label: 'CaptionMagicObserve' });

      if (!Array.isArray(obs.observed)) {
        return res.status(500).json({ error: 'Could not read the image. Please try again.' });
      }
      envelope = {
        observed: obs.observed,
        uncertain: Array.isArray(obs.uncertain) ? obs.uncertain : [],
        prohibited_inferences: [...NEVER_INFERABLE, ...(Array.isArray(obs.prohibited_inferences) ? obs.prohibited_inferences : [])],
      };
    } else {
      // No image: nothing is being interpreted. Every fact came from the person,
      // so it is all observed and nothing is uncertain — asking a model to
      // re-derive that produced the old bug where a fact the visitor supplied
      // got listed as doubtful and then blocked downstream.
      envelope = {
        observed: [imageDescription, context].filter(Boolean),
        uncertain: [],
        prohibited_inferences: [...NEVER_INFERABLE],
      };
    }

    // ── STAGE 2 — GENERATE (no image) ─────────────────────────────────
    const genPrompt = `You are a social media caption specialist who writes captions that sound like a real person, not a brand.

You cannot see the picture. Everything you know about it is below. That is deliberate — write from it and the captions will be true.

${renderEnvelope(envelope)}
${context ? `\nThe person also said: ${context} — this is supplied fact, use it freely.` : ''}

${platformName === 'none'
  ? `NO PLATFORM: they have not said where this is going — a photo book, a message, a print, somewhere with no conventions of its own. Write captions that stand on their own: no platform-shaped length, no hashtag-bait phrasing, no calls to action about following or commenting. Hashtags are still fine as suggestions, since they may add them later, but nothing in the caption itself should assume a feed.`
  : `PLATFORM: ${platformName} (character limit: ${charLimit})`}
TONE: ${toneList}
LENGTH PREFERENCE: ${lengthPref} (short = 1-2 lines, medium = 2-4 lines, long = 4-8 lines)

RULES:
- Write like a real person posting to their own feed, not a copywriter
- Match the tone precisely: "funny" = actually funny, "minimal" = just a few words
- For ${platformName}, respect the ${charLimit} character limit
- Each caption should feel distinctly different, not just rephrased
- If platform is Twitter/X, keep it tight and punchy
- If platform is LinkedIn, be slightly more polished but never corporate-speak
- Include emojis naturally where they fit the tone, don't force them

FUN IS A REQUIREMENT, NOT A PERMISSION.

This tool exists to make someone smile and hand them a line they would not have
arrived at on their own. A caption that describes the photograph accurately and
does nothing else has failed, however true it is.

At least ONE of the three must take a real creative swing: an absurd premise, a
personification, a joke that runs away with a detail, a voice with an attitude,
a line that surprises. Not a competent description with a wink at the end. The
peculiar specifics in OBSERVED are the funniest thing you have — the odd object,
the wrong scale, the thing nobody would put next to the other thing. Use them.

The envelope is not a reason to be careful. It rules out inventing the
backstory. It rules out nothing about how strange the caption may be.

For HASHTAGS: tags that genuinely fit this post. Do not label any of them trending, high-volume or high-competition — you cannot see what is trending, nobody counted the posts, and a tag presented as trending is a measurement claim.

The voice-versus-fact line applies to tags too, and it cuts finely. A tag stating a fact the picture cannot support is a claim in one word: #sundaymorning assigns a day nobody established, #handmade assigns an author, #vintage assigns an age. A tag that is obviously part of the joke is not: #morningsomewhere claims nothing, because no one reads it as a timestamp. Play in tags where the play reads as play. Never write the leading # — the interface adds it.

Create 3 caption variations, each with a different approach.

OUTPUT (JSON only):
{
  "captions": [
    {
      "tone": "the tone used (e.g., Witty, Casual, Reflective)",
      "text": "The caption.",
      "hashtags": [{ "tag": "hashtag1" }, { "tag": "hashtag2" }, { "tag": "hashtag3" }],
      "char_count": 150,
      "why_it_works": "1-sentence explanation of the approach",
      "best_for": "when this version works best"
    }
  ],
  "alt_text": "Descriptive accessibility text, built from OBSERVED. A screen-reader user gets this INSTEAD of the picture and has no way to see past a wrong word, so it carries the envelope more strictly than anything else here, not less.",
  "engagement_tips": [
    "A creative suggestion about the post itself, phrased as what it offers rather than what it will achieve. No performance claims of any kind — not about the algorithm or reach, and not about people either.
      NO:  Questions in captions get more replies
      YES: A question can give people an easy way into the conversation
      No frequency words — often, usually, tend to, most people. They smuggle an unmeasured population claim back in under a softer verb.
      THE TEST IS THE SUBJECT OF YOUR SENTENCE. It must be the caption, the post or the thing in it — never people, readers, your audience or they. The moment an audience becomes the subject you are reporting behaviour you never observed.
      And no comparison of outcomes, whatever the subject: goes further, does better, works best, gets more. A sentence can pass the subject test and still rank two results nobody measured.
      YES: thinking out loud on the page leaves room for a reply; a finished description does not
      Worked pairs for shape only — write your own.",
    "A second, on the same terms."
  ],
  "avoid": ["thing to avoid 1", "thing to avoid 2"]
}

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    const out = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(genPrompt, userLanguage) + locale }],
    }, { label: 'CaptionMagicGenerate' });

    if (!Array.isArray(out.captions)) {
      return res.status(500).json({ error: 'Could not generate captions. Please try again.' });
    }

    // ── STAGE 3/4 — VALIDATE, THEN REPAIR WHAT FAILED ─────────────────
    // Fail-open throughout. This is a safety net over a working answer, and a
    // net that can drop the answer is worse than no net.
    try {
      await enforceEnvelope(out, envelope, { userLanguage, locale, context });
    } catch (err) {
      console.error('CaptionMagic validation skipped:', err.message);
    }

    // char_count is a consumed hero stat — code-compute it (model understated
    // all three counts in the audit).
    out.captions.forEach(c => { if (c && typeof c.text === 'string') c.char_count = c.text.length; });

    // Asking for funnier captions produced funnier hashtags — "make it make
    // sense", "jellyfish energy" — and a hashtag with a space in it is not a
    // hashtag on any platform that has them. Closed up in code because it is a
    // mechanical property of the string, not a judgement the model should be
    // spending attention on.
    out.captions.forEach(c => {
      if (!Array.isArray(c?.hashtags)) return;
      c.hashtags = c.hashtags
        .map(h => (typeof h === 'object' ? h?.tag : h))
        .map(tag => String(tag || '').replace(/^#+/, '').replace(/[\s_]+/g, '').trim())
        .filter(Boolean)
        .map(tag => ({ tag }));
    });

    res.json({ ...out, observed: envelope.observed, uncertain: envelope.uncertain });

  } catch (error) {
    console.error('CaptionMagic error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// Every generated string the visitor will see, addressed by a path the
// validator is handed verbatim. Enumerated in code so the validator cannot
// invent a field name and the repair cannot write to one that does not exist.
function checkableFields(out) {
  const fields = [];
  (out.captions || []).forEach((c, i) => {
    if (typeof c?.text === 'string') fields.push([`captions[${i}].text`, c.text]);
    if (typeof c?.why_it_works === 'string') fields.push([`captions[${i}].why_it_works`, c.why_it_works]);
    if (Array.isArray(c?.hashtags) && c.hashtags.length) {
      fields.push([`captions[${i}].hashtags`, c.hashtags.map(h => (typeof h === 'object' ? h?.tag : h)).filter(Boolean).join(', ')]);
    }
  });
  if (typeof out.alt_text === 'string') fields.push(['alt_text', out.alt_text]);
  (out.engagement_tips || []).forEach((t, i) => {
    if (typeof t === 'string') fields.push([`engagement_tips[${i}]`, t]);
  });
  return fields;
}

// Stage 3 and 4. Adversarial by construction: this call is never asked to
// write a caption, only to find propositions the envelope does not support.
// The distinction matters — a model asked to improve its own output rates it
// as fine, and asking the generator to check itself is the instruction we have
// already watched fail four times.
async function enforceEnvelope(out, envelope, { userLanguage, locale, context }) {
  const fields = checkableFields(out);
  if (!fields.length) return;

  const proposed = fields.map(([path, value]) => `${path}: ${value}`).join('\n');
  const supplied = context ? `\nUSER-PROVIDED FACTS (established, always supported):\n${context}\n` : '';

  const validatePrompt = `Caption Magic is a creative-writing tool. You are checking a draft for MISLEADING invention, which is a much narrower thing than untrue invention. You are not writing or improving the draft, and you are not making it more literal.

${renderEnvelope(envelope)}
${supplied}
PROPOSED OUTPUT:
${proposed}

Captions and their hashtags may freely use humour, imagination, metaphor, personification, attitude, rhetorical exaggeration and an invented caption voice. Do not reject creative language merely because the image does not literally establish it.

Reject invention only where a reasonable reader could take it as a concrete claim about the real photograph or its circumstances — identity, relationships, ownership, location, date or time, history, events, activities, provenance, condition, or other consequential facts the visitor did not supply and the image does not establish.

Worked pairs, because this line is the whole job:

  FINE: the cactus remains neutral. the cup knows nothing.
        (personification; nobody reads it as a report on a cactus)
  FINE: me wondering what any of this has to do with anything
        (caption voice; requiring proof the poster wondered it would be absurd)
  FINE: #morningsomewhere
        (obviously a joke; claims no timestamp)
  FINE: some kind of resin, maybe
        (visibly preserves an UNCERTAIN detail)
  FINE: this little guy really said 'i'm not like other spheres'
        (voice; nobody believes the sphere said anything)
  VIOLATION: #sundaymorning
        (assigns a day nobody established, and reads as a fact)
  VIOLATION: brought this home. it sits in the corner now.
        (playful, but a reader comes away believing the poster has it)
  VIOLATION: it glows a bit
        (whether it emits light is in UNCERTAIN; a light register does not
         make it less of an answer)

The register is not the test. A joke can carry a fact, and a flat sentence can carry none. "Brought this home" is warm and casual and still tells the reader something about the world that may be false; "the cup knows nothing" is a straight declarative sentence about a cup and tells them nothing at all. Ask only what they would believe afterwards.
  VIOLATION: my grandmother gave me this cactus
  VIOLATION: first morning in our new apartment
  VIOLATION: after three hours of repotting this thing
  VIOLATION: she had no idea I was taking this

The engagement_tips and why_it_works fields are different in kind. They are analysis, not caption voice, and they get no creative licence: a claim there about what viewers will do, feel, notice or how they will respond is unsupported however it is phrased, because nobody observed the audience.

But a statement about what a caption OFFERS is a description of the writing, not a prediction about people, and is fine:

  FINE: gives a reply somewhere to land
  FINE: leaves room for a question
  VIOLATION: makes people stop rather than scroll past
  VIOLATION: viewers will feel like they discovered something

WHEN UNCERTAIN, PRESERVE CREATIVITY. The purpose of this check is to prevent misleading fabrication, not to make captions descriptive. A flagged line gets rewritten, so a wrong flag costs the visitor a joke — flag only where an invented detail could genuinely mislead someone about the real circumstances behind the photograph. Silence is the right answer far more often than not.

Return PASS or FAIL. If FAIL, identify the offending fields and the misleading propositions. Do not rewrite them.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the proposed output", "proposition": "the misleading claim, quoted from the field", "why": "what a reader would wrongly believe, in a few words" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character from the list above — captions[0].text stays captions[0].text. Code compares both literally; a translated one matches nothing and the check is silently lost. proposition and why are prose and may be in any language, since nobody reads them.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  // withLanguage applies here like every other call, with verdict and field
  // pinned to English inside the prompt. Leaving it off would have been the
  // other way to protect the enum, but it also puts a German draft in front of
  // an English-reasoning check, and S7.4 exists because that kind of local
  // exception is how a route quietly stops speaking the visitor's language.
  const check = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2000,
    messages: [{ role: 'user', content: withLanguage(validatePrompt, userLanguage) }],
  }, { label: 'CaptionMagicValidate' });

  // One repair per field. The validator sometimes reports two propositions in
  // the same line, and the second replacement would silently overwrite the
  // first — repairing the original text twice rather than the fixed text once.
  const seen = new Set();
  const violations = (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => v && typeof v.field === 'string' && getByPath(out, v.field) !== undefined)
    .filter(v => !seen.has(v.field) && seen.add(v.field));

  // Logged on every call, not only on failure. A validator that silently stops
  // working looks exactly like a validator finding nothing wrong, and this
  // project has already shipped one audit that passed because it crashed.
  console.log(`[caption-magic] envelope check: ${String(check?.verdict).toUpperCase() === 'FAIL' ? 'FAIL' : 'PASS'} (${violations.length} violation(s)${violations.length ? ': ' + violations.map(v => v.field).join(', ') : ''})`);

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return;

  // ── STAGE 4 — repair only what failed ───────────────────────────────
  const repairPrompt = `You are repairing specific lines of a social caption draft that made claims the evidence does not support. Everything else has been accepted and is not your concern.

${renderEnvelope(envelope)}
${supplied}
Rewrite each line below so it keeps its voice, tone, length and joke, and drops only the misleading claim. Do not make it cautious, do not add a hedge where the fix is simply to cut three words, and do not replace a specific image with a vague one, and above all do not make it more literal — a line that has lost its joke has not been repaired, it has been damaged. The fix for "my kitchen at 4pm on a sunday" is not "a kitchen": the claim was the possessive and the timestamp, so the invention worth keeping is whatever made the line worth reading. Invent something else in its place if you need to. The line should read as though the claim was never there — not as though it was removed.

${violations.map((v, i) => `${i}. [${v.field}]
   current: ${getByPath(out, v.field)}
   unsupported: ${v.proposition}${v.why ? ` (${v.why})` : ''}`).join('\n\n')}

Where the item is an engagement tip or a why_it_works line, the replacement is analysis rather than caption voice: say what the caption offers, never what people will do with it. "Gives a reply somewhere to land" is a replacement; "makes people stop scrolling" is the same violation in new words, and so is anything about what a reader will notice, feel or do instead.

Return one replacement per numbered item, keyed by its number.
${violations.some(v => v.field.endsWith('.hashtags')) ? 'For a hashtags item, return a comma-separated list of tags with no leading #.\n' : ''}
OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "value": "the rewritten line" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2500,
    messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
  }, { label: 'CaptionMagicRepair' });

  // Keyed by number, not by path: withLanguage translates JSON string values,
  // and a translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const v = violations[Number(fix?.n)];
    if (!v || typeof fix.value !== 'string' || !fix.value.trim()) return;
    if (v.field.endsWith('.hashtags')) {
      const tags = fix.value.split(',').map(s => s.trim().replace(/^#+/, '')).filter(Boolean);
      if (tags.length) setByPath(out, v.field, tags.map(tag => ({ tag })));
      return;
    }
    setByPath(out, v.field, fix.value.trim());
  });
}

// ════════════════════════════════════════════
// REVISE ENDPOINT: Refine a caption
// ════════════════════════════════════════════
router.post('/caption-magic/revise', rateLimit(), async (req, res) => {
  try {
    const { captionText, direction, platform, userLanguage } = req.body;
    if (!captionText) return res.status(400).json({ error: 'Caption text is required' });

    const charLimit = PLATFORM_LIMITS[platform] || 2200;
    const directionMap = {
      'less_tryhard': 'Make this sound less try-hard and more naturally authentic. Remove anything forced or overly polished. Keep it real.',
      'more_engaging': 'Make this more engaging and attention-grabbing. Add a hook or question that makes people want to respond.',
      'shorter': `Make this significantly shorter and punchier. Get to the point. Max ${Math.min(charLimit, 280)} characters.`,
      'longer': 'Expand this with more detail, storytelling, or personality. Add depth without padding.',
      'more_professional': 'Make this more polished and professional while keeping it human. Good for LinkedIn or work contexts.',
    };

    const instruction = directionMap[direction] || directionMap['less_tryhard'];
    const basePrompt = `${instruction}

ORIGINAL CAPTION:
"${captionText}"

PLATFORM: ${platform || 'instagram'} (limit: ${charLimit} chars)

Return ONLY a JSON object:
{
  "revised_text": "the revised caption",
  "char_count": 123,
  "what_changed": "1-sentence summary of the revision"
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'CaptionMagicRevise' });
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic revise error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════
// ADAPT ENDPOINT: Multi-platform export (#4)
// Takes one caption and adapts it for all platforms
// ════════════════════════════════════════════
router.post('/caption-magic/adapt', rateLimit(), async (req, res) => {
  try {
    const { captionText, hashtags, sourcePlatform, targetPlatforms, userLanguage } = req.body;
    if (!captionText) return res.status(400).json({ error: 'Caption text is required' });

    const targets = Array.isArray(targetPlatforms) && targetPlatforms.length > 0
      ? targetPlatforms
      : Object.keys(PLATFORM_LIMITS).filter(p => p !== sourcePlatform);

    const platformSpecs = targets.map(p =>
      `- ${PLATFORM_NAMES[p] || p}: ${PLATFORM_LIMITS[p] || 2200} char limit`
    ).join('\n');

    const hashtagCtx = Array.isArray(hashtags) && hashtags.length > 0
      ? `\nORIGINAL HASHTAGS: ${hashtags.map(h => typeof h === 'object' ? h.tag : h).join(', ')}`
      : '';

    const basePrompt = `You are a social media expert. Take this caption written for ${PLATFORM_NAMES[sourcePlatform] || sourcePlatform} and adapt it for each target platform.

ORIGINAL CAPTION:
"${captionText}"
${hashtagCtx}

TARGET PLATFORMS:
${platformSpecs}

RULES:
- Each adaptation should feel native to its platform, not just trimmed/padded
- Twitter/X: tight, punchy, max 280 chars. Often drop hashtags or use 1-2 max
- LinkedIn: slightly more polished, can be longer, fewer emojis, 3-5 professional hashtags
- TikTok: conversational, hook-first, trend-aware, include relevant hashtags
- Threads: conversational, medium length, minimal hashtags
- Facebook: can be more personal/narrative, moderate hashtags
- Instagram: emoji-friendly, 5-15 hashtags, can use line breaks for readability
- Adapt hashtags per platform (fewer for Twitter, more niche for LinkedIn, etc.)

OUTPUT (JSON only):
{
  "adaptations": [
    {
      "platform": "twitter",
      "platform_name": "Twitter/X",
      "text": "adapted caption",
      "hashtags": ["tag1", "tag2"],
      "char_count": 120,
      "adaptation_note": "what was changed and why"
    }
  ]
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'CaptionMagicAdapt' });
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic adapt error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════
// REMIX ENDPOINT: Blend parts of captions (#6)
// ════════════════════════════════════════════
router.post('/caption-magic/remix', rateLimit(), async (req, res) => {
  try {
    const { captions, remixInstructions, platform, userLanguage } = req.body;

    if (!Array.isArray(captions) || captions.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 captions to remix' });
    }

    const charLimit = PLATFORM_LIMITS[platform] || 2200;

    const captionList = captions.map((cap, i) =>
      `OPTION ${i + 1} (${cap.tone || 'unknown tone'}):\n"${cap.text}"\nHashtags: ${(cap.hashtags || []).map(h => typeof h === 'object' ? h.tag : h).join(', ')}`
    ).join('\n\n');

    const basePrompt = `You are a social media caption specialist. The user has generated multiple caption options and wants you to blend them into a perfect hybrid.

${captionList}

USER'S REMIX INSTRUCTIONS: ${remixInstructions || 'Combine the best elements of each into one great caption'}

PLATFORM: ${platform || 'instagram'} (limit: ${charLimit} chars)

RULES:
- Create a single remixed caption that blends the requested elements
- It should feel cohesive, not frankensteined
- Stay within the platform's character limit
- Pick the best hashtags from across all options, respecting platform norms

OUTPUT (JSON only):
{
  "remixed_caption": {
    "tone": "the blended tone",
    "text": "the remixed caption",
    "hashtags": [
      { "tag": "hashtag1" },
      { "tag": "hashtag2" }
    ],
    "char_count": 150,
    "remix_explanation": "what was taken from each option and why it works together"
  }
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'CaptionMagicRemix' });
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic remix error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23. PF-38
// binds truth and v2 binds usefulness, both by instruction. This tool needed a
// third thing: enforcement after generation. See the evidence envelope above —
// prose asking the model to respect its own uncertainty list failed four times
// running, so the generator no longer receives the image and a separate
// adversarial pass checks the draft against the envelope before it renders.
router.outputStandard = 'v2';

// Exposed for the enforcement test: the validator is the one part of this file
// whose failure mode is silence, so it has to be callable without a live image
// and a full generation in front of it.
router._enforceEnvelope = enforceEnvelope;
router._renderEnvelope = renderEnvelope;

module.exports = router;
