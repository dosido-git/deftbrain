const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted names or phrases must be written plainly or with single quotes, or it breaks the JSON.';

// ═══════════════════════════════════════════════════
// HELPER: Domain DNS check — a signal, not a registration check
// ═══════════════════════════════════════════════════
// DNS resolution only proves *something* answers at that name; a domain can be
// registered-but-unconfigured and still resolve to nothing, or parked and still
// resolve. The old labels (`taken` / `likely_available`) implied a registrar
// lookup that never happened. Renamed to say exactly what was measured.
async function checkDomains(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tlds = ['.com', '.co', '.io', '.app', '.net', '.org', '.dev', '.xyz'];
  const results = {};

  await Promise.all(tlds.map(async (tld) => {
    const domain = slug + tld;
    try {
      await dns.resolve(domain);
      results[domain] = 'dns_detected';
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
        results[domain] = 'no_dns_detected';
      } else {
        results[domain] = 'unknown';
      }
    }
  }));

  return results;
}

// ═══════════════════════════════════════════════════
// HELPER: Suggested handle — formatting, not a live availability check
// ═══════════════════════════════════════════════════
// The previous version HEAD-requested five platforms and labelled the result
// likely_available / likely_taken. A 404 from Instagram, X, TikTok, GitHub or
// YouTube is not a reliable availability signal — platforms block, redirect and
// rate-limit HEAD requests inconsistently, so the label was noise dressed as a
// finding. This is deterministic string formatting; there is nothing to verify
// because it claims nothing.
function suggestedHandle(name) {
  const handle = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `@${handle}`;
}

// ═══════════════════════════════════════════════════
// HELPER: Check-before-you-commit checklist — code-computed, not model-authored
// ═══════════════════════════════════════════════════
// What still needs real-world verification does not depend on the specific
// name — it depends on what KIND of name this is. Generating it from the model
// risks the exact failure the rewrite exists to stop (a checklist item that
// quietly asserts the check already happened). Fixed wording, conditional only
// on whether a domain/handle is even relevant to this context.
function checklistFor(showDomainChecks) {
  const items = [
    'Search for existing businesses, products or projects using this name.',
    'Check trademark databases in the jurisdictions and categories that matter to you.',
  ];
  if (showDomainChecks) {
    items.push('Confirm domain registration with a registrar.');
    items.push('Check the social handles that matter to you directly.');
  }
  items.push('If international use matters, verify meaning and pronunciation with people who speak the relevant languages.');
  return items;
}

// ═══════════════════════════════════════════════════
// CORE PROMPT — prepended to every endpoint below
// ═══════════════════════════════════════════════════
const NAME_AUDIT_CORE = `NAME AUDIT — CORE PROMPT

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

You are helping someone stress-test a proposed name.

Your job is to identify what can reasonably be learned from the name itself,
what changes when the supplied context is considered, what practical problems
may exist, and what still needs real-world verification.

Do not perform naming theater.
Do not make an ordinary observation sound scientific merely because it concerns
phonetics, psychology, branding, linguistics, or marketing.

DISTINGUISH:

OBSERVABLE
- spelling
- length
- syllable structure when reasonably clear
- obvious pronunciation possibilities
- visible letter combinations
- common abbreviations
- ordinary semantic associations
- facts supplied by the visitor

REASONABLE INTERPRETATION
- impressions the name may create
- whether spelling may be ambiguous
- whether it feels formal, playful, technical, traditional, etc.
- whether the name fits the stated use
- whether it resembles a naming pattern or category convention

These are judgments, not objective facts.
Use language such as:
"may"
"can read as"
"could suggest"
"one possible association is"

REQUIRES VERIFICATION
- trademark status
- company existence
- competitive landscape
- current search results
- domain ownership or registrability
- social-handle availability
- current naming trends
- popularity statistics
- cultural or linguistic meaning outside languages you can confidently assess
- legal protectability
- current marketplace conflicts

Never silently turn REQUIRES VERIFICATION into fact.

Do not describe a heuristic judgment as though it were a test the name has
already passed. Nothing here was tried on a real listener — describe what
makes the name structurally suited to a test, not that it "passes" one.

Do not predict a domain's current registration status or price ("likely
taken", "probably expensive", "variants will probably be necessary") — that
is exactly the kind of claim the REQUIRES VERIFICATION list above already
rules out. Name the check; do not guess its outcome.

Do not infer how a specific audience segment will actually respond
("approachable for weekday commuters, soft enough for weekend family
visits") — that claims knowledge of real people's reactions nobody measured.
Stay on what the name itself does or doesn't read as, and say when a broad
audience description is too broad to support a more specific read.

Do not confuse epistemic caution with timid analysis. Analyze the name
boldly wherever the judgment comes from the name itself and the context
supplied — do not hedge a reading you can actually support. You may state
plainly, without hedging: a strong or weak semantic fit; weak category
clarity; spelling or pronunciation difficulty; genericness; flexibility or
narrowness for future use; visual and wordmark possibilities; an obvious
association; a real naming tradeoff; and, when comparing candidates, whether
one is clearly stronger than another and why. These are the reason this tool
exists — do not soften them into vagueness in the name of caution. Reserve
hedging for claims about PEOPLE — what an audience will remember, feel, or
infer, what a customer or investor will think — and require verification for
claims about THE WORLD, as listed above. The goal is not "say as little as
possible unless proven." The goal is "analyze the name boldly; don't invent
evidence."

A strong audit is useful even when no outside-world lookup has occurred.
Say what can be judged from the name and identify what should be checked before
the visitor commits.`;

