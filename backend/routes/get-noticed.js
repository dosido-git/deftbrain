const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

const CONTRACT = `
LUCK SURFACE — TOOL CONTRACT

Follow DEFTBRAIN_OUTPUT_STANDARD_V2.

PURPOSE

Luck Surface helps the visitor create more opportunities for useful,
unexpected connections, discoveries, introductions, and opportunities.

It does NOT calculate luck, predict luck, measure probability, or claim that
specific actions will produce particular outcomes.

The central question is:

"Given where this person currently spends attention, time, relationships,
and public visibility, what practical changes would expose them to more
relevant people, ideas, and opportunities?"

GROUNDING

Use only the visitor's supplied information as scenario facts.

You may reason about how an activity changes exposure or discoverability,
but do not invent:
- the size or quality of their network;
- how other people perceive them;
- whether their work is good;
- whether people trust them;
- whether an audience exists;
- who attends particular places;
- what opportunities are available locally;
- what specific people will notice or respond;
- future introductions, clients, collaborations, or results.

Do not infer hidden personality traits such as:
- shy
- passive
- isolated
- risk-averse
- invisible
- bad at networking

unless the visitor explicitly describes themselves that way.

NO FAKE MEASUREMENT

Do not calculate:
- a luck percentage;
- a current "surface area";
- a future surface-area percentage;
- a multiplier;
- probability of serendipity;
- expected number of opportunities;
- time to first result.

There is no defensible numerical denominator for "available serendipity."

Describe the visitor's current opportunity surface qualitatively instead.

Use one of:

NARROW
Most exposure currently comes through a small number of repeated channels.

MIXED
The visitor has some routes to new people or ideas, but several channels
remain underused.

BROAD
The visitor already has several independent ways for new people, ideas, or
opportunities to encounter them.

These labels describe the structure of the supplied activities only.
They do not predict success.

DO NOT DIAGNOSE A "WALL"

Do not manufacture a single hidden reason the visitor is not getting lucky.

Instead identify:
"What currently limits new exposure"

This may include several concrete structural observations.

Prefer:

"Most of your professional opportunities currently come through two clients."

Not:

"Your network is a closed loop."

Prefer:

"You use Instagram, but you did not describe using it to show your work
professionally."

Not:

"You have no public professional signal."

Do not treat absence of mention as absence in the visitor's life.

STRENGTHS

A supplied fact is not automatically evidence of reputation, quality,
trust, social capital, influence, or advantage.

Explain only the concrete opportunity mechanism established by the fact.

Prefer:

"Existing client referrals give you one working route to new work."

Not:

"Those referrals prove you deliver quality."

THE MOVES

Generate 3 to 5 moves.

Do not force five if fewer strong moves adequately solve the problem.

Every move must:

1. connect directly to something the visitor supplied;
2. expose them to a meaningfully different person, idea, or opportunity
   pathway;
3. be feasible without requiring invented access or relationships;
4. have limited downside relative to the possible benefit;
5. remain worthwhile even if no lucky outcome follows.

Prefer moves that diversify mechanisms.

Possible mechanisms include:

SIGNAL
Make useful work, interests, needs, or availability easier for relevant
people to notice.

ENTER
Participate in a relevant environment the visitor does not currently
describe using.

CREATE
Produce something that can travel beyond the visitor's existing relationships.

CONNECT
Create a useful introduction or connection between people when there is an
actual basis for doing so.

COMPOUND
Extend something the visitor already does successfully into another
opportunity pathway.

Do not use language such as "infiltrate," "colonize," or other manipulative
networking language.

NO INVENTED REAL-WORLD OPPORTUNITIES

Do not invent a specific:
- event;
- meetup;
- conference;
- organization;
- venue policy;
- gallery opportunity;
- volunteer opening;
- community;
- publication;
- local program

unless supplied or verified.

You may recommend categories:

"Look for a local design critique, open studio, professional association
event, or another gathering where working designers actually participate."

Not:

"Find an industry event happening within 60 days."

Do not instruct someone to ask a venue to display work unless their supplied
context gives a reasonable basis for that approach. Prefer broader options
when venue practices are unknown.

NO RESULT PREDICTIONS

Do not say a move:
- will generate clients;
- will create introductions;
- will cause others to share their work;
- will make agents discover them;
- will produce professional collisions;
- will create a particular opportunity.

Explain the mechanism instead.

Prefer:

"This gives people outside your referral network a way to see what you do
and contact you."

Not:

"Agents and gallery directors can now find you and reach out."

TIMING

Timing may define the action when useful:

"Do this today."
"Try this at the next relevant event."
"Make this a recurring monthly practice."

Do not predict when results will arrive.

START HERE

Choose one move as the easiest high-information or high-leverage starting
point.

Explain why it is a sensible first move using established facts.

Do not claim:
- it takes five minutes;
- it costs nothing;
- it will put new nodes in motion;

unless those claims are actually established.

VOICE

Write directly to the visitor using "you."

Use plain language.

Avoid networking jargon such as:
- nodes
- collisions
- luck infrastructure
- surface-area multiplier
- asymmetric yield

unless explaining the underlying concept would genuinely help.

The output should feel practical, curious, and encouraging without
performative enthusiasm.

GET NOTICED — OUTPUT GROUNDING ADDITIONS

Follow DEFTBRAIN_OUTPUT_STANDARD_V2.

CURRENT OPPORTUNITY SURFACE

Describe only pathways the visitor actually supplied.

Do not convert an omitted pathway into a known limitation.

BAD:
"Your professional exposure currently runs almost entirely through your existing team and employer."

BETTER:
"The professional exposure you described is concentrated in your existing team and employer."

BAD:
"Your social contact is a stable but small friend group with no professional overlap."

BETTER:
"You described a small, close friend group, but did not describe whether those relationships create professional connections."

WHAT CURRENTLY LIMITS NEW EXPOSURE

A limitation must follow from something the visitor actually described.

Do not state general circumstances as though their effects on this visitor are established.

BAD:
"Remote work removes the incidental contact with people outside your company that an office or shared workspace can produce."

BETTER:
"Working from home may provide fewer incidental opportunities to meet people outside your existing work relationships."

Do not classify ordinary hobbies as "private or consumption-based" unless that distinction is useful and supported.

BAD:
"Hobbies as described are private or consumption-based, which creates little outward signal about your skills or interests."

BETTER:
"You mentioned the gym, cooking, and watching TV, but didn't describe using those interests to meet new people or share what you do."

WHAT'S ALREADY WORKING

This section means an EXISTING PATHWAY that is already creating exposure.

Do not put unused possibilities, latent assets, geographic opportunities, or hypothetical actions in this section.

BAD:
"Living in Denver gives you access to in-person professional and technical communities if you choose to use them."

This is a possible move, not something already working.

BAD:
"Three years of accumulated work likely means you have projects, decisions, and lessons that could be made visible."

This is a possible resource, not evidence of an existing exposure pathway.

If the visitor has not described anything currently creating new exposure, say so plainly:

"Nothing you described clearly shows an existing pathway that regularly puts your work in front of new professional contacts. That doesn't mean none exists—only that you haven't identified one here."

MOVE GENERATION

Do not invent facts about what exists locally or who participates.

When location is supplied, location may personalize the search/action without establishing current-world facts.

BAD:
"Find one recurring in-person gathering in Denver where working software engineers participate..."

BETTER:
"Look for one recurring Denver-area gathering related to software development, startups, or another professional interest you want to explore."

Do not assume the visitor has a suitable open-source project, public technical community, or two people worth introducing.

Frame these conditionally when their existence has not been established:

"If you use an open-source tool or participate in a public technical community, look for one small contribution you could make..."

"If two people you already know would genuinely benefit from knowing each other, consider making the introduction."

FINAL CHECK

Before returning the result ask:

- Did I calculate or imply a fake measure of luck?
- Did I predict a future result?
- Did I turn missing information into a fact?
- Did I infer reputation, quality, trust, or personality?
- Did I invent an event, venue opportunity, audience, or network?
- Does every move create a genuinely different opportunity pathway?
- Would each move still be worthwhile if nobody unexpected responds?
- Is the easiest useful next step obvious?
`;

