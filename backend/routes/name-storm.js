const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { anthropic, cleanJsonResponse, callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, CREATIVE_LIMITS } = require('../lib/rateLimiter');

// Apply creative-tier rate limit to all NameStorm routes (separate bucket from global)
router.use(rateLimit(CREATIVE_LIMITS, 'namestorm:'));

// ═══════════════════════════════════════════════════
// HELPER: Check domain availability via DNS
// ═══════════════════════════════════════════════════
async function checkDomain(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tlds = ['.com', '.co', '.io', '.app', '.net', '.org'];
  const results = {};

  await Promise.all(tlds.map(async (tld) => {
    const domain = slug + tld;
    try {
      await dns.resolve(domain);
      results[domain] = 'taken';
    } catch (err) {
      // ENOTFOUND means domain doesn't resolve — likely available
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
async function checkSocialHandle(name) {
  const handle = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const platforms = [
    { name: 'Instagram', url: `https://www.instagram.com/${handle}/` },
    { name: 'X/Twitter', url: `https://x.com/${handle}` },
    { name: 'TikTok', url: `https://www.tiktok.com/@${handle}` },
    { name: 'GitHub', url: `https://github.com/${handle}` },
  ];

  const results = {};

  await Promise.all(platforms.map(async (platform) => {
    try {
      const response = await fetch(platform.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(4000),
      });
      // 404 = likely available, 200 = likely taken
      results[platform.name] = response.status === 404 ? 'likely_available' : 'likely_taken';
    } catch {
      results[platform.name] = 'unknown';
    }
  }));

  return { handle: `@${handle}`, platforms: results };
}

// ═══════════════════════════════════════════════════
// HELPER: Domain-aware availability check
// ═══════════════════════════════════════════════════
async function checkDomainForDomainMode(fullDomain) {
  const lastDot = fullDomain.lastIndexOf('.');
  if (lastDot <= 0) return checkDomain(fullDomain);
  const namePart = fullDomain.substring(0, lastDot).toLowerCase().replace(/[^a-z0-9]/g, '');
  const userTld = fullDomain.substring(lastDot).toLowerCase();
  const competingTlds = ['.com', '.co', '.io', '.app', '.net', '.org', '.me', '.now', '.tips', '.guide'];
  const tldsToCheck = [...new Set([userTld, ...competingTlds])];
  const results = {};
  await Promise.all(tldsToCheck.map(async (tld) => {
    const domain = namePart + tld;
    try {
      await dns.resolve(domain);
      results[domain] = 'taken';
    } catch (err) {
      results[domain] = (err.code === 'ENOTFOUND' || err.code === 'ENODATA') ? 'likely_available' : 'unknown';
    }
  }));
  return results;
}

// ═══════════════════════════════════════════════════
// HELPER: Build domain-mode generation prompt
// ═══════════════════════════════════════════════════
function buildDomainStormPrompt(vibeText, constraints, industryContext, preferredTLDs, targetLanguages, maxChars, primaryLanguage) {
  const tldList = preferredTLDs?.length > 0
    ? preferredTLDs.map(t => t.startsWith('.') ? t : '.' + t).join(', ')
    : '.com, .net, .co, .io, .app, .me, .now, .tips, .guide, .one, .today, .tools, .space, .run, .how, .fyi, .live, .works';

  const isNonEnglish = primaryLanguage && primaryLanguage !== 'English';

  const langNote = isNonEnglish
    ? `PRIMARY AUDIENCE: ${primaryLanguage} speakers. Generate names that a ${primaryLanguage} speaker would find natural, clever, and memorable FIRST. English compatibility is a secondary bonus, not a requirement. Prioritize words, roots, and sounds from ${primaryLanguage} and closely related languages. Names should feel native to a ${primaryLanguage} speaker — not like English words with foreign flavor.${targetLanguages?.length > 0 ? ` Also check compatibility with: ${targetLanguages.join(', ')}.` : ''}`
    : targetLanguages?.length > 0
      ? `PRIMARY AUDIENCE: English speakers. Also ensure compatibility with: ${targetLanguages.join(', ')}.`
      : 'Must be easy to pronounce across English, Spanish, and German at minimum.';

  const charLimit = maxChars ? `MAX CHARACTERS: ${maxChars} total (name + dot + TLD).` : 'Prefer short domains — under 10 characters total is ideal.';

  const categoryOverride = isNonEnglish ? `
STYLE CATEGORIES — pick the 4-5 most relevant:
1. Native ${primaryLanguage} Words — Real words from ${primaryLanguage} that carry positive meaning: everyday words, poetic words, slang that translates well to a domain
2. ${primaryLanguage} Commands / Phrases — The TLD completes a thought in ${primaryLanguage} or creates a bilingual phrase
3. Cross-Cultural Bridges — Words from ${primaryLanguage} that happen to sound good or carry meaning in English too
4. Coined from ${primaryLanguage} Roots — Invented words built from ${primaryLanguage} word roots, prefixes, or suffixes that feel natural to ${primaryLanguage} speakers
5. Short & Universal — 2-5 character name parts that work in ${primaryLanguage} and look clean as a URL
6. Aspirational in ${primaryLanguage} — Words that evoke growth, success, or positive emotion specifically within ${primaryLanguage} culture
7. Playful ${primaryLanguage} — Fun, memorable words from ${primaryLanguage} slang, colloquialisms, or expressions that would make a ${primaryLanguage} speaker smile
8. Latin & Romance Roots — Words from shared Latin/Romance heritage that bridge ${primaryLanguage} with other languages` : `
STYLE CATEGORIES — pick the 4-5 most relevant:
1. Period Phrases — TLD completes a thought: fix.now, ask.me, go.tips
2. Latin & Romance Roots — globally pronounceable real words: deft.app, claro.me, modo.app
3. Short English Words — high-recognition: savvy.app, knack.me, crisp.now
4. Coined / Invented — ownable, trademarkable: solu.app, fixo.me, reko.tips
5. Multilingual Bridges — positive cross-language meaning: miao.app (Chinese: wonderful), pronto.me
6. Ultra-Minimal — 2-5 char name parts: go.now, qi.app, zen.tips
7. Aspirational / Lifestyle — beyond utility: able.now, voila.me, vamos.app
8. Playful & Sticky — fun, memorable: sorta.me, bonus.app, presto.me`;

  return `You are an elite domain name strategist. Generate complete domain names (word + TLD). The TLD is part of the creative act — "fix.now" reads as a command, "savvy.app" signals tech. Choose TLDs deliberately.${isNonEnglish ? ` You are generating domains for a ${primaryLanguage}-speaking audience. Think in ${primaryLanguage} first.` : ''}

BRIEF: ${vibeText}
CONSTRAINTS: ${constraints || 'None'}
INDUSTRY: ${industryContext || 'Not specified'}
TLDs TO USE: ${tldList}
${langNote}
${charLimit}
${categoryOverride}

Generate 4 domains per category. For each:
- name: full domain "deft.now"
- tld_rationale: why THIS TLD with THIS word (1 sentence)
- verbal_form: "deft dot now"
- pronunciation: phonetic guide if not obvious, else null
- why_it_works: Name DNA — sounds, meaning, name+TLD synergy (2-3 sentences)
- problems: array of {type, detail, severity}. Types: tld_confusion, competing_com, language_conflict, phonetic_issue, brand_similarity, spelling_difficulty. Severity: warning/caution/info. Empty array [] if clean.
- clean: true if no problems
- email_appearance: "hello@deft.now"
- domain_note: 1-sentence domain landscape note

After all categories: TOP 5 PICKS with rank, from_category, and why_top_pick. Then SAY IT OUT LOUD: flag domains that sound bad spoken aloud.

Return ONLY this JSON (no markdown):
{
  "brief_summary": "1-sentence summary",
  "categories_selected": ["category names"],
  "names_by_category": [
    {
      "category": "Name",
      "names": [
        {
          "name": "deft.now",
          "tld_rationale": "...",
          "verbal_form": "deft dot now",
          "pronunciation": null,
          "why_it_works": "...",
          "problems": [],
          "clean": true,
          "email_appearance": "hello@deft.now",
          "domain_note": "..."
        }
      ]
    }
  ],
  "top_picks": [{"name": "...", "from_category": "...", "why_top_pick": "...", "rank": 1}],
  "say_it_out_loud": [{"name": "...", "issue": "..."}],
  "naming_notes": "Strategic observations"
}

RULES:
1. Every output is a COMPLETE domain with TLD. "savvy" alone is invalid.
2. Vary TLDs — don't just append .app to everything.
3. problems must ALWAYS be an array (empty [] if clean, never null or a string).
4. Be honest about .com competition and TLD confusion risk.
5. TLD CONFUSION IS MANDATORY for novel TLDs: Any TLD other than .com, .org, .net, .app, .io, .co, or .me MUST get a tld_confusion problem flag (severity "caution" minimum). Most people default to .com — TLDs like .now, .tips, .guide, .tools, .today, .space, .how, .fyi are still uncommon and WILL cause confusion. Never skip this flag just because the domain sounds good.
6. Check name parts against major languages for unintended meanings.
7. Return ONLY valid JSON.`;
}

// ═══════════════════════════════════════════════════
// HELPER: Build domain-mode "More Like This" prompt
// ═══════════════════════════════════════════════════
function buildDomainMorePrompt(name, category, vibe, namingCategory, whyItWorks, preferredTLDs, primaryLanguage) {
  const lastDot = name.lastIndexOf('.');
  const namePart = lastDot > 0 ? name.substring(0, lastDot) : name;
  const tld = lastDot > 0 ? name.substring(lastDot) : '.app';
  const tldList = preferredTLDs?.length > 0
    ? preferredTLDs.map(t => t.startsWith('.') ? t : '.' + t).join(', ')
    : '.com, .net, .co, .io, .app, .me, .now, .tips, .guide, .one, .today, .tools, .space, .run';

  const isNonEnglish = primaryLanguage && primaryLanguage !== 'English';
  const langDirective = isNonEnglish
    ? `\nIMPORTANT: The primary audience speaks ${primaryLanguage}. Generate variations that feel natural and clever to ${primaryLanguage} speakers. Prioritize ${primaryLanguage} words and roots.`
    : '';

  return `You are an elite domain name strategist. The user likes this domain and wants more like it.${langDirective}

DOMAIN THEY LIKED: "${name}" (name part: "${namePart}", TLD: "${tld}")
WHAT IT'S FOR: ${category || 'Website / web app'}
STYLE: ${namingCategory || 'Not specified'}
WHY IT WORKS: ${whyItWorks || 'Not specified'}
VIBE: ${vibe || 'Not specified'}
TLDs TO USE: ${tldList}

Generate 5-6 domain variations that capture the same energy. Vary approach: some keep similar name part with different TLDs, some keep same TLD with different name parts, some are entirely new combinations.

Return ONLY this JSON:
{
  "liked_name_dna": "What makes this domain work (1-2 sentences)",
  "variations": [
    {
      "name": "full.domain",
      "tld_rationale": "Why this TLD",
      "verbal_form": "full dot domain",
      "pronunciation": null,
      "why_it_works": "How this captures the same energy",
      "problems": [],
      "clean": true,
      "email_appearance": "hello@full.domain",
      "domain_note": null
    }
  ]
}

RULES: problems must be an array ([] if clean). Check names for language conflicts. Return ONLY valid JSON.`;
}

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN GENERATION
// ═══════════════════════════════════════════════════
router.post('/namestorm', async (req, res) => {
  try {
    const {
      category,
      vibe,
      vibeChips,
      constraints,
      industryContext,
      preferredTLDs,
      targetLanguages,
      maxChars,
      primaryLanguage,
      competitors,
    } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!vibe && (!vibeChips || vibeChips.length === 0)) {
      return res.status(400).json({ error: 'Please describe the vibe or select at least one vibe chip' });
    }

    const isDomainMode = category === 'Domain Name';

    const vibeText = [
      vibeChips?.length > 0 ? `Vibe keywords: ${vibeChips.join(', ')}` : '',
      vibe ? `Description: ${vibe}` : '',
    ].filter(Boolean).join('. ');

    const isNonEnglish = primaryLanguage && primaryLanguage !== 'English';

    const competitorBlock = competitors
      ? `\n═══ COMPETITOR DIFFERENTIATION ═══\nCompetitors / names to avoid sounding like: ${competitors}\nCRITICAL: Generated names MUST sound, look, and feel clearly distinct from these competitors. Avoid similar:\n- Sound patterns (rhyme, alliteration, syllable structure)\n- Root words or morphemes\n- Visual similarity (same letter shapes, same length)\n- Conceptual overlap (same metaphor family)\nFlag any generated name that gets too close.\n`
      : '';

    const prompt = isDomainMode
      ? buildDomainStormPrompt(vibeText, constraints, industryContext, preferredTLDs, targetLanguages, maxChars, primaryLanguage)
      : `You are an elite naming strategist who combines creative linguistics, brand psychology, cultural awareness, and market intelligence. You've named hundreds of successful brands, products, and projects.${isNonEnglish ? ` You are generating names for a ${primaryLanguage}-speaking audience. Think in ${primaryLanguage} first.` : ''}

NAMING BRIEF

WHAT NEEDS A NAME: ${category}
VIBE / ENERGY: ${vibeText}
CONSTRAINTS: ${constraints || 'None specified'}
INDUSTRY / CONTEXT: ${industryContext || 'Not specified'}${competitorBlock}${isNonEnglish ? `
PRIMARY AUDIENCE LANGUAGE: ${primaryLanguage}. Names should feel natural and resonant to ${primaryLanguage} speakers FIRST. English compatibility is a bonus, not a requirement. Prioritize words, sounds, and cultural references from ${primaryLanguage} and closely related languages.` : ''}

STYLE CATEGORIES AVAILABLE
${isNonEnglish ? `
You have 15 style categories. Based on what's being named and the vibe described, select the 5-7 MOST RELEVANT. When a category calls for wordplay, humor, warmth, etc., draw from ${primaryLanguage} language and culture — not English.

Categories:
1. Clever / Wordplay — puns, double meanings, linguistic tricks in ${primaryLanguage}
2. Professional / Clean — trustworthy, grown-up names that sound polished in ${primaryLanguage}
3. Bold / Punchy — short, impactful names that hit hard in ${primaryLanguage}
4. Minimal — one or two syllables, clean sounds natural in ${primaryLanguage}
5. Funny / Irreverent — humor and personality rooted in ${primaryLanguage} culture
6. Nostalgic / Warm — comforting, familiar words or sounds from ${primaryLanguage} heritage
7. Abstract / Artistic — unusual, evocative words from ${primaryLanguage} or coined from its roots
8. Mythic / Epic — mythology, legends, and cultural stories from ${primaryLanguage}-speaking traditions
9. Nature / Organic — earthy, botanical words from ${primaryLanguage}
10. Techy / Future — sleek, modern-sounding names that work in ${primaryLanguage} context
11. Vintage / Heritage — old-fashioned charm drawn from ${primaryLanguage} history
12. Fierce / Edgy — attitude and grit expressed through ${primaryLanguage} sounds and words
13. Whimsical / Storybook — charming, delightful names from ${primaryLanguage} children's literature, fairy tales, or expressions
14. Cross-Cultural — names that bridge ${primaryLanguage} with English or other languages, carrying meaning in both
15. Coined from ${primaryLanguage} Roots — invented words built from ${primaryLanguage} prefixes, suffixes, or word roots`
: `
You have 15 style categories. Based on what's being named and the vibe described, select the 5-7 MOST RELEVANT categories. Don't force categories that don't fit — if someone is naming a golden retriever, skip "Techy / Future."

Categories:
1. Clever / Wordplay — puns, double meanings, linguistic tricks
2. Professional / Clean — trustworthy, corporate-ready, grown-up
3. Bold / Punchy — short, impactful, memorable, hits hard
4. Minimal — stripped down, one or two syllables, clean
5. Funny / Irreverent — humor, personality, makes people smile
6. Nostalgic / Warm — comforting, familiar, cozy feeling
7. Abstract / Artistic — unusual, evocative, open to interpretation
8. Mythic / Epic — mythology, legend, celestial, ancient languages
9. Nature / Organic — earthy, botanical, elemental, grounded
10. Techy / Future — sleek, invented syllables, startup energy
11. Vintage / Heritage — old-fashioned charm, timeless quality
12. Fierce / Edgy — attitude, grit, bite, unapologetic
13. Whimsical / Storybook — charming, slightly magical, delightful
14. Global / Multicultural — draws from specific languages/cultures with noted origin
15. Mashup / Coined — portmanteau, invented compound words with explained components`}

GENERATION INSTRUCTIONS

For each selected style category, generate 4-5 name options. For EVERY name:

1. THE NAME itself
2. PRONUNCIATION — phonetic guide if not obvious (skip for simple names like "Birch")
3. WHY IT WORKS — the linguistic/psychological reasoning: what sounds, syllable patterns, or associations create the intended feeling. This is the "Name DNA."${isNonEnglish ? ` Explain the meaning and cultural resonance in ${primaryLanguage}.` : ''}
4. PROBLEM FLAGS — check EVERY name against ALL of these:
   - Unintended meanings in other major languages (${isNonEnglish ? `English, ` : ''}Spanish, French, German, Mandarin, Japanese, Arabic, Hindi at minimum)
   - Phonetic issues — sounds bad when said aloud, awkward mouth-feel, easy to mishear${isNonEnglish ? ` (test pronunciation for both ${primaryLanguage} and English speakers)` : ''}
   - Similar to existing well-known brands (be specific — name the brand)
   - Potential trademark conflict zones (for business/product names)
   - Hard to spell from hearing it spoken (the "radio test")
   - Awkward abbreviations or initials
   - If NO problems found, explicitly say "clean"

5. For ${category === 'Business' || category === 'Product' ? 'business/product names' : 'all names where relevant'}: note likely domain situation — is [name].com almost certainly taken? Are there creative TLD alternatives?

AFTER generating all categories, provide:

TOP 5 PICKS — Your curated best choices across all categories with specific reasoning for why each is the strongest. Consider: memorability, uniqueness, vibe-match, absence of problems, and ${category === 'Business' || category === 'Product' ? 'brandability and domain potential' : 'how well it fits the naming context'}.${isNonEnglish ? ` Prioritize names that feel native to ${primaryLanguage} speakers.` : ''}

SAY IT OUT LOUD — Flag any names from any category that look great on paper but have phonetic issues when spoken. The "looks-good-sounds-bad" trap.

OUTPUT FORMAT — Return ONLY valid JSON

{
  "brief_summary": "1-sentence summary of the naming direction you took based on the brief",

  "categories_selected": ["Which 5-7 style categories you chose and why, as an array of category names"],

  "names_by_category": [
    {
      "category": "Category Name",
      "names": [
        {
          "name": "The Name",
          "pronunciation": "Phonetic guide or null if obvious",
          "why_it_works": "The Name DNA — what makes this name effective for this brief. Be specific about sounds, syllables, and associations.",
          "problems": [
            {
              "type": "language_conflict | phonetic_issue | brand_similarity | trademark_risk | spelling_difficulty | abbreviation_issue",
              "detail": "Specific description of the problem",
              "severity": "warning | caution | info"
            }
          ],
          "clean": true,
          "domain_note": "Brief note on domain situation, or null"
        }
      ]
    }
  ],

  "top_picks": [
    {
      "name": "The Name",
      "from_category": "Which category",
      "why_top_pick": "Specific reasoning for why this is a top choice",
      "rank": 1
    }
  ],

  "say_it_out_loud": [
    {
      "name": "The Name",
      "issue": "What goes wrong when you say it"
    }
  ],

  "naming_notes": "Any additional strategic observations about this naming space — common pitfalls, trends to be aware of, or creative directions to explore further"
}

CRITICAL RULES

1. ORIGINALITY: Generate names that are genuinely creative, not the first thing anyone would think of.${isNonEnglish ? ` Draw from ${primaryLanguage} vocabulary, slang, poetry, and cultural references — not just well-known ${primaryLanguage} words that English speakers already know.` : ' Avoid clichés for each category (no "Synergy" for business, no "Byte" for tech, no "Luna" for pets unless it fits perfectly).'}

2. PROBLEM-CHECK EVERYTHING: The problem flags are what make this tool valuable. Be thorough. Check every name against every language you can. If a name means something unfortunate in ANY major language, flag it. False negatives are worse than false positives.

3. CALIBRATE TO CATEGORY: A business name needs different qualities than a pet name. Business = memorable, professional, domain-friendly. Pet = fun to say, personality-forward. Baby = ages well, cultural considerations. Character = evocative, fits the world. Adjust your creativity accordingly.

4. RESPECT CONSTRAINTS: If the user specified length preferences, sounds to include/exclude, or language considerations, follow them strictly.

5. NAME DNA IS REQUIRED: Don't just say "this sounds nice." Explain WHY — the specific phonetic qualities, the cultural associations, the psychological impact of certain sounds (e.g., hard consonants feel strong, open vowels feel warm, sibilants feel sleek).

6. PROBLEMS MUST ALWAYS BE AN ARRAY: Even if a name is clean, return "problems": []. Never return null, a string, or omit the field.

7. Return ONLY the JSON. No markdown, no preamble.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isDomainMode ? 6000 : 7000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameStorm' });

    // Normalize: ensure all problems fields are arrays (AI sometimes returns null or strings)
    parsed.names_by_category?.forEach(cat => {
      cat.names?.forEach(n => {
        if (!Array.isArray(n.problems)) n.problems = [];
      });
    });

    res.json(parsed);

  } catch (error) {
    console.error('[NameStorm] Error:', error);
    res.status(500).json({ error: 'Failed to generate names', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: AVAILABILITY CHECK (domain + social)
// ═══════════════════════════════════════════════════
router.post('/namestorm/check', async (req, res) => {
  try {
    const { name, isDomainMode } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // For domain mode, use the domain-aware checker
    if (isDomainMode && name.includes('.')) {
      const namePart = name.substring(0, name.lastIndexOf('.'));
      const [domains, social] = await Promise.all([
        checkDomainForDomainMode(name),
        checkSocialHandle(namePart),
      ]);
      return res.json({ name, domains, social });
    }

    const [domains, social] = await Promise.all([
      checkDomain(name),
      checkSocialHandle(name),
    ]);

    res.json({ name, domains, social });

  } catch (error) {
    console.error('[NameStorm/Check] Error:', error);
    res.status(500).json({ error: 'Failed to check availability', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: MORE LIKE THIS
// ═══════════════════════════════════════════════════
router.post('/namestorm/more', async (req, res) => {
  try {
    const { name, category, vibe, namingCategory, whyItWorks, isDomainMode, preferredTLDs, primaryLanguage } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const isNonEnglish = primaryLanguage && primaryLanguage !== 'English';

    const prompt = isDomainMode
      ? buildDomainMorePrompt(name, category, vibe, namingCategory, whyItWorks, preferredTLDs, primaryLanguage)
      : `You are an elite naming strategist. The user likes this name and wants more like it.${isNonEnglish ? ` The primary audience speaks ${primaryLanguage}. Generate variations that feel natural and clever to ${primaryLanguage} speakers. Prioritize ${primaryLanguage} words, sounds, and cultural references.` : ''}

NAME THEY LIKED: "${name}"
WHAT IT'S FOR: ${category || 'Not specified'}
STYLE CATEGORY: ${namingCategory || 'Not specified'}
WHY IT WORKS: ${whyItWorks || 'Not specified'}
ORIGINAL VIBE: ${vibe || 'Not specified'}${isNonEnglish ? `\nPRIMARY LANGUAGE: ${primaryLanguage}` : ''}

Generate 8-10 variations that capture the SAME ENERGY as this name. Analyze what makes the liked name work (sound patterns, syllable count, linguistic tricks, cultural associations) and generate names that share those qualities while being distinct.

Return ONLY this JSON:

{
  "liked_name_dna": "What makes this name work — the specific qualities you're matching",
  "variations": [
    {
      "name": "The Name",
      "pronunciation": "Phonetic guide or null",
      "why_it_works": "How this captures the same energy as the liked name",
      "problems": [
        {
          "type": "language_conflict | phonetic_issue | brand_similarity | trademark_risk | spelling_difficulty | abbreviation_issue",
          "detail": "Specific problem",
          "severity": "warning | caution | info"
        }
      ],
      "clean": true,
      "domain_note": "Brief domain note or null"
    }
  ]
}

Same rules: check every name for problems in major languages, phonetic issues, brand conflicts. Be creative — don't just add prefixes/suffixes to the original. Return ONLY JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameStorm/More' });

    // Normalize problems arrays
    parsed.variations?.forEach(v => {
      if (!Array.isArray(v.problems)) v.problems = [];
    });

    res.json(parsed);

  } catch (error) {
    console.error('[NameStorm/More] Error:', error);
    res.status(500).json({ error: 'Failed to generate variations', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: BLEND MODE
// ═══════════════════════════════════════════════════
router.post('/namestorm/blend', async (req, res) => {
  try {
    const {
      seedWords,
      vibe,
      vibeChips,
      constraints,
      industryContext,
      primaryLanguage,
      pairWithDomains,
      preferredTLDs,
      competitors,
    } = req.body;

    if (!seedWords || seedWords.length < 2) {
      return res.status(400).json({ error: 'At least 2 seed words are required' });
    }

    const isNonEnglish = primaryLanguage && primaryLanguage !== 'English';
    const vibeText = [
      vibeChips?.length > 0 ? `Vibe keywords: ${vibeChips.join(', ')}` : '',
      vibe ? `Description: ${vibe}` : '',
    ].filter(Boolean).join('. ') || 'No specific vibe — focus on clever combinations';

    const tldDirective = pairWithDomains
      ? `\n\nDOMAIN PAIRING: After generating each blend, pair it with the best TLD to create a complete domain. Available TLDs: ${preferredTLDs?.length > 0 ? preferredTLDs.join(', ') : '.com, .net, .co, .io, .app, .me, .now, .tips, .guide, .one, .today, .tools'}. For each name, output the full domain as "name" (e.g., "clevkit.app") and include tld_rationale and email_appearance fields. NOTE: For invented/blended words, .com and .net become viable since the word didn't exist before — check these first.`
      : '';

    const langDirective = isNonEnglish
      ? `\nPRIMARY LANGUAGE: ${primaryLanguage}. Expand seeds using ${primaryLanguage} synonyms and related words first, then also include cross-language options. Blended names should feel natural to ${primaryLanguage} speakers.`
      : '';

    const blendCompetitorBlock = competitors
      ? `\nCOMPETITORS TO AVOID: ${competitors}\nBlended names must sound, look, and feel clearly distinct from these competitors.`
      : '';

    const prompt = `You are an expert linguistic blender and portmanteau creator. Your job is to take seed words, expand them into clouds of related words, then systematically blend them into original, brandable names that could NOT have been found by simply combining two whole words.

SEED WORDS: ${seedWords.join(', ')}
VIBE: ${vibeText}
CONSTRAINTS: ${constraints || 'None'}
INDUSTRY: ${industryContext || 'Not specified'}${blendCompetitorBlock}${langDirective}${tldDirective}

STEP 1: EXPAND EACH SEED

For each seed word, generate 8-12 synonyms, related words, and conceptually adjacent words. Think broadly:
- Direct synonyms and near-synonyms
- Words that capture the same FEELING but from different registers (formal, informal, poetic, technical)
- Shorter/punchier alternatives (especially 3-5 letter words — these blend best)
- Words from the same semantic field
- Abstract associations and metaphors${isNonEnglish ? `\n- ${primaryLanguage} equivalents and near-equivalents` : ''}

STEP 2: BLEND ACROSS ALL WORDS

Using the expanded word clouds (not just the original seeds), create blended names. Use ALL 6 of these strategies:

PAIR BLENDING (combine 2 source words):
1. Overlap Blends — one word's end overlaps with another's start. "brunch" = breakfast+lunch (the 'r' bridges both). The overlap must be a real shared sound, not just letters glued together.
2. Truncation Pairs — shorten two words and join at the cut point. "Microsoft" = microcomputer+software. Both words must lose something. This is the workhorse strategy for brandable portmanteaus.
3. Sound Bridges — two words share a phoneme that becomes the hinge. "intellisense" bridges through the shared 'l' sound. The bridge must be audible, not just visual.

ADVANCED BLENDING:
4. Nested Words — a short word hides INSIDE a longer blend. "calmunity" hides "calm" inside "community." The hidden word should be discoverable, not accidental. This produces the cleverest names.
5. Multi-Source Blends — use fragments from 3+ seed word clouds in a single name. The user gave you multiple seeds — most blends only use 2. Combine fragments from 3 or 4 clouds into one word. e.g., from seeds {spark, craft, neural, beacon}: "sparcnel" (spark + craft + neural). These are denser with meaning and more unique.
6. Phonetic-First — start from a TARGET SOUND, then find source fragments that produce it. Work backwards: decide what a smart, [insert vibe] 5-7 letter word would SOUND like, then reverse-engineer which seed/expanded fragments produce that sound. This is how professional naming agencies work — sound first, etymology second. The result should feel like a real word that happens to contain your seed meanings.

Generate 4 names per strategy (24 total). For EVERY name:

- name: The blended name${pairWithDomains ? ' as a full domain with TLD (e.g., "clevkit.app")' : ''}
- blend_components: Show the FULL recipe — which expanded words were used, what was cut, where the join happens. e.g., "keen (from smart) + nexus (from cortex) → kee + nex → keenex... too close to Kleenex, try: keen + cortex → ke + ortex → kortex... but that's just cortex. Final: keen + texture → keen + tex → keentex, truncate → kentex"
- pronunciation: Phonetic guide
- why_it_works: What makes this blend effective — sound quality, meaning ghosting (how much of each source word's MEANING survives even though the letters changed), mouth feel, memorability${pairWithDomains ? ', and how the TLD completes it' : ''}
- problems: Array of {type, detail, severity}. THOROUGHLY check for:
   - language_conflict: Does this blend accidentally mean something in Spanish, French, German, Mandarin, Japanese, Arabic, Hindi, Portuguese, Italian, Korean? Check EVERY blend. Portmanteaus are especially accident-prone because they create novel letter combinations.
   - brand_similarity: Is this too close to an existing brand? "Cortiq" → Cortex? "Smartex" → Smartsheet? Be specific — name the brand.
   - phonetic_issue: Awkward mouth feel, sounds like a different word when spoken fast, hard to say on the phone
   - spelling_difficulty: Would someone hearing this name be able to type it correctly? Unusual letter combinations are a red flag.
   - If a blend is genuinely clean across all checks, say so — but at least 40% of blends should have SOME flag. If you're finding zero problems, you're not checking hard enough.
   MUST be an array ([] if truly clean, but be honest).
- clean: true ONLY if no problems found after thorough checking${pairWithDomains ? `
- tld_rationale: Why this TLD for this blend
- email_appearance: "hello@blend.tld"` : ''}
- domain_note: Brief note on domain availability landscape

AFTER all strategies, provide:

TOP 5 PICKS — Best blends across all strategies. The best portmanteaus have: (1) both source meanings still ghosting through, (2) natural pronunciation, (3) under 8 characters, (4) no problems, (5) doesn't look like two words glued together.

SAY IT OUT LOUD — Flag blends that look clever on paper but are awkward to say. Portmanteaus fail the verbal test more often than regular words.

Return ONLY this JSON:
{
  "brief_summary": "1-sentence summary of the blending direction",
  "seed_expansion": [
    {"original": "clever", "expanded": ["deft", "savvy", "sharp", "keen", "astute", "nimble", "adroit", "bright", "swift", "shrewd"]}
  ],
  "categories_selected": ["Which blend strategies you used"],
  "names_by_category": [
    {
      "category": "Overlap Blends",
      "names": [
        {
          "name": "${pairWithDomains ? 'clevkit.app' : 'Clevkit'}",
          "blend_components": "clever + toolkit → clev + kit (overlap at 'k')",
          "pronunciation": "KLEV-kit",
          "why_it_works": "...",
          "problems": [],
          "clean": true,${pairWithDomains ? `
          "tld_rationale": "...",
          "email_appearance": "hello@clevkit.app",` : ''}
          "domain_note": "..."
        }
      ]
    }
  ],
  "top_picks": [{"name": "...", "from_category": "...", "why_top_pick": "...", "rank": 1}],
  "say_it_out_loud": [{"name": "...", "issue": "..."}],
  "naming_notes": "Strategic observations"
}

RULES:
1. USE THE EXPANDED WORD CLOUDS, not just the original seeds. The best blends come from synonyms the user didn't think of.
2. NO COMPOUND WORDS: If both source words survive fully intact (e.g., "flowkey", "brighthub", "deftpath"), it is NOT a blend — it's two words glued together. REJECT these. At least one source word must be truncated, overlapped, or transformed. "Spotify" is a blend. "Flowkey" is not. This is the single most important rule. DO NOT INCLUDE COMPOUND WORDS EVEN WITH A FLAG — if you catch yourself generating one, throw it away and generate a real blend as a replacement. Self-awareness without action is worthless.
3. SHOW YOUR WORK in blend_components. Show which expanded words you used, what you cut, where the join happens. If the recipe is just "word1 + word2", you haven't blended — you've concatenated.
4. problems must ALWAYS be an array ([] if clean). But be THOROUGH — portmanteaus create novel letter sequences that often have unintended meanings in other languages. Check every blend against Spanish, French, German, Mandarin, Japanese, Arabic, Hindi, Portuguese, Italian, Korean. Flag brand similarities by name. At least 40% of names should have at least one flag.
5. Favor blends under 8 characters (not counting TLD). Short is dramatically better.
6. USE ALL 6 STRATEGIES with 4 names each. The advanced strategies (Nested Words, Multi-Source, Phonetic-First) produce the most original results — invest extra creative effort there.
7. PHONETIC-FIRST IS SOUND-FIRST: For strategy 6, do NOT start with source words and modify them. Start by imagining what the perfect name SOUNDS like for this vibe, then find the source fragments inside that sound. The result should feel like a discovered word, not a constructed one.
8. Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameStorm/Blend' });

    // Normalize problems arrays
    parsed.names_by_category?.forEach(cat => {
      cat.names?.forEach(n => {
        if (!Array.isArray(n.problems)) n.problems = [];
      });
    });

    res.json(parsed);

  } catch (error) {
    console.error('[NameStorm/Blend] Error:', error);
    res.status(500).json({ error: 'Failed to generate blends', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: ITERATIVE REFINEMENT ("Almost Love")
// Takes a name the user almost likes + specific feedback
// ═══════════════════════════════════════════════════
router.post('/namestorm/refine', async (req, res) => {
  try {
    const {
      name, whyItWorks, pronunciation, problems,
      instruction, category, vibe,
      isDomainMode, competitors, preferredTLDs,
      primaryLanguage, userLanguage,
    } = req.body;

    if (!name || !instruction) {
      return res.status(400).json({ error: 'Name and refinement instruction are required' });
    }

    const langDirective = withLanguage(userLanguage);
    const competitorNote = competitors
      ? `\nCOMPETITOR NAMES TO CONTRAST AGAINST: ${competitors}\nGenerated names must sound, look, and feel clearly distinct from these competitors.`
      : '';
    const tldBlock = isDomainMode && preferredTLDs?.length > 0
      ? `\nPreferred TLDs: ${preferredTLDs.join(', ')}`
      : '';

    const prompt = `You are a world-class naming consultant. A client almost loves a name but wants specific changes. Your job: take their feedback and generate refined variations that address exactly what they asked for while keeping what made the original name work.
${langDirective ? `\n${langDirective}` : ''}

═══════════════════════════════
THE ORIGINAL NAME
═══════════════════════════════
Name: "${name}"
Why it works: ${whyItWorks || 'Not specified'}
Pronunciation: ${pronunciation || 'Not specified'}
Known problems: ${problems?.length > 0 ? problems.map(p => p.detail).join('; ') : 'None flagged'}

Category: ${category || 'General'}
Vibe: ${vibe || 'Not specified'}
${competitorNote}${tldBlock}

═══════════════════════════════
WHAT THE CLIENT WANTS CHANGED
═══════════════════════════════
"${instruction}"

═══════════════════════════════
YOUR TASK
═══════════════════════════════
Generate 6-8 refined variations that directly address the client's feedback while preserving the core appeal of the original name.

For each variation, explain how it specifically addresses the feedback.

Respond in JSON:
{
  "refinement_note": "Brief note on what approach you took to address the feedback",
  "variations": [
    {
      "name": "RefinedName",
      "pronunciation": "ruh-FIND-name",
      "why_it_works": "Why this variation is strong",
      "how_it_addresses_feedback": "Specifically how this addresses: ${instruction}",
      "clean": true,
      "problems": []
    }
  ]
}

For "problems", flag issues like the original tool does:
- { "detail": "description", "severity": "warning|caution|info" }
- Check: unintended meanings in other languages, phonetic issues, brand conflicts, awkward abbreviations
- "clean" = true means no problems found

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameStorm/Refine' });

    // Normalize problems arrays
    parsed.variations?.forEach(v => {
      if (!Array.isArray(v.problems)) v.problems = [];
    });

    res.json(parsed);

  } catch (error) {
    console.error('[NameStorm/Refine] Error:', error);
    res.status(500).json({ error: 'Failed to refine name', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: BRAND STORY GENERATOR
// Creates a brand narrative package for a chosen name
// ═══════════════════════════════════════════════════
router.post('/namestorm/story', async (req, res) => {
  try {
    const {
      name, whyItWorks, pronunciation, blendComponents,
      category, industryContext, vibe, userLanguage,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const langDirective = withLanguage(userLanguage);

    const prompt = `You are a world-class brand storyteller and naming consultant. A client has chosen a name and needs help selling it — to cofounders, investors, partners, and themselves. Create a compelling brand narrative around this name.
${langDirective ? `\n${langDirective}` : ''}

═══════════════════════════════
THE NAME
═══════════════════════════════
Name: "${name}"
Why it works: ${whyItWorks || 'Not specified'}
Pronunciation: ${pronunciation || 'Not specified'}
${blendComponents ? `Blend components: ${blendComponents}` : ''}
Category: ${category || 'Business'}
Industry: ${industryContext || 'Not specified'}
Vibe: ${vibe || 'Not specified'}

═══════════════════════════════
YOUR TASK
═══════════════════════════════
Create a brand story package. This should feel like something from a top naming agency's final presentation.

Respond in JSON:
{
  "origin_story": "2-3 sentences explaining where this name 'came from' — the insight, the metaphor, the connection. Make it feel intentional and meaningful, even if the name was AI-generated. This is the story people will tell when asked 'why that name?'",
  "tagline": "A 3-8 word tagline that pairs naturally with the name. Should feel like it belongs on a website hero section or business card.",
  "elevator_pitch": "1-2 sentences that use the name naturally in context. How you'd introduce the brand in conversation. Should demonstrate the name working in a real sentence.",
  "introduction_script": "A short script for how to verbally introduce the name: 'We're called [Name] — it comes from [origin]. We [what you do] for [who you serve].' Fill in plausible details based on the category and industry."
}

The story should:
- Feel authentic, not manufactured
- Connect the name's linguistic properties to the brand's purpose
- Be specific enough to use immediately, generic enough to not box them in
- Make the listener think "that's a great name" even if they didn't before

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'NameStorm/Story' });

    res.json(parsed);

  } catch (error) {
    console.error('[NameStorm/Story] Error:', error);
    res.status(500).json({ error: 'Failed to generate brand story', details: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// POST /namestorm/quick — ThingNamer
// Fast-path: describe a thing and its vibe → clever names
// ════════════════════════════════════════════════════════════
router.post('/namestorm/quick', async (req, res) => {
  try {
    const { whatIsIt, vibe, constraints, avoid, userLanguage } = req.body;
    if (!whatIsIt?.trim()) return res.status(400).json({ error: 'Describe what needs a name.' });

    const systemPrompt = `You are a naming expert who loves the weird, the clever, and the memorable. You know that most name generators produce the same 10 results anyone could think of. You go further.

Your philosophy:
- Clever beats obvious. Memorable beats safe. Specific beats generic.
- The best names make people smile or say "that's perfect"
- Consider: wordplay, portmanteaus, obscure references, unexpected juxtapositions, phonetic appeal, cultural resonance
- Flag any names that have accidental meanings, awkward acronyms, or pronunciation problems
- For informal naming (pets, WiFi, group chats, boats) — fun and personality beat brandability`;

    const userPrompt = `THING NAMER — FAST NAMING

WHAT NEEDS A NAME: "${whatIsIt.trim()}"
${vibe?.trim() ? `VIBE/PERSONALITY: ${vibe.trim()}` : ''}
${constraints?.trim() ? `CONSTRAINTS: ${constraints.trim()}` : ''}
${avoid?.trim() ? `AVOID: ${avoid.trim()}` : ''}

Generate 12–16 names across 3–4 creative directions. Go clever. Go specific. Don't give them the first 10 results from a name generator.

Return ONLY valid JSON:
{
  "directions": [
    {
      "direction": "Short label for this creative angle (e.g., 'Wordplay', 'Pop culture riff', 'Descriptive twist', 'Unexpected reference')",
      "names": [
        {
          "name": "The name",
          "score": 75,
          "note": "One sentence — why this one works, what the reference is, or why it fits",
          "flag": "Any issue to know about (awkward acronym, unintended meaning, hard to pronounce) — null if none"
        }
      ]
    }
  ],
  "top_pick": "The single name you'd put money on — and the 10-word pitch for it"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('NameStorm quick error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate names' });
  }
});

module.exports = router;