// ═══════════════════════════════════════════════════
// Pinned enum + deterministic backstops
// ═══════════════════════════════════════════════════
const VERDICTS = ['STRONG FIT', 'GOOD FIT', 'MIXED', 'HAS PROBLEMS', 'RECONSIDER'];
const WORD_OF_MOUTH_RATINGS = ['LIKELY EASY', 'WORKABLE', 'LIKELY CONFUSING'];

function pinVerdict(data, field, fallback) {
  if (!data) return data;
  const v = String(data[field] || '').toUpperCase().trim();
  data[field] = VERDICTS.includes(v) ? v : fallback;
  return data;
}

// The frontend colours word_of_mouth.rating by value, so it has to survive
// withLanguage exactly — pinning to English here does not mean the visitor
// reads English; the frontend maps the pinned value to a t() key. This enum
// was not pinned in the original rewrite; closing that gap in the same pass
// that renamed its middle value, per the guard-vs-schema sweep habit.
function pinRating(data) {
  if (!data || !data.word_of_mouth) return data;
  const v = String(data.word_of_mouth.rating || '').toUpperCase().trim();
  data.word_of_mouth.rating = WORD_OF_MOUTH_RATINGS.includes(v) ? v : 'WORKABLE';
  return data;
}

// A hedge usually means the model is proposing rather than asserting — spare it.
const HEDGED = /\b(?:may|might|could|can (?:read|come across|feel)|often|tend(?:s)? to|one possible|possibly|appears? to|seems? to)\b/i;

