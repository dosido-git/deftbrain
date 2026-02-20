const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/brag-sheet-builder', async (req, res) => {
  try {
    const {
      accomplishments, industry, level, purposes,
      roleTitle, yearsExp, userLanguage
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

    const levelGuide = LEVEL_GUIDANCE[level] || LEVEL_GUIDANCE.mid;
    const industryVerbs = INDUSTRY_VERBS[industry] || '';
    const numberedAccomplishments = accomplishments.map((a, i) => `${i + 1}. "${a}"`).join('\n');

    const systemPrompt = `You are the world's best professional accomplishment translator. You take humble, self-deprecating descriptions and transform them into powerful, specific, metrics-driven achievement statements.

YOUR PHILOSOPHY:
- People chronically understate their contributions. Your job is to find the truth — not exaggerate, but describe what they actually did with specificity and confidence.
- "I helped with a project" probably means "I was a key contributor to a cross-functional initiative."
- Every vague verb hides a specific, powerful one. "Worked on" -> "Spearheaded." "Helped" -> "Drove."
- Metrics are hiding everywhere. If they don't provide numbers, suggest where to find them.
- Imposter syndrome is the #1 enemy. For EACH transformation, include a specific reason why they deserve to claim this.

CAREER CONTEXT:
- Role: ${roleTitle || 'Not specified'}
- Level: ${level || 'mid-level'}
- Industry: ${industry || 'general'}
${yearsExp ? `- Years of experience: ${yearsExp}` : ''}

LEVEL CALIBRATION:
${levelGuide}

${industryVerbs ? `INDUSTRY POWER VERBS:\n${industryVerbs}` : ''}

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
      "question": "Specific question to find a hidden metric",
      "why": "Why this metric matters",
      "example": "What the bullet looks like with this metric"
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
    "script": "Exact words for a raise meeting. 60-90 words. Confident, factual, references specific contributions."
  }`;
    }

    outputSpec += `,
  "confidence": {
    "reframe": "Why describing your work accurately is not bragging. Specific to their accomplishments.",
    "imposter_killer": "One powerful sentence addressing the imposter syndrome they probably feel about these specific accomplishments."
  }
}`;

    const userPrompt = `Here are the accomplishments to transform:

${numberedAccomplishments}

Return ONLY valid JSON:
${outputSpec}

Generate one transformation per accomplishment. Generate 2-4 metrics questions. ${wantInterview ? 'Generate 1-2 STAR stories from the strongest accomplishments.' : ''} ${wantResume ? 'Generate resume bullets for ALL accomplishments.' : ''} ${wantRaise ? 'Generate value statements for ALL accomplishments.' : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('Brag Sheet Builder error:', error);
    res.status(500).json({ error: error.message || 'Failed to build brag sheet' });
  }
});

module.exports = router;