// ── Deterministic backstops ───────────────────────────────────────────────
// The percentages were the whole premise of the old tool, so a prose ban is
// not enough on its own — this is the one failure worth catching in code.
const FAKE_MEASURE = new RegExp([
  '\\b\\d{1,3}\\s?%',
  '\\b\\d+(?:\\.\\d+)?\\s?x\\b',
  '\\bsurface area (?:of|is|at)\\b',
  '\\b(?:luck|serendipity) (?:score|percentage|probability|multiplier)\\b',
  '\\bprobability of\\b',
  '\\bexpected number of\\b',
  '\\btime to first (?:result|collision|opportunity)\\b',
  '\\bwithin \\d+ (?:days|weeks|months)\\b',
].join('|'), 'i');

// Saying what a move will produce, rather than what it makes possible.
const RESULT_PREDICTION = new RegExp([
  '\\bwill (?:generate|create|produce|bring|lead to|result in|get you|land you|make)\\b',
  '\\b(?:agents?|clients?|recruiters?|galleries|gallery \\w+|editors?|curators?|directors?|employers?|collaborators?|people)\\b[^.]{0,40}?\\s(?:will|are going to)\\s',
  '\\byou(?:\\x27ll| will) (?:get|meet|find|receive|hear from)\\b',
].join('|'), 'i');
const HEDGE = /\b(?:may|might|could|can|if|whether|gives? (?:people|them|others)|makes? it (?:possible|easier)|so that)\b/i;

