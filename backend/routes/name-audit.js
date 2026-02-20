const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { anthropic, cleanJsonResponse } = require('../lib/claude');

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
// HELPER: Web search for competitive landscape
// ═══════════════════════════════════════════════════
async function searchExisting(name) {
  try {
    const response = await fetch(`https://www.google.com/search?q=%22${encodeURIComponent(name)}%22+brand+OR+company+OR+product`, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const html = await response.text();
      // Simple check: does the name appear in significant contexts?
      const count = (html.match(new RegExp(name, 'gi')) || []).length;
      return { mentions: count, searched: true };
    }
    return { mentions: 0, searched: false };
  } catch {
    return { mentions: 0, searched: false };
  }
}

// ═══════════════════════════════════════════════════
// HELPER: Domain checks for Domain Name mode
// ═══════════════════════════════════════════════════
async function checkDomainsForDomainMode(fullDomain) {
  // Parse: "deft.now" → namepart="deft", tld=".now"
  const lastDot = fullDomain.lastIndexOf('.');
  if (lastDot <= 0) return checkDomains(fullDomain); // fallback if no dot
  const namePart = fullDomain.substring(0, lastDot).toLowerCase().replace(/[^a-z0-9]/g, '');
  const userTld = fullDomain.substring(lastDot).toLowerCase();
  
  // Check: the exact domain, plus the name part with common TLDs (for competing risk analysis)
  const competingTlds = ['.com', '.co', '.io', '.app', '.net', '.org', '.me', '.now', '.tips', '.guide'];
  const tldsToCheck = [...new Set([userTld, ...competingTlds])];
  const results = {};

  await Promise.all(tldsToCheck.map(async (tld) => {
    const domain = namePart + tld;
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
// HELPER: Build domain-specific analysis prompt
// ═══════════════════════════════════════════════════
function buildDomainPrompt(name, industry, targetAudience) {
  // Parse domain parts for the prompt
  const lastDot = name.lastIndexOf('.');
  const namePart = lastDot > 0 ? name.substring(0, lastDot) : name;
  const tld = lastDot > 0 ? name.substring(lastDot + 1) : '';

  return `You are a world-class domain name consultant who combines linguistics, brand psychology, UX, web marketing strategy, and cultural anthropology. A client is considering a DOMAIN NAME and needs a thorough, honest evaluation.

═══════════════════════════════════════════════
THE DOMAIN TO ANALYZE
═══════════════════════════════════════════════

FULL DOMAIN: "${name}"
NAME PART (before the dot): "${namePart}"
TLD (after the dot): ".${tld}"
INDUSTRY / CONTEXT: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

═══════════════════════════════════════════════
DOMAIN-SPECIFIC ANALYSIS FRAMEWORK
═══════════════════════════════════════════════

CRITICAL FRAMING: This is a DOMAIN NAME, not just a brand name. The dot is structural — it separates the name part from the top-level domain. Analyze accordingly. When someone says "deft.now" aloud, they say "deft dot now." When they type it, they type it in a browser bar. Every test must account for this.

1. FIRST IMPRESSION
What does someone think when they see "${name}" as a web address? Does it look professional, clever, confusing? Does the TLD complement or undermine the name part? Does the combination read as a phrase, a command, a statement, or just a random pairing?

2. PHONETIC PROFILE
- How does "${namePart} dot ${tld}" sound spoken aloud?
- Is the "dot" transition smooth or awkward between those specific sounds?
- Syllable count of the FULL spoken form (including "dot")
- How does it sound in different accents? Do non-native English speakers handle both parts easily?
- Does the name part alone carry the brand, or is the TLD essential to the meaning?

3. MEMORABILITY TESTS (DOMAIN-SPECIFIC VERSIONS)
- Day-After Test: If someone saw this URL once on a slide, would they remember the full domain tomorrow — including the correct TLD?
- Tell-A-Friend Test: "You should check out ${name}" — would the friend type it correctly? Or would they try .com instead?
- Phone Test: Can you say "go to ${name}" on a phone call without confusion? Do you have to say "that's dot-${tld}, not dot-com"?
- Drunk Test: After 3 drinks, could someone type this into a browser and land on the right site?
- Shout Test: Could someone shout "check out ${name}!" at a conference and have people find it?

4. RADIO TEST (DOMAIN-CRITICAL)
If someone HEARD "go to ${namePart} dot ${tld}" on a podcast or radio ad, what would they type? This is the single most important test for a domain name. Consider:
- Would they spell the name part correctly?
- Would they type the correct TLD or default to .com?
- What are the likely wrong URLs they'd end up at?
- How many times would you need to repeat/spell it?

5. VISUAL ANALYSIS (BROWSER BAR FOCUS)
- How does "${name}" look in a browser address bar?
- How does it look as a link in an email or text message?
- Does the name part run into the dot confusingly? (e.g., "sell.it" vs "se.ll.it" confusion)
- Any letter combinations that could be misread at small sizes?
- How would it look on a business card?
- Logo/wordmark potential — does the dot add visual interest or clutter?

6. TLD ANALYSIS (DOMAIN-SPECIFIC SECTION)
- Is .${tld} a well-known, trusted TLD? Or niche/novel?
- What trust signal does .${tld} send? (e.g., .com = established, .app = tech-forward, .now = urgency, .me = personal)
- TLD confusion risk: Will people instinctively type .com instead?
- Does the TLD add meaning to the name part? (e.g., "fix.now" reads as a sentence — the TLD IS part of the name)
- Who owns ${namePart}.com? Is it a competitor, a parked page, or available?
- What other TLDs would work with "${namePart}" and how do they compare?

7. GLOBAL LANGUAGE SCAN
Check the NAME PART ("${namePart}") against these languages and report ANY meanings, associations, or sounds-like matches:
- Spanish, Portuguese, French, Italian, German, Dutch
- Mandarin Chinese, Japanese, Korean
- Arabic, Hindi, Urdu
- Russian, Polish
- Turkish, Swahili, Thai, Vietnamese
Also consider: Does the FULL domain "${name}" resemble any word or phrase in another language? Does ".${tld}" have meaning in other languages?

8. ABBREVIATION & NICKNAME AUDIT
- What will people call this site conversationally? ("Check out ${namePart}" or "go to ${name}"?)
- How does it hashtag? #${namePart.replace(/[^a-zA-Z0-9]/g, '')} — clean?
- What do people type in text messages when sharing the URL?
- If the company behind this domain gets big, what's the shorthand?

9. COMPETITIVE LANDSCAPE
- Are there existing sites with similar domains?
- How crowded is the TLD .${tld} namespace?
- Would someone searching for this site accidentally end up at a competitor?

10. SEO / SEARCHABILITY
- Does "${namePart}" as a search term face strong competition from dictionary words or established brands?
- Will people search for the brand name or type the domain directly?
- Does .${tld} have any SEO implications (Google treats all TLDs roughly equally, but user behavior differs)?

11. DOMAIN-SPECIFIC TESTS
- Browser bar test: When someone types "${name}" in a browser, is there any autocomplete interference or confusion?
- Typosquatting risk: What are the most likely typos? (adjacent keys, doubled letters, wrong TLD)
- Verbal sharing: Rate how easy it is to share this domain in conversation on a scale of effortless/easy/moderate/difficult/painful
- Email test: How does "hello@${name}" look and sound? Professional, quirky, confusing?

12. LONGEVITY CHECK
- Is the .${tld} TLD likely to remain active and supported in 10 years?
- Is the name part tied to trends that will date it?
- Could this domain still be the company's primary address in 2035?

13. EMOTIONAL RESONANCE
- What personality does the FULL domain project?
- Does the TLD choice send a signal about the company? (innovative? scrappy? established?)
- If this website were a physical store, what would it look like?

14. OVERALL VERDICT
- Strengths (things this domain does well)
- Weaknesses (things that concern you)
- Deal-breakers (if any)
- Final recommendation: STRONG / GOOD / FAIR / WEAK / RECONSIDER
- Brief, honest summary — lead with the most important thing

═══════════════════════════════════════════════
OUTPUT FORMAT — Return ONLY valid JSON
═══════════════════════════════════════════════

{
  "name_analyzed": "${name}",

  "overall_grade": "STRONG | GOOD | FAIR | WEAK | RECONSIDER",

  "overall_summary": "A 2-3 sentence honest verdict about this domain. Lead with the most important thing.",

  "first_impression": {
    "gut_reaction": "What someone thinks seeing this URL for the first time",
    "associations": ["3-5 immediate associations"],
    "personality_projected": "What personality this domain projects"
  },

  "phonetic_profile": {
    "syllables": "Full spoken form syllable count (e.g., 'deft-dot-now — 3 syllables')",
    "mouth_feel": "How '${namePart} dot ${tld}' physically feels to say",
    "accent_notes": "How it sounds across accents — any issues?",
    "sound_psychology": "What the specific sounds convey",
    "rhythm": "Musical quality of the full spoken domain"
  },

  "memorability": {
    "day_after_test": { "pass": true, "notes": "Would they remember the FULL domain including TLD?" },
    "tell_a_friend_test": { "pass": true, "notes": "Would the friend type the correct TLD?" },
    "phone_test": { "pass": true, "notes": "Can you say 'go to ${name}' without confusion?" },
    "drunk_test": { "pass": true, "notes": "Could they type the full domain correctly?" },
    "shout_test": { "pass": true, "notes": "Could someone shout this URL at a conference?" }
  },

  "radio_test": {
    "pass": true,
    "likely_misspellings": ["Wrong URLs people would type after hearing it aloud"],
    "notes": "Assessment — would they get the name AND the TLD right?"
  },

  "visual_analysis": {
    "lowercase": "How it looks: ${name}",
    "uppercase": "How it looks: ${name.toUpperCase()}",
    "title_case": "How it looks in title case",
    "url_appearance": "How it reads in a browser address bar",
    "logo_potential": "Assessment of the domain as a wordmark (with or without the dot)",
    "visual_issues": "Any problematic letter combinations or dot-adjacency issues, or 'None'"
  },

  "tld_analysis": {
    "tld_choice": "Assessment of .${tld} as a TLD — is it well-known? Trusted? Novel?",
    "trust_signal": "What trust/credibility signal does .${tld} send to users?",
    "confusion_risk": "How likely are people to type .com instead of .${tld}?",
    "competing_com": "Who owns ${namePart}.com? Is this a risk?",
    "alternative_tlds": "What other TLDs would work with '${namePart}' and how do they compare?"
  },

  "domain_specific": {
    "browser_bar_test": {
      "appearance": "${name}",
      "assessment": "How it looks and behaves in a real browser address bar"
    },
    "typosquat_risk": "Most likely typos and their consequences",
    "verbal_sharing": "Rate: effortless/easy/moderate/difficult/painful — with explanation",
    "email_test": "How 'hello@${name}' looks and sounds"
  },

  "global_language_scan": [
    {
      "language": "Language name",
      "finding": "What the name part or full domain means/sounds like",
      "severity": "positive | neutral | caution | problem"
    }
  ],

  "abbreviation_audit": {
    "natural_shortening": "What people will call this site conversationally",
    "initials": "What the initials spell (if applicable)",
    "hashtag": "How the name hashtags",
    "issues": "Any problems found, or 'Clean'"
  },

  "competitive_landscape": {
    "similar_names": ["Existing sites or brands with similar domains"],
    "crowdedness": "How crowded this naming space is",
    "differentiation": "How well this domain stands apart"
  },

  "searchability": {
    "uniqueness": "Is the name part a unique term or does it fight dictionary words?",
    "google_competition": "What dominates search results for the name part",
    "seo_assessment": "Overall SEO outlook for this domain"
  },

  "longevity": {
    "trend_dependency": "Is this tied to a passing trend?",
    "aging_risk": "Will the TLD or name feel dated?",
    "verdict": "Assessment of 10-year staying power"
  },

  "emotional_resonance": {
    "personality_match": "Does this domain's personality match the intended use?",
    "sensory_associations": "Colors, textures, environments it evokes",
    "if_it_were_a_person": "Describe this domain as a human personality"
  },

  "strengths": ["Specific things this domain does well"],

  "weaknesses": ["Specific concerns or issues"],

  "deal_breakers": ["Serious problems that should give pause, or empty array if none"],

  "suggestions": {
    "to_strengthen": "If keeping this domain, what could mitigate the weaknesses",
    "alternatives_direction": "If reconsidering, what direction to explore"
  }
}

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. THIS IS A DOMAIN, NOT JUST A NAME: Every assessment must consider the dot, the TLD, and how people interact with URLs. The Radio Test and Phone Test are 10x more important for domains than for brand names.

2. TLD HONESTY: If .${tld} is obscure and people will default to .com, say so clearly. The TLD choice can make or break a domain — don't downplay confusion risk.

3. THE .COM QUESTION: Always address who owns ${namePart}.com and what the risk is. This is often the #1 concern for domain buyers.

4. HONESTY OVER KINDNESS: The client needs truth. If this domain has problems, say so clearly. But be constructive.

5. SPECIFICITY: Back every claim with concrete reasoning about how people actually interact with URLs, browser bars, search engines, and verbal recommendations.

6. LANGUAGE CHECKS: Be thorough on the name part. A domain is global by definition.

7. Return ONLY the JSON object. No markdown, no preamble.`;
}

router.post('/nameaudit', async (req, res) => {
  try {
    const {
      name,
      context,
      industry,
      targetAudience,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!context) {
      return res.status(400).json({ error: 'Please select what this name is for' });
    }

    // Run live checks in parallel with AI analysis
    const isDomainMode = context === 'Domain Name';
    const showDomainChecks = isDomainMode || ['Business', 'Product', 'Band / Music Project', 'Creative Project', 'App', 'Event'].includes(context);

    const [aiAnalysis, domainResults, socialResults] = await Promise.all([
      // AI Analysis
      (async () => {
        const prompt = isDomainMode
          ? buildDomainPrompt(name, industry, targetAudience)
          : `You are a world-class naming consultant who combines linguistics, brand psychology, cultural anthropology, and marketing strategy. A client is asking you to evaluate a name they're considering. Give them the most thorough, honest analysis possible.

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
- Would this name still feel right in 2035?

11. EMOTIONAL RESONANCE
- What personality does this name project? (authoritative, playful, premium, scrappy, etc.)
- Does that personality match the intended context?
- What colors, textures, or environments does this name evoke?
- If this name were a person, how would you describe them?

12. OVERALL VERDICT
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

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = message.content.find(item => item.type === 'text')?.text || '';
        const cleaned = cleanJsonResponse(textContent);
        return JSON.parse(cleaned);
      })(),

      // Domain checks (parallel) — use domain-specific checker in domain mode
      showDomainChecks ? (isDomainMode ? checkDomainsForDomainMode(name) : checkDomains(name)) : null,

      // Social checks (parallel) — for domain mode, use the name part before the dot
      showDomainChecks ? checkSocials(isDomainMode && name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name) : null,
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
    const { names, context, industry } = req.body;

    if (!names || names.length < 2) {
      return res.status(400).json({ error: 'At least 2 names required for comparison' });
    }
    if (names.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 names for comparison' });
    }

    const isDomainMode = context === 'Domain Name';
    const domainPreamble = isDomainMode
      ? `\n\nCRITICAL: These are DOMAIN NAMES, not just brand names. The dot separates the name part from the TLD. Evaluate each as a URL people will type in browsers, share verbally, and see on business cards. The Radio Test (can someone hear it on a podcast and type the correct URL, including TLD?) is the single most important differentiator. Also assess TLD trust, .com competition risk, and typosquatting vulnerability for each.\n`
      : '';

    const prompt = `You are a world-class naming consultant. A client is torn between ${names.length} ${isDomainMode ? 'domain name' : 'name'} candidates and needs a clear comparison.

NAMES TO COMPARE: ${names.map((n, i) => `${i + 1}. "${n}"`).join(', ')}
WHAT IT'S FOR: ${context || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}${domainPreamble}

For each name, give a quick assessment across the key dimensions. Then declare a winner with clear reasoning.

Return ONLY this JSON:

{
  "candidates": [
    {
      "name": "The name",
      "grade": "STRONG | GOOD | FAIR | WEAK",
      "one_liner": "One sentence assessment",
      "best_quality": "Its single biggest strength",
      "biggest_risk": "Its single biggest weakness",
      "memorability": "high | medium | low",
      "radio_test": "pass | partial | fail",
      "global_safety": "clean | caution | problem",
      "tld_risk": "low | medium | high (only if comparing domain names, otherwise omit)",
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[NameAudit/Compare] Winner: ${parsed.winner?.name} (${parsed.winner?.margin})`);
    res.json(parsed);

  } catch (error) {
    console.error('[NameAudit/Compare] Error:', error);
    res.status(500).json({ error: 'Failed to compare names', details: error.message });
  }
});

module.exports = router;
