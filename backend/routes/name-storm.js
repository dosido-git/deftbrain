const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, CREATIVE_LIMITS } = require('../lib/rateLimiter');

// The output kept drifting into brand-consultant voice — "telegraph healthy
// family meals", "word-of-mouth clarity", "category crystal clear". Accurate,
// but not how a person talks, and the Charter is explicit that a DeftBrain
// answer sounds like a knowledgeable friend rather than an agency deck. The
// worst version of this describes a name by its construction instead of by
// what the reader gets out of it, so that case is called out by example.
const PLAIN_LANGUAGE_RULE = 'PLAIN LANGUAGE. Say each sentence the way you would say it out loud to the person, not the way it would read in a pitch deck. A list of banned words is not enough — the giveaway is naming the technique instead of the payoff. Rewrite in that direction: "two-syllable coined word" becomes "short and made up, so nobody else owns it"; "telegraphs healthy family meals" becomes "people will guess it is about family dinners before you explain"; "strong phonetic clarity and word-of-mouth potential" becomes "easy to say, and easy for someone to repeat correctly"; "premium-approachable balance with category legibility" becomes "feels a bit upmarket without being fussy, and it is obvious what you do". Do not write: telegraphs, signals, conveys, evokes, resonance, viability, legibility, brand equity, ownable, positioning, differentiator, white space, dual-layer, imagery, or any phrase ending in -forward. Test every sentence: if it would sound strange said aloud in someone kitchen, rewrite it.';

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted names or phrases must be written plainly or with single quotes, or it breaks the JSON.';

// Apply creative-tier rate limit to all NameStorm routes (separate bucket from global)
// NOTE: never use router.use(rateLimit(...)) here — routers all mount at '/',
// so router-level middleware runs for EVERY /api request passing through the
// chain. That silently capped the whole site at CREATIVE_LIMITS (4/min/IP)
// from the initial commit until 2026-07-03. Apply limits per-route instead.

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
STYLE CATEGORIES — pick the 4 most relevant:
1. Native ${primaryLanguage} Words — Real words from ${primaryLanguage} that carry positive meaning: everyday words, poetic words, slang that translates well to a domain
2. ${primaryLanguage} Commands / Phrases — The TLD completes a thought in ${primaryLanguage} or creates a bilingual phrase
3. Cross-Cultural Bridges — Words from ${primaryLanguage} that happen to sound good or carry meaning in English too
4. Coined from ${primaryLanguage} Roots — Invented words built from ${primaryLanguage} word roots, prefixes, or suffixes that feel natural to ${primaryLanguage} speakers
5. Short & Universal — 2-5 character name parts that work in ${primaryLanguage} and look clean as a URL
6. Aspirational in ${primaryLanguage} — Words that evoke growth, success, or positive emotion specifically within ${primaryLanguage} culture
7. Playful ${primaryLanguage} — Fun, memorable words from ${primaryLanguage} slang, colloquialisms, or expressions that would make a ${primaryLanguage} speaker smile
8. Latin & Romance Roots — Words from shared Latin/Romance heritage that bridge ${primaryLanguage} with other languages` : `
STYLE CATEGORIES — pick the 4 most relevant:
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
  "naming_notes": "What is worth knowing, in plain words — name the surprising thing you noticed, not the method that produced it"
}

