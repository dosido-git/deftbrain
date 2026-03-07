const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Build Brag Sheet
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-builder', async (req, res) => {
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

    const systemPrompt = `You are the world's best professional accomplishment translator. You take humble, self-deprecating descriptions and transform them into powerful, specific, metrics-driven achievement statements.

YOUR PHILOSOPHY:
- People chronically understate their contributions. Your job is to find the truth — not exaggerate, but describe what they actually did with specificity and confidence.
- "I helped with a project" probably means "I was a key contributor to a cross-functional initiative."
- Every vague verb hides a specific, powerful one. "Worked on" -> "Spearheaded." "Helped" -> "Drove."
- Metrics are hiding everywhere. If they don't provide numbers, suggest where to find them.
- For EACH transformation, include a specific reason why they deserve to claim this.

CAREER CONTEXT:
- Role: ${roleTitle || 'Not specified'}
- Level: ${level || 'mid-level'}
- Industry: ${industry || 'general'}
${yearsExp ? `- Years of experience: ${yearsExp}` : ''}

LEVEL CALIBRATION:
${levelGuide}

${industryVerbs ? `INDUSTRY POWER VERBS:\n${industryVerbs}` : ''}

TONE:
${toneGuide}

RULES:
- Never invent facts. If they said "improved a process," reframe as "Streamlined [process] resulting in [estimated improvement]" but note estimates with [brackets].
- Each transformation must show SPECIFIC verb upgrades.
- STAR stories should feel natural and conversational.
- Resume bullets: power verb + what + metric/impact, 1-2 lines each.
- LinkedIn: warm, narrative, first-person. NOT corporate jargon. NOT generic AI voice.
- Performance review: professional, confident, specific. Not arrogant, not humble.
- Raise ammunition: translate everything into business value with dollar estimates where possible.`;

    let outputSpec = `{
  "transformations": [
    {
      "original": "Quoted exactly from input",
      "improved": "Power version. If metric is estimated, use [brackets].",
      "what_changed": "Brief: 'Added specificity + quantified impact + upgraded verb'",
      "verb_upgrades": [{"from": "helped", "to": "spearheaded"}],
      "why_you_deserve_this": "Specific imposter-syndrome killer for THIS accomplishment."
    }
  ],
  "metrics_to_find": [
    {
      "accomplishment_index": 0,
      "question": "Specific question to find a hidden metric for this accomplishment",
      "why": "Why this metric matters",
      "example": "What the bullet looks like with this metric filled in"
    }
  ]`;

    if (wantInterview) {
      outputSpec += `,
  "star_stories": [
    {
      "title": "Short title",
      "situation": "Context and stakes",
      "task": "What they needed to accomplish",
      "action": "What they DID — specific, showing initiative",
      "result": "Outcome with metrics"
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
    "total_estimated_value": "Aggregate estimated business value — a single number or range.",
    "script": "Exact words for a raise meeting. 60-90 words. Confident, factual, references specific contributions."
  }`;
    }

    outputSpec += `,
  "confidence": {
    "reframe": "Why describing your work accurately is not bragging. Specific to their accomplishments.",
    "imposter_killer": "One powerful sentence addressing the imposter syndrome they probably feel about these specific accomplishments."
  }
}`;

    const userPrompt = withLanguage(`Here are the accomplishments to transform:

${numberedAccomplishments}

Return ONLY valid JSON:
${outputSpec}

Generate one transformation per accomplishment. Generate 2-4 metrics questions (include accomplishment_index to track which accomplishment each question is about, 0-indexed). ${wantInterview ? 'Generate 1-2 STAR stories from the strongest accomplishments.' : ''} ${wantResume ? 'Generate resume bullets for ALL accomplishments.' : ''} ${wantRaise ? 'Generate value statements for ALL accomplishments.' : ''}`, userLanguage);

    console.log(`[BragSheetBuilder] Accomplishments: ${accomplishments.length}, Industry: ${industry}, Level: ${level}, Tone: ${tone || 'balanced'}, Purposes: ${purposes?.join(',')}`);

    const parsed = await callClaudeWithRetry(userPrompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetBuilder',
      max_tokens: 6000,
      system: withLanguage(systemPrompt, userLanguage),
    });

    console.log(`[BragSheetBuilder] Transformations: ${parsed.transformations?.length}, Metrics Qs: ${parsed.metrics_to_find?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetBuilder] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to build brag sheet' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: REFINE — Upgrade bullets with real metrics
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-refine', async (req, res) => {
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
      "improved": "New power version with real metrics plugged in",
      "what_changed": "What got better with the real numbers",
      "verb_upgrades": [{"from": "old verb", "to": "new verb"}],
      "why_you_deserve_this": "Updated imposter-syndrome killer with real metric acknowledgment",
      "metric_highlight": "The key number that makes this pop — e.g., '47% reduction in processing time'"
    }
  ]${wantResume ? `,
  "updated_resume_bullets": ["Updated bullets with real metrics"]` : ''}${wantRaise ? `,
  "updated_raise_statements": ["Updated value statements with real numbers"]` : ''},
  "remaining_questions": [
    {
      "accomplishment_index": 0,
      "question": "Follow-up question to dig even deeper — only if there's obviously more to uncover",
      "why": "Why this additional metric matters"
    }
  ]
}`, userLanguage);

    console.log(`[BragSheetRefine] Answers: ${metricsAnswers.length}, Transformations: ${originalTransformations.length}`);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetRefine',
      max_tokens: 4000,
      system: withLanguage('You are an expert career coach upgrading accomplishment statements with real metrics. Return ONLY valid JSON. No markdown, no preamble.', userLanguage),
    });

    console.log(`[BragSheetRefine] Upgraded: ${parsed.upgraded_transformations?.length}, Remaining Qs: ${parsed.remaining_questions?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetRefine] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine bullets' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: TWEAK — Reword a single transformation
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-tweak', async (req, res) => {
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
  "improved": "The rewritten version",
  "what_changed": "Brief explanation of what you changed",
  "verb_upgrades": [{"from": "old verb", "to": "new verb"}],
  "why_you_deserve_this": "Updated imposter-syndrome killer"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetTweak',
      max_tokens: 1000,
      system: withLanguage('You are a professional accomplishment translator. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetTweak] Instruction: "${instruction.substring(0, 40)}"`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetTweak] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to tweak.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: ADD SINGLE — Transform one new accomplishment
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-add-single', async (req, res) => {
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
    "improved": "Power version with [brackets] for estimated metrics",
    "what_changed": "Brief explanation",
    "verb_upgrades": [{"from": "old", "to": "new"}],
    "why_you_deserve_this": "Specific imposter-syndrome killer"
  },
  "metrics_to_find": [
    {
      "question": "Question to find a hidden metric",
      "why": "Why this metric matters",
      "example": "What the bullet looks like with this metric"
    }
  ]${wantResume ? `,
  "resume_bullet": "One resume bullet for this accomplishment"` : ''}${wantRaise ? `,
  "raise_statement": "This accomplishment as business value"` : ''}
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetAddSingle',
      max_tokens: 1500,
      system: withLanguage('You are an expert accomplishment translator. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetAddSingle] New: "${newAccomplishment.substring(0, 40)}"`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetAddSingle] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to add accomplishment.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: STAR SELECT — Generate STAR story from specific accomplishment
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-star', async (req, res) => {
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
  "title": "Short title for this story",
  "situation": "Context and stakes — set the scene in 2-3 sentences",
  "task": "What you needed to accomplish — 1-2 sentences",
  "action": "What you DID — specific, showing initiative, 2-4 sentences. This is the longest section.",
  "result": "Outcome with metrics — 1-2 sentences. End strong.",
  "good_for_questions": ["List of 2-3 common interview questions this story answers well"]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetStar',
      max_tokens: 1500,
      system: withLanguage('You are an expert interview coach. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetStar] Story: "${parsed.title}"`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetStar] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate STAR story.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: EXCAVATE — Role-specific prompting questions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-excavate', async (req, res) => {
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
      "name": "Impact & Results",
      "icon": "📈",
      "questions": [
        {
          "text": "Specific memory-jogging question",
          "followUp": "If they say yes, ask this to get the details",
          "exampleAccomplishment": "What this might turn into — e.g., 'Reduced customer churn by 15% by redesigning the onboarding flow'"
        }
      ]
    },
    {
      "name": "Leadership & Influence",
      "icon": "👥",
      "questions": [...]
    },
    {
      "name": "Problem Solving",
      "icon": "🔧",
      "questions": [...]
    },
    {
      "name": "Growth & Learning",
      "icon": "🌱",
      "questions": [...]
    },
    {
      "name": "Collaboration & Communication",
      "icon": "🤝",
      "questions": [...]
    },
    {
      "name": "Innovation & Initiative",
      "icon": "💡",
      "questions": [...]
    }
  ]
}