const RULES = [
  // The result no longer HAS score fields — this catches one leaking into
  // prose anyway, which is the failure mode a schema change alone can't stop.
  ['invented a numeric score in prose', /\b\d{1,3}\s*(?:\/|out of)\s*100\b|\bscores?\s+(?:it\s+)?(?:an?\s+|about\s+|around\s+|roughly\s+)?\d{1,3}\b|\brate[sd]?\s+(?:it\s+)?(?:an?\s+|about\s+|around\s+)?\d{1,3}\s*\/\s*10\b/i],

  // The exact phrase this rewrite exists to remove — a scan that never happened,
  // reported as though it cleared the name.
  ['claimed a global-language clearance that did not happen', /\bclean global language profile\b|\bno (?:problems?|issues?) in (?:any|all|the )?major markets\b|\bglobally safe\b|\bsafe (?:across|in) (?:all|every) languages?\b|\bno issues? in (?:any|all) languages?\b/i],

  // A live-world fact stated as settled, without a live check having occurred.
  // Scoped to ownership/existence verbs so it doesn't catch a legitimate
  // linguistic-meaning observation ("already means X in Spanish").
  ['stated a live-world ownership fact as settled', /\bis (?:already |currently )?(?:owned|trademarked|registered|used|taken) by\b|\balready (?:exists|taken) as a\b|\bcurrently dominates\b|\bis a (?:funded|active|existing) (?:company|startup|brand)\b/i,
    (v) => HEDGED.test(v)],

  // "If it were a person…" and its variants — a fictional personality for the
  // brand, which is a claim about the world dressed as branding language.
  ['invented a fictional personality for the name', /\bif (?:it|this name) were a person\b|\bas a person,? this name\b|\bpersonality:\s/i],

  // "Open vowels signal approachability", "hard consonants create authority" —
  // branding folklore stated as behavioral science, unhedged.
  ['stated phoneme-to-psychology folklore as fact', /\b(?:open|closed|front|back) vowels?\s+(?:signals?|creates?|conveys?|projects?|adds?)\b|\b(?:hard|soft|plosive) consonants?\s+(?:signals?|creates?|conveys?|projects?|adds?)\b|\b[a-z]{1,3} sounds?\s+(?:signals?|creates?|adds?|feels?)\b/i,
    (v) => HEDGED.test(v)],

  // Universal pronunciation consistency claimed without evidence.
  ['claimed universal pronunciation consistency', /\bno (?:pronunciation )?disagreement across accents\b|\bconsistent(?:ly)? pronounced? (?:across|worldwide|globally|in every)\b|\buniversally pronounced\b|\bvirtually no (?:pronunciation )?disagreement\b/i],

  // Two AI generations agreeing is not independent evidence — the exact claim
  // Challenge This Audit exists to forbid.
  ['treated agreement between two AI passes as increased reliability', /\bagreement (?:between|across) (?:the )?(?:two )?(?:analyses|opinions|audits)\b.{0,40}\b(?:reliab|confiden|increas)/i,
    (v) => HEDGED.test(v)],

  // A heuristic judgment dressed as a test result — nothing here ran on a
  // real listener. Added in the 2026-09-05 micro-pass, from a live Kindling
  // probe: "it passes the core tests of memorability and ease."
  ['claimed the name passed a test that was never run', /\bpasses? the (?:core |key )?tests?\b/i],

  // "Making it easy to remember" states memorability as an achieved outcome.
  // A short, common, phonetically transparent spelling is a starting point
  // for word of mouth, not a guarantee of it.
  ['asserted memorability as an achieved fact', /\bmak(?:es?|ing) it easy to remember\b/i,
    (v) => HEDGED.test(v)],

  // A specific unverified business-name conflict, in softer clothing than
  // "is owned by" — the LIVE_WORLD_ASSERTION rule above doesn't catch this
  // phrasing because it names no verb of ownership, just "has used".
  ['claimed a specific unverified business-name conflict', /\band potentially other businesses (?:that|who) have used\b|\bother businesses that have used the same word\b/i],

  // Domain status/price is REQUIRES VERIFICATION, not something to guess at —
  // the largest current-world overreach found in the 2026-09-05 pass.
  ['predicted a domain\'s current registration status or price', /\.(?:com|io|co|net|org|app|dev|xyz)\b[^.!?]{0,25}\b(?:is|will be)\s+(?:likely|probably)\s+(?:taken|expensive|unavailable)\b|\bdomains?\s+(?:is|are|will be)\s+(?:likely|probably)\s+(?:taken|unavailable|expensive)\b|\bvariants? will (?:probably|likely) be necessary\b/i],

  // Absolutist confidence about how a real person would perceive or spell an
  // untested name — "almost certainly", "no plausible rival word".
  ['made an absolutist behavioral claim about an untested name', /\balmost certainly\b|\bno plausible rival\b/i],
];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    // No early return for arrays — see the Justify My Meeting note this
    // pattern is copied from: an array IS an object, so Object.entries below
    // enumerates its indices and a return-on-array here would leave every
    // array-of-strings field unchecked.
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'verdict' || k === 'rating' || k === 'severity' || k === 'how_close' || k === 'word_of_mouth') continue;
      if (typeof v === 'string') {
        // A nullable field described as "...or null" gets answered with the
        // STRING "null" often enough that it isn't worth chasing out of the
        // prompt one field at a time — how_it_looks.issues did it on the first
        // live probe. Every card renders `field && ...`, and a non-empty
        // string is truthy, so this normalizes to a real null before that
        // check ever runs. See crisis-prioritizer.js for the same fix.
        if (v.trim().toLowerCase() === 'null') { node[k] = null; continue; }
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 220 && (v.match(/[.!?]/g) || []).length <= 1) {
            console.log(`[name-audit] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[name-audit] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  // Blanking a named field leaves ''; a blanked array item reads as an empty
  // bullet, which is worse than no bullet, so array items are pruned instead.
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] === '') node.splice(i, 1); else prune(node[i]);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
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
      priority,
      userLanguage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!context) {
      return res.status(400).json({ error: 'Please select what this name is for' });
    }

    const showDomainChecks = ['Business', 'Product', 'Band / Music Project', 'Creative Project', 'App', 'Event', 'Domain Name'].includes(context);

    const [aiAnalysis, domainResults] = await Promise.all([
      (async () => {
        const prompt = `${NAME_AUDIT_CORE}

NAME: "${name}"
WHAT IT'S FOR: ${context}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
WHAT MATTERS MOST ABOUT THIS NAME: ${priority || 'Not specified — weigh the dimensions evenly'}

Evaluate the name across these areas.

SOUND & IMPRESSION
Describe how the name sounds, and what impression its sound may create. Do
not claim universal psychological effects from individual phonemes, and do
not assign an emotional quality — cozy, gentle, warm, authoritative — to a
sound or suffix as a direct, unhedged effect. That includes soft phrasing that
avoids words like "signals": "the -ling ending gives it a gentle, cozy sound"
makes the same unhedged claim as "signals approachability" does. Separate the
two moves instead: state the acoustic fact plainly, then hedge the impression.
Avoid: "Open vowels signal approachability." "Hard consonants create
authority." "The soft opening consonant and the -ling ending give it a
gentle, slightly cozy sound."
Prefer: "The long 'oo' gives the name a rounded, softer sound." "The initial K
gives the name a clear start, while the '-ling' ending softens the overall
sound; in this context it may read as informal and warm rather than refined."
Do not present branding folklore as behavioral science.

PHONETICS
Likely pronunciation, syllables, stress when reasonably clear, awkward
consonant/vowel combinations, plausible alternate pronunciations. Do not claim
pronunciation consistency "across accents" without evidence. Do not invent how
non-native speakers will pronounce the name. If pronunciation varies plausibly,
show the alternatives — otherwise leave alternate_pronunciations empty.

MEMORABILITY & WORD-OF-MOUTH
These are heuristic stress tests, not measured predictions — nothing here was
tried on a real listener. Ask: is it distinctive enough to stick? Could
someone repeat it after hearing it once? Could they plausibly spell it from
hearing it? Could they search for it later without seeing it written? Does it
survive a noisy-room / "drunk test"? Is there a genuinely similar-sounding
word or name it could be confused with?

Do not assert memorability as an achieved fact. "It is short, common, and
spelled exactly as it sounds, making it easy to remember and search after
hearing it once" states an outcome nobody tested. A short, familiar,
phonetically transparent spelling is a good STARTING POINT for word of mouth
— say that, not that it succeeds at it.

Do not use absolutist language for an untested name — "someone who hears it
once can almost certainly spell it and search for it," "there is no plausible
rival word it could be confused with." If a specific word is close enough to
be worth naming (a well-known near-homophone), name it as something worth
testing — never invent HOW OFTEN or in WHAT CONTEXT (typing, voice search)
that confusion would occur; there is no basis for that specificity.

Do not output true/false predictions of whether a person WILL remember it —
rate LIKELY EASY, WORKABLE, or LIKELY CONFUSING, and explain why in terms of
these tests.

likely_misspellings: only a misspelling that plausibly follows from how the
name sounds or a common spelling confusion belongs here. A dropped or altered
vowel that does not reflect how anyone would actually mishear the name reads
as generated, not observed — leave the array empty rather than manufacture
one to fill it.

TONE & ASSOCIATIONS
Describe plausible impressions created by the name in the supplied context. Do
not create a fictional personality for the brand — no "if it were a person...",
no "personality: a capable but unhurried collaborator...". Prefer: "The name
reads as relatively soft and approachable." "In this context, that may fit a
product intended to feel accessible." These are interpretations, not audience
research. Up to 3 short association words or phrases are fine as a supplement,
not a substitute for the summary.

FIT FOR WHAT YOU'RE NAMING
Whether the name fits the stated context, industry and audience — one or two
sentences of reasonable interpretation, not a verdict restated. Do not infer
how a specific audience segment will actually respond ("approachable for
weekday commuters, soft enough for weekend family visits, without leaning too
child-focused or too corporate") — that predicts real people's reactions from
a description too broad to support it. Stay on the name: whether it reads as
overtly corporate or child-focused, or neither, given what was supplied — and
say so plainly rather than manufacturing a more specific fit than the input
warrants.

HOW IT LOOKS
url_form (the name as a bare URL, nothing else), logo_potential (one
sentence), issues (a specific visual trap — e.g. an rn/cl pair that misreads —
or null if none).

ABBREVIATION AUDIT
Natural shortening, initials, hashtag form, and any issue with them — or
"Clean" if none.

COMPETITION & FINDABILITY
Do not state that a company currently exists, a competitor is active, a brand
is funded, a name dominates search, a category is crowded, SEO is unwinnable,
or a trademark is owned — unless that information came from verified
current-world data, which it has not. That includes softer phrasing like "and
potentially other businesses that have used the same word" — it still
asserts a specific unverified conflict rather than a structural fact. For a
common dictionary word, the structural fact is that search results MAY be
SHARED WITH general uses of the word; whether an actual business-name
conflict exists still needs to be checked. Evaluate only structural
findability: dictionary word vs. coined term, spelling ambiguity,
generic/descriptive quality, likely query ambiguity inherent in the word
itself.

LONGEVITY
Whether the name itself depends on slang, a dated naming construction, a
technology that may become obsolete, or a very narrow product/category
description. Do not predict how the name will feel ten years from now. Prefer:
"The -ly construction is associated with many technology-company names and may
make the name feel tied to that naming style." Avoid turning a naming-pattern
observation into a verdict on originality.

LANGUAGE & PRONUNCIATION FLAGS
Do not claim to have cleared a name across a fixed list of world languages.
Only report a meaning or sound-alike you can identify with reasonable
confidence, or a potential issue worth verifying. Never claim a "clean global
language profile" or that it is "globally safe" — you have not performed a
multilingual clearance. Most names will have 0-3 flags; omit neutral or
positive findings entirely. If the visitor named specific countries or
languages, prioritize those.

Return ONLY this JSON (no markdown, no preamble):

{
  "name_analyzed": "${name}",
  "verdict": "Exactly one of: STRONG FIT, GOOD FIT, MIXED, HAS PROBLEMS, RECONSIDER",
  "bottom_line": "1-2 sentence honest, contextual judgment — not a restated verdict",
  "what_works": ["Specific strength — one sentence each, 2-4 items"],
  "what_could_get_in_the_way": ["Specific problem or risk — one sentence each, 0-4 items"],
  "how_it_sounds": { "pronunciation": "e.g. LOO-mly, 2 syllables — one sentence", "alternate_pronunciations": ["plausible alternate — only if genuinely ambiguous"], "impression": "One or two cautious sentences on the impression the sound may create" },
  "word_of_mouth": { "rating": "Exactly one of: LIKELY EASY, WORKABLE, LIKELY CONFUSING", "why": "One or two sentences referencing the specific test(s) this depends on — no absolutist language ('almost certainly', 'no plausible rival')", "likely_misspellings": ["Only if genuinely plausible — omit the field entirely if none stand out"] },
  "tone_and_associations": { "summary": "1-2 cautious sentences, no personification", "associations": ["short phrase", "short phrase"] },
  "fit_for_context": "One or two sentences",
  "how_it_looks": { "url_form": "name.com. Nothing else.", "logo_potential": "One sentence", "issues": "Specific trap or null" },
  "abbreviation_audit": { "natural_shortening": "Short form — one sentence", "initials": "Initials or N/A — one sentence", "hashtag": "#hashtag — one sentence", "issues": "Problem or Clean — one sentence" },
  "competition_and_findability": { "structural_findability": "One or two sentences — dictionary word vs coined, spelling ambiguity, query ambiguity", "checks_needed": ["Specific current-world check this name warrants — one sentence each, 1-3 items"] },
  "longevity": "One or two sentences",
  "language_flags": [
    { "language": "Spanish — one sentence", "issue": "What it means or sounds like — one sentence", "severity": "caution | problem" }
  ]
}

language_flags: ONLY include languages where there is a genuine caution or problem, with reasonable confidence. Omit neutral/positive findings entirely — most names will have 0-3 flags.
${NO_QUOTE_RULE}`;

        return await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 3000,
          messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
        }, { label: 'NameAudit' });
      })(),

      showDomainChecks ? checkDomains(name) : null,
    ]);

    const result = validateResult(pinRating(pinVerdict(aiAnalysis, 'verdict', 'MIXED')));
    result.live_availability = showDomainChecks ? {
      domains: domainResults,
      suggested_handle: suggestedHandle(name),
    } : null;
    result.check_before_you_commit = checklistFor(showDomainChecks);

    if (!result.verdict) {
      return res.status(500).json({ error: 'Could not audit this name. Please try again.' });
    }
    res.json(result);

  } catch (error) {
    console.error('[NameAudit] Error:', error);
    res.status(500).json({ error: 'Failed to analyze name', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: COMPARE NAMES
// ═══════════════════════════════════════════════════
router.post('/nameaudit/compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { names, context, industry, priority, userLanguage } = req.body;

    if (!names || names.length < 2) {
      return res.status(400).json({ error: 'At least 2 names required for comparison' });
    }
    if (names.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 names for comparison' });
    }
    if (!context?.trim()) {
      return res.status(400).json({ error: 'Please select what these names are for' });
    }

    const trimmedNames = names.map(n => (n || '').trim()).filter(Boolean);
    if (trimmedNames.length < 2) {
      return res.status(400).json({ error: 'At least 2 non-empty names required for comparison' });
    }

    const prompt = `${NAME_AUDIT_CORE}

COMPARE NAMES

NAMES TO COMPARE: ${trimmedNames.map((n, i) => `${i + 1}. "${n}"`).join(', ')}
WHAT IT'S FOR: ${context}
INDUSTRY: ${industry || 'Not specified'}
WHAT MATTERS MOST: ${priority || 'Not specified — weigh the dimensions evenly'}

Compare the candidates against the visitor's stated purpose and priorities. Do
not manufacture a winner merely because the interface asks for one — if the
choice is genuinely close, say so. A verified real-world conflict may
disqualify a candidate; an unverified possible conflict belongs under
needs_verification and may not be treated as established. Prefer useful
differences over faux scoring precision.

Return ONLY this JSON:

{
  "candidates": [
    {
      "name": "The name — 3-6 words",
      "verdict": "Exactly one of: STRONG FIT, GOOD FIT, MIXED, HAS PROBLEMS, RECONSIDER",
      "best_quality": "Its single biggest strength — one sentence",
      "biggest_risk": "Its single biggest weakness — one sentence",
      "word_of_mouth": "Exactly one of: easy, workable, difficult",
      "fit_for_context": "One sentence on how well it fits the stated purpose",
      "needs_verification": ["A specific current-world check this candidate warrants — 0-2 items"]
    }
  ],
  "recommendation": {
    "name": "The recommended name — 3-6 words",
    "why": "Clear reasoning for why this one is the better fit — one sentence",
    "how_close": "Exactly one of: clear choice, slight edge, genuinely close"
  },
  "decision_driver": "The single most important difference between these names that should drive the decision — one sentence"
}

Be honest and decisive where the input supports it. Return ONLY JSON.
${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    }, { label: 'NameAudit/Compare' });

    if (!parsed.candidates) {
      return res.status(500).json({ error: 'Could not compare these names. Please try again.' });
    }
    parsed.candidates.forEach(c => pinVerdict(c, 'verdict', 'MIXED'));
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NameAudit/Compare] Error:', error);
    res.status(500).json({ error: 'Failed to compare names', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: FIX THIS NAME
// ═══════════════════════════════════════════════════
router.post('/nameaudit/fix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      verdict, whatWorks, whatCouldGetInTheWay,
      bottomLine, userLanguage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const worksList = Array.isArray(whatWorks) && whatWorks.length > 0
      ? `\nWHAT WORKS — PRESERVE THIS:\n${whatWorks.map(s => `  ✓ ${s}`).join('\n')}`
      : '';
    const problemsList = Array.isArray(whatCouldGetInTheWay) && whatCouldGetInTheWay.length > 0
      ? `\nWHAT COULD GET IN THE WAY — ADDRESS THIS:\n${whatCouldGetInTheWay.map(w => `  ✗ ${w}`).join('\n')}`
      : '';

    const prompt = `${NAME_AUDIT_CORE}

FIX THIS NAME

A visitor ran their name through an audit and it surfaced specific problems.
Generate improved name variations that keep what works and address what
doesn't. These are alternatives designed to address identified weaknesses —
not a promise that they are objectively "improved."

═══════════════════════════════
THE ORIGINAL NAME & ITS AUDIT
═══════════════════════════════
Name: "${name}"
Context: ${context || 'General'}
${industry ? `Industry: ${industry}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Verdict: ${verdict || 'Not audited yet'}
Bottom line: ${bottomLine || 'No summary'}
${worksList}${problemsList}

═══════════════════════════════
YOUR TASK
═══════════════════════════════
Generate 5-7 variations. Each should preserve what works above, address what
could get in the way, and stay in the same general naming territory unless a
serious problem requires a different direction. Be immediately usable — not
just a tweak but a genuinely distinct alternative. At least 2 should be "close
cousins" (small evolution from the original); at least 2 should be "fresh
takes" (same energy, different approach). Be honest about tradeoffs — every
name change involves compromise, and a variation with no tradeoff is
suspicious, not strong.

Respond in JSON:
{
  "approach": "Brief explanation of the fix strategy — what's being kept, what's changing, and why — one sentence",
  "variations": [
    {
      "name": "ImprovedName — 3-6 words",
      "pronunciation": "im-PROOVD-name. Nothing else.",
      "why_it_may_be_stronger": "One sentence, hedged — this is a judgment, not a measured fact",
      "what_it_addresses": "Which specific problem from above this targets — one sentence",
      "tradeoff": "Any downside of this change, or null if genuinely none — one sentence"
    }
  ],
  "direction_to_explore": "If the visitor wants to explore further, the direction worth trying and why — one sentence"
}

Do not include an estimated score of any kind.
Return ONLY valid JSON.
${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      temperature: 0.9,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    }, { label: 'NameAudit/Fix' });

    if (!parsed.approach) {
      return res.status(500).json({ error: 'Could not generate fixes. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NameAudit/Fix] Error:', error);
    res.status(500).json({ error: 'Failed to generate fixes', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: CONTEXT-SPECIFIC DEEP DIVE
// ═══════════════════════════════════════════════════
router.post('/nameaudit/deepdive', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      verdict, userLanguage,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    // Stress tests that can actually be reasoned from the name, not the ones
    // that require investor sentiment, LinkedIn perception or acquisition
    // appetite — none of which the name itself can answer.
    const contextFrameworks = {
      'Baby': `BABY NAME DEEP DIVE for "${name}":
1. PRONUNCIATION: How reliably will most people say this correctly on first read?
2. LIKELY NICKNAMES: What nicknames would this name naturally shorten to?
3. INITIALS: Do the initials (with a plausible surname) spell or suggest anything worth noticing?
4. RHYMES / TEASING POSSIBILITIES: What obvious rhymes or teasing angles exist?
5. WORKS ACROSS LIFE STAGES: Does the name read naturally for a baby, a teenager, and an adult professional?
6. FAMILY/CONTEXT CONSIDERATIONS: Anything the visitor supplied about siblings, heritage or family naming patterns — only if they supplied it.
7. POPULARITY/CURRENT TRENDS: This requires verification, not invention — flag it as a check, don't state a trend as fact.`,

      'Band / Music Project': `MUSIC PROJECT DEEP DIVE for "${name}":
1. SAYABILITY: Does this sound natural said aloud by an announcer or a fan?
2. SEARCH AMBIGUITY: Structurally, is this a unique search term or does it compete with ordinary dictionary words?
3. POSTER/WORDMARK POTENTIAL: Does the name have visual shape in large type?
4. CROWD-CALLABILITY: Could a crowd chant or call this name with rhythm?
5. GENRE ASSOCIATIONS: What genre might this name suggest — stated as interpretation, not fact.
6. EXISTING ARTISTS/CURRENT AVAILABILITY: This requires verification, not invention — flag it as a check, don't state availability as fact.`,

      'Pet': `PET NAME DEEP DIVE for "${name}":
1. CALLABILITY: Can this be called out across a yard or a dog park without becoming awkward?
2. COMMAND CONFUSION: Does it sound like a common command (sit, stay, come, no, down)?
3. LENGTH: Is it short enough to be useful in the moment, or does it invite a shortened form?
4. NICKNAME POSSIBILITIES: What would this name naturally shorten to?
5. MULTI-PET CONFUSION: Only if the visitor mentioned other pet names — does this one sound too similar to cause mix-ups?`,
    };

    const defaultFramework = `BUSINESS / PRODUCT DEEP DIVE for "${name}":
1. DISTINCTIVENESS: Is this name distinctive enough to stand apart, or does it lean on generic/descriptive language?
2. CATEGORY FIT: Does the name read as belonging to the stated industry/category, or does it work against that fit?
3. ROOM TO EXPAND: If the offering grows or shifts, does the name box it in or leave room?
4. WORD-OF-MOUTH: Structurally, is this an easy name to say, spell and pass along?
5. VISUAL USE: How does the name work as a wordmark, on a page, in a URL?
6. SEARCH AMBIGUITY: Structurally, is this a coined term or does it compete with dictionary words?
7. CURRENT-WORLD CHECKS STILL NEEDED: Name the specific checks this warrants — do not state their outcome.`;

    const framework = contextFrameworks[context] || defaultFramework;

    const prompt = `${NAME_AUDIT_CORE}

CONTEXT-SPECIFIC DEEP DIVE

NAME: "${name}"
CONTEXT: ${context || 'Business'}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}
CURRENT VERDICT: ${verdict || 'Not audited yet'}

${framework}

For each test, give a severity: "positive" (passes well), "neutral" (no
issues), "caution" (minor concern), or "problem" (serious issue). A test whose
answer requires real-world verification gets severity "neutral" and a finding
that names the check, not an invented outcome.

Return ONLY this JSON:
{
  "sections": [
    {
      "title": "TEST NAME (e.g., DISTINCTIVENESS) — 3-6 words",
      "finding": "Clear, specific finding in 1-2 sentences",
      "detail": "Additional context if needed, or null — one sentence",
      "severity": "positive | neutral | caution | problem"
    }
  ],
  "verdict": "1-2 sentence overall deep-dive takeaway — does the context-specific view change what matters most?"
}

Return ONLY valid JSON.
${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      temperature: 0.85,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    }, { label: 'NameAudit/DeepDive' });

    if (!parsed.sections) {
      return res.status(500).json({ error: 'Could not run the deep dive. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NameAudit/DeepDive] Error:', error);
    res.status(500).json({ error: 'Failed to run deep dive', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: CHALLENGE THIS AUDIT
// ═══════════════════════════════════════════════════
router.post('/nameaudit/second-opinion', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      name, context, industry, targetAudience,
      firstAudit, userLanguage,
    } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const prompt = `${NAME_AUDIT_CORE}

CHALLENGE THIS AUDIT

Review the original audit adversarially. Do not treat agreement between two AI
responses as increased factual reliability — two generations agreeing is not
independent evidence.

NAME: "${name}"
CONTEXT: ${context || 'Business'}
INDUSTRY: ${industry || 'Not specified'}
TARGET AUDIENCE: ${targetAudience || 'Not specified'}

THE ORIGINAL AUDIT:
- Verdict: ${firstAudit?.verdict || 'N/A'}
- Bottom line: ${firstAudit?.bottomLine || 'N/A'}
- What works: ${(firstAudit?.whatWorks || []).join('; ') || 'None listed'}
- What could get in the way: ${(firstAudit?.whatCouldGetInTheWay || []).join('; ') || 'None listed'}

Look specifically for: interpretations presented too confidently, overlooked
pronunciation possibilities, alternative associations, context that could
reverse a judgment, claims requiring outside verification, strengths the
original audit undervalued, and weaknesses it overstated. Don't just agree to
be diplomatic — if the original reads too harsh or too generous, say so.

Return ONLY this JSON:
{
  "holds_up": ["A specific finding from the original that genuinely holds up, and why — one sentence each"],
  "worth_reconsidering": ["A specific finding stated too confidently, and the more accurate framing — one sentence each"],
  "missed_the_first_time": ["Something the original audit didn't catch — one sentence each"],
  "facts_to_verify": ["A specific claim, from either audit, that requires real-world verification before it should be trusted — one sentence each"],
  "bottom_line": "1-2 sentence overall read on how much the original audit should be trusted, and why"
}

Return ONLY valid JSON.
${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      temperature: 1.0,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    }, { label: 'NameAudit/SecondOpinion' });

    if (!parsed.bottom_line) {
      return res.status(500).json({ error: 'Could not challenge this audit. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NameAudit/SecondOpinion] Error:', error);
    res.status(500).json({ error: 'Failed to challenge this audit', details: error.message });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-04 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'No numeric score, radar chart, "clean global language" claim, live-world ownership/existence assertion, fictional personification, phoneme-to-psychology folklore, universal-pronunciation-consistency claim, or "agreement = reliable signal" framing survives to the response — all seven are regex-detected and blanked in code, not left to the prompt alone. The literal string "null" is normalized to a real null (how_it_looks.issues answered it that way on the first live probe). check_before_you_commit and the domain/handle labels are code-computed, never model-authored.',
};

module.exports = router;
