const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// HELPER: Check domain availability via DNS
// ═══════════════════════════════════════════════════
async function checkDomains(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tlds = ['.com', '.co', '.io', '.app', '.net', '.org', '.dev', '.xyz'];
  const results = {};

  await Promise.all(tlds.map(async (tld) => {
    const domain = slug + tld;
    try {
      await dns.resolve(domain);
      results[domain] = 'taken';
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
        results[domain] = 'likely_available';
      } else {
        results[domain] = 'unknown';
      }
    }
  }));

  return results;
}

// ═══════════════════════════════════════════════════
// HELPER: Check social handle availability
// ═══════════════════════════════════════════════════
async function checkSocials(name) {
  const handle = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const platforms = [
    { name: 'Instagram', url: `https://www.instagram.com/${handle}/` },
    { name: 'X/Twitter', url: `https://x.com/${handle}` },
    { name: 'TikTok', url: `https://www.tiktok.com/@${handle}` },
    { name: 'GitHub', url: `https://github.com/${handle}` },
    { name: 'YouTube', url: `https://www.youtube.com/@${handle}` },
  ];

  const results = {};

  await Promise.all(platforms.map(async (platform) => {
    try {
      const response = await fetch(platform.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(4000),
      });
      results[platform.name] = response.status === 404 ? 'likely_available' : 'likely_taken';
    } catch {
      results[platform.name] = 'unknown';
    }
  }));

  return { handle: `@${handle}`, platforms: results };
}

