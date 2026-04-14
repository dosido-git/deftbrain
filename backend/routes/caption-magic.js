const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[caption-magic] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ── Helper: extract base64 and media type from data URL ──
function parseDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  return { media_type: match[1], data: match[2] };
}

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
router.post('/caption-magic', async (req, res) => {
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

PLATFORM: ${platformName} (character limit: ${charLimit})
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

For HASHTAGS, categorize each one:
- "trending" = high volume (100k+ posts), broad reach, high competition
- "niche" = lower volume but higher engagement rate, specific audience
- "branded" = unique/personal tags the user could own

Create 3 caption variations, each with a different approach.

OUTPUT (JSON only):
{
  "image_read": "brief description of what you see in the image (or what was described)",
  "captions": [
    {
      "tone": "the tone used (e.g., Witty, Casual, Reflective)",
      "text": "the full caption text",
      "hashtags": [
        { "tag": "hashtag1", "category": "trending" },
        { "tag": "hashtag2", "category": "niche" },
        { "tag": "hashtag3", "category": "branded" }
      ],
      "char_count": 150,
      "why_it_works": "1-sentence explanation of the approach",
      "best_for": "when this version works best"
    }
  ],
  "alt_text": "descriptive accessibility text for the image",
  "best_posting_time": "optimal posting window for ${platformName}",
  "posting_schedule": {
    "best_days": ["Tuesday", "Thursday"],
    "best_hours": ["12pm-1pm", "6pm-8pm"],
    "why": "brief explanation of timing strategy for this content type"
  },
  "engagement_tips": [
    "tip 1 specific to this content",
    "tip 2 specific to this platform"
  ],
  "avoid": ["thing to avoid 1", "thing to avoid 2"]
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    contentBlocks.push({ type: 'text', text: withLanguage(basePrompt, userLanguage) });

    const message = await withRetry(() => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: contentBlocks }],
    }));

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed_json = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed_json);

  } catch (error) {
    console.error('CaptionMagic error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate captions' });
  }
});

// ════════════════════════════════════════════
// REVISE ENDPOINT: Refine a caption
// ════════════════════════════════════════════
router.post('/caption-magic/revise', async (req, res) => {
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

CRITICAL: Return ONLY valid JSON.`;

    const lang = withLanguage(userLanguage);
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic revise error:', error);
    res.status(500).json({ error: error.message || 'Failed to revise caption' });
  }
});

// ════════════════════════════════════════════
// ADAPT ENDPOINT: Multi-platform export (#4)
// Takes one caption and adapts it for all platforms
// ════════════════════════════════════════════
router.post('/caption-magic/adapt', async (req, res) => {
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

CRITICAL: Return ONLY valid JSON.`;

    const msg2 = await withRetry(() => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg2.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic adapt error:', error);
    res.status(500).json({ error: error.message || 'Failed to adapt captions' });
  }
});

// ════════════════════════════════════════════
// REMIX ENDPOINT: Blend parts of captions (#6)
// ════════════════════════════════════════════
router.post('/caption-magic/remix', async (req, res) => {
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
      { "tag": "hashtag1", "category": "trending" },
      { "tag": "hashtag2", "category": "niche" }
    ],
    "char_count": 150,
    "remix_explanation": "what was taken from each option and why it works together"
  }
}

CRITICAL: Return ONLY valid JSON.`;

    const msg3 = await withRetry(() => anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg3.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic remix error:', error);
    res.status(500).json({ error: error.message || 'Failed to remix captions' });
  }
});

module.exports = router;
