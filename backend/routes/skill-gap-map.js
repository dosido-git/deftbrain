const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Map skill gaps between Job A and Job B
// ═══════════════════════════════════════════════════
router.post('/skill-gap-map', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, currentSkills, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Describe both your current role and target role.' });
    }

    const skillsCtx = currentSkills?.trim()
      ? `\nSKILLS/EXPERIENCE THE USER ALREADY HAS: "${currentSkills.trim()}"`
      : '';

    const hoursCtx = hoursPerWeek
      ? `\nAVAILABLE HOURS PER WEEK FOR LEARNING: ${hoursPerWeek}`
      : '';

    const prompt = withLanguage(`Map the complete skill gap between these two roles. Be ruthlessly specific — not "learn leadership" but "learn to run a sprint retrospective and synthesize team feedback into actionable changes."

CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
${skillsCtx}
${hoursCtx}

INSTRUCTIONS:
1. Identify 8-12 specific skill gaps between these roles
2. For each, assess impact (how much it matters for getting hired) and effort (how hard/long to learn)
3. Categorize as: technical, soft skill, domain knowledge, tool/platform, credential, or network
4. Rank by impact-to-effort ratio (best ROI first)
5. Be specific to THIS transition, not generic career advice
6. Account for skills the user likely already has from their current role

Return ONLY valid JSON:
{
  "transition_summary": {
    "from": "${currentRole.trim()}",
    "to": "${targetRole.trim()}",
    "difficulty": "Lateral move|Moderate stretch|Significant pivot|Major career change",
    "estimated_months": 6,
    "core_challenge": "The single biggest obstacle in this specific transition — 1 sentence"
  },
  "skill_gaps": [
    {
      "id": "gap_1",
      "skill": "Specific skill name — 3-6 words",
      "description": "What this skill actually means in practice — not a definition, but what you'd DO with it — 1-2 sentences",
      "category": "technical|soft_skill|domain_knowledge|tool_platform|credential|network",
      "impact": 90,
      "effort": 40,
      "roi_score": 88,
      "priority": "critical|high|medium|nice_to_have",
      "current_level": "none|beginner|intermediate|advanced",
      "target_level": "beginner|intermediate|advanced|expert",
      "why_it_matters": "Why this specific skill is a gate for the target role — be blunt — one sentence",
      "time_estimate_hours": 40,
      "resource_type": "Search Coursera for 'X'|Read 'Book Title' by Author|Practice via Y|Build Z",
      "resource_detail": "Specific search term or resource description — never a URL, always a findable reference — one sentence",
      "free_or_paid": "free|cheap (<$50)|moderate ($50-200)|expensive (>$200)"
    }
  ],
  "transferable_skills": [
    {
      "current_name": "What the user calls this skill in their current role — 3-6 words",
      "target_name": "What the target role calls the same skill — 3-6 words",
      "reframe": "How to describe this on a resume for the target role — one sentence",
      "gap_to_close": "Any delta between how they use it now vs. how the target role uses it (or 'None — direct transfer') — one sentence"
    }
  ],
  "hidden_requirements": [
    {
      "skill": "A skill that rarely appears in job descriptions but actually determines who gets hired — 3-6 words",
      "why_hidden": "Why this doesn't show up in postings — one sentence",
      "how_to_spot": "How to tell if an employer actually cares about this — one sentence",
      "how_to_build": "How to develop this without having the target job yet — one sentence"
    }
  ],
  "quick_wins": ["2-3 things the user could do THIS WEEK to start closing gaps"],
  "overall_readiness": {
    "score": 45,
    "summary": "Honest 1-sentence assessment of how close they are right now — 1-2 sentences",
    "biggest_gap": "The single skill that would move the needle most — one sentence",
    "pleasant_surprise": "Something they probably already have that they don't realize counts — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a career transition strategist who gives brutally specific advice. No generic platitudes. Every recommendation is actionable and specific to this exact transition. You never fabricate URLs — you describe resources by name, author, or search term. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMap' });

    if (!parsed.gaps && !parsed.skill_gaps) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMap] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: TIMELINE — Week-by-week learning plan
// ═══════════════════════════════════════════════════
router.post('/skill-gap-timeline', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, skillGaps, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const hours = hoursPerWeek || 5;
    const gapCtx = skillGaps.slice(0, 8).map((g, i) =>
      `${i + 1}. ${g.skill} (${g.priority}, ~${g.time_estimate_hours}h, ${g.category})`
    ).join('\n');

    const prompt = withLanguage(`Create a realistic week-by-week learning plan for this career transition. The user has ${hours} hours per week to dedicate to learning.

TRANSITION: ${transitionSummary?.from || 'Current role'} → ${transitionSummary?.to || 'Target role'}
ESTIMATED TOTAL MONTHS: ${transitionSummary?.estimated_months || 6}

SKILL GAPS (prioritized):
${gapCtx}

INSTRUCTIONS:
- Break into phases (Foundation, Building, Advanced, Application)
- Each phase has specific weeks and milestones
- Every week has a concrete deliverable or checkpoint
- Account for the ${hours} hours/week constraint
- Front-load high-ROI skills
- Include rest/consolidation weeks — learning isn't linear
- Be realistic about what's achievable

Return ONLY valid JSON:
{
  "total_weeks": 24,
  "hours_per_week": ${hours},
  "phases": [
    {
      "name": "Phase name — e.g., 'Foundation' — 3-6 words",
      "weeks": "1-6",
      "focus": "What this phase accomplishes — 1 sentence",
      "milestones": [
        {
          "week": 2,
          "milestone": "Specific, verifiable checkpoint — e.g., 'Complete Python basics course, build first data cleaning script' — one sentence",
          "deliverable": "What you should have to show for it — a project, a certificate, a document, a conversation — one sentence"
        }
      ]
    }
  ],
  "plateau_warning": "When and why the user is likely to feel stuck, and what to do about it — one sentence",
  "ready_to_apply_by": "Week X — at this point, start applying even if you're not 'done' because... — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a learning plan designer who builds realistic, week-by-week roadmaps. You understand that people have jobs and lives, and plan accordingly. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapTimeline' });

    if (!parsed.total_weeks) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapTimeline] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: PROOF — Portfolio proof planner for each gap
// ═══════════════════════════════════════════════════
router.post('/skill-gap-proof', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const gapCtx = skillGaps.filter(g => g.priority === 'critical' || g.priority === 'high').slice(0, 6).map((g, i) =>
      `${i + 1}. ${g.skill} (${g.category}, target: ${g.target_level})`
    ).join('\n');

    const prompt = withLanguage(`For each critical/high-priority skill gap, design a specific way to PROVE competence without having the target job. Hiring managers don't care about courses — they care about evidence.

TRANSITION: ${transitionSummary?.from || 'Current'} → ${transitionSummary?.to || 'Target'}

HIGH-PRIORITY GAPS:
${gapCtx}

For each skill, provide 2 proof strategies: one project-based and one contribution-based.

Return ONLY valid JSON:
{
  "proof_plans": [
    {
      "skill": "Skill name — 3-6 words",
      "project_proof": {
        "title": "Specific project name — e.g., 'Build a customer churn prediction dashboard' — 3-6 words",
        "description": "What you'd build, 2-3 sentences",
        "time_estimate": "10-15 hours — one sentence",
        "resume_bullet": "How to describe this project on your resume for the target role — one sentence"
      },
      "contribution_proof": {
        "title": "A contribution you could make without being hired — e.g., 'Contribute to open-source X' — 3-6 words",
        "description": "What you'd do, 2-3 sentences",
        "time_estimate": "5-10 hours — one sentence"
      }
    }
  ],
  "portfolio_strategy": {
    "minimum_viable_portfolio": "The 2-3 pieces that would be sufficient to demonstrate readiness — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a career portfolio strategist who helps people prove competence without credentials. You think like a hiring manager. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapProof' });

    if (!parsed.proof_plans) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapProof] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: NETWORK — Who you need to know
// ═══════════════════════════════════════════════════
router.post('/skill-gap-network', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, targetRole, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Map the network this person needs to build for their career transition. Not generic "network more" advice — specific types of people, where to find them, and what to say.

TRANSITION: ${transitionSummary?.from || 'Current role'} → ${targetRole.trim()}

INSTRUCTIONS:
- Identify 4-6 specific types of people they need in their network
- For each, explain why this person matters, where to find them, and a specific opener
- Include at least one "unexpected ally" — someone outside the obvious network
- Be realistic about how networking actually works for career transitioners

Return ONLY valid JSON:
{
  "network_gaps": [
    {
      "type": "Specific type — e.g., 'A senior PM who transitioned from engineering' — one sentence",
      "why_critical": "What this person can do for you that no one else can — one sentence",
      "where_to_find": "Specific place — 'LinkedIn search: PM at [target companies] + previously engineer' — one sentence",
      "opener": "Exact message template to reach out — specific to the transition, not generic — one sentence",
      "what_to_ask": "The specific question that will get you the most useful information — one sentence"
    }
  ],
  "unexpected_ally": {
    "type": "Someone outside the obvious network who surprisingly helps with this transition — one sentence",
    "how_they_help": "The specific advantage they provide — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a strategic networking advisor for career transitioners. You give specific, actionable advice about who to connect with and what to say. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapNetwork' });

    if (!parsed.network_gaps) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapNetwork] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: DEEP DIVE — Expand one specific skill gap
// ═══════════════════════════════════════════════════
router.post('/skill-gap-deep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { gap, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!gap?.skill) {
      return res.status(400).json({ error: 'Select a skill gap to explore.' });
    }

    const prompt = withLanguage(`Create a detailed learning plan for this single skill gap. Go deep — the user has decided to focus on this skill and needs a complete roadmap.

SKILL: ${gap.skill}
CURRENT LEVEL: ${gap.current_level || 'unknown'}
TARGET LEVEL: ${gap.target_level || 'advanced'}
CONTEXT: Transitioning from ${transitionSummary?.from || 'current role'} to ${transitionSummary?.to || 'target role'}
ESTIMATED HOURS: ${gap.time_estimate_hours || 40}

Return ONLY valid JSON:
{
  "skill": "${gap.skill}",
  "learning_path": [
    {
      "stage": "Stage name — e.g., 'Understand the fundamentals' — 2-4 words",
      "hours": 8,
      "activities": [
        {
          "activity": "Specific thing to do — e.g., 'Complete chapters 1-4 of...' — one sentence",
          "resource": "Specific resource by name/search term (no URLs) — one sentence",
          "free_or_paid": "free|cheap|moderate"
        }
      ],
      "checkpoint": "How to verify you've completed this stage — specific test or task — one sentence"
    }
  ],
  "good_enough_threshold": "The specific level where you can stop studying and start applying — described concretely — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a skill development coach who creates detailed, stage-by-stage learning plans. Be specific about resources (by name, not URL) and honest about what "good enough" looks like. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDeep' });

    if (!parsed.skill) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDeep] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: REFRAME — Translate current experience into target language
// ═══════════════════════════════════════════════════
router.post('/skill-gap-reframe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, experience, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim() || !experience?.trim()) {
      return res.status(400).json({ error: 'Current role, target role, and experience description are required.' });
    }

    const prompt = withLanguage(`The user is describing their current experience. Translate EVERYTHING they do into the language and framing of their target role. Show them how much of what they already do is transferable — they just need to rename it.

CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
THEIR EXPERIENCE DESCRIPTION: "${experience.trim()}"

INSTRUCTIONS:
- Take every activity, responsibility, and accomplishment they described
- Translate each one into the vocabulary and framing the target role uses
- Identify which are direct transfers, which need slight reframing, and which reveal gaps
- Write resume bullets in the target role's language

Return ONLY valid JSON:
{
  "translations": [
    {
      "original": "What they said they do / did — one sentence",
      "translated": "How the target role describes this same activity — one sentence",
      "transfer_type": "direct|reframe|partial|gap",
      "resume_bullet": "A polished resume bullet using target-role language — one sentence",
      "strength": "How strong this experience is for the target role: strong|moderate|weak"
    }
  ],
  "coverage_score": 65,
  "coverage_summary": "X out of Y core competencies for the target role are covered by existing experience — 1-2 sentences",
  "strongest_translations": ["The 2-3 translations that would most impress a hiring manager for the target role"],
  "vocabulary_cheat_sheet": [
    {
      "you_say": "Term from current role — one sentence",
      "they_say": "Equivalent term in target role — one sentence",
      "context": "When and how to use the target term — 1-2 sentences"
    }
  ],
  "linkedin_headline": "A LinkedIn headline that bridges current experience with target aspirations — one sentence",
  "elevator_pitch": "A 30-second pitch explaining this transition that sounds intentional, not desperate — max 60 words — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 7500,
      system: withLanguage('You are a resume strategist and career translator who helps people reframe existing experience for new roles. You think like a hiring manager and know what language signals competence in different fields. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapReframe' });

    if (!parsed.translations) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapReframe] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: ECONOMICS — Transition financial analysis
// ═══════════════════════════════════════════════════
router.post('/skill-gap-economics', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles are required.' });
    }

    const prompt = withLanguage(`Analyze the financial reality of this career transition. Be honest — sometimes the math doesn't work. People deserve to know before they invest months.

CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
ESTIMATED TRANSITION TIME: ${transitionSummary?.estimated_months || 6} months

INSTRUCTIONS:
- Use realistic salary ranges (not maximums)
- Account for the transition period (reduced income, learning costs)
- Calculate the real ROI over 1, 3, and 5 years
- Be honest about hidden costs
- Consider geographic variation

Return ONLY valid JSON:
{
  "current_salary_range": {
    "low": 45000,
    "mid": 55000,
    "high": 70000,
    "note": "Any relevant context about this range — one sentence"
  },
  "target_salary_range": {
    "low": 65000,
    "mid": 80000,
    "high": 100000,
    "note": "Any relevant context — e.g., 'Entry-level PM pay varies wildly by company size' — one sentence"
  },
  "salary_delta": {
    "expected_increase_percent": 45,
    "annual_dollar_increase": 25000,
    "realistic_starting_salary": "What you'll actually get in your FIRST target-role job — usually below the midpoint — one sentence"
  },
  "transition_costs": [
    {
      "item": "Specific cost — e.g., 'Google PM Certificate' — one sentence",
      "cost": 300,
      "required_or_optional": "required|recommended|optional",
      "note": "Why this cost exists — one sentence"
    }
  ],
  "total_transition_cost": 1500,
  "roi_analysis": {
    "payback_period_months": 8,
    "year_3_cumulative": "Total additional earnings over 3 years — one sentence",
    "year_5_cumulative": "Total additional earnings over 5 years — one sentence",
    "verdict": "Strong ROI|Good ROI|Marginal — consider carefully|Negative — financial case is weak"
  },
  "negotiation_leverage": "What gives you leverage in salary negotiation for the target role — specific to this transition — one sentence",
  "financial_warning": "Any honest caution about the financial side of this specific transition (or null if the math is clearly good) — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a career economics analyst who gives honest financial assessments of career transitions. Use realistic salary data. Never inflate numbers to make a transition look better. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapEconomics' });

    if (!parsed.current_salary_range) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapEconomics] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: RESUME AUDIT — Grade real resume against target
// ═══════════════════════════════════════════════════
router.post('/skill-gap-resume', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, resumeText, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!resumeText?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Paste your resume and specify the target role.' });
    }

    const gapCtx = skillGaps?.slice(0, 6).map(g => `${g.skill} (${g.priority})`).join(', ') || '';

    const prompt = withLanguage(`Audit this resume for the target role. Be direct — tell them what's working, what's hurting them, and exactly how to fix it.

TARGET ROLE: "${targetRole.trim()}"
CURRENT ROLE: "${currentRole?.trim() || 'Not specified'}"
KNOWN SKILL GAPS: ${gapCtx || 'Not assessed'}

RESUME:
"""
${resumeText.trim().substring(0, 3000)}
"""

Return ONLY valid JSON:
{
  "overall_score": 55,
  "verdict": "One-sentence honest assessment — e.g., 'Solid foundation but reads like a marketing resume, not a PM resume' — one sentence",
  "strengths": [
    {
      "element": "What's working — one sentence",
      "why": "Why this is effective for the target role — one sentence"
    }
  ],
  "problems": [
    {
      "element": "What's hurting them — one sentence",
      "severity": "critical|moderate|minor",
      "why": "Why this is a problem for the target role — one sentence",
      "fix": "Exactly how to fix it — specific rewrite or removal — one sentence"
    }
  ],
  "missing_elements": [
    {
      "element": "What should be on this resume but isn't — one sentence",
      "why": "Why the target role expects this — one sentence",
      "how_to_add": "How to add this even if they don't have direct experience — one sentence"
    }
  ],
  "rewritten_bullets": [
    {
      "original": "Their current bullet — one sentence",
      "rewritten": "The same experience reframed for the target role — one sentence",
      "what_changed": "What we changed and why — one sentence"
    }
  ],
  "format_notes": "Any structural/formatting advice — length, order, sections — one sentence",
  "ats_concerns": "Any issues that might cause problems with applicant tracking systems — one sentence",
  "summary_suggestion": "A rewritten professional summary/objective for the target role — 2-3 sentences"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a resume auditor who has reviewed thousands of career-transition resumes. You know exactly what hiring managers scan for and what triggers an instant rejection. Be direct and specific. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapResume' });

    if (!parsed.overall_score) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapResume] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: COMPANY FIT — What types of companies to target
// ═══════════════════════════════════════════════════
router.post('/skill-gap-companies', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Advise this career transitioner on what types of companies to target — and which to avoid. Different companies have wildly different bars for the same title, and some actively value non-traditional backgrounds while others screen them out.

TRANSITION: ${currentRole?.trim() || 'Current role'} → ${targetRole.trim()}
DIFFICULTY: ${transitionSummary?.difficulty || 'Unknown'}

INSTRUCTIONS:
- Identify 4-5 company archetypes (not specific company names — types)
- For each, explain why they're good or bad for this specific transition
- Be honest about where the user's background is an asset vs. a liability
- Include at least one contrarian suggestion

Return ONLY valid JSON:
{
  "ideal_company_types": [
    {
      "type": "Company archetype — e.g., 'Series B-C startups in [industry]' — one sentence",
      "why_good_for_you": "Why this type of company values your specific background — one sentence",
      "what_to_search": "Specific job board filters, search terms, or signals to look for — one sentence",
      "interview_advantage": "How your transition story plays as a STRENGTH here — one sentence",
      "typical_titles": ["Job titles to search for at this type of company"],
      "fit_score": 85
    }
  ],
  "avoid_types": [
    {
      "type": "Company archetype to avoid for now — one sentence",
      "why_avoid": "Why your transition background is a liability here — one sentence",
      "exception": "The one scenario where this could work anyway — one sentence"
    }
  ],
  "stealth_targets": {
    "type": "A company type most transitioners don't think to target — one sentence",
    "why_surprising": "Why this is actually a great fit despite not being obvious — one sentence"
  },
  "application_strategy": {
    "apply_ratio": "How many applications to expect before landing interviews — honest number — one sentence",
    "best_channel": "The most effective way to get interviews for this specific transition (spoiler: it's rarely job boards) — one sentence",
    "timing": "When in the skill-building process to start applying — and why earlier than you think — one sentence"
  },
  "red_flags": ["2-3 things in a job posting that signal this company won't be receptive to career transitioners"]
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: withLanguage('You are a job search strategist who knows which companies hire career transitioners and which screen them out. Be specific about company types and honest about the odds. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCompanies' });

    if (!parsed.ideal_company_types) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCompanies] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: INTERVIEW PREP — Full mock interview for target role
// ═══════════════════════════════════════════════════
router.post('/skill-gap-interview', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, transferableSkills, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles required.' });
    }

    const gapCtx = skillGaps?.slice(0, 6).map(g => `${g.skill} (${g.priority}, current: ${g.current_level})`).join(', ') || '';
    const transferCtx = transferableSkills?.slice(0, 4).map(t => `${t.current_name} → ${t.target_name}`).join(', ') || '';

    const prompt = withLanguage(`Build a complete interview prep guide for this career transitioner. They'll face questions that specifically probe the transition — prepare them.

TRANSITION: "${currentRole.trim()}" → "${targetRole.trim()}"
SKILL GAPS: ${gapCtx || 'Not assessed'}
TRANSFERABLE SKILLS: ${transferCtx || 'Not assessed'}

INSTRUCTIONS:
- Include the transition-specific questions they WILL be asked
- Provide answer frameworks, not scripts — they need to sound natural
- Include the "landmine" questions designed to expose transitioners
- Help them flip weaknesses into stories

Return ONLY valid JSON:
{
  "transition_questions": [
    {
      "question": "The exact question they'll be asked — one sentence",
      "why_they_ask": "What the interviewer is really trying to determine — one sentence",
      "landmine": "The bad answer most transitioners give — one sentence",
      "framework": "How to structure a strong answer — specific to their background — one sentence",
      "example_opener": "A strong opening sentence they can adapt — one sentence",
      "key_phrase": "A specific phrase or framing that signals competence — one sentence"
    }
  ],
  "technical_questions": [
    {
      "question": "Technical/domain question for the target role — one sentence",
      "difficulty": "basic|intermediate|advanced",
      "honest_answer_if_learning": "How to answer honestly when you're still building this skill — without sounding incompetent — one sentence",
      "bridge_from_current": "How to connect this to something from their current role — one sentence"
    }
  ],
  "behavioral_questions": [
    {
      "question": "Behavioral question — one sentence",
      "best_story_from": "Which part of their current experience provides the best STAR story — one sentence",
      "opening_line": "Strong opening sentence — one sentence"
    }
  ],
  "questions_to_ask": [
    {
      "question": "A smart question to ask the interviewer — one sentence",
      "why_smart": "What this signals about you — one sentence"
    }
  ],
  "transition_story": {
    "the_narrative": "A 30-second story arc explaining WHY they're making this transition — must sound intentional, not desperate — 1-2 sentences",
    "the_bridge": "The specific sentence that connects their past to their future — the pivot point of their story — one sentence",
    "what_to_never_say": "The thing most transitioners say that immediately undermines their credibility — one sentence"
  },
  "confidence_note": "An honest assessment of how they'll come across in interviews right now, and what would most improve their presence — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are an interview coach who specializes in career transitioners. You know the specific questions they face and the landmines they step on. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapInterview' });

    if (!parsed.transition_questions) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapInterview] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: CALIBRATE — Adjust plan based on real constraints
// ═══════════════════════════════════════════════════
router.post('/skill-gap-calibrate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, constraints, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!constraints) {
      return res.status(400).json({ error: 'Constraints are required.' });
    }

    const gapCtx = skillGaps?.slice(0, 8).map(g =>
      `${g.skill} (${g.priority}, ~${g.time_estimate_hours}h)`
    ).join(', ') || '';

    const prompt = withLanguage(`Recalibrate this career transition plan based on real-life constraints. The original plan assumed ideal conditions — now adjust for reality.

TRANSITION: ${currentRole?.trim() || 'Current'} → ${targetRole?.trim() || 'Target'}
ORIGINAL GAPS: ${gapCtx || 'Not specified'}

CONSTRAINTS:
- Employment status: ${constraints.employmentStatus || 'Not specified'}
- Financial runway: ${constraints.financialRunway || 'Not specified'}
- Family obligations: ${constraints.familyObligations || 'None mentioned'}
- Location flexibility: ${constraints.locationFlexibility || 'Not specified'}
- Timeline pressure: ${constraints.timelinePressure || 'Flexible'}
- Biggest worry: ${constraints.biggestWorry || 'Not specified'}

Return ONLY valid JSON:
{
  "adjusted_timeline_months": 9,
  "adjustment_explanation": "Why the timeline changed — 1 sentence",
  "constraint_specific_advice": [
    {
      "constraint": "Which constraint this addresses — one sentence",
      "advice": "Specific, actionable advice for their situation — one sentence",
      "resource": "A specific resource or strategy for this constraint — one sentence"
    }
  ],
  "risk_assessment": {
    "biggest_risk": "The single biggest risk to this transition given their constraints — one sentence",
    "mitigation": "How to reduce this risk — one sentence"
  },
  "momentum_strategy": "How to maintain momentum given their specific constraints — e.g., 'With only 3h/week and a family, batch learning into Saturday mornings and...' — one sentence",
  "honest_take": "A direct, kind, honest assessment: is this transition realistic given their constraints? What would make it more realistic? — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a career transition realist who adjusts plans for real life. You are kind but honest — if constraints make a transition significantly harder, you say so while offering solutions. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCalibrate' });

    if (!parsed.adjusted_timeline_months) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCalibrate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: EXPLORE — Suggest target roles from current skills
// ═══════════════════════════════════════════════════
router.post('/skill-gap-explore', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, currentSkills, interests, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim()) {
      return res.status(400).json({ error: 'Describe your current role.' });
    }

    const prompt = withLanguage(`This person knows they want a change but hasn't picked a target yet. Based on their current role and skills, suggest 5-6 realistic career paths — ranging from easy lateral moves to ambitious pivots.

CURRENT ROLE: "${currentRole.trim()}"
${currentSkills?.trim() ? `SKILLS/EXPERIENCE: "${currentSkills.trim()}"` : ''}
${interests?.trim() ? `INTERESTS: "${interests.trim()}"` : ''}

INSTRUCTIONS:
- Range from easy (lateral) to hard (major pivot)
- For each, show the salary change, difficulty, and key gap
- Include at least one surprising option they wouldn't think of
- Be honest about which paths are realistic vs. aspirational

Return ONLY valid JSON:
{
  "current_profile_summary": "What their current role signals about their skills — 1 sentence",
  "paths": [
    {
      "target_role": "Specific role title — 3-6 words",
      "difficulty": "Lateral move|Moderate stretch|Significant pivot|Major career change",
      "salary_change": "+15%|+30%|−10%|Similar",
      "time_to_transition": "3-6 months|6-12 months|1-2 years",
      "key_gap": "The single biggest skill they'd need to develop — one sentence",
      "key_advantage": "What from their current role gives them a head start — one sentence",
      "surprise_factor": "Why this path might not be obvious but is realistic — one sentence",
      "lifestyle_change": "How their day-to-day would differ — one sentence",
      "demand": "High|Medium|Low — current job market for this role"
    }
  ],
  "pattern_insight": "What these options collectively reveal about their transferable strengths — one sentence",
  "avoid_paths": [
    {
      "role": "A role that seems like a natural transition but actually isn't — 3-6 words",
      "why_trap": "Why this path is harder than it looks — one sentence"
    }
  ],
  "next_step": "What to do right now to start exploring — one specific action — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: withLanguage('You are a career exploration advisor who helps people discover realistic career paths based on their current skills. Be creative but honest about difficulty. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapExplore' });

    if (!parsed.current_profile_summary) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapExplore] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: PROGRESS CHECK — Reassess readiness with updates
// ═══════════════════════════════════════════════════
router.post('/skill-gap-progress', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, originalGaps, completedSkills, newExperience, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!originalGaps?.length || !completedSkills?.length) {
      return res.status(400).json({ error: 'Original gaps and completed skills are required.' });
    }

    const gapCtx = originalGaps.map(g =>
      `${g.skill} (was: ${g.priority}, ${g.current_level} → ${g.target_level})`
    ).join('\n');

    const completedCtx = completedSkills.map(s => `- ${s}`).join('\n');

    const prompt = withLanguage(`Reassess this person's readiness for their career transition. They've been working on closing gaps — now give them an updated score and revised plan.

TRANSITION: ${currentRole?.trim() || 'Current'} → ${targetRole?.trim() || 'Target'}

ORIGINAL GAPS:
${gapCtx}

SKILLS THEY'VE COMPLETED/IMPROVED:
${completedCtx}

${newExperience?.trim() ? `NEW EXPERIENCE GAINED:\n"${newExperience.trim()}"` : ''}

Return ONLY valid JSON:
{
  "updated_readiness": {
    "score": 68,
    "improvement": "+23 points — one sentence",
    "summary": "Honest reassessment of where they stand now — 1-2 sentences"
  },
  "new_gaps_revealed": ["Any new gaps that have become apparent now that they know more — learning often reveals new unknowns"],
  "ready_to_apply": true,
  "apply_advice": "If ready: what to do this week. If not: what's left and how long. — one sentence",
  "celebration": "One specific thing they should feel good about — people in transition need encouragement — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a career transition coach doing a progress check. Be encouraging but honest — if they are not ready, say so kindly. If they are, celebrate them. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapProgress' });

    if (!parsed.updated_readiness) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapProgress] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: DAY IN THE LIFE — Simulate a typical day in target role
// ═══════════════════════════════════════════════════
router.post('/skill-gap-daylife', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Simulate a realistic Tuesday in the target role. Not the highlight reel — the actual day, including the boring parts, the frustrating parts, and the moments that make the job worth it. Help this person figure out if they'd actually ENJOY this work.

TARGET ROLE: "${targetRole.trim()}"
TRANSITION FROM: ${transitionSummary?.from || 'Not specified'}

INSTRUCTIONS:
- Walk through a full day hour by hour (8am-6pm)
- Include specific tasks, meetings, tools, and interactions
- Include at least one frustrating moment and one rewarding moment
- Be honest about the parts nobody talks about in job descriptions
- Include decision moments where the user can imagine how they'd react

Return ONLY valid JSON:
{
  "role_reality": {
    "one_sentence": "What this job actually IS in one honest sentence — one sentence",
    "percent_meetings": 35,
    "percent_deep_work": 25,
    "percent_communication": 25,
    "percent_admin": 15
  },
  "schedule": [
    {
      "time": "8:30 AM — one sentence",
      "activity": "What you're doing — specific — one sentence",
      "detail": "The granular reality — tools, people, decisions — one sentence",
      "feeling": "How this typically feels — energizing|draining|neutral|stressful|satisfying",
      "decision_moment": "A choice you'd face here (or null if routine) — one sentence"
    }
  ],
  "the_frustration": {
    "scenario": "A specific frustrating thing that happens regularly in this role — one sentence",
    "how_good_ones_handle_it": "What experienced people in this role do about it — one sentence",
    "would_you_tolerate": "An honest question for the user to ask themselves — one sentence"
  },
  "the_reward": {
    "scenario": "The moment that makes people in this role say 'this is why I do this' — one sentence",
    "frequency": "How often this actually happens — daily|weekly|monthly|quarterly",
    "your_version": "How this reward would specifically manifest given the user's transition background — one sentence"
  },
  "reality_check": {
    "what_surprises_people": "The thing most people don't expect about this role — one sentence",
    "dealbreaker_test": "One question to ask yourself — if the answer is 'no', this role might not be for you — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a career realist who shows people what jobs actually feel like day-to-day. Not the recruiting pitch — the truth. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDayLife' });

    if (!parsed.role_reality) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDayLife] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: OUTREACH DRAFTER — Personalized networking message
// ═══════════════════════════════════════════════════
router.post('/skill-gap-outreach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, personDescription, goal, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!personDescription?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Describe the person and your target role.' });
    }

    const prompt = withLanguage(`Write a hyper-personalized cold outreach message to this specific person. NOT a template — a message that references their background and makes a specific, easy-to-say-yes-to ask.

SENDER: Transitioning from "${currentRole?.trim() || 'current role'}" to "${targetRole.trim()}"
RECIPIENT: "${personDescription.trim()}"
GOAL: ${goal?.trim() || 'Informational conversation about the transition'}

INSTRUCTIONS:
- Reference something specific about their background
- Make the ask small and specific (not "can I pick your brain")
- Keep it under 100 words
- Sound like a real person, not a networking bot
- Include a reason they'd want to respond

Return ONLY valid JSON:
{
  "message": "The complete outreach message — ready to send — 2-4 sentences",
  "subject_line": "Email subject line if applicable — one sentence",
  "platform": "LinkedIn|Email|Twitter — where to send this",
  "why_theyd_respond": "What makes this message worth responding to from their perspective — one sentence",
  "followup": "What to send if they don't respond in 5 days — 1 sentence",
  "if_they_say_yes": "What to prepare before the conversation — 2-3 specific things — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage('You write networking messages that actually get responses. You sound human, specific, and respectful of the recipient\'s time. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapOutreach' });

    if (!parsed.message) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapOutreach] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: JOB POSTING DECODER — Analyze specific posting vs gaps
// ═══════════════════════════════════════════════════
router.post('/skill-gap-decode', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { jobPosting, currentRole, targetRole, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!jobPosting?.trim()) {
      return res.status(400).json({ error: 'Paste a job posting.' });
    }

    const gapCtx = skillGaps?.slice(0, 8).map(g =>
      `${g.skill} (${g.priority}, current: ${g.current_level})`
    ).join(', ') || '';

    const prompt = withLanguage(`Decode this job posting for a career transitioner. Tell them what's real, what's aspirational, what's a red flag, and how competitive they are for THIS specific job.

JOB POSTING:
"""
${jobPosting.trim().substring(0, 3000)}
"""

APPLICANT: Transitioning from "${currentRole?.trim() || 'current role'}" to "${targetRole?.trim() || 'target role'}"
KNOWN GAPS: ${gapCtx || 'Not assessed'}

Return ONLY valid JSON:
{
  "requirements_decoded": [
    {
      "requirement": "What they listed — one sentence",
      "reality": "must_have|strong_preference|nice_to_have|aspirational_wishlist",
      "your_status": "have_it|close|gap|major_gap",
      "translation": "What this requirement actually means in practice — one sentence"
    }
  ],
  "red_flags": [
    {
      "phrase": "Exact phrase from the posting — one sentence",
      "translation": "What this actually means — e.g., 'fast-paced' = understaffed — one sentence",
      "severity": "yellow|orange|red"
    }
  ],
  "green_flags": [
    {
      "phrase": "Positive signal from the posting — one sentence",
      "why_good": "Why this is good for a career transitioner specifically — one sentence"
    }
  ],
  "competitiveness": {
    "score": 62,
    "summary": "How competitive you are for this specific posting — honest — 1-2 sentences",
    "biggest_gap": "The single thing most likely to get you screened out — one sentence",
    "should_you_apply": "Yes, strong candidate|Yes, worth a shot|Maybe, if you...|Probably not, because..."
  },
  "application_strategy": {
    "cover_letter_angle": "The specific angle to take in your cover letter for THIS posting — one sentence",
    "resume_emphasis": "Which 2-3 experiences to highlight for THIS job specifically — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a job posting analyst who decodes what companies actually want vs. what they write. You know the difference between must-haves and wishlist items. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDecode' });

    if (!parsed.requirements_decoded) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDecode] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: SKILL ADJACENCY — Learning sequence optimizer
// ═══════════════════════════════════════════════════
router.post('/skill-gap-adjacency', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const gapCtx = skillGaps.map(g => `${g.id}: ${g.skill} (${g.category})`).join(', ');

    const prompt = withLanguage(`Map the dependency relationships between these skills. Which skills unlock or accelerate other skills? What's the optimal learning SEQUENCE (not just priority)?

SKILLS TO SEQUENCE:
${gapCtx}

Return ONLY valid JSON:
{
  "optimal_sequence": [
    {
      "order": 1,
      "skill": "Skill name — 3-6 words",
      "why_first": "Why this should come before the others — one sentence",
      "unlocks_count": 3
    }
  ],
  "parallel_tracks": [
    {
      "track_name": "Track label — e.g., 'Technical foundation' — 3-6 words",
      "skills": ["Skills that can be learned simultaneously"],
      "reason": "Why these don't depend on each other — one sentence"
    }
  ],
  "bottleneck_skill": {
    "skill": "The single skill that blocks the most other skills — 3-6 words",
    "blocks": ["What it blocks"],
    "recommendation": "Front-load this — everything else gets easier after — one sentence"
  },
  "sequence_insight": "The non-obvious insight about learning order for this specific transition — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('You are a learning sequence optimizer who maps dependencies between skills. You find the order that minimizes total learning time. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapAdjacency' });

    if (!parsed.optimal_sequence) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapAdjacency] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 18: MOCK CONVERSATION — AI plays interviewer
// ═══════════════════════════════════════════════════
router.post('/skill-gap-mock', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, userAnswer, question, interviewContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    // If no question yet, generate the first one
    if (!question) {
      const prompt = withLanguage(`You're interviewing a career transitioner for the role of "${targetRole.trim()}". They're coming from "${currentRole?.trim() || 'a different field'}".

Start the interview with the single most important question for this specific transition. Make it realistic — this is the question they'll face in every real interview.

Return ONLY valid JSON:
{
  "question": "The interview question — one sentence",
  "context": "What the interviewer is thinking — what they want to hear — 1-2 sentences",
  "difficulty": "opener|standard|probing|curveball",
  "category": "transition|technical|behavioral|situational"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage('You are a realistic interviewer for the target role. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMockStart' });
      return res.json({ type: 'question', ...parsed });
    }

    // If user answered, evaluate and follow up
    const prompt = withLanguage(`You're interviewing someone transitioning from "${currentRole?.trim() || 'another field'}" to "${targetRole.trim()}".

QUESTION ASKED: "${question}"
THEIR ANSWER: "${userAnswer?.trim() || '(no answer provided)'}"
${interviewContext ? `PREVIOUS CONTEXT: ${interviewContext}` : ''}

Evaluate their answer and generate a follow-up question.

Return ONLY valid JSON:
{
  "evaluation": {
    "score": 72,
    "verdict": "Strong|Good|Needs work|Concerning",
    "what_worked": "The strongest part of their answer — be specific — one sentence",
    "coach_tip": "A concrete tip — e.g., 'Lead with the metric next time: 30% improvement, THEN the story' — one sentence",
    "rewritten_opener": "How the first sentence of their answer could be stronger — one sentence"
  },
  "next_question": {
    "question": "The follow-up question — either probing deeper on their answer or moving to a new topic — one sentence",
    "context": "What you're testing with this question — 1-2 sentences",
    "difficulty": "opener|standard|probing|curveball",
    "category": "transition|technical|behavioral|situational"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage('You are a supportive but honest interview coach. You evaluate answers realistically and give specific, actionable feedback. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMockEval' });

    res.json({ type: 'evaluation', ...parsed });

  } catch (error) {
    console.error('[SkillGapMock] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 19: MARKET PULSE — Is this transition getting easier or harder?
// ═══════════════════════════════════════════════════
router.post('/skill-gap-market', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Assess the current market dynamics for this career transition. Is it getting easier or harder? Should they accelerate or wait?

TRANSITION: "${currentRole?.trim() || 'Current'}" → "${targetRole.trim()}"

Return ONLY valid JSON:
{
  "market_outlook": {
    "trend": "Growing|Stable|Shrinking|Volatile",
    "direction": "Getting easier|Getting harder|Stable|Mixed signals",
    "confidence": "High|Medium|Low — how confident in this assessment"
  },
  "demand_factors": [
    {
      "factor": "Specific market factor affecting demand — one sentence",
      "impact": "positive|negative|neutral",
      "detail": "How this specifically affects the user's transition — one sentence"
    }
  ],
  "timing_advice": {
    "recommendation": "Accelerate|Stay on pace|Wait for...|Pivot to...",
    "reasoning": "Why this timing makes sense right now — one sentence",
    "window": "How long this market window is likely to stay open — one sentence"
  },
  "emerging_requirements": ["1-3 new skills or qualifications that are becoming more important for this role"],
  "declining_requirements": ["1-2 things that used to be required but matter less now"],
  "wildcard": "One unexpected market factor that could change everything — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a labor market analyst who tracks hiring trends and career transition dynamics. Be specific and honest about market conditions. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMarket' });

    if (!parsed.market_outlook) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMarket] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 20: MILESTONE CELEBRATION — Personalized achievement moment
// ═══════════════════════════════════════════════════
router.post('/skill-gap-celebrate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, milestone, completedSkills, readinessScore, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!milestone?.trim()) {
      return res.status(400).json({ error: 'Milestone description required.' });
    }

    const prompt = withLanguage(`This person just hit a milestone in their career transition. Celebrate them! But make it real — not generic cheerleading. Reference what they've specifically accomplished.

TRANSITION: "${currentRole?.trim() || 'Current'}" → "${targetRole?.trim() || 'Target'}"
MILESTONE: ${milestone}
COMPLETED SKILLS: ${completedSkills?.join(', ') || 'Unknown'}
READINESS: ${readinessScore || 'Unknown'}%

Return ONLY valid JSON:
{
  "headline": "A short, punchy celebration headline — like a notification they'd want to see — one sentence",
  "message": "2-3 sentences acknowledging what they've accomplished — specific, not generic. Reference the actual skills.",
  "perspective": "Put this in perspective — how far they've come, what this means for their transition — one sentence",
  "next_nudge": "One gentle, encouraging push toward what's next — not a to-do, more a 'you know what would be cool next...' — one sentence",
  "shareable": "A one-sentence brag they could post on LinkedIn or tell a friend — makes their progress tangible — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage('You are an encouraging career coach who celebrates milestones with specific, genuine acknowledgment — not empty cheerleading. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCelebrate' });

    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCelebrate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 21: WEEKLY NUDGE — This week's specific assignment
// ═══════════════════════════════════════════════════
router.post('/skill-gap-nudge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { targetRole, skillGaps, completedSkills, timelinePhase, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const completedCtx = completedSkills?.length ? `Already completed: ${completedSkills.join(', ')}` : '';
    const gapCtx = skillGaps.filter(g => !completedSkills?.includes(g.skill)).slice(0, 5).map(g =>
      `${g.skill} (${g.priority}, ~${g.time_estimate_hours}h total)`
    ).join(', ');

    const prompt = withLanguage(`Generate ONE specific, achievable assignment for this week. Not a vague goal — a concrete task with a clear deliverable that fits in ${hoursPerWeek || 5} hours.

TARGET: "${targetRole?.trim() || 'Target role'}"
REMAINING GAPS: ${gapCtx}
${completedCtx}
CURRENT PHASE: ${timelinePhase || 'Early'}
HOURS THIS WEEK: ${hoursPerWeek || 5}

Return ONLY valid JSON:
{
  "assignment": "One specific thing to do this week — concrete and verifiable — one sentence",
  "why_this_week": "Why this is the right thing to work on RIGHT NOW — one sentence",
  "time_estimate": "2-3 hours — one sentence",
  "deliverable": "What you should have at the end — a document, a project, a conversation, a certificate section — one sentence",
  "stretch_goal": "If you have extra time, also do this — one sentence",
  "motivation": "One sentence of encouragement — specific to where they are in the journey",
  "calendar_block": "Suggested calendar title and duration — e.g., 'SkillGapMap: SQL Practice (90 min)' — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: withLanguage('You are a focused accountability partner who gives one clear assignment per week. Never overwhelming — just the next right step. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapNudge' });

    if (!parsed.assignment) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapNudge] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 22: MENTOR MATCH — Describe the ideal mentor
// ═══════════════════════════════════════════════════
router.post('/skill-gap-mentor', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles required.' });
    }

    const topGaps = skillGaps?.slice(0, 4).map(g => g.skill).join(', ') || '';

    const prompt = withLanguage(`Describe the IDEAL mentor for this specific career transition. Not generic "find a mentor" advice — a detailed profile of exactly who would be most useful and why.

TRANSITION: "${currentRole.trim()}" → "${targetRole.trim()}"
TOP SKILL GAPS: ${topGaps || 'Not specified'}

Return ONLY valid JSON:
{
  "ideal_mentor_profile": {
    "background": "Specific career path they should have — e.g., 'Someone who went from marketing to PM, ideally at a Series B startup, within the last 3 years' — 1-2 sentences",
    "why_this_profile": "Why this specific background is most useful for your transition — one sentence",
    "seniority": "How senior — and why more senior isn't always better — one sentence",
    "red_flags": ["Types of mentors that sound good but won't actually help with THIS transition"]
  },
  "what_to_ask_them": [
    {
      "question": "Specific question for the first meeting — one sentence",
      "why": "What you'll learn from this question — one sentence",
      "what_to_listen_for": "The signal in their answer that tells you something actionable — one sentence"
    }
  ],
  "where_to_find_them": [
    {
      "channel": "Specific place to find this type of person — one sentence",
      "search_strategy": "How to search — specific filters, keywords, communities — one sentence"
    }
  ],
  "mentorship_structure": {
    "frequency": "How often to meet — and why more than monthly is usually too much (number)",
    "format": "Coffee/video/async — what works best for career transition mentoring — 2-4 words",
    "duration": "How long the mentorship should last (number)"
  },
  "alternative_to_formal_mentor": "If you can't find a formal mentor, here's how to get 80% of the value through other means — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('You are a mentorship strategist who helps career transitioners find exactly the right person to guide them. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMentor' });

    if (!parsed.ideal_mentor_profile) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMentor] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