// ═══════════════════════════════════════════════════
// ROUTE 1: FULL NAME ANALYSIS
// ═══════════════════════════════════════════════════
router.post('/nameaudit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name,
      context,
      industry,
      targetAudience,
      userLanguage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!context) {
      return res.status(400).json({ error: 'Please select what this name is for' });
    }

    // Run live checks in parallel with AI analysis
    const showDomainChecks = ['Business', 'Product', 'Band / Music Project', 'Creative Project', 'App', 'Event', 'Domain Name'].includes(context);

    const [aiAnalysis, domainResults, socialResults] = await Promise.all([
      // AI Analysis
      (async () => {
        const today = new Date().toISOString().split('T')[0];
        const currentYear = new Date().getFullYear();
        const langDirective = withLanguage(userLanguage);

        const prompt = `You are a naming consultant. Evaluate this name rigorously and honestly.

NAME: "${name}"
WHAT IT'S FOR: ${context}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
TODAY: ${today}

Analyze across all dimensions below. Be specific — vague praise is worthless. If the name has problems, say so.

DIMENSIONS TO COVER:
1. First impression — gut reaction with zero context; immediate associations; personality projected
2. Phonetics — syllables/stress, mouth feel, accent issues, sound psychology (hard consonants=authority, open vowels=warmth, etc.), rhythm
3. Memorability — day-after test, tell-a-friend test, phone test, drunk test (could they find the site after 3 drinks?), shout test
4. Radio test — if heard aloud, what would someone type? Common misspellings?
5. Visual — lowercase/caps/title case appearance, URL clarity, logo wordmark potential, any rn/cl visual traps
6. Global language scan — check Spanish, Portuguese, French, German, Italian, Mandarin, Japanese, Arabic, Hindi, Russian, Turkish at minimum. Report any meanings, sounds-like, or connotations. Flag problems.
7. Abbreviations — natural shortening, initials, hashtag readability, any unfortunate acronyms
8. Competitive landscape — similar existing brands; how crowded is this space; does it stand out?
9. SEO/searchability — unique coined term or fighting dictionary words? What dominates Google for this?
10. Longevity — trend-dependent? Will it feel dated in ${currentYear + 10}?
11. Emotional resonance — personality match for intended use; sensory associations; if-it-were-a-person
${showDomainChecks ? `12. Domain/TLD — TLD perception, competing .com risk, URL readability, typosquatting risk` : ''}

SCORING: Rate 0-100 overall; 0-10 each dimension. Be honest — mediocre names score 40-55, not 70+.

Return ONLY this JSON (no markdown, no preamble):

{
  "name_analyzed": "${name}",
  "overall_grade": "STRONG | GOOD | FAIR | WEAK | RECONSIDER",
  "overall_score": 74,
  "overall_summary": "2-3 sentence honest verdict.",
  "section_scores": { "first_impression": 8, "phonetics": 7, "memorability": 6, "radio_test": 9, "visual": 7, "global_safety": 5, "abbreviations": 8, "competitive": 6, "seo": 7, "longevity": 8, "emotional_resonance": 7 },
  "first_impression": { "gut_reaction": "One sentence", "associations": ["3 associations max"], "personality_projected": "One sentence" },
  "phonetic_profile": { "syllables": "e.g. LOO-mly, 2 syllables — one sentence", "mouth_feel": "One sentence", "sound_psychology": "One sentence", "accent_notes": "One sentence or None" },
  "memorability": { "score": 7, "day_after": true, "tell_a_friend": true, "phone": true, "drunk": false, "shout": true, "notes": "One sentence on weakest test" },
  "radio_test": { "pass": true, "likely_misspellings": ["wrong1"], "notes": "One sentence" },
  "visual_analysis": { "url_form": "name.com — one sentence", "logo_potential": "One sentence", "issues": "Specific trap or None — one sentence" },
  "global_language_flags": [
    { "language": "Spanish — one sentence", "issue": "What it means or sounds like — one sentence", "severity": "caution | problem" }
  ],
  "abbreviation_audit": { "natural_shortening": "Short form — one sentence", "initials": "Initials or N/A — one sentence", "hashtag": "#hashtag — one sentence", "issues": "Problem or Clean — one sentence" },
  "competitive_landscape": { "similar_names": ["1-2 brands max"], "differentiation": "One sentence" },
  "searchability": { "uniqueness": "Coined or dictionary? — one sentence", "seo_verdict": "One sentence" },
  "longevity": { "aging_verdict": "One sentence" },
  "emotional_resonance": { "personality_match": "One sentence", "as_a_person": "One sentence" },
  ${showDomainChecks ? `"tld_analysis": { "competing_com": "Taken/Available + impact — one sentence", "url_readability": "One sentence", "typosquatting_risk": "Low | Medium | High" },` : ''}
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "deal_breakers": [],
  "suggestions": { "to_strengthen": "One sentence", "alternatives_direction": "One sentence" }
}

global_language_flags: ONLY include languages where there is a caution or problem. Omit neutral/positive findings entirely. Most names will have 0-3 flags.`;

        return await callClaudeWithRetry({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          messages: [{ role: 'user', content: prompt }],
        }, { label: 'NameAudit' });
      })(),

      // Domain checks (parallel)
      showDomainChecks ? checkDomains(name) : null,

      // Social checks (parallel)
      showDomainChecks ? checkSocials(name) : null,
    ]);

    // Merge live availability data into the AI analysis
    const result = {
      ...aiAnalysis,
      live_availability: showDomainChecks ? {
        domains: domainResults,
        social: socialResults,
      } : null,
    };

    if (!result.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(result);

  } catch (error) {
    console.error('[NameAudit] Error:', error);
    res.status(500).json({ error: 'Failed to analyze name', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: QUICK COMPARE (analyze 2-3 names side by side)
// ═══════════════════════════════════════════════════
router.post('/nameaudit/compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { names, context, industry, userLanguage } = req.body;

    if (!names || names.length < 2) {
      return res.status(400).json({ error: 'At least 2 names required for comparison' });
    }
    if (names.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 names for comparison' });
    }
    if (!context?.trim()) {
      return res.status(400).json({ error: 'Please select what these names are for' });
    }

    const langDirective = withLanguage(userLanguage);
    const trimmedNames = names.map(n => (n || '').trim()).filter(Boolean);
    if (trimmedNames.length < 2) {
      return res.status(400).json({ error: 'At least 2 non-empty names required for comparison' });
    }

    const prompt = `You are a world-class naming consultant. A client is torn between ${trimmedNames.length} name candidates and needs a clear comparison.

NAMES TO COMPARE: ${trimmedNames.map((n, i) => `${i + 1}. "${n}"`).join(', ')}
WHAT IT'S FOR: ${context}
INDUSTRY: ${industry || 'Not specified'}

For each name, give a quick assessment across the key dimensions, including a score from 0-100. Be honest — a mediocre name should score 40-55, not 70. Then declare a winner with clear reasoning.

Return ONLY this JSON:

{
  "candidates": [
    {
      "name": "The name — 3-6 words",
      "score": 74,
      "grade": "STRONG | GOOD | FAIR | WEAK",
      "one_liner": "One sentence assessment",
      "best_quality": "Its single biggest strength — one sentence",
      "biggest_risk": "Its single biggest weakness — one sentence",
      "memorability": "high | medium | low",
      "radio_test": "pass | partial | fail",
      "global_safety": "clean | caution | problem",
      "personality": "2-3 word personality summary"
    }
  ],

  "winner": {
    "name": "The recommended name — 3-6 words",
    "why": "Clear reasoning for why this one wins — one sentence",
    "margin": "by_a_mile | clear_winner | close_call | basically_tied"
  },

  "comparison_insight": "The most important difference between these names that should drive the decision — one sentence"
}

Be honest and decisive. The client needs clarity, not diplomacy. Return ONLY JSON.
${langDirective ? `\n${langDirective}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/Compare' });

    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/Compare] Error:', error);
    res.status(500).json({ error: 'Failed to compare names', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: FIX THIS NAME
// Takes a name + its audit results, generates improved variations
// ═══════════════════════════════════════════════════
router.post('/nameaudit/fix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      grade, strengths, weaknesses, dealBreakers,
      overallSummary, userLanguage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const langDirective = withLanguage(userLanguage);

    const strengthsList = Array.isArray(strengths) && strengths.length > 0
      ? `\nSTRENGTHS TO PRESERVE:\n${strengths.map(s => `  ✓ ${s}`).join('\n')}`
      : '';
    const weaknessesList = Array.isArray(weaknesses) && weaknesses.length > 0
      ? `\nWEAKNESSES TO FIX:\n${weaknesses.map(w => `  ✗ ${w}`).join('\n')}`
      : '';
    const dealBreakersList = Array.isArray(dealBreakers) && dealBreakers.length > 0
      ? `\nDEAL BREAKERS TO ELIMINATE:\n${dealBreakers.map(d => `  🚨 ${d}`).join('\n')}`
      : '';

    const prompt = `You are a world-class naming consultant. A client ran their name through an audit tool and it revealed specific problems. Your job: generate improved name variations that keep what works and fix what doesn't.
${langDirective ? `\n${langDirective}` : ''}

═══════════════════════════════
THE ORIGINAL NAME & ITS AUDIT
═══════════════════════════════
Name: "${name}"
Context: ${context || 'General'}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Grade: ${grade || 'Not graded'}
Summary: ${overallSummary || 'No summary'}
${strengthsList}${weaknessesList}${dealBreakersList}

═══════════════════════════════
YOUR TASK
═══════════════════════════════
Generate 5-7 improved name variations. Each should:
1. PRESERVE the strengths identified above (these are what the client liked)
2. FIX the weaknesses and eliminate deal breakers
3. Stay in the same general naming territory (don't radically change direction unless deal breakers require it)
4. Be immediately usable — not just tweaks but genuinely strong alternatives

For each variation, clearly explain:
- What makes it better than the original
- Which specific weakness/problem it fixes
- Any tradeoffs (what you might lose by making this change)
- An estimated audit score (your honest guess of what this name would score on a 0-100 scale)

Respond in JSON:
{
  "approach": "Brief explanation of your fix strategy — what you're keeping, what you're changing, and why — one sentence",
  "variations": [
    {
      "name": "ImprovedName — 3-6 words",
      "pronunciation": "im-PROOVD-name — one sentence",
      "why_its_better": "Clear explanation of why this variation is stronger — one sentence",
      "what_it_fixes": "Specific weaknesses/problems this addresses — one sentence",
      "tradeoff": "Any downside of this change, or null if none — one sentence",
      "estimated_score": 82
    }
  ],
  "naming_direction": "If the client wants to explore further, here's the direction I'd recommend and why — one sentence"
}

IMPORTANT:
- Don't just add/remove a letter — make meaningful improvements
- Each variation should fix a DIFFERENT combination of problems when possible
- At least 2 variations should be "close cousins" (small evolution from original)
- At least 2 should be "fresh takes" (same energy, different approach)
- Be honest about tradeoffs — every name change involves compromise
- Estimated scores should be realistic, not inflated

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/Fix' });

    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/Fix] Error:', error);
    res.status(500).json({ error: 'Failed to generate fixes', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: AUDIENCE REACTION SIMULATOR
// Simulates 4-5 target audience personas reacting to the name
// ═══════════════════════════════════════════════════
router.post('/nameaudit/reactions', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      overallSummary, personality, userLanguage,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const langDirective = withLanguage(userLanguage);

    const audienceHint = targetAudience
      ? `The client's target audience is: ${targetAudience}. Create personas that represent this specific audience.`
      : `Create realistic personas appropriate for a ${context || 'business'} ${industry ? `in ${industry}` : ''}.`;

    const prompt = `You are a consumer psychologist and brand researcher. A client wants to understand how real people would react to a name. Your job: create 4-5 realistic personas from the target audience and simulate their genuine first-impression reaction.
${langDirective ? `\n${langDirective}` : ''}

NAME: "${name}"
CONTEXT: ${context || 'Business'}
INDUSTRY: ${industry || 'Not specified'}
OVERALL VIBE: ${personality || overallSummary || 'Not specified'}

${audienceHint}

IMPORTANT RULES:
- Make reactions feel REAL — not marketing-speak. Include awkward honesty, mild confusion, enthusiasm, and skepticism.
- Each persona should have a different perspective. Include at least one skeptic.
- Reactions should be 1-3 sentences, in the persona's natural voice (casual for Gen Z, measured for executives, etc.)
- "Would they remember it" should be honest — most names are forgettable.
- Trust level should reflect what this name signals about quality/legitimacy.

Return ONLY this JSON:
{
  "personas": [
    {
      "emoji": "👩‍💻",
      "name": "Maya, 28 — Product Designer — 3-6 words",
      "description": "Early adopter, design-savvy, values aesthetics — 1-2 sentences",
      "reaction": "Their genuine, in-voice reaction to hearing this name for the first time — one sentence",
      "would_they_remember": "Yes/No/Maybe + brief why — one sentence",
      "trust_level": "High/Medium/Low — what the name signals to them about credibility — one sentence"
    }
  ],
  "consensus": "1-2 sentence summary of the overall audience sentiment. Where do most personas agree? What's the pattern?"
}

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.95,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/Reactions' });

    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/Reactions] Error:', error);
    res.status(500).json({ error: 'Failed to simulate reactions', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: CONTEXT-SPECIFIC DEEP DIVE
// Runs specialized analysis based on name category
// ═══════════════════════════════════════════════════
router.post('/nameaudit/deepdive', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      grade, score, userLanguage,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const langDirective = withLanguage(userLanguage);

    // Build context-specific analysis framework
    const contextFrameworks = {
      'Baby': `BABY NAME DEEP DIVE for "${name}":
1. POPULARITY TREND: Is this name rising, falling, or stable? Is it about to spike (celebrity baby, TV character)?
2. GENERATIONAL PATTERN: Will there be 6 of these in the same class? Is it a "teacher name" or "grandparent name" cycling back?
3. SIBLING COMPATIBILITY: What sibling names pair well? Would "${name}" and common sibling names feel cohesive?
4. PLAYGROUND AUDIT: What rhymes or teasing angles exist? What will kids actually call them?
5. NICKNAME EVOLUTION: How will this name morph as they grow? Baby → child → teen → adult → elderly — does it work at every stage?
6. CULTURAL HERITAGE: Does this name connect to any heritage, mythology, or literary tradition?
7. PROFESSIONAL READINESS: Will "Dr. ${name}" or "${name}, Attorney at Law" feel natural on a business card in 2050?`,

      'Band / Music Project': `MUSIC INDUSTRY DEEP DIVE for "${name}":
1. GENRE FIT: What genre does this name signal? Would metal fans, indie listeners, or pop audiences gravitate to it?
2. SPOTIFY SEARCHABILITY: Is this a unique search term or will it compete with existing artists/songs?
3. TOUR POSTER TEST: Does this name look good in large type on a poster? Does it have visual impact?
4. MERCH POTENTIAL: How does it look on a t-shirt? Can it be stylized into a logo wordmark?
5. RADIO DJ TEST: Would a DJ feel natural saying "That was ${name} with their new single..."?
6. CROWD CHANT: Could a festival crowd chant this name? Does it have rhythm?
7. DISCOGRAPHY FIT: Does it work as a prefix? "${name}: The Album" or "${name} Live at..."?`,

      'Pet': `PET NAME DEEP DIVE for "${name}":
1. CALL TEST: Can you shout "${name}!" across a dog park without embarrassment? Does it carry?
2. COMMAND CONFUSION: Does it sound like common commands (sit, stay, come, no, down)?
3. VET OFFICE: How will "${name}" sound in a waiting room? Will multiple pets respond?
4. MULTI-PET COMPATIBILITY: What other pet names pair well with "${name}"?
5. SYLLABLE TEST: 1-2 syllables are ideal for dogs. How does this name score for responsiveness?
6. HUMAN CONFUSION: Will people think you're calling a person? Is that a feature or a bug?`,
    };

    const defaultFramework = `BUSINESS/PRODUCT DEEP DIVE for "${name}":
1. TRADEMARK RISK: How defensible is this name? Is it descriptive (hard to trademark) or distinctive (strong mark)?
2. EXPANSION READINESS: If the company pivots or adds products, does this name box them in or leave room?
3. FUNDING APPEAL: Does this name sound like a company investors would back? Does it signal ambition and scale?
4. ACQUISITION PROOF: Could a larger company absorb this name, or is it too generic/specific to defend?
5. PARTNERSHIP FIT: How does this name sound next to "powered by [BigCo]" or "[Name] by [Partner]"?
6. INTERNATIONAL EXPANSION: Beyond language issues, does this name work as a global brand?
7. TALENT ATTRACTION: Would top talent feel proud to have this on their LinkedIn? Does it attract or repel?
8. CUSTOMER SENTENCE TEST: Can customers naturally say "I use ${name}" or "I bought it from ${name}" without awkwardness?`;

    const framework = contextFrameworks[context] || defaultFramework;

    const prompt = `You are a specialized naming consultant. A client has already run a general audit on their name. Now they need a deep dive specific to their exact use case.
${langDirective ? `\n${langDirective}` : ''}

NAME: "${name}"
CONTEXT: ${context || 'Business'}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CURRENT GRADE: ${grade || 'N/A'} (${score || 'N/A'}/100)

${framework}

For each test, give a severity: "positive" (passes well), "neutral" (no issues), "caution" (minor concern), or "problem" (serious issue).

Return ONLY this JSON:
{
  "sections": [
    {
      "title": "TEST NAME (e.g., POPULARITY TREND) — 3-6 words",
      "finding": "Clear, specific finding in 1-2 sentences",
      "detail": "Additional context if needed, or null — one sentence",
      "severity": "positive | neutral | caution | problem"
    }
  ],
  "verdict": "1-2 sentence overall deep dive verdict — does the context-specific analysis change the overall assessment?"
}

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      temperature: 0.85,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/DeepDive' });

    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/DeepDive] Error:', error);
    res.status(500).json({ error: 'Failed to run deep dive', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: SECOND OPINION
// Independent re-analysis compared against the first
// ═══════════════════════════════════════════════════
router.post('/nameaudit/second-opinion', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      firstOpinion, userLanguage,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const langDirective = withLanguage(userLanguage);

    const prompt = `You are an independent naming consultant providing a SECOND OPINION. Another consultant already analyzed this name. Your job is to give your own honest, independent assessment — then compare it to the first opinion to identify agreements and disagreements.
${langDirective ? `\n${langDirective}` : ''}

NAME: "${name}"
CONTEXT: ${context || 'Business'}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

THE FIRST CONSULTANT'S OPINION:
- Grade: ${firstOpinion?.grade || 'N/A'}
- Score: ${firstOpinion?.score || 'N/A'}/100
- Strengths: ${(firstOpinion?.strengths || []).join('; ') || 'None listed'}
- Weaknesses: ${(firstOpinion?.weaknesses || []).join('; ') || 'None listed'}
- Deal breakers: ${(firstOpinion?.dealBreakers || []).join('; ') || 'None'}

YOUR TASK:
1. Give your own independent grade and score (be honest — you may agree or disagree)
2. Identify where you AGREE with the first opinion (these are reliable signals)
3. Identify where you DISAGREE (these are debatable — the client should think harder about these)
4. Surface any NEW INSIGHTS the first analysis missed
5. Give a confidence verdict: how reliable is the overall assessment?

IMPORTANT: Don't just agree to be diplomatic. If you think the first analysis was too harsh or too generous, say so. The client benefits from genuine disagreement.

Return ONLY this JSON:
{
  "score": 72,
  "grade": "GOOD",
  "agreements": [
    "Both analyses agree: [specific finding]"
  ],
  "disagreements": [
    "First analysis said [X], but I'd argue [Y] because [reason]"
  ],
  "new_insights": [
    "Something the first analysis didn't catch: [finding]"
  ],
  "confidence_verdict": "How confident should you be in the overall assessment? e.g., 'High confidence — both analyses converge on the same grade.' or 'Mixed signals — the disagreements suggest this name is more polarizing than the score suggests.' — one sentence"
}

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 1.0,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/SecondOpinion' });

    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/SecondOpinion] Error:', error);
    res.status(500).json({ error: 'Failed to get second opinion', details: error.message });
  }
});

module.exports = router;