// The contract names these outright.
const MANIPULATIVE = /\b(?:infiltrat\w+|coloniz\w+|colonis\w+|penetrat\w+ the (?:market|scene))\b/i;

// Personality read off the page rather than supplied.
const PERSONALITY_CLAIM = /\byou (?:are|seem|appear|come across as|tend to be)\s+(?:quite |rather |a bit |somewhat )?(?:shy|passive|isolated|risk-averse|risk averse|invisible|introverted|reserved|bad at networking|not a natural networker)\b/i;

// The voice rule, mechanically.
const THIRD_PERSON_READER = /\bthe (?:visitor|user|person)\b/i;

// "Already working" is the section that drifts hardest: it fills with things
// that could work rather than things that do. A latent asset is a move, and a
// city you live in is not a pathway. Key-scoped, because the same phrasing is
// perfectly correct inside a move.
const HYPOTHETICAL = new RegExp([
  '\\bif you (?:choose|want|decide|use|participate)\\b',
  '\\bcould be (?:made |turned )?\\w*',
  '\\bgives? you access to\\b',
  '\\blikely means\\b',
  '\\bmeans you (?:have|probably have)\\b',
  '\\bthere (?:are|may be|could be) (?:many |plenty of )?\\w+ (?:communities|groups|meetups|events)\\b',
  '\\bwaiting to be\\b',
  '\\bpotential\\b',
].join('|'), 'i');

const RULES = [
  ['measured something it cannot measure', FAKE_MEASURE],
  ['predicted a result', RESULT_PREDICTION, (v) => HEDGE.test(v)],
  ['used manipulative networking language', MANIPULATIVE],
  ['assigned a personality it was not given', PERSONALITY_CLAIM],
  ['talked about you instead of to you', THIRD_PERSON_READER],
];