RULES:
1. Every output is a COMPLETE domain with TLD. "savvy" alone is invalid.
2. Vary TLDs — don't just append .app to everything.
3. problems must ALWAYS be an array (empty [] if clean, never null or a string).
4. Be honest about .com competition and TLD confusion risk.
5. TLD CONFUSION IS MANDATORY for novel TLDs: Any TLD other than .com, .org, .net, .app, .io, .co, or .me MUST get a tld_confusion problem flag (severity "caution" minimum). Most people default to .com — TLDs like .now, .tips, .guide, .tools, .today, .space, .how, .fyi are still uncommon and WILL cause confusion. Never skip this flag just because the domain sounds good.
6. Check name parts against major languages for unintended meanings.
7. Return ONLY valid JSON.
8. ${NO_QUOTE_RULE}`;
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

RULES: problems must be an array ([] if clean). Check names for language conflicts. Return ONLY valid JSON. ${NO_QUOTE_RULE}`;
}

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN GENERATION
// ═══════════════════════════════════════════════════
router.post('/namestorm', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
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
      userLanguage,
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

    // ── Non-domain mode is a 3-stage split (was one ~100s 9000-token call):
    //    1) FAST pre-pass picks the 5 most relevant style categories
    //    2) two parallel SMART calls generate names for 3 + 2 categories
    //    3) small SMART curation call produces top_picks / say_it_out_loud
    //    Response shape is unchanged after the merge.
    const CATEGORY_LIST_TEXT = isNonEnglish ? `
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
15. Coined from ${primaryLanguage} Roots — invented words built from ${primaryLanguage} prefixes, suffixes, or word roots` : `
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
15. Mashup / Coined — portmanteau, invented compound words with explained components`;

    const briefBlock = `NAMING BRIEF

WHAT NEEDS A NAME: ${category}
VIBE / ENERGY: ${vibeText}
CONSTRAINTS: ${constraints || 'None specified'}
INDUSTRY / CONTEXT: ${industryContext || 'Not specified'}${competitorBlock}${isNonEnglish ? `
PRIMARY AUDIENCE LANGUAGE: ${primaryLanguage}. Names should feel natural and resonant to ${primaryLanguage} speakers FIRST. English compatibility is a bonus, not a requirement. Prioritize words, sounds, and cultural references from ${primaryLanguage} and closely related languages.` : ''}`;

    const prompt = isDomainMode
      ? buildDomainStormPrompt(vibeText, constraints, industryContext, preferredTLDs, targetLanguages, maxChars, primaryLanguage)
      : null;

    const normalizeProblems = (obj) => {
      obj.names_by_category?.forEach(cat => {
        cat.names?.forEach(n => {
          if (!Array.isArray(n.problems)) n.problems = [];
        });
      });
      return obj;
    };

    if (isDomainMode) {
      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 8000,
        messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
      }, { label: 'NameStorm' });
      return res.json(normalizeProblems(parsed));
    }

    // Stage 1 — FAST pre-pass: pick the 5 most relevant categories.
    // Internal enum output — deliberately NOT localized (category names must
    // stay exact English; prose localization happens in the generation calls).
    const canonicalCats = CATEGORY_LIST_TEXT.split('\n').filter(Boolean)
      .map(l => l.replace(/^\d+\.\s*/, '').split('—')[0].trim());
    let cats = [];
    try {
      const pick = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 300,
        messages: [{ role: 'user', content: `${briefBlock}

STYLE CATEGORIES:
${CATEGORY_LIST_TEXT}

Pick the 5 MOST RELEVANT categories for this brief. Do not force categories that do not fit. Return ONLY valid JSON: {"categories": ["exact category name before the dash", "...", "...", "...", "..."]} ${NO_QUOTE_RULE}` }],
      }, { label: 'NameStorm-pick' });
      cats = (Array.isArray(pick.categories) ? pick.categories : [])
        .map(c => String(c).split('—')[0].trim())
        .filter(c => canonicalCats.includes(c));
    } catch (e) {
      console.warn('[NameStorm] category pre-pass failed, using defaults:', e.message);
    }
    for (const c of canonicalCats) {
      if (cats.length >= 5) break;
      if (!cats.includes(c)) cats.push(c);
    }
    cats = [...new Set(cats)].slice(0, 5);

    // Stage 2 — two parallel generation calls over disjoint category sets.
    const genPrompt = (catNames) => withLanguage(`You are an elite naming strategist who combines creative linguistics, brand psychology, cultural awareness, and market intelligence.${isNonEnglish ? ` You are generating names for a ${primaryLanguage}-speaking audience. Think in ${primaryLanguage} first.` : ''}

${briefBlock}

Generate names for EXACTLY these style categories (ALL of them MUST appear in the output, none omitted): ${catNames.join('; ')}.
Category meanings:
${CATEGORY_LIST_TEXT}

For each listed category generate exactly 4 name options. For EVERY name:
1. THE NAME itself
2. PRONUNCIATION — phonetic guide if not obvious (null if obvious)
3. WHY IT WORKS — in plain words, what makes this name land: the sounds, the length, what it brings to mind.${isNonEnglish ? ` Explain the meaning and cultural resonance in ${primaryLanguage}.` : ''}
4. PROBLEM FLAGS — check EVERY name against ALL of these: unintended meanings in other major languages (${isNonEnglish ? 'English, ' : ''}Spanish, French, German, Mandarin, Japanese, Arabic, Hindi at minimum); phonetic issues; similarity to existing well-known brands (name the brand); trademark conflict zones; the radio test (hard to spell from hearing); awkward abbreviations. If NO problems found, "problems" is [] and "clean" is true.
5. ${category === 'Business' || category === 'Product' ? 'Note the likely domain situation — is [name].com almost certainly taken? Creative TLD alternatives?' : 'Where relevant, note the likely domain situation.'}

Return ONLY valid JSON:
{
  "names_by_category": [
    {
      "category": "Category Name",
      "names": [
        {
          "name": "The Name",
          "pronunciation": "Phonetic guide or null if obvious",
          "why_it_works": "One or two sentences on what makes it work, said the way you would say it to a friend",
          "problems": [
            {"type": "language_conflict | phonetic_issue | brand_similarity | trademark_risk | spelling_difficulty | abbreviation_issue", "detail": "Specific description", "severity": "warning | caution | info"}
          ],
          "clean": true,
          "domain_note": "Brief note on domain situation, or null"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. ORIGINALITY: genuinely creative, not the first thing anyone would think of.${isNonEnglish ? ` Draw from ${primaryLanguage} vocabulary, slang, poetry, and cultural references.` : ' Avoid clichés (no "Synergy" for business, no "Byte" for tech, no "Luna" for pets unless it fits perfectly).'}
2. PROBLEM-CHECK EVERYTHING: false negatives are worse than false positives.
3. CALIBRATE TO CATEGORY: business = memorable/professional/domain-friendly; pet = fun to say; baby = ages well; character = evocative.
4. RESPECT CONSTRAINTS strictly.
5. "problems" MUST always be an array — [] when clean, never null or a string.
6. "type" and "severity" are internal keys, not prose: write their values in English exactly as listed above, never translated. Only "detail" is written for the reader.
7. BE CONCISE: every field a phrase or single sentence — no meta-notes.
8. ${PLAIN_LANGUAGE_RULE}
9. Return ONLY the JSON. No markdown, no preamble.
10. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    // Generation is the long pole of the three stages (pick → generate →
    // curate, and curate cannot start until every name exists). Two calls split
    // 3/rest at 5000/3500 left the run at 61s, past the ~60s where Safari
    // abandons the fetch. Three even chunks at 3000 each brought it to ~55s —
    // still only seconds of headroom, so a single 529 retry inside any stage
    // pushed the whole request back over 60s and the dropped connection
    // surfaced to the user as a 502. One category per call makes the pole one
    // category's output instead of two, which buys back enough room that a
    // retry no longer blows the budget. The partition still guarantees no name
    // is generated twice, and one-per-chunk keeps the pick stage's order.
    const chunks = cats.map(c => [c]);

    // allSettled, not all. Splitting one category per call cut the wall clock,
    // but it also means five independent chances for a transient API error, and
    // Promise.all turns any one of them into a 500 for the whole request — which
    // is how a ~13% intermittent failure appeared in the German golden case.
    // Four categories of names beats an error page, so a straggler is dropped
    // and logged; only a total wipeout is worth failing on.
    const settled = await Promise.allSettled(chunks.map((chunk, i) => callClaudeWithRetry({
      model: MODELS.SMART,
      // 4 names for a single category — ~700 tokens in English, but German and
      // Thai run far longer, and one truncated call throws and 500s the entire
      // request. A ceiling only costs when it is hit.
      max_tokens: 3200,
      messages: [{ role: 'user', content: genPrompt(chunk) }],
    }, { label: `NameStorm-gen${i + 1}` })));

    const genFailed = settled.filter(r => r.status === 'rejected');
    if (genFailed.length) {
      console.warn(`[NameStorm] ${genFailed.length}/${chunks.length} generation call(s) failed, continuing with the rest:`,
        genFailed.map(f => f.reason?.message).join(' | '));
    }
    const gens = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!gens.length) throw new Error(`all ${chunks.length} generation calls failed: ${genFailed[0]?.reason?.message}`);

    // Chunks are contiguous slices, so concatenating keeps the category order
    // the pick stage chose.
    const namesByCategory = gens.flatMap(g => (Array.isArray(g.names_by_category) ? g.names_by_category : []));

    // Stage 3 — small curation call across ALL generated names.
    const compactList = namesByCategory.flatMap(cat =>
      (cat.names || []).map(n => `- ${n.name} [${cat.category}] — ${n.why_it_works || ''}${Array.isArray(n.problems) && n.problems.length ? ` (flags: ${n.problems.map(pb => pb.type).join(', ')})` : ' (clean)'}`)
    ).join('\n');

    // Stage 3 was the single biggest cost in the whole request — a SMART call
    // that sat at 24-29s producing ~500 tokens, purely because it re-derived
    // the spoken-aloud problem list from scratch. That detection now comes off
    // the generation stage below, which is SMART and already checked every
    // name against the radio test. What is left here is ranking and summary
    // over an already-analysed list, which FAST does in 7-9s at the same
    // quality — measured side by side, not assumed.
    // Losing this one call after five successful generations would throw away
    // every name to save nothing. The picks are a ranking over names we already
    // hold, so a failure degrades to the cleanest-first ordering instead of a
    // 500 — the reader loses the written rationale, not the work.
    let curated = {};
    try {
      curated = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2200,
      messages: [{ role: 'user', content: withLanguage(`You are an elite naming strategist. Brief:

${briefBlock}

CANDIDATE NAMES (already generated and problem-checked):
${compactList}

Curate them. Return ONLY valid JSON:
{
  "brief_summary": "1 plain sentence on the direction these names take — no pitch-deck words",
  "top_picks": [
    {"name": "The Name", "from_category": "Which category", "why_top_pick": "Why this one, in plain words — one sentence", "rank": 1}
  ],
  "naming_notes": "What is worth knowing before choosing — one or two sentences, plainly put"
}

RULES: exactly 5 top_picks ranked 1-5, chosen for memorability, uniqueness, vibe-match, absence of problems${category === 'Business' || category === 'Product' ? ', brandability and domain potential' : ''}.${isNonEnglish ? ` Prioritize names that feel native to ${primaryLanguage} speakers.` : ''} Use ONLY names from the candidate list, spelled exactly. ${PLAIN_LANGUAGE_RULE} Return ONLY the JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
      }, { label: 'NameStorm-curate' });
    } catch (e) {
      console.warn('[NameStorm] curation failed, falling back to score order:', e.message);
      const ranked = namesByCategory
        .flatMap(cat => (cat.names || []).map(n => ({ n, cat: cat.category })))
        .sort((a, b) => ((a.n.problems?.length || 0) - (b.n.problems?.length || 0)) || (String(a.n.name).length - String(b.n.name).length))
        .slice(0, 5);
      curated = {
        top_picks: ranked.map((r, i) => ({
          name: r.n.name, from_category: r.cat, why_top_pick: r.n.why_it_works || '', rank: i + 1,
        })),
      };
    }

    // "Say it out loud" is a filter over work the generation stage already did
    // rather than a second model pass: it problem-checks every name for the
    // radio test and phonetic conflicts, so re-asking a model to find the same
    // issues cost a full round trip AND let the two disagree — a name could be
    // flagged on its card and absent from this list. Reading the flags instead
    // keeps them consistent by construction. Depends on the pinned English
    // enums above; without that pin these values arrive translated and the
    // section silently empties in all 12 non-English languages.
    const SPOKEN_TYPES = new Set(['phonetic_issue', 'spelling_difficulty']);
    const SEVERITY_RANK = { warning: 0, caution: 1, info: 2 };
    const sayItOutLoud = namesByCategory
      .flatMap(cat => (cat.names || []).map(n => ({
        name: n.name,
        flag: (Array.isArray(n.problems) ? n.problems : []).find(pb => SPOKEN_TYPES.has(pb.type)),
      })))
      .filter(x => x.name && x.flag?.detail)
      .sort((a, b) => (SEVERITY_RANK[a.flag.severity] ?? 3) - (SEVERITY_RANK[b.flag.severity] ?? 3))
      .slice(0, 6)
      .map(x => ({ name: x.name, issue: x.flag.detail }));

    const parsed = normalizeProblems({
      brief_summary: curated.brief_summary || '',
      names_by_category: namesByCategory,
      top_picks: Array.isArray(curated.top_picks) ? curated.top_picks : [],
      say_it_out_loud: sayItOutLoud,
      naming_notes: curated.naming_notes || '',
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
router.post('/namestorm/check', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
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
router.post('/namestorm/more', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
  try {
    const { name, category, vibe, namingCategory, whyItWorks, isDomainMode, preferredTLDs, primaryLanguage, userLanguage } = req.body;
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

Same rules: check every name for problems in major languages, phonetic issues, brand conflicts. Be creative — don't just add prefixes/suffixes to the original. Keep every field to a phrase or single sentence. Return ONLY JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
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
router.post('/namestorm/blend', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
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
      userLanguage,
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

    // This was one 8,500-token call doing everything: expand the seeds, blend 18
    // names across 6 strategies, rank the top 5, write the notes. Back-to-back
    // runs measured 112s and 237s — a browser abandons the fetch long before
    // that, so blend mode was effectively down for anyone who actually used it.
    // Same three-stage shape as the main generate route: a cheap expansion, a
    // parallel blend over disjoint strategies, then a small curation. The
    // strategies are data now rather than prose, because the partition needs to
    // hand each call a different slice of them.
    const STRATEGIES = [
      { label: 'Words that naturally merge',
        def: `Overlap Blends — one word's end overlaps with another's start. "brunch" = breakfast+lunch (the 'r' bridges both). The overlap must be a real shared sound, not just letters glued together.` },
      { label: 'Pieces of both words',
        def: `Truncation Pairs — shorten two words and join at the cut point. "Microsoft" = microcomputer+software. Both words must lose something. This is the workhorse strategy for brandable portmanteaus.` },
      { label: 'Names that flow when spoken',
        def: `Sound Bridges — two words share a phoneme that becomes the hinge. "intellisense" bridges through the shared 'l' sound. The bridge must be audible, not just visual.` },
      { label: 'Hidden meanings',
        def: `Nested Words — a short word hides INSIDE a longer blend. "calmunity" hides "calm" inside "community." The hidden word should be discoverable, not accidental. This produces the cleverest names.` },
      { label: 'Three ideas in one',
        def: `Multi-Source Blends — use fragments from 3+ seed word clouds in a single name. Most blends only use 2. e.g., from seeds {spark, craft, neural, beacon}: "sparcnel" (spark + craft + neural). These are denser with meaning and more unique.` },
      { label: 'Names invented for their sound',
        def: `Phonetic-First — start from a TARGET SOUND, then find source fragments that produce it. Work backwards: decide what a smart, on-vibe 5-7 letter word would SOUND like, then reverse-engineer which seed/expanded fragments produce that sound. Sound first, etymology second — the result should feel like a discovered word, not a constructed one.` },
    ];

    const briefHeader = `SEED WORDS: ${seedWords.join(', ')}
VIBE: ${vibeText}
CONSTRAINTS: ${constraints || 'None'}
INDUSTRY: ${industryContext || 'Not specified'}${blendCompetitorBlock}${langDirective}`;

    // ─── Stage 1: expand each seed into a word cloud ───
    // Mechanical recall, not judgement, so it runs on the fast model. Every
    // blend downstream draws from this, which is also why it cannot be folded
    // into the parallel calls — they would each invent a different cloud.
    let seedExpansion = [];
    try {
      const expanded = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 2200,
        messages: [{ role: 'user', content: withLanguage(`${briefHeader}

For each seed word, generate 8-12 synonyms, related words, and conceptually adjacent words. Think broadly:
- Direct synonyms and near-synonyms
- Words that capture the same FEELING but from different registers (formal, informal, poetic, technical)
- Shorter/punchier alternatives (especially 3-5 letter words — these blend best)
- Words from the same semantic field
- Abstract associations and metaphors${isNonEnglish ? `\n- ${primaryLanguage} equivalents and near-equivalents` : ''}

Return ONLY valid JSON: {"seed_expansion": [{"original": "clever", "expanded": ["deft", "savvy", "sharp", "keen", "astute", "nimble", "adroit", "bright", "swift", "shrewd"]}]} ${NO_QUOTE_RULE}`, userLanguage) }],
      }, { label: 'NameStorm/Blend-expand' });
      seedExpansion = Array.isArray(expanded.seed_expansion) ? expanded.seed_expansion : [];
    } catch (e) {
      console.warn('[NameStorm/Blend] seed expansion failed, blending from raw seeds:', e.message);
    }

    const cloudText = seedExpansion.length
      ? seedExpansion.map(sd => `${sd.original}: ${(Array.isArray(sd.expanded) ? sd.expanded : []).join(', ')}`).join('\n')
      : seedWords.join(', ');

    // ─── Stage 2: blend, two strategies per call ───
    const blendPrompt = (group) => withLanguage(`You are an expert linguistic blender and portmanteau creator. You take word clouds and blend them into original, brandable names that could NOT have been found by simply combining two whole words.

${briefHeader}${tldDirective}

EXPANDED WORD CLOUDS — blend from these, not just the raw seeds:
${cloudText}

Use EXACTLY these ${group.length} strategies, 3 names each (${group.length * 3} total):
${group.map((st, i) => `${i + 1}. ${st.def}\n   Output this group with "category" set to EXACTLY: ${st.label}`).join('\n')}

BREVITY IS CRITICAL: keep every string field to ONE tight sentence. The response must be complete JSON that closes; never pad. For EVERY name:

- name: The blended name${pairWithDomains ? ' as a full domain with TLD (e.g., "clevkit.app")' : ''}
- blend_components: the recipe — which expanded words were used, what was cut, where the join happens. e.g., "keen + texture → keen + tex → kentex"
- pronunciation: Phonetic guide
- why_it_works: What makes this blend effective — how it sounds, how much of each source word's meaning survives, how memorable it is${pairWithDomains ? ', and how the TLD completes it' : ''}
- problems: Array of {type, detail, severity}. THOROUGHLY check for:
   - language_conflict: Does this blend accidentally mean something in Spanish, French, German, Mandarin, Japanese, Arabic, Hindi, Portuguese, Italian, Korean? Check EVERY blend — portmanteaus are accident-prone because they create novel letter combinations.
   - brand_similarity: Too close to an existing brand? Be specific — name the brand.
   - phonetic_issue: Awkward mouth feel, sounds like a different word spoken fast, hard to say on the phone
   - spelling_difficulty: Could someone hearing this name type it correctly? Unusual letter combinations are a red flag.
   - At least 40% of blends should carry SOME flag. Zero problems means you are not checking hard enough.
- clean: true ONLY if no problems found after thorough checking${pairWithDomains ? `
- tld_rationale: Why this TLD for this blend
- email_appearance: "hello@blend.tld"` : ''}
- domain_note: Brief note on domain availability landscape

Return ONLY valid JSON:
{
  "names_by_category": [
    {
      "category": "${group[0].label}",
      "names": [
        {
          "name": "${pairWithDomains ? 'clevkit.app' : 'Clevkit'}",
          "blend_components": "clever + toolkit → clev + kit (overlap at 'k')",
          "pronunciation": "KLEV-kit",
          "why_it_works": "...",
          "problems": [{"type": "phonetic_issue", "detail": "Specific description", "severity": "warning | caution | info"}],
          "clean": true,${pairWithDomains ? `
          "tld_rationale": "...",
          "email_appearance": "hello@clevkit.app",` : ''}
          "domain_note": "..."
        }
      ]
    }
  ]
}

RULES:
1. USE THE EXPANDED WORD CLOUDS, not just the original seeds. The best blends come from synonyms the user did not think of.
2. NO COMPOUND WORDS: If both source words survive fully intact (e.g., "flowkey", "brighthub", "deftpath"), it is NOT a blend — it is two words glued together. REJECT these. At least one source word must be truncated, overlapped, or transformed. "Spotify" is a blend. "Flowkey" is not. This is the single most important rule. DO NOT INCLUDE COMPOUND WORDS EVEN WITH A FLAG — if you catch yourself generating one, throw it away and generate a real blend instead.
3. SHOW YOUR WORK in blend_components. If the recipe is just "word1 + word2", you have concatenated, not blended.
4. problems must ALWAYS be an array ([] if clean).
5. Favor blends under 8 characters (not counting TLD). Short is dramatically better.
6. CATEGORY LABELS: "category" MUST be exactly the label given above. Never output the technique name — not "Overlap Blends", "Truncation Pairs", "Sound Bridges", "Nested Words", "Multi-Source Blends" or "Phonetic-First" — anywhere in the response.
7. "type" and "severity" are internal keys, not prose: write their values in English exactly as listed, never translated. Only "detail" is written for the reader.
8. BE CONCISE: every string field a phrase or single sentence — no length annotations.
9. ${PLAIN_LANGUAGE_RULE}
10. Return ONLY the JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    // One strategy per call. Two-per-call landed at ~50s, which clears the
    // browser's patience but leaves nothing for a retry; one-per-call makes the
    // pole three names instead of six.
    const groups = STRATEGIES.map(st => [st]);
    // allSettled for the same reason as the generate route: six parallel calls
    // are six chances for a transient failure, and one straggler must not cost
    // the reader all eighteen names.
    const blendSettled = await Promise.allSettled(groups.map((group, i) => callClaudeWithRetry({
      model: MODELS.SMART,
      // 3 names with their recipes. Localized output runs much longer, and a
      // truncated call throws rather than retrying — see the generate route.
      max_tokens: 2800,
      messages: [{ role: 'user', content: blendPrompt(group) }],
    }, { label: `NameStorm/Blend-gen${i + 1}` })));

    const blendFailed = blendSettled.filter(r => r.status === 'rejected');
    if (blendFailed.length) {
      console.warn(`[NameStorm/Blend] ${blendFailed.length}/${groups.length} blend call(s) failed, continuing with the rest:`,
        blendFailed.map(f => f.reason?.message).join(' | '));
    }
    const gens = blendSettled.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!gens.length) throw new Error(`all ${groups.length} blend calls failed: ${blendFailed[0]?.reason?.message}`);

    const namesByCategory = gens.flatMap(g => (Array.isArray(g.names_by_category) ? g.names_by_category : []));

    // ─── Stage 3: curate across everything ───
    const compactList = namesByCategory.flatMap(cat =>
      (cat.names || []).map(n => `- ${n.name} [${cat.category}] — ${n.why_it_works || ''}${Array.isArray(n.problems) && n.problems.length ? ` (flags: ${n.problems.map(pb => pb.type).join(', ')})` : ' (clean)'}`)
    ).join('\n');

    const curated = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(`You are an expert namer. The brief:

${briefHeader}

The seed words were expanded into these clouds, and the names below were blended from them:
${cloudText}

CANDIDATE BLENDS (already problem-checked):
${compactList}

Return ONLY valid JSON:
{
  "brief_summary": "1 plain sentence on where these names came from — no pitch-deck words",
  "top_picks": [{"name": "The Name", "from_category": "Which group", "why_top_pick": "Why this one, in plain words — one sentence", "rank": 1}],
  "naming_notes": "What is worth knowing, in plain words — two or three sentences"
}

RULES: exactly 5 top_picks ranked 1-5. The best portmanteaus have both source meanings still showing through, natural pronunciation, under 8 characters, no problems, and do not look like two words glued together. Use ONLY names from the candidate list, spelled exactly.
naming_notes: name the surprising thing you noticed — which words the good names actually came from — not the method that produced them. "The phonetic-first strategy consistently outperformed for premium-vibe briefs" is exactly the voice to avoid.
${PLAIN_LANGUAGE_RULE} Return ONLY the JSON. ${NO_QUOTE_RULE}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'NameStorm/Blend-curate' });

    // Spoken-aloud trouble is read off the flags the blend stage already set,
    // rather than asked for a second time — see the main generate route.
    const SPOKEN_TYPES = new Set(['phonetic_issue', 'spelling_difficulty']);
    const SEVERITY_RANK = { warning: 0, caution: 1, info: 2 };
    const sayItOutLoud = namesByCategory
      .flatMap(cat => (cat.names || []).map(n => ({
        name: n.name,
        flag: (Array.isArray(n.problems) ? n.problems : []).find(pb => SPOKEN_TYPES.has(pb.type)),
      })))
      .filter(x => x.name && x.flag?.detail)
      .sort((a, b) => (SEVERITY_RANK[a.flag.severity] ?? 3) - (SEVERITY_RANK[b.flag.severity] ?? 3))
      .slice(0, 6)
      .map(x => ({ name: x.name, issue: x.flag.detail }));

    const parsed = {
      brief_summary: curated.brief_summary || '',
      seed_expansion: seedExpansion,
      names_by_category: namesByCategory,
      top_picks: Array.isArray(curated.top_picks) ? curated.top_picks : [],
      say_it_out_loud: sayItOutLoud,
      naming_notes: curated.naming_notes || '',
    };

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
router.post('/namestorm/refine', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
  try {
    const {
      name, whyItWorks, pronunciation, problems,
      instruction, category, vibe,
      isDomainMode, competitors, preferredTLDs,
      userLanguage,
    } = req.body;

    if (!name || !instruction) {
      return res.status(400).json({ error: 'Name and refinement instruction are required' });
    }

    const langDirective = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
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

Keep every field to a phrase or single sentence — no length annotations. Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      temperature: 0.9,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
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
router.post('/namestorm/story', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
  try {
    const {
      name, whyItWorks, pronunciation, blendComponents,
      category, industryContext, vibe, userLanguage,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const langDirective = withLanguage('', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

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

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
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
router.post('/namestorm/quick', rateLimit(CREATIVE_LIMITS, 'namestorm:'), async (req, res) => {
  try {
    const { whatIsIt, vibe, constraints, avoid, userLanguage } = req.body;
    if (!whatIsIt?.trim()) return res.status(400).json({ error: 'Describe what needs a name.' });

    const systemPrompt = `You are a naming expert who loves the weird, the clever, and the memorable. You know that most name generators produce the same 10 results anyone could think of. You go further.

Your philosophy:
- Clever beats obvious. Memorable beats safe. Specific beats generic.
- The best names make people smile or say "that's perfect"
- Consider: wordplay, portmanteaus, obscure references, unexpected juxtapositions, phonetic appeal, cultural resonance
- Flag any names that have accidental meanings, awkward acronyms, or pronunciation problems
- For informal naming (pets, WiFi, group chats, boats) — fun and personality beat brandability
- People pick a direction before they pick a name — they are choosing which version of themselves the thing announces. Make each direction a world worth belonging to, and make its label say which world.

${PLAIN_LANGUAGE_RULE}

${NO_QUOTE_RULE}`;

    const userPrompt = `THING NAMER — FAST NAMING

WHAT NEEDS A NAME: "${whatIsIt.trim()}"
${vibe?.trim() ? `VIBE/PERSONALITY: ${vibe.trim()}` : ''}
${constraints?.trim() ? `CONSTRAINTS: ${constraints.trim()}` : ''}
${avoid?.trim() ? `AVOID: ${avoid.trim()}` : ''}

Generate 12–16 names across 3–4 creative directions. Go clever. Go specific. Don't give them the first 10 results from a name generator. Keep every field (note, flag, direction) to a single concise sentence — no length annotations.

Return ONLY valid JSON:
{
  "directions": [
    {
      "direction": "2-4 WORDS MAXIMUM, title case — this is a heading, not a sentence. The world these names come from, named the way someone would recognize it: 'Trail Culture', 'Photo and Memory', 'Unexpected References', 'Garage Nights'. Name the identity, never the technique — 'Wordplay' and 'Portmanteau' describe how you built it, which is not what anyone is choosing between.",
      "names": [
        {
          "name": "The name",
          "note": "One sentence — why this one works, what the reference is, or why it fits",
          "flag": "Any issue to know about (awkward acronym, unintended meaning, hard to pronounce) — null if none"
        }
      ]
    }
  ],
  "top_pick": "The single name you'd put money on — and the 10-word pitch for it"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'NameStorm/Quick' });
    res.json(parsed);

  } catch (error) {
    console.error('NameStorm quick error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