Generate 3-4 questions per category. Make them SPECIFIC to this person's role, industry, and level. A nurse gets different questions than a software engineer. A student gets different questions than a VP.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetExcavate',
      max_tokens: 4000,
      system: withLanguage('You are a career coach who specializes in helping people uncover hidden accomplishments. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetExcavate] Categories: ${parsed.categories?.length}, Role: ${roleTitle}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetExcavate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate questions.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: TAILOR — Match accomplishments to a job description
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-tailor', async (req, res) => {
  try {
    const {
      jobDescription,
      transformations,
      resumeBullets,
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
      "requirement": "What the JD asks for",
      "keywords": ["key", "terms", "from", "JD"],
      "priority": "must_have|nice_to_have|implied"
    }
  ],
  "relevance_ranking": [
    {
      "accomplishment_index": 0,
      "relevance_score": 85,
      "matching_requirements": ["requirement text"],
      "tailored_version": "Rewritten using JD language and keywords",
      "keywords_used": ["specific", "JD", "terms", "incorporated"]
    }
  ],
  "gaps": [
    {
      "requirement": "What the JD needs that you don't have",
      "suggestion": "How to address this — either excavate a new accomplishment or frame an existing one differently",
      "severity": "critical|moderate|minor"
    }
  ],
  "cover_letter_opening": "3-4 sentences connecting their strongest accomplishments to this specific role. Uses company name if mentioned in JD.",
  "tailored_resume_bullets": ["Bullets reordered by relevance, rewritten with JD keywords"],
  "match_score": 78,
  "match_summary": "One sentence: 'Strong match on X and Y; gaps in Z.'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetTailor',
      max_tokens: 5000,
      system: withLanguage('You are an expert resume strategist and ATS optimization specialist. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetTailor] Match: ${parsed.match_score}%, Gaps: ${parsed.gaps?.length}, Ranked: ${parsed.relevance_ranking?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetTailor] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to tailor.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: RADAR — Strength assessment across dimensions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-radar', async (req, res) => {
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
      "name": "Dimension Name",
      "score": 75,
      "icon": "emoji",
      "evidence": "Which accomplishment(s) support this score",
      "gap_suggestion": "If score < 50: what kind of accomplishment would strengthen this. If score >= 50: null"
    }
  ],
  "overall_score": 68,
  "overall_grade": "B+",
  "strongest": "Your strongest area is X because Y",
  "weakest": "The biggest gap is Z — try thinking about Q",
  "level_comparison": "For a [level] in [industry], this sheet is [above average / competitive / needs work] because...",
  "next_actions": [
    "Specific thing to do to improve the weakest dimension",
    "Second action"
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetRadar',
      max_tokens: 3000,
      system: withLanguage('You are a career assessment expert. Be honest — a 60 is not a bad score, it means there is room to improve. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetRadar] Overall: ${parsed.overall_score}, Grade: ${parsed.overall_grade}, Dims: ${parsed.dimensions?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetRadar] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: INTERVIEW MATRIX — Map accomplishments to questions
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-interview-matrix', async (req, res) => {
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
      "question": "Tell me about a time you...",
      "category": "Leadership|Problem Solving|Teamwork|Conflict|Failure|Innovation|Communication|Pressure|Growth",
      "likelihood": "very_likely|likely|possible",
      "best_match": {
        "type": "accomplishment|star_story|none",
        "index": 0,
        "angle": "Frame this as: you identified the problem early, took initiative to fix it, and delivered measurable results",
        "opening_line": "A great example is when I [specific opening]..."
      }
    }
  ],
  "coverage_score": 72,
  "covered_count": 10,
  "gap_count": 3,
  "gaps": [
    {
      "question": "The interview question with no good answer",
      "category": "Category",
      "suggestion": "What kind of experience would answer this — think about times when..."
    }
  ],
  "prep_summary": "You're well-prepared for X and Y questions. Focus on preparing for Z."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetInterviewMatrix',
      max_tokens: 5000,
      system: withLanguage('You are a senior interview coach at a top career consulting firm. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetInterviewMatrix] Questions: ${parsed.questions?.length}, Coverage: ${parsed.coverage_score}%, Gaps: ${parsed.gap_count}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetInterviewMatrix] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to build interview matrix.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: VOICE MATCH — Extract voice patterns from writing sample
// ═══════════════════════════════════════════════════
router.post('/brag-sheet-voice-match', async (req, res) => {
  try {
    const {
      writingSample,
      transformations,
      resumeBullets,
      linkedinAbout,
      tone,
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
    "style_notes": "2-3 specific observations about their voice",
    "avoids": ["words or patterns they never use"],
    "prefers": ["words or patterns they gravitate toward"]
  },
  "rewritten_transformations": [
    {
      "accomplishment_index": 0,
      "original_ai_version": "The current power version",
      "voice_matched_version": "Same content, their voice",
      "what_changed": "What was adjusted to match their voice"
    }
  ],
  "rewritten_resume_bullets": ["Bullets in their voice"],
  "rewritten_linkedin": "LinkedIn about in their voice (or null if not provided)",
  "voice_summary": "One sentence: 'Your natural writing style is X — I've adjusted the formality/verb choices/sentence structure to match.'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      model: 'claude-haiku-4-5-20251001',

      label: 'BragSheetVoiceMatch',
      max_tokens: 5000,
      system: withLanguage('You are a ghostwriter who specializes in matching someone\'s natural voice while keeping professional accomplishment statements powerful. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    console.log(`[BragSheetVoiceMatch] Profile: ${parsed.voice_profile?.formality}, Rewrites: ${parsed.rewritten_transformations?.length}`);
    res.json(parsed);

  } catch (error) {
    console.error('[BragSheetVoiceMatch] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to voice-match.' });
  }
});

module.exports = router;
