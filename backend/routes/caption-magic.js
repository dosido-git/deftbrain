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
// MAIN ENDPOINT: Generate captions
// (updated with hashtag intelligence #5)
// ════════════════════════════════════════════
router.post('/caption-magic', rateLimit(), async (req, res) => {
  try {
    const { imageBase64, imageDescription, platform, tones, context, captionLength, brandVoice, userLanguage } = req.body;

    if (!imageBase64 && !imageDescription) {
      return res.status(400).json({ error: 'Provide an image or image description' });
    }

    const platformName = platform || 'instagram';
    const charLimit = PLATFORM_LIMITS[platformName] || 2200;
    const toneList = Array.isArray(tones) && tones.length > 0 ? tones.join(', ') : 'casual & authentic';
    const lengthPref = captionLength || 'medium';

    // Build content blocks for Claude
    const contentBlocks = [];

    // Vision block
    const parsed = parseDataUrl(imageBase64);
    if (imageBase64 && !parsed && !imageDescription) {
      return res.status(400).json({ error: "That image didn't upload correctly — try re-uploading it." });
    }
    if (parsed) {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: parsed.media_type, data: parsed.data },
      });
    }

    // Brand voice context
    const brandCtx = brandVoice
      ? `\nBRAND VOICE: The user's established writing style preferences: ${brandVoice}. Match this voice while still varying each caption's approach.`
      : '';

    const basePrompt = `You are a social media caption specialist who writes captions that sound like a real person, not a brand.

${parsed ? 'Look at this image carefully and use what you see to craft captions.' : ''}
${imageDescription ? `IMAGE DESCRIPTION: ${imageDescription}` : ''}
${context ? `CONTEXT: ${context}` : ''}
${brandCtx}

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

For HASHTAGS: suggest tags that genuinely describe this post. Do not label any of them trending, high-volume or high-competition — you cannot see what is trending, nobody counted the posts, and a tag presented as trending is a measurement claim. Mix broad and specific naturally and leave it at that. Never write the leading # — the interface adds it.

Create 3 caption variations, each with a different approach.

OUTPUT (JSON only):
{
  "image_read": "What is CLEARLY visible, and nothing else. Name only what you could point at and be confident about — a bicycle, a person, an indoor room, a number written on the frame. Leave out anything you are inferring: what the setting is for, what the clothing is, what an object is used for, what someone is doing — and any appearance word that is really a claim about its cause. Bright is visible; glowing is an assertion that the object is the light source, and a photograph cannot show you that. Lit, backlit, translucent, wet, warm, heavy, old and handmade are the same trap: they name a cause for what you can see. Describe the surface, not what is producing it. This field is written before the rest, so anything wrong here is repeated by every field after it. Where a detail matters to the captions but you cannot be sure of it, say so in the same breath: a frame that may be on a stand or may be a stationary trainer. An uncertain detail stated flatly becomes a caption built on something that is not there. If the user described the image instead of uploading one, work from their words and add nothing to them.",
  "_propagation": "READ THIS BEFORE WRITING ANY FIELD BELOW not_sure_about. Whatever you put in not_sure_about becomes prohibited factual material for the WHOLE response — every caption, every why_it_works, every hashtag, the alt text and every engagement tip — unless the user supplied that same fact themselves in their own description, in which case it was never uncertain and does not belong in the list. There is no field where the doubt lapses.
    It is prohibited in every grammatical disguise. Not only as a statement: not as an adjective (glowing), not as a verb (I built, just acquired), not as a noun compound (#resinart, #handmade), not as an implication (my new lamp), not smuggled into a rationale about why a caption works, and not as a hashtag, which is the surface people forget because it does not look like a sentence. A hashtag is a claim in one word.
    The check is mechanical, so do it mechanically: for each item you wrote in not_sure_about, scan every string you are about to output and ask whether it could only be true if that doubt had been settled. If yes, cut it or rewrite around it. Uncertainty about a thing never blocks mentioning the thing — only asserting the part you could not see. The octopus may be described, joked about and hashtagged; whether it lights up and who made it may not.",
  "not_sure_about": ["Anything you can see but cannot identify with confidence, and which would change a caption if you got it wrong. Empty array when the image is unambiguous.
    A settled thing is simply ABSENT from this list. Do not list it with a note explaining that it is settled — that is narrating the instruction back instead of following it, and the entry still blocks the fact downstream. If the user told you they made it, who made it never appears here at all. Do not split hairs about a fact they gave you either: told it is a lamp that lights up purple, neither the lamp nor the light belongs here, however uncertain the mechanism is. Doubt what you are LOOKING at, never what you were TOLD.
    This is not hedging either: it is the list of things every later field is forbidden to assert."],
  "captions": [
    {
      "tone": "the tone used (e.g., Witty, Casual, Reflective)",
      "text": "The caption. Before writing each one, read your own not_sure_about list back and check every word against it — the leak is never the noun, it is the adjective or the verb that only works if one of those doubts had been resolved. If you wrote that you cannot tell whether it lights up, then glowing is out; if you cannot tell whether it was handmade, then so I built this is out, and so is any word implying you made it, found it, bought it, or that it is yours to keep. Followed me home and it's staying are the same invented history in a friendlier voice. Write the caption from what is in image_read alone and it will be fine.
        NO:  a glowing purple head watching over my desk   (lighting was listed as uncertain)
        NO:  so I built an octopus                          (authorship was listed as uncertain)
        YES: a purple octopus head, watching over my desk
        YES: this octopus has taken up residence on my desk
        These are worked pairs to show the shape, not lines to reuse — write your own.
        Authorship and ownership never wait for not_sure_about. An image cannot show you who made a thing, who owns it, where it came from or what it cost, so unless the visitor's own words say they made it, own it, found it or bought it, no caption may say or imply that they did — whether or not it appears in the list. The list is built from looking, and none of this is visible, so it will often be missing from it.
        Separately: a detail you CAN see does not license a claim about what it MEANS. A number written on a photo establishes that someone measured it, never that the number is correct, ideal or recommended — a caption calling 130 degrees the magic angle has invented the meaning and attached it to the observation. Describe, joke, react; do not conclude.",
      "hashtags": [
        { "tag": "hashtag1" },
        { "tag": "hashtag2" },
        { "tag": "hashtag3" }
      ],
      "char_count": 150,
      "why_it_works": "1-sentence explanation of the approach",
      "best_for": "when this version works best"
    }
  ],
  "alt_text": "Descriptive accessibility text. Bound by not_sure_about exactly as the captions are: describe what is visible, assert nothing you listed as uncertain. This is the field the rule is most often lost in, because describing feels safer than claiming — but a screen-reader user gets this INSTEAD of the picture and has no way to see past a wrong word. Glowing, handmade, antique, expensive are conclusions, not descriptions.",
  "engagement_tips": [
    "A creative suggestion about the post itself, phrased as what it offers rather than what it will achieve. No performance claims of any kind — not about the algorithm or reach, and not about people either. 'Questions in captions get more replies' and 'people respond better to X' are population findings nobody measured, and they are the same borrowed authority as an algorithm claim wearing softer clothes.
      NO:  Questions in captions get more replies
      YES: A question can give people an easy way into the conversation
      NO:  People respond better to authenticity than to polish
      YES: A casual observation fits this tone better than a generic call to action
      No frequency words either — often, usually, tend to, most people. They smuggle the same
      unmeasured population claim back in under a softer verb.
      THE TEST IS THE SUBJECT OF YOUR SENTENCE. It must be the caption, the post or the object
      in it — never people, readers, your audience or they. The moment an audience becomes the
      subject you are reporting their behaviour, and you have not observed any of it.
      And no comparison of outcomes, whatever the subject: goes further, does better,
      works best, gets more. A sentence can pass the subject test and still rank two
      results nobody measured.
      NO:  people respond to a voice that sounds like thinking out loud
      NO:  a conversational tone invites more comments than a polished description
      YES: thinking out loud on the page leaves room for a reply; a finished description does not
      Worked pairs for shape only — write your own.",
    "A second, on the same terms."
  ],
  "avoid": ["thing to avoid 1", "thing to avoid 2"]
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    contentBlocks.push({ type: 'text', text: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) });

    const parsed_json = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: contentBlocks }],
    }, { label: 'CaptionMagic' });
    if (!parsed_json.captions && !parsed_json.image_read) {
      return res.status(500).json({ error: 'Could not generate captions. Please try again.' });
    }
    // char_count is a consumed hero stat — code-compute it (model understated
    // all three counts in the audit).
    if (Array.isArray(parsed_json.captions)) {
      parsed_json.captions.forEach(c => { if (c && typeof c.caption === 'string') c.char_count = c.caption.length; });
    }
    // Uncertainty here comes from LOOKING. With no image there is nothing being
    // interpreted — every fact came from the person, and the prompt rule saying
    // so did not hold: told "a lamp I made myself", the model still listed who
    // made it as uncertain, which then blocks the fact they supplied. Enforced
    // in code rather than asked for again.
    if (!parsed) parsed_json.not_sure_about = [];
    // The working field that makes the model read its own list before writing
    // the rest. Never shown.
    delete parsed_json._propagation;
    res.json(parsed_json);

  } catch (error) {
    console.error('CaptionMagic error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

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

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23. The
// tool's own failure was epistemic — an ambiguous image became first-person
// history — and PF-38 plus the not_sure_about propagation contract already
// bind that. v2 is here for the other half: whether the captions stay usable
// once the invented specifics are gone.
router.outputStandard = 'v2';

module.exports = router;