const BREADTH = ['narrow', 'mixed', 'broad'];
const MECHANISMS = ['signal', 'enter', 'create', 'connect', 'compound'];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;

  // Drop anything in already_working that is a possibility rather than a
  // pathway. If that empties the section the frontend says so in the visitor's
  // own language, which is better than leaving an English sentence behind.
  const aw = data.current_surface && data.current_surface.already_working;
  if (Array.isArray(aw)) {
    const kept = aw.filter(x => !(typeof x === 'string' && HYPOTHETICAL.test(x)));
    if (kept.length !== aw.length) {
      console.log(`[get-noticed] already_working: dropped ${aw.length - kept.length} of ${aw.length} — possibility, not an existing pathway`);
    }
    data.current_surface.already_working = kept;
  }

  // breadth and mechanism are switched on by the frontend, so they must stay
  // exact English. withLanguage translates JSON string values, which is how an
  // enum the UI reads turns into a blank label in twelve languages.
  if (data.current_surface && !BREADTH.includes(String(data.current_surface.breadth || '').toLowerCase())) {
    data.current_surface.breadth = 'mixed';
  } else if (data.current_surface) {
    data.current_surface.breadth = String(data.current_surface.breadth).toLowerCase();
  }
  if (Array.isArray(data.moves)) {
    // 3 to 5, per the contract — a sixth is dropped rather than rendered.
    if (data.moves.length > 5) data.moves = data.moves.slice(0, 5);
    data.moves.forEach(m => {
      const mech = String(m.mechanism || '').toLowerCase();
      m.mechanism = MECHANISMS.includes(mech) ? mech : 'signal';
    });
  }

  const walk = (node) => {
    // No early return for arrays. An array IS an object, so Object.entries
    // below enumerates its indices and node[k] = '' assigns into it — while
    // forEach(walk) handed each STRING element to a function that returns
    // immediately for non-objects, so every array-of-strings field went
    // unchecked. Found when Meeting Worth It emitted "most attendees are
    // passive listeners" inside why_this_verdict and the rule that exists
    // to catch exactly that did not fire.
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'breadth' || k === 'mechanism') continue;
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 200 && (v.match(/[.!?]/g) || []).length <= 1) {
            console.log(`[get-noticed] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[get-noticed] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  // A blanked array item would render as an empty bullet, which reads worse than
  // no bullet. Blanking is right for a named field; for a list, removal is.
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

router.post('/get-noticed', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, goals, currentExposures, userLanguage } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: 'Describe where your life puts you in contact with new people or ideas.' });

    const userPrompt = `${CONTRACT}

WHERE YOUR LIFE CURRENTLY PUTS YOU IN CONTACT WITH NEW PEOPLE OR IDEAS:
${description.trim()}
${goals?.trim() ? `\nWHAT YOU WOULD LIKE MORE CHANCES TO ENCOUNTER: ${goals.trim()}` : '\nWHAT YOU WOULD LIKE MORE CHANCES TO ENCOUNTER: not supplied — do not guess at a goal.'}
${currentExposures?.trim() ? `\nWHAT YOU ARE ALREADY DOING TO CREATE OPPORTUNITIES: ${currentExposures.trim()}` : '\nWHAT YOU ARE ALREADY DOING TO CREATE OPPORTUNITIES: not supplied — do not treat this as doing nothing.'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "current_surface": {
    "breadth": "Exactly one of these English words and nothing else: narrow, mixed, broad",
    "summary": "1-2 sentences describing only the pathways you actually supplied. Say what you described, not what your world contains — an omitted pathway is unknown, not absent",
    "limits": ["A limitation that follows from something you actually described — one short line each. Where the effect on you is inferred rather than established, say may or fewer rather than stating it as fact"],
    "already_working": ["An EXISTING pathway that is already creating exposure — one short line each. Never a latent asset, a place you live, or something you could do; those are moves. If nothing you described qualifies, return exactly one line saying so plainly and that it does not mean none exists"]
  },
  "moves": [
    {
      "title": "Short useful title — 2-5 words",
      "mechanism": "Exactly one of these English words and nothing else: signal, enter, create, connect, compound",
      "action": "Concrete action you can take — one or two sentences. Where you have not established that something exists — an open-source project, a public community, two people worth introducing, a particular local gathering — frame it conditionally with If, and name a category to look for rather than asserting one is there",
      "why_it_expands_opportunity": "The exposure mechanism, without predicting an outcome — one sentence",
      "first_step": "Smallest useful way to begin — one sentence"
    }
  ],
  "start_here": {
    "move_title": "The title of one of the moves above, copied exactly",
    "why_this_one": "Why this is a sensible first move from what you supplied — one sentence",
    "first_step": "Immediate action — one sentence"
  }
}

ARRAY BOUNDS: 3 to 5 moves. limits at most 4, already_working at most 4.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Helps people widen the ways new people, ideas and opportunities can reach them. Works only from what the visitor supplied. Return ONLY valid JSON. No markdown. ' + NO_QUOTE_RULE, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'get-noticed' });
    if (!parsed.current_surface) {
      return res.status(500).json({ error: 'Could not read your situation. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('LuckSurface error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the rewrite around the
// tool contract. validateResult runs on every response.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'percentages and multipliers are blanked in code; breadth and mechanism are pinned to English because the frontend switches on them.',
};

module.exports = router;
