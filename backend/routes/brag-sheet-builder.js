const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext} = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Build Brag Sheet
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-builder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      accomplishments, industry, level, purposes,
      roleTitle, yearsExp, tone, userLanguage,
    } = req.body;

    if (!accomplishments || accomplishments.length === 0) {
      return res.status(400).json({ error: 'Add at least one accomplishment.' });
    }

    const wantResume = purposes?.includes('resume');
    const wantLinkedin = purposes?.includes('linkedin');
    const wantInterview = purposes?.includes('interview');
    const wantReview = purposes?.includes('review');
    const wantRaise = purposes?.includes('raise');

    const LEVEL_GUIDANCE = {
      student: 'Student or new grad. Academic projects, internships, and extracurriculars ARE real accomplishments. Frame leadership of a class project as seriously as managing a corporate initiative. Quantify everything.',
      entry: 'Entry-level. They may minimize contributions because they "just" did their job. Highlight initiative, learning speed, and any ownership they took.',
      mid: 'Mid-level professional. Look for evidence of influence, mentoring, cross-team work, and process improvements. They probably led more than they admit.',
      senior: 'Senior/Lead level. Translate individual contributions into team and org-level impact. They should describe outcomes, not tasks.',
      manager: 'Manager/Director level. Frame everything as leadership impact: team growth, revenue influence, strategic decisions, organizational change.',
      executive: 'VP/Executive level. Business outcomes, P&L impact, market positioning, organizational transformation. Numbers should be large-scale.',
    };

    const INDUSTRY_VERBS = {
      tech: 'Prefer: architected, engineered, shipped, scaled, automated, optimized, deployed, migrated. Avoid: helped, worked on.',
      finance: 'Prefer: modeled, forecasted, analyzed, structured, executed, allocated, valued. Avoid: helped with.',
      healthcare: 'Prefer: administered, coordinated care, implemented protocol, reduced readmissions, improved outcomes. Avoid: was responsible for.',
      education: 'Prefer: developed curriculum, improved outcomes, mentored, increased engagement. Avoid: taught (too generic).',
      marketing: 'Prefer: launched, drove, converted, grew, positioned, generated, scaled. Avoid: managed (too vague).',
      sales: 'Prefer: closed, exceeded quota, expanded, penetrated, upsold, retained, secured. Avoid: worked with clients.',
      consulting: 'Prefer: advised, assessed, recommended, transformed, restructured, delivered. Avoid: helped, assisted.',
      nonprofit: 'Prefer: mobilized, advocated, secured funding, expanded reach, launched program. Avoid: helped.',
      engineering: 'Prefer: designed, fabricated, tested, validated, certified, reduced defects, patented. Avoid: worked on.',
      government: 'Prefer: administered, regulated, coordinated, implemented policy, streamlined. Avoid: was responsible for.',
      retail: 'Prefer: merchandised, trained, increased revenue, improved NPS, reduced shrinkage. Avoid: worked the floor.',
    };

    const TONE_GUIDANCE = {
      confident: 'Use bold, assertive language. Lead with impact. The user wants to own their accomplishments fully.',
      balanced: 'Professional and confident but not boastful. The default — strong verbs, clear metrics, measured tone.',
      understated: 'Quietly powerful. Let the numbers speak. Avoid superlatives. The user prefers a more reserved style.',
    };

    const levelGuide = LEVEL_GUIDANCE[level] || LEVEL_GUIDANCE.mid;
    const industryVerbs = INDUSTRY_VERBS[industry] || '';
    const toneGuide = TONE_GUIDANCE[tone] || TONE_GUIDANCE.balanced;
    const numberedAccomplishments = accomplishments.map((a, i) => `${i + 1}. "${a}"`).join('\n');

    const calibration = [
      `Level framing: ${levelGuide}`,
      industryVerbs ? `Verb preferences: ${industryVerbs}` : null,
      `Tone: ${toneGuide}`,
    ].filter(Boolean).join('\n');

    const systemPrompt = `You are the world's best professional accomplishment translator. You take humble, self-deprecating descriptions and transform them into powerful, specific, metrics-driven achievement statements.

CALIBRATE YOUR OUTPUT TO THIS PERSON:
${calibration}`;

    let outputSpec = `{
  "transformations": [
    {
      "original": "Quoted exactly from input — one sentence",
      "improved": "Power version. If metric is estimated, use [brackets]. — one sentence",
      "what_changed": "Brief: 'Added specificity + quantified impact + upgraded verb' — one sentence",
      "verb_upgrades": [{"from": "helped — one sentence", "to": "spearheaded — one sentence"}],
      "why_you_deserve_this": "Specific imposter-syndrome killer for THIS accomplishment. — one sentence"
    }
  ],
  "metrics_to_find": [
    {
      "accomplishment_index": 0,
      "question": "Specific question to find a hidden metric for this accomplishment — one sentence",
      "why": "Why this metric matters — one sentence",
      "example": "What the bullet looks like with this metric filled in — one sentence"
    }
  ]`;

    if (wantInterview) {
      outputSpec += `,
  "star_stories": [
    {
      "title": "Short title — 3-6 words",
      "situation": "Context and stakes — one sentence",
      "task": "What they needed to accomplish — one sentence",
      "action": "What they DID — specific, showing initiative — one sentence",
      "result": "Outcome with metrics — one sentence"
    }
  ]`;
    }

    if (wantResume) {
      outputSpec += `,
  "resume_bullets": ["Power verb + what + metric. 1-2 lines each."]`;
    }

    if (wantLinkedin) {
      outputSpec += `,
  "linkedin_about": "Warm first-person narrative, 150-250 words. Sounds human, not AI-generated."`;
    }

    if (wantReview) {
      outputSpec += `,
  "performance_review": "Self-assessment paragraph, 150-200 words. Professional, confident, specific."`;
    }

    if (wantRaise) {
      outputSpec += `,
  "raise_ammunition": {
    "summary": "One sentence framing why contributions justify a raise/promotion.",
    "value_statements": ["Each accomplishment as business value with dollar estimates where reasonable."],
    "total_estimated_value": "Aggregate estimated business value — a single number or range. — one sentence",
    "script": "Exact words for a raise meeting. 60-90 words. Confident, factual, references specific contributions."
  }`;
    }

    outputSpec += `,
  "confidence": {
    "reframe": "Why describing your work accurately is not bragging. Specific to their accomplishments. — one sentence",
    "imposter_killer": "One powerful sentence addressing the imposter syndrome they probably feel about these specific accomplishments. — one sentence"
  }
}`;

    const personContext = [
      roleTitle ? `Role / title: ${roleTitle}` : null,
      yearsExp ? `Years of experience: ${yearsExp}` : null,
    ].filter(Boolean).join('\n');

    const userPrompt = withLanguage(`Here are the accomplishments to transform:
${personContext ? `\n${personContext}\n` : ''}
${numberedAccomplishments}

Return ONLY valid JSON:
${outputSpec}

Generate one transformation per accomplishment. Generate 2-4 metrics questions (include accomplishment_index to track which accomplishment each question is about, 0-indexed). ${wantInterview ? 'Generate 1-2 STAR stories from the strongest accomplishments.' : ''} ${wantResume ? 'Generate resume bullets for ALL accomplishments.' : ''} ${wantRaise ? 'Generate value statements for ALL accomplishments.' : ''}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'BragSheetBuilder' });

    // guard: accept any of the common top-level keys the schema may return
    if (!parsed.transformations && !parsed.transformed && !parsed.bullets && !parsed.achievements && !parsed.brag_sheet) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetBuilder] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: REFINE — Upgrade bullets with real metrics
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-refine', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      originalTransformations,
      metricsAnswers,
      industry,
      level,
      roleTitle,
      purposes,
      tone,
      userLanguage,
    } = req.body;

    if (!metricsAnswers || metricsAnswers.length === 0) {
      return res.status(400).json({ error: 'Provide at least one metrics answer.' });
    }

    const TONE_GUIDANCE = {
      confident: 'Bold, assertive. Lead with impact.',
      balanced: 'Professional, confident, measured.',
      understated: 'Quietly powerful. Let the numbers speak.',
    };
    const toneGuide = TONE_GUIDANCE[tone] || TONE_GUIDANCE.balanced;

    const wantResume = purposes?.includes('resume');
    const wantRaise = purposes?.includes('raise');

    const transformContext = originalTransformations
      .map((t, i) => `${i + 1}. Original: "${t.original}" → Current: "${t.improved}"`)
      .join('\n');

    const answersText = metricsAnswers
      .map(a => `For accomplishment ${a.accomplishment_index + 1} ("${a.question}"): "${a.answer}"`)
      .join('\n');

    const prompt = withLanguage(`You are upgrading professional accomplishment statements with REAL metrics the user just provided.

CURRENT TRANSFORMATIONS:
${transformContext}

USER'S METRIC ANSWERS:
${answersText}

CONTEXT:
- Role: ${roleTitle || 'Not specified'}
- Level: ${level || 'mid-level'}
- Industry: ${industry || 'general'}
- Tone: ${toneGuide}

INSTRUCTIONS:
1. For each accomplishment that has new metric data, create an upgraded version replacing [brackets] with real numbers.
2. If an answer is vague ("a lot", "many"), infer a reasonable metric range and present it confidently.
3. Update verb upgrades if the new data suggests even stronger framing.
4. Include a new imposter-syndrome note acknowledging the REAL metric.
${wantResume ? '5. Generate updated resume bullets incorporating the real metrics.' : ''}
${wantRaise ? '6. Update raise value statements with real dollar figures where possible.' : ''}

Return ONLY valid JSON:
{
  "upgraded_transformations": [
    {
      "accomplishment_index": 0,
      "improved": "New power version with real metrics plugged in — one sentence",
      "what_changed": "What got better with the real numbers — one sentence",
      "verb_upgrades": [{"from": "old verb — one sentence", "to": "new verb — one sentence"}],
      "why_you_deserve_this": "Updated imposter-syndrome killer with real metric acknowledgment — one sentence",
      "metric_highlight": "The key number that makes this pop — e.g., '47% reduction in processing time' — one sentence"
    }
  ]${wantResume ? `,
  "updated_resume_bullets": ["Updated bullets with real metrics"]` : ''}${wantRaise ? `,
  "updated_raise_statements": ["Updated value statements with real numbers"]` : ''},
  "remaining_questions": [
    {
      "accomplishment_index": 0,
      "question": "Follow-up question to dig even deeper — only if there's obviously more to uncover — one sentence",
      "why": "Why this additional metric matters — one sentence"
    }
  ]
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are an expert career coach upgrading accomplishment statements with real metrics. Return ONLY valid JSON. No markdown, no preamble.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetRefine' });

    if (!parsed.upgraded_transformations) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetRefine] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: TWEAK — Reword a single transformation
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-tweak', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      original,
      currentImproved,
      instruction,
      industry,
      level,
      roleTitle,
      tone,
      userLanguage,
    } = req.body;

    if (!currentImproved || !instruction) {
      return res.status(400).json({ error: 'Current text and instruction are required.' });
    }

    const TONE_GUIDANCE = {
      confident: 'Bold, assertive. Lead with impact.',
      balanced: 'Professional, confident, measured.',
      understated: 'Quietly powerful. Let the numbers speak.',
    };

    const prompt = withLanguage(`You are rewriting a professional accomplishment statement based on user feedback.

ORIGINAL (what they said): "${original}"
CURRENT VERSION: "${currentImproved}"
USER INSTRUCTION: "${instruction}"

CONTEXT: Role: ${roleTitle || 'Not specified'}, Level: ${level || 'mid-level'}, Industry: ${industry || 'general'}
TONE: ${TONE_GUIDANCE[tone] || TONE_GUIDANCE.balanced}

Rewrite the "current version" according to the user's instruction. Keep it truthful — never invent facts.
If instruction is "less aggressive" → soften verbs, remove superlatives, keep metrics.
If instruction is "stronger" → upgrade verbs, add impact framing, be bolder.
If instruction is a custom rewrite request → follow it exactly.

Return ONLY valid JSON:
{
  "improved": "The rewritten version — one sentence",
  "what_changed": "Brief explanation of what you changed — one sentence",
  "verb_upgrades": [{"from": "old verb — one sentence", "to": "new verb — one sentence"}],
  "why_you_deserve_this": "Updated imposter-syndrome killer — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are a professional accomplishment translator. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetTweak' });

    if (!parsed.improved) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetTweak] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: ADD SINGLE — Transform one new accomplishment
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-add-single', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      newAccomplishment,
      existingTransformations,
      industry,
      level,
      roleTitle,
      purposes,
      tone,
      userLanguage,
    } = req.body;

    if (!newAccomplishment?.trim()) {
      return res.status(400).json({ error: 'Accomplishment text is required.' });
    }

    const TONE_GUIDANCE = {
      confident: 'Bold, assertive. Lead with impact.',
      balanced: 'Professional, confident, measured.',
      understated: 'Quietly powerful. Let the numbers speak.',
    };

    const existingContext = existingTransformations?.length > 0
      ? `\nEXISTING ACCOMPLISHMENTS (for context — match the style):\n${existingTransformations.map((t, i) => `${i + 1}. "${t.improved}"`).join('\n')}`
      : '';

    const wantResume = purposes?.includes('resume');
    const wantRaise = purposes?.includes('raise');

    const prompt = withLanguage(`You are transforming a single new professional accomplishment. Match the style of existing transformations if provided.

NEW ACCOMPLISHMENT: "${newAccomplishment}"
${existingContext}

CONTEXT: Role: ${roleTitle || 'Not specified'}, Level: ${level || 'mid-level'}, Industry: ${industry || 'general'}
TONE: ${TONE_GUIDANCE[tone] || TONE_GUIDANCE.balanced}

Return ONLY valid JSON:
{
  "transformation": {
    "original": "${newAccomplishment}",
    "improved": "Power version with [brackets] for estimated metrics — one sentence",
    "what_changed": "Brief explanation — one sentence",
    "verb_upgrades": [{"from": "old", "to": "new"}],
    "why_you_deserve_this": "Specific imposter-syndrome killer — one sentence"
  },
  "metrics_to_find": [
    {
      "question": "Question to find a hidden metric — one sentence",
      "why": "Why this metric matters — one sentence",
      "example": "What the bullet looks like with this metric — one sentence"
    }
  ]${wantResume ? `,
  "resume_bullet": "One resume bullet for this accomplishment — one sentence"` : ''}${wantRaise ? `,
  "raise_statement": "This accomplishment as business value — one sentence"` : ''}
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are an expert accomplishment translator. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetAddSingle' });

    if (!parsed.transformation) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetAddSingle] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: STAR SELECT — Generate STAR story from specific accomplishment
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-star', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      accomplishment,
      improved,
      interviewQuestion,
      industry,
      level,
      roleTitle,
      userLanguage,
    } = req.body;

    if (!accomplishment) {
      return res.status(400).json({ error: 'Accomplishment is required.' });
    }

    const questionContext = interviewQuestion
      ? `\nThe user wants this STAR story to answer this interview question: "${interviewQuestion}"\nTailor the framing to directly address this question.`
      : '';

    const prompt = withLanguage(`Generate a STAR interview story from this accomplishment.

ORIGINAL: "${accomplishment}"
POWER VERSION: "${improved || accomplishment}"
CONTEXT: Role: ${roleTitle || 'Not specified'}, Level: ${level || 'mid-level'}, Industry: ${industry || 'general'}${questionContext}

The STAR story should feel natural and conversational — something you'd actually say in an interview, not a written document.

Return ONLY valid JSON:
{
  "title": "Short title for this story — 3-6 words",
  "situation": "Context and stakes — set the scene in 2-3 sentences",
  "task": "What you needed to accomplish — 1-2 sentences",
  "action": "What you DID — specific, showing initiative, 2-4 sentences. This is the longest section.",
  "result": "Outcome with metrics — 1-2 sentences. End strong.",
  "good_for_questions": ["List of 2-3 common interview questions this story answers well"]
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are an expert interview coach. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetStar' });

    if (!parsed.title) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetStar] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: EXCAVATE — Role-specific prompting questions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-excavate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      roleTitle,
      industry,
      level,
      yearsExp,
      existingAccomplishments,
      userLanguage,
    } = req.body;

    const existingContext = existingAccomplishments?.length > 0
      ? `\n\nACCOMPLISHMENTS THEY ALREADY LISTED (don't repeat these — dig for NEW ones):\n${existingAccomplishments.map((a, i) => `${i + 1}. "${a}"`).join('\n')}`
      : '';

    const prompt = withLanguage(`You are helping someone remember their professional accomplishments. Most people go blank when asked "what did you achieve?" — your job is to jog their memory with specific, role-aware prompting questions.

CONTEXT:
- Role: ${roleTitle || 'Not specified'}
- Industry: ${industry || 'general'}
- Level: ${level || 'mid-level'}
${yearsExp ? `- Years of experience: ${yearsExp}` : ''}${existingContext}

Generate questions across these categories. Each question should be specific enough to trigger a memory. NOT generic like "Did you lead anything?" — instead: "Did you ever take over a project that was behind schedule and get it back on track?"

Return ONLY valid JSON:
{
  "categories": [
    {
      "name": "Impact & Results — 3-6 words",
      "icon": "📈",
      "questions": [
        {
          "text": "Specific memory-jogging question — one sentence",
          "exampleAccomplishment": "What this might turn into — e.g., 'Reduced customer churn by 15% by redesigning the onboarding flow' — one sentence"
        }
      ]
    },
    {
      "name": "Leadership & Influence — 3-6 words",
      "icon": "👥",
      "questions": [...]
    },
    {
      "name": "Problem Solving — 3-6 words",
      "icon": "🔧",
      "questions": [...]
    },
    {
      "name": "Growth & Learning — 3-6 words",
      "icon": "🌱",
      "questions": [...]
    },
    {
      "name": "Collaboration & Communication — 3-6 words",
      "icon": "🤝",
      "questions": [...]
    },
    {
      "name": "Innovation & Initiative — 3-6 words",
      "icon": "💡",
      "questions": [...]
    }
  ]
}

Generate 3-4 questions per category. Make them SPECIFIC to this person's role, industry, and level. A nurse gets different questions than a software engineer. A student gets different questions than a VP.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a career coach who specializes in helping people uncover hidden accomplishments. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetExcavate' });

    if (!parsed.categories) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetExcavate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: TAILOR — Match accomplishments to a job description
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-tailor', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      jobDescription,
      transformations,
      industry,
      level,
      roleTitle,
      tone,
      userLanguage,
    } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({ error: 'Paste a job description to tailor against.' });
    }
    if (!transformations?.length) {
      return res.status(400).json({ error: 'Build your brag sheet first, then tailor it.' });
    }

    const TONE_GUIDANCE = {
      confident: 'Bold, assertive framing.',
      balanced: 'Professional, confident, measured.',
      understated: 'Quietly powerful. Let numbers speak.',
    };

    const bulletContext = transformations
      .map((t, i) => `${i + 1}. "${t.improved}" (original: "${t.original}")`)
      .join('\n');

    const prompt = withLanguage(`You are tailoring a professional's accomplishments to a specific job description.

JOB DESCRIPTION:
"""
${jobDescription.substring(0, 3000)}
"""

THEIR ACCOMPLISHMENTS:
${bulletContext}

CONTEXT: Role: ${roleTitle || 'Not specified'}, Level: ${level || 'mid'}, Industry: ${industry || 'general'}
TONE: ${TONE_GUIDANCE[tone] || TONE_GUIDANCE.balanced}

INSTRUCTIONS:
1. Extract the key requirements/skills/values from the JD.
2. Score each accomplishment's relevance (0-100) to this JD.
3. Rewrite the top accomplishments using the JD's own language and keywords.
4. Identify gaps — requirements in the JD that NO accomplishment addresses.
5. Generate a tailored cover letter opening (3-4 sentences).
6. Generate tailored resume bullets ordered by relevance.

Return ONLY valid JSON:
{
  "jd_requirements": [
    {
      "requirement": "What the JD asks for — one sentence",
      "keywords": ["key", "terms", "from", "JD"],
      "priority": "must_have|nice_to_have|implied"
    }
  ],
  "relevance_ranking": [
    {
      "accomplishment_index": 0,
      "relevance_score": 85,
      "tailored_version": "Rewritten using JD language and keywords — one sentence",
      "keywords_used": ["specific", "JD", "terms", "incorporated"]
    }
  ],
  "gaps": [
    {
      "requirement": "What the JD needs that you don't have — one sentence",
      "suggestion": "How to address this — either excavate a new accomplishment or frame an existing one differently — one sentence",
      "severity": "critical|moderate|minor"
    }
  ],
  "cover_letter_opening": "3-4 sentences connecting their strongest accomplishments to this specific role. Uses company name if mentioned in JD.",
  "tailored_resume_bullets": ["Bullets reordered by relevance, rewritten with JD keywords"],
  "match_score": 78,
  "match_summary": "One sentence: 'Strong match on X and Y; gaps in Z.'"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are an expert resume strategist and ATS optimization specialist. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetTailor' });

    if (!parsed.jd_requirements) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetTailor] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: RADAR — Strength assessment across dimensions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-radar', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      transformations,
      industry,
      level,
      roleTitle,
      userLanguage,
    } = req.body;

    if (!transformations?.length) {
      return res.status(400).json({ error: 'Build your brag sheet first.' });
    }

    const bulletContext = transformations
      .map((t, i) => `${i + 1}. "${t.improved}" (original: "${t.original}")`)
      .join('\n');

    const prompt = withLanguage(`Assess this person's brag sheet across key professional dimensions. Score each dimension based ONLY on what their accomplishments demonstrate.

ROLE: ${roleTitle || 'Not specified'}
LEVEL: ${level || 'mid-level'}
INDUSTRY: ${industry || 'general'}

ACCOMPLISHMENTS:
${bulletContext}

Score each dimension 0-100 where:
- 0 = Not represented at all (no accomplishments in this area)
- 25 = Mentioned but weak (vague, no metrics)
- 50 = Present (clear accomplishment but room for stronger examples)
- 75 = Strong (specific, quantified, impressive for level)
- 100 = Exceptional (would impress a hiring manager immediately)

Choose 6-8 dimensions appropriate for this role/level/industry. Common dimensions include: Technical Execution, Leadership, Metrics & Impact, Collaboration, Innovation, Communication, Strategic Thinking, Problem Solving, People Development — but customize to their context.

Return ONLY valid JSON:
{
  "dimensions": [
    {
      "name": "Dimension Name — 3-6 words",
      "score": 75,
      "icon": "emoji",
      "evidence": "Which accomplishment(s) support this score — one sentence",
      "gap_suggestion": "If score < 50: what kind of accomplishment would strengthen this. If score >= 50: null — one sentence"
    }
  ],
  "overall_score": 68,
  "overall_grade": "B+",
  "strongest": "Your strongest area is X because Y — one sentence",
  "weakest": "The biggest gap is Z — try thinking about Q — one sentence",
  "level_comparison": "For a [level] in [industry], this sheet is [above average / competitive / needs work] because... — one sentence",
  "next_actions": [
    "Specific thing to do to improve the weakest dimension",
    "Second action"
  ]
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a career assessment expert. Be honest — a 60 is not a bad score, it means there is room to improve. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetRadar' });

    if (!parsed.dimensions) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetRadar] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: INTERVIEW MATRIX — Map accomplishments to questions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-interview-matrix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      transformations,
      starStories,
      industry,
      level,
      roleTitle,
      userLanguage,
    } = req.body;

    if (!transformations?.length) {
      return res.status(400).json({ error: 'Build your brag sheet first.' });
    }

    const bulletContext = transformations
      .map((t, i) => `${i + 1}. "${t.improved}"`)
      .join('\n');

    const starContext = starStories?.length > 0
      ? `\n\nEXISTING STAR STORIES:\n${starStories.map((s, i) => `${i + 1}. "${s.title}" — S: ${s.situation} T: ${s.task} A: ${s.action} R: ${s.result}`).join('\n')}`
      : '';

    const prompt = withLanguage(`You are mapping this person's accomplishments and STAR stories to common behavioral interview questions for their role.

ROLE: ${roleTitle || 'Not specified'}
LEVEL: ${level || 'mid-level'}
INDUSTRY: ${industry || 'general'}

ACCOMPLISHMENTS:
${bulletContext}${starContext}

INSTRUCTIONS:
1. Generate the 10-15 most likely behavioral interview questions for this role/level/industry.
2. Map each question to the best accomplishment or STAR story to answer it.
3. Identify questions with NO good answer — these are preparation gaps.
4. For each mapped question, give a brief "angle" — how to frame the accomplishment as an answer.

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Tell me about a time you... — one sentence",
      "category": "Leadership|Problem Solving|Teamwork|Conflict|Failure|Innovation|Communication|Pressure|Growth",
      "likelihood": "very_likely|likely|possible",
      "best_match": {
        "type": "accomplishment|star_story|none",
        "index": 0,
        "angle": "Frame this as: you identified the problem early, took initiative to fix it, and delivered measurable results — one sentence",
        "opening_line": "A great example is when I [specific opening]... — one sentence"
      }
    }
  ],
  "coverage_score": 72,
  "covered_count": 10,
  "gap_count": 3,
  "gaps": [
    {
      "question": "The interview question with no good answer — one sentence",
      "category": "Category — one sentence",
      "suggestion": "What kind of experience would answer this — think about times when... — one sentence"
    }
  ],
  "prep_summary": "You're well-prepared for X and Y questions. Focus on preparing for Z. — 1-2 sentences"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a senior interview coach at a top career consulting firm. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetInterviewMatrix' });

    if (!parsed.questions) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetInterviewMatrix] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: VOICE MATCH — Extract voice patterns from writing sample
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-voice-match', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      writingSample,
      transformations,
      resumeBullets,
      linkedinAbout,
      userLanguage,
    } = req.body;

    if (!writingSample?.trim()) {
      return res.status(400).json({ error: 'Paste a writing sample.' });
    }
    if (!transformations?.length) {
      return res.status(400).json({ error: 'Build your brag sheet first, then voice-match it.' });
    }

    const bulletContext = transformations
      .map((t, i) => `${i + 1}. "${t.improved}"`)
      .join('\n');

    const prompt = withLanguage(`You are rewriting professional accomplishment statements to match a person's natural writing voice.

THEIR WRITING SAMPLE:
"""
${writingSample.substring(0, 2000)}
"""

CURRENT ACCOMPLISHMENT STATEMENTS (AI-generated, may sound generic):
${bulletContext}

${resumeBullets?.length ? `CURRENT RESUME BULLETS:\n${resumeBullets.map(b => `• ${b}`).join('\n')}` : ''}

${linkedinAbout ? `CURRENT LINKEDIN ABOUT:\n${linkedinAbout}` : ''}

INSTRUCTIONS:
1. Analyze their writing voice: sentence length, formality, vocabulary, use of "I" vs "we", active vs passive, whether they use humor, technical depth, etc.
2. Rewrite ALL accomplishment statements in their voice — keeping the power and specificity but making it sound like THEM.
3. Rewrite resume bullets in their voice.
4. If LinkedIn about exists, rewrite it in their voice.
5. Show what you changed and why.

Return ONLY valid JSON:
{
  "voice_profile": {
    "sentence_length": "short|medium|long",
    "formality": "casual|professional|formal",
    "perspective": "I-focused|we-focused|mixed",
    "style_notes": "2-3 specific observations about their voice — one sentence",
    "avoids": ["words or patterns they never use"],
    "prefers": ["words or patterns they gravitate toward"]
  },
  "rewritten_transformations": [
    {
      "accomplishment_index": 0,
      "original_ai_version": "The current power version — one sentence",
      "voice_matched_version": "Same content, their voice — one sentence",
      "what_changed": "What was adjusted to match their voice — one sentence"
    }
  ],
  "rewritten_resume_bullets": ["Bullets in their voice"],
  "rewritten_linkedin": "LinkedIn about in their voice (or null if not provided) — one sentence",
  "voice_summary": "One sentence: 'Your natural writing style is X — I've adjusted the formality/verb choices/sentence structure to match.'"
}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a ghostwriter who specializes in matching someone\'s natural voice while keeping professional accomplishment statements powerful. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'BragSheetVoiceMatch' });

    if (!parsed.voice_profile) {
      return res.status(500).json({ error: 'Could not build your brag sheet. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetVoiceMatch] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
