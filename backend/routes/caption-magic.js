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
  'ownership — whether the poster owns, made, found, bought or built anything pictured',
  'when the photo was taken — date, day, time of day, season, or how recently',
  'who took the photo, or where the poster was standing',
  'whether anyone uses, lives in, works in or has ever visited the pictured place',
  'the age, condition, price, brand or history of anything pictured',
  'what the poster or anyone else feels, thinks, intends or has been through',
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

Write creatively using OBSERVED facts.

You may use UNCERTAIN details only if the wording visibly preserves the uncertainty.

Do not introduce a factual proposition about the pictured scene, the poster, or circumstances unless it is supported by OBSERVED or independently supplied by the user.

PROHIBITED INFERENCES may not appear as facts anywhere in captions, rationales, hashtags, engagement tips, or other generated fields.

Creativity must come from language, tone, juxtaposition, humour, rhythm and selection — not invented circumstances. An envelope is not a reason to be dull: everything in OBSERVED is yours to play with, and the funniest line about a thing is rarely a claim about where it came from.`;
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

For HASHTAGS: suggest tags that genuinely describe this post, drawn from OBSERVED. Do not label any of them trending, high-volume or high-competition — you cannot see what is trending, nobody counted the posts, and a tag presented as trending is a measurement claim. A hashtag is a claim in one word, so #handmade and #vintage are prohibited inferences wearing a shorter coat. Never write the leading # — the interface adds it.

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

  const validatePrompt = `You are checking a draft for unsupported claims. You are not writing or improving it.

${renderEnvelope(envelope)}
${supplied}
PROPOSED OUTPUT:
${proposed}

For each factual proposition in the proposed output about the image, poster, circumstances, history, time, actions, feelings, ownership, use, or condition — and equally about anyone who will see the post, what they will do, feel, notice or how they will respond:

Is it supported by OBSERVED or USER-PROVIDED facts?

Audience claims are the ones most often missed here, because they are not about the picture and so do not feel like claims about it. Nobody observed the audience either. "Makes people stop rather than scroll past", "viewers will feel like they discovered something", "gets more comments" are all unsupported propositions, whatever the sentence's subject.

Also check whether anything in UNCERTAIN or PROHIBITED INFERENCES has been converted into fact.

A proposition can hide in an adjective, a verb, a possessive or a hashtag — "my new lamp" claims ownership and novelty, "glowing" claims a light source, "#handmade" claims authorship, "when nobody's using it" claims current use, "rather than scroll past" claims viewer behaviour. Wording that visibly preserves an UNCERTAIN detail is fine: "some kind of resin, maybe" is supported, "resin" is not.

Do not flag figurative language that asserts nothing — a joke, a mood, an address to the reader, a description of the picture in playful words. Nor a statement about what a caption OFFERS, which is a description of the writing rather than a prediction: "gives a reply somewhere to land" and "leaves room for a question" claim nothing about anyone. It becomes a violation when it says what people will actually do.

Flag only where a reader would come away believing something the envelope does not support.

Return PASS or FAIL. If FAIL, identify the offending output fields and the unsupported propositions. Do not rewrite them.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the proposed output", "proposition": "the unsupported claim, quoted from the field", "why": "which envelope rule it breaks, in a few words" }
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
Rewrite each line below so it keeps its voice, tone, length and joke, and drops only the unsupported claim. Do not make it cautious, do not add a hedge where the fix is simply to cut three words, and do not replace a specific image with a vague one. The line should read as though the claim was never there — not as though it was removed.

${violations.map((v, i) => `${i}. [${v.field}]
   current: ${getByPath(out, v.field)}
   unsupported: ${v.proposition}${v.why ? ` (${v.why})` : ''}`).join('\n\n')}

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
