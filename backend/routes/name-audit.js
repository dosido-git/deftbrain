const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage } = require('../lib/claude');

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
router.post('/nameaudit', async (req, res) => {
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

        const prompt = `You are a world-class naming consultant who combines linguistics, brand psychology, cultural anthropology, and marketing strategy. A client is asking you to evaluate a name they're considering. Give them the most thorough, honest analysis possible.
${langDirective ? `\n${langDirective}` : ''}
TODAY'S DATE: ${today}

═══════════════════════════════════════════════
THE NAME TO ANALYZE
═══════════════════════════════════════════════

NAME: "${name}"
WHAT IT'S FOR: ${context}
INDUSTRY / CONTEXT: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

═══════════════════════════════════════════════
ANALYSIS FRAMEWORK — Be exhaustive
═══════════════════════════════════════════════

1. FIRST IMPRESSION
What does someone feel/think hearing this name for the very first time with ZERO context? Before they know what it is? This raw gut reaction matters enormously. Be honest — if it sounds like a pharmaceutical drug, say so.

2. PHONETIC PROFILE
- Syllable count and stress pattern
- Mouth feel — is it satisfying to say? Does the tongue flow or stumble?
- How it sounds in different accents (American, British, Australian, non-native English speakers)
- Consonant/vowel balance — what psychological qualities do these sounds convey?
  (hard consonants = authority/strength, soft consonants = gentleness/approachability,
  open vowels = warmth/openness, closed vowels = precision/focus,
  sibilants = sleekness/speed, plosives = energy/impact)
- Rhythm and cadence — does it have a musical quality?

3. MEMORABILITY TESTS
- The Day-After Test: If someone heard this name once at a party, would they remember it tomorrow?
- The Tell-A-Friend Test: If someone loved your product, could they accurately relay the name to a friend?
- The Phone Test: Can you say it clearly on a phone call without spelling it?
- The Drunk Test: Could someone find your website after 3 drinks? (This is a real naming industry test)
- The Shout Test: Could someone shout this across a loud bar or conference?

4. RADIO TEST (SPELL-FROM-HEARING)
If someone only HEARD this name spoken aloud, what would they type into a search bar? Would they get it right on the first try? What common misspellings would occur? This is critical for word-of-mouth growth.

5. VISUAL ANALYSIS
- How does it look in lowercase? ALL CAPS? Title Case?
- Does it have good letter-shape balance? (ascending/descending letters, visual weight)
- How would it look as a logo wordmark?
- Does it have awkward letter combinations visually? (e.g., "rn" looking like "m", "cl" looking like "d")
- URL appearance: does it read clearly as a web address?

6. GLOBAL LANGUAGE SCAN
Check the name against these languages AT MINIMUM and report ANY meanings, associations, or sounds-like matches:
- Spanish, Portuguese, French, Italian, German, Dutch
- Mandarin Chinese, Japanese, Korean
- Arabic, Hindi, Urdu
- Russian, Polish
- Turkish, Swahili
- Thai, Vietnamese
Flag anything problematic, funny, or actually beneficial (positive meaning in another language = bonus).

7. ABBREVIATION & NICKNAME AUDIT
- What will people naturally shorten this to?
- What do the initials spell?
- Are there any unfortunate acronyms if combined with a descriptor? (e.g., "Super Tech" → S.T.?)
- What's the hashtag version? Does it read cleanly without spaces?

8. COMPETITIVE LANDSCAPE
- What other brands/products/entities have this or a very similar name?
- How crowded is this naming space?
- Does it stand out or blend in with competitors?

9. SEO / SEARCHABILITY
- Is this a unique/invented term, or does it compete with existing dictionary words or entities?
- What would someone find if they Googled this name right now?
- Would this name fight for search position against established entities?

10. LONGEVITY CHECK
- Is this name tied to a current trend that will feel dated in 5 years?
- Does it reference technology, slang, or cultural moments that will age?
- Would this name still feel right in ${currentYear + 10}?

11. EMOTIONAL RESONANCE
- What personality does this name project? (authoritative, playful, premium, scrappy, etc.)
- Does that personality match the intended context?
- What colors, textures, or environments does this name evoke?
- If this name were a person, how would you describe them?

${showDomainChecks ? `12. TLD ANALYSIS (Domain Names)
- TLD choice assessment — how does the chosen TLD affect perception?
- Trust signal — what level of credibility does this TLD convey?
- Confusion risk — will users default to a different TLD?
- Competing .com — is the .com likely taken? How does that affect this domain?
- Alternative TLDs — what other TLDs would work well with this name?

13. DOMAIN-SPECIFIC TESTS
- Browser bar test — how does the full URL look in a browser address bar?
- Typosquatting risk — is this domain vulnerable to typosquatters?
- Verbal sharing — how easy is it to tell someone this URL in conversation?
- Email test — how does an email address at this domain look? (e.g., hello@name.com)` : ''}

${showDomainChecks ? '14' : '12'}. SCORING
Rate the name 0-100 overall, and give a sub-score (0-10) for each dimension:
- first_impression, phonetics, memorability, radio_test, visual, global_safety, abbreviations, competitive, seo, longevity, emotional_resonance
The overall score should reflect the weighted importance of each dimension for the specific context (e.g., radio_test matters more for a business than a pet name). Be honest — a mediocre name should score 40-55, not 70.

${showDomainChecks ? '15' : '13'}. OVERALL VERDICT
- Clear list of strengths (things this name does well)
- Clear list of weaknesses (things that concern you)
- Deal-breakers (if any — problems serious enough to reconsider)
- Final recommendation: STRONG / GOOD / FAIR / WEAK / RECONSIDER
- A brief, honest summary paragraph

═══════════════════════════════════════════════
OUTPUT FORMAT — Return ONLY valid JSON
═══════════════════════════════════════════════

{
  "name_analyzed": "${name}",

  "overall_grade": "STRONG | GOOD | FAIR | WEAK | RECONSIDER",

  "overall_score": 74,

  "section_scores": {
    "first_impression": 8,
    "phonetics": 7,
    "memorability": 6,
    "radio_test": 9,
    "visual": 7,
    "global_safety": 5,
    "abbreviations": 8,
    "competitive": 6,
    "seo": 7,
    "longevity": 8,
    "emotional_resonance": 7
  },

  "overall_summary": "A 2-3 sentence honest verdict. Lead with the most important thing.",

  "first_impression": {
    "gut_reaction": "What someone feels/thinks hearing this name cold",
    "associations": ["3-5 immediate associations or mental images"],
    "personality_projected": "What personality the name projects"
  },

  "phonetic_profile": {
    "syllables": "Count and stress pattern (e.g., 'AI-fu — 2 syllables, stress on first')",
    "mouth_feel": "How it physically feels to say",
    "accent_notes": "How it sounds across accents — any issues?",
    "sound_psychology": "What the specific sounds convey psychologically",
    "rhythm": "Musical quality / cadence assessment"
  },

  "memorability": {
    "day_after_test": { "pass": true, "notes": "Explanation" },
    "tell_a_friend_test": { "pass": true, "notes": "Explanation" },
    "phone_test": { "pass": true, "notes": "Explanation" },
    "drunk_test": { "pass": true, "notes": "Explanation" },
    "shout_test": { "pass": true, "notes": "Explanation" }
  },

  "radio_test": {
    "pass": true,
    "likely_misspellings": ["Common wrong spellings someone might type"],
    "notes": "Assessment of spell-from-hearing difficulty"
  },

  "visual_analysis": {
    "lowercase": "How it looks: the_name",
    "uppercase": "How it looks: THE_NAME",
    "title_case": "How it looks: The_Name",
    "url_appearance": "How it reads as a web address",
    "logo_potential": "Assessment of wordmark potential",
    "visual_issues": "Any problematic letter combinations, or 'None'"
  },

  "global_language_scan": [
    {
      "language": "Language name",
      "finding": "What the name means/sounds like in this language",
      "severity": "positive | neutral | caution | problem"
    }
  ],

  "abbreviation_audit": {
    "natural_shortening": "What people will call it for short",
    "initials": "What the initials spell",
    "hashtag": "How it reads as #hashtag",
    "issues": "Any problems found, or 'Clean'"
  },

  "competitive_landscape": {
    "similar_names": ["Known brands/entities with the same or very similar names"],
    "crowdedness": "How crowded this naming space is",
    "differentiation": "How well this name stands apart"
  },

  "searchability": {
    "uniqueness": "Is this a unique term or does it fight dictionary words?",
    "google_competition": "What currently dominates search results for this term",
    "seo_assessment": "Overall SEO outlook"
  },

  "longevity": {
    "trend_dependency": "Is this tied to a passing trend?",
    "aging_risk": "Will it feel dated? When?",
    "verdict": "Assessment of 10-year staying power"
  },

  "emotional_resonance": {
    "personality_match": "Does the name's personality match the intended use?",
    "sensory_associations": "Colors, textures, environments it evokes",
    "if_it_were_a_person": "Describe this name as a human personality"
  },

  ${showDomainChecks ? `"tld_analysis": {
    "tld_choice": "Assessment of the chosen TLD",
    "trust_signal": "What credibility level this TLD conveys",
    "confusion_risk": "Will users default to a different TLD?",
    "competing_com": "Is the .com taken? How does that affect things?",
    "alternative_tlds": "What other TLDs would work well"
  },

  "domain_specific_tests": {
    "browser_bar": "How the full URL looks in a browser",
    "typosquatting_risk": "Vulnerability to typosquatters",
    "verbal_sharing": "How easy to share verbally",
    "email_test": "How an email address looks at this domain"
  },` : ''}

  "strengths": ["Specific things this name does well"],

  "weaknesses": ["Specific concerns or issues"],

  "deal_breakers": ["Serious problems that should give pause, or empty array if none"],

  "suggestions": {
    "to_strengthen": "If keeping this name, what could mitigate the weaknesses",
    "alternatives_direction": "If reconsidering, what direction to explore instead"
  }
}

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. HONESTY OVER KINDNESS: The user is paying for truth, not validation. If the name has problems, say so clearly. False reassurance wastes their time and money. But be constructive — explain WHY something is a problem and what would fix it.

2. SPECIFICITY: "Sounds nice" is worthless. "The open 'ah' vowel in the first syllable creates warmth, while the hard 'k' ending adds memorability and authority" is useful. Every claim about the name should be backed by specific linguistic or psychological reasoning.

3. LANGUAGE CHECKS: Be thorough. Check every language listed. If you're not confident about a language, say "uncertain" rather than skipping it. False negatives (missing a problem) are worse than false positives.

4. CONTEXT MATTERS: A name that's perfect for a pet is terrible for a law firm. Every assessment should be calibrated to what this name is FOR and who the target audience is.

5. THE MEMORABILITY TESTS ARE REAL: The drunk test and shout test are used by actual naming agencies. Take them seriously and assess honestly.

6. Return ONLY the JSON object. No markdown, no preamble.`;

        console.log(`[NameAudit] Analyzing: "${name}" for ${context}`);

        return await callClaudeWithRetry({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
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

    console.log(`[NameAudit] Grade: ${result.overall_grade}, Strengths: ${result.strengths?.length}, Weaknesses: ${result.weaknesses?.length}`);
    res.json(result);

  } catch (error) {
    console.error('[NameAudit] Error:', error);
    res.status(500).json({ error: 'Failed to analyze name', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: QUICK COMPARE (analyze 2-3 names side by side)
// ═══════════════════════════════════════════════════
router.post('/nameaudit/compare', async (req, res) => {
  try {
    const { names, context, industry, userLanguage } = req.body;

    if (!names || names.length < 2) {
      return res.status(400).json({ error: 'At least 2 names required for comparison' });
    }
    if (names.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 names for comparison' });
    }

    const prompt = `You are a world-class naming consultant. A client is torn between ${names.length} name candidates and needs a clear comparison.

NAMES TO COMPARE: ${names.map((n, i) => `${i + 1}. "${n}"`).join(', ')}
WHAT IT'S FOR: ${context || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

For each name, give a quick assessment across the key dimensions, including a score from 0-100. Be honest — a mediocre name should score 40-55, not 70. Then declare a winner with clear reasoning.

Return ONLY this JSON:

{
  "candidates": [
    {
      "name": "The name",
      "score": 74,
      "grade": "STRONG | GOOD | FAIR | WEAK",
      "one_liner": "One sentence assessment",
      "best_quality": "Its single biggest strength",
      "biggest_risk": "Its single biggest weakness",
      "memorability": "high | medium | low",
      "radio_test": "pass | partial | fail",
      "global_safety": "clean | caution | problem",
      "personality": "2-3 word personality summary"
    }
  ],

  "winner": {
    "name": "The recommended name",
    "why": "Clear reasoning for why this one wins",
    "margin": "by_a_mile | clear_winner | close_call | basically_tied"
  },

  "comparison_insight": "The most important difference between these names that should drive the decision"
}

Be honest and decisive. The client needs clarity, not diplomacy. Return ONLY JSON.`;

    console.log(`[NameAudit/Compare] Comparing: ${names.join(' vs ')}`);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameAudit/Compare' });

    console.log(`[NameAudit/Compare] Winner: ${parsed.winner?.name} (${parsed.winner?.margin})`);
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/Compare] Error:', error);
    res.status(500).json({ error: 'Failed to compare names', details: error.message });
  }
});

module.exports = router;
