const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write place names or quoted phrases plainly or with single quotes, or it breaks the JSON.';

const SYSTEM_PROMPT = `You are Micro-Adventure Mapper.

Your job is to turn a small pocket of free time into a practical local outing that feels a little more interesting than doing the obvious thing.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

CORE PRINCIPLE
Make the adventure specific enough to use, but never invent local facts merely to make it vivid.

The user may supply:
- location
- available time
- when they want to go
- interests
- desired vibe
- budget
- transportation
- companions
- accessibility needs

Treat those as constraints.

LOCAL FACTS
You do not have reliable live knowledge of:
- current business openings
- current hours
- current admission prices
- current exhibits
- current events
- current weather
- temporary closures
- current transit schedules
- whether a storefront is open to visitors
- whether a mural, gallery, market, vendor, trail condition, or other local feature still exists in the form you remember

Never present those as established facts unless they were supplied by the user or provided through verified current-world data.

You MAY safely use:
- well-established neighborhoods
- major public parks
- major landmarks
- broadly stable public spaces
when you are confident they exist.

When confidence is lower, describe the TYPE of place rather than inventing a named venue:
- a used bookstore in the neighborhood
- a waterfront path
- a small independent gallery
- a public market
- a neighborhood coffee shop
- a shaded park loop

Do not fabricate:
- addresses
- cross streets
- opening hours
- admission prices
- menu prices
- seasonal schedules
- current exhibits
- hidden-gem status
- how busy a place is
- who tends to go there
- whether doors are open
- whether staff will welcome visitors
- whether photography is permitted
- local insider knowledge

If an exact current place must be chosen, tell the user what to look for in their maps app rather than inventing one.

TIME
Build an outing that fits comfortably inside the supplied time.

Do not automatically fill every available minute.
Leave reasonable transition slack when needed.

If the user says Right now or Later today, do not invent the current clock time or exact stop times unless an actual start time was supplied.

Prefer:
- Stop 1 · about 25 minutes
- Then walk about 10 minutes
rather than:
- 2:00 PM-2:25 PM
unless the actual start time is known.

Do not invent travel durations or distances with false precision.
Use qualitative routing or rough estimates only when they are clearly presented as estimates.

BUDGET
Respect the selected budget as a hard constraint.

Do not invent current prices.

For places whose price is not verified, use:
- Free if the activity itself is inherently free
- Optional purchase
- Check current price
- Choose something within your remaining budget

Do not invent currency conversions.

TRANSPORTATION
Respect the transportation mode supplied.

Do not invent exact turn-by-turn directions unless they follow from stable, known geography.

Prefer:
- walk toward the main commercial street
- continue through the park toward the waterfront
- choose the next stop within a short walk
rather than invented street-by-street routing.

ACCESSIBILITY
Treat accessibility selections as hard constraints.

Never call a route, venue, trail, entrance, restroom, transit stop, or surface accessible unless that fact is known.

If accessibility depends on current local conditions, say what the user should verify before leaving.

COMPANIONS
Adapt the outing to the supplied companion type without inventing preferences, ages, relationships, stamina, or needs.

Family with kids does not establish children's ages.
Partner/friend does not make the outing romantic.
Solo does not imply loneliness or a desire for reflection.

VIBE
Use vibe to shape pacing and activity style only.

Do not infer personality or emotional state.

ADVENTURE DESIGN
A good micro-adventure has:
1. a simple theme
2. 2-4 meaningful stops, depending on available time
3. a clear progression rather than unrelated errands
4. one small element of novelty
5. enough flexibility that the outing survives a closed door or changed condition

Do not force 3-5 stops when the time does not justify it.

A one-hour adventure may have only one or two stops.

Do not manufacture novelty through fake hidden gems or insider claims.

PHOTO SUGGESTIONS
Only include a photo suggestion when Photography is one of the selected interests or when the scene naturally supports it.

Never recommend photographing strangers, people working, private interiors, or people through windows without permission.

PRO TIPS
A pro tip must be practical and derived from the planned activity.

Do not invent local insider knowledge.

Good:
- Walk one block beyond the main commercial strip before turning back.
- Give yourself ten minutes with no destination and follow whatever looks interesting.
- If the indoor stop is closed, use that time to explore the surrounding block instead.

Bad:
- Ask the barista which murals are about to be painted over.
- Local artists always gather here on Sundays.
- This is where locals go to avoid tourists.

RAIN / WEATHER
Do not invent current weather.

A rainy backup should be a general alternative that preserves the theme.

Do not claim an indoor venue is open or free unless established.

EXTENDING THE OUTING
Suggest a natural way to continue if the user still has time or energy.

Do not invent additional current businesses or attractions.

VOICE
Write directly to the user as you.

Sound curious, practical, and lightly adventurous.
Avoid tourism-copy language such as:
- vibrant
- legendary
- hidden gem
- unmissable
- locals know
- tourists miss
unless that characterization is grounded.

The adventure should make ordinary surroundings feel newly usable without pretending to possess live local knowledge.

Return only valid JSON matching the requested schema. ${NO_QUOTE_RULE}`;

// ── Deterministic backstops ───────────────────────────────────────────────
// The probe that prompted this rewrite produced, among others: "Pilsen is where
// Chicago's street art scene actually lives", "you'll see work most tourists
// miss", "afternoon light hits murals better between 2-4 PM", "many have open
// doors on weekends", "if a door is propped open, you're welcome to look".
// Every one is a claim about a place the model cannot currently see.

// Tourism copy. The characterisation itself is the problem, not the adjective.
const TOURISM_COPY = new RegExp([
  '\\bhidden gems?\\b|\\boff the beaten (?:path|track)\\b|\\bunmissable\\b|\\bmust[- ]see\\b',
  '\\b(?:most |the )?tourists? (?:miss|never|rarely|do not|don\\x27t)\\b',
  '\\bwhere (?:the )?locals (?:go|hang|eat|drink|actually)\\b|\\blocals (?:know|swear by|flock)\\b',
  '\\bis where\\b[^.]{0,40}\\b(?:actually|really) (?:lives|happens|is)\\b',
  '\\b(?:legendary|iconic|vibrant|buzzing|bustling|charming|quaint)\\b',
  '\\bavoid (?:the )?tourists?\\b|\\btourist traps?\\b',
].join('|'), 'i');

// Clock times the model cannot know, and the "best light between 2-4" family.
const INVENTED_CLOCK = new RegExp([
  '\\b\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)\\b',
  '\\bbetween \\d{1,2}\\s*(?:and|-|–|to)\\s*\\d{1,2}\\s*(?:AM|PM|am|pm)\\b',
  '\\b(?:before|after|around|by) \\d{1,2}\\s*(?:AM|PM|am|pm)\\b',
  '\\b(?:opens?|closes?) at \\d{1,2}\\b',
].join('|'), 'i');

// Claims about doors, staff, welcome, crowds and who goes there.
const LOCAL_INSIDER = new RegExp([
  '\\b(?:doors? (?:are|is) (?:usually |often |sometimes )?(?:open|propped)|open doors?)\\b',
  '\\bif (?:a|the) door is propped\\b|\\byou(?:\\x27re| are) welcome to (?:look|wander|browse)\\b',
  // The words may not be adjacent: "Many artists IN PILSEN are generous with
  // their time" slipped through the first version, which required them to be.
  '\\b(?:staff|owners?|baristas?|artists?|vendors?|shopkeepers?)\\b[^.]{0,25}\\b(?:will|are|tend to|usually|often|always|happy to|generous|welcoming|friendly)\\b',
  '\\bcatch (?:the )?artists?\\b|\\bmid[- ]project\\b',
  '\\b(?:rotating|changing) (?:local )?(?:art|exhibits?|displays?)\\b',
  '\\b(?:knows?|know) the (?:art|event|gallery) calendar\\b',
  '\\b(?:tends? to be|is|gets|are) (?:quiet|busy|packed|crowded|empty)\\b[^.]{0,25}\\b(?:on|in|during|before|after)\\b',
  '\\b(?:ask|chat with) the (?:barista|owner|staff|bartender|vendor)\\b',
].join('|'), 'i');

// An admission price, opening state or menu price presented as fact.
const INVENTED_PRICE_OR_HOURS = new RegExp([
  '\\badmission is\\b|\\bentry is\\b|\\bcosts? (?:about |around )?[\\p{Sc}]\\s?\\d',
  '\\bfree (?:on|every) (?:\\p{Lu}\\p{L}+day|the first \\p{Lu}\\p{L}+day)\\b',
  '\\bopen (?:daily|every day|until|from|on weekends?|\\p{Lu}\\p{L}+day)\\b',
  '\\bclosed (?:on )?(?:\\p{Lu}\\p{L}+days?|Mondays)\\b',
].join('|'), 'iu');

// A street address or cross-street the schema no longer even has a field for.
const INVENTED_ADDRESS = new RegExp([
  '\\b\\d{2,5}\\s+(?:[NSEW]\\.?\\s+)?\\p{Lu}[\\p{L}\\x27-]+(?:\\s+\\p{Lu}[\\p{L}\\x27-]+)?\\s+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Way|Pl|Place)\\b',
  '\\b(?:corner of|at the corner of|junction of)\\s+\\p{Lu}',
  '\\b\\p{Lu}[\\p{L}\\x27-]+\\s+(?:St|Street|Ave|Avenue)\\s+(?:and|&|at)\\s+\\p{Lu}',
].join('|'), 'u');

// A hedge means the sentence proposes rather than asserts — spare it.
const HEDGED = /\b(?:if|whether|may|might|could|check|confirm|look for|see whether|verify|some|often vary|not sure)\b/i;

const RULES = [
  ['used tourism copy it cannot ground', TOURISM_COPY],
  ['invented a clock time', INVENTED_CLOCK],
  // No hedge-spare on this one. "If a door is propped open, you're welcome to
  // look" and "you might catch artists mid-project" both start with a hedge and
  // are still claims about what happens at a place the model cannot see. The
  // hedge is doing rhetorical work, not epistemic work.
  ['claimed local insider knowledge', LOCAL_INSIDER],
  ['stated a price or opening state as fact', INVENTED_PRICE_OR_HOURS, (v) => HEDGED.test(v)],
  ['invented an address or cross street', INVENTED_ADDRESS],
];

// Arrays are objects: Object.entries enumerates their indices, so the walk
// reaches strings inside arrays without a special case.
function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[micro-adventure-mapper] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[micro-adventure-mapper] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const it = node[i];
        if (it === '') node.splice(i, 1);
        else if (it && typeof it === 'object' && Object.values(it).every(x => x === '' || x == null)) node.splice(i, 1);
        else prune(it);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return data;
}

// An unparseable "location" (emoji-only, no letters/digits) made the model
// return non-schema output → guard threw → deterministic 500. Catch it early.
const looksLikeLocation = (loc) => typeof loc === 'string' && /[\p{L}\p{N}]/u.test(loc);

function buildConstraintNotes(body) {
  const notes = [];
  if (body.timeAvailable) notes.push(`Time available: ${body.timeAvailable}`);
  if (body.when) {
    const whenMap = { right_now: 'Right now', later_today: `Later today (${body.timeOfDay || 'afternoon'})`, weekend: 'This weekend (flexible)' };
    notes.push(`When: ${whenMap[body.when] || body.when}`);
  }
  if (body.interests?.length) notes.push(`Interests: ${body.interests.join(', ')}`);
  if (body.vibe) notes.push(`Vibe: ${body.vibe}`);
  if (body.budget) {
    const budgetMap = { free: 'Free only', low: 'Low budget', moderate: 'Moderate budget', any: 'Any budget' };
    notes.push(`Budget: ${budgetMap[body.budget] || body.budget}`);
  }
  if (body.transport) notes.push(`Transportation: ${body.transport}`);
  if (body.companions) {
    const compMap = { solo: 'Solo', partner: 'With a partner/friend', family: 'Family with kids', group: 'Group' };
    notes.push(`Companions: ${compMap[body.companions] || body.companions}`);
  }
  if (body.accessibility?.length) notes.push(`Accessibility: ${body.accessibility.join(', ')}`);
  notes.push('The user did not supply an actual start time. Do not invent one.');
  return notes.join('\n');
}

const RESPONSE_SCHEMA = `{
  "adventure": {
    "name": "Short, memorable adventure name",
    "tagline": "One-sentence invitation",
    "category": "Short category label",
    "total_time": "Approximate total duration",
    "total_cost": "Free|Within selected budget|Optional purchase|Check current prices",
    "activity_level": "Easy|Moderate|Active",
    "why_this_fits": "1-2 sentences explaining how the outing fits the supplied interests, vibe, time, transportation, and companions without inventing personal traits"
  },
  "stops": [
    {
      "number": 1,
      "name": "Known stable place name OR descriptive place type",
      "area": "Neighborhood or general area only",
      "duration_min": 30,
      "description": "Concrete thing to do here",
      "small_twist": "Optional small element that makes the stop feel more adventurous",
      "photo_op": "Optional; empty string unless photography is relevant",
      "cost": "Free|Optional purchase|Check current price|Within remaining budget",
      "verify": "Anything current the user should confirm before relying on this stop, otherwise empty string"
    }
  ],
  "between_stops": [
    {
      "from_stop": 1,
      "to_stop": 2,
      "guidance": "Simple qualitative transition",
      "estimated_time": "Rough estimate or empty string"
    }
  ],
  "what_to_bring": ["Only genuinely useful items"],
  "backup_plan": {
    "when_to_use": "If weather, closure, crowds, or another condition makes the original plan impractical",
    "description": "A flexible alternative that does not depend on invented current venue facts"
  },
  "keep_going": {
    "extra_time": "Approximate extra time",
    "suggestion": "Natural extension if the user wants more"
  }
}`;

router.post('/micro-adventure-mapper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;

    // ─── GENERATE: New adventure ───
    if (action === 'generate') {
      const { location, previousAdventures } = req.body;
      if (!location || location.trim().length < 2) {
        return res.status(400).json({ error: 'Location is required' });
      }
      if (!looksLikeLocation(location)) {
        return res.status(400).json({ error: "We couldn't recognize that location — try a city or neighborhood name." });
      }

      const constraints = buildConstraintNotes(req.body);

      let dedupBlock = '';
      if (previousAdventures && previousAdventures.length > 0) {
        const pastList = previousAdventures.map((a, i) =>
          `  ${i + 1}. ${a.name} — stops: ${(a.stops || []).join(', ')}`
        ).join('\n');
        dedupBlock = `\nAlready done in this area — do not reuse these themes or stops:\n${pastList}\n`;
      }

      const prompt = `Build one practical micro-adventure from these constraints.

LOCATION:
${location}

${constraints}

${dedupBlock}

Use the lightest itinerary that makes the available time feel worthwhile.

Important:
- Do not invent live local facts.
- Do not invent exact current businesses merely to make the itinerary specific.
- Do not invent exact start/end clock times unless the user supplied an actual start time.
- Do not invent precise walking distances or travel times.
- Do not invent prices.
- If a current fact needs confirmation, put it in verify.
- Prefer stable public places and descriptive venue types when exact current knowledge is uncertain.
- Every stop must fit the user's transportation, time, budget, companions, and accessibility constraints.
- One hour may justify only 1-2 stops.
- The outing should feel like one small adventure, not a checklist of unrelated places.

Return ONLY valid JSON matching this schema:
${RESPONSE_SCHEMA}`;

      const data = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'micro-adventure-mapper-generate' });

      if (!data.adventure) {
        return res.status(500).json({ error: 'Could not generate your adventure. Please try again.' });
      }
      return res.json(validateResult(data));
    }

    // ─── REGENERATE: Different adventure, same inputs ───
    if (action === 'regenerate') {
      const { location, previousAdventureName, previousAdventures } = req.body;
      if (!location) return res.status(400).json({ error: 'Location is required' });
      if (!looksLikeLocation(location)) return res.status(400).json({ error: "We couldn't recognize that location — try a city or neighborhood name." });

      const constraints = buildConstraintNotes(req.body);

      let dedupBlock = '';
      if (previousAdventures && previousAdventures.length > 0) {
        const pastList = previousAdventures.map((a, i) =>
          `  ${i + 1}. ${a.name} — stops: ${(a.stops || []).join(', ')}`
        ).join('\n');
        dedupBlock = `\nAlready done in this area — do not reuse these themes or stops:\n${pastList}\n`;
      }

      const prompt = `Create another micro-adventure using the same constraints.

LOCATION:
${location}

${constraints}

Previous adventure:
${previousAdventureName || 'Not supplied'}

${dedupBlock}

Make the new outing meaningfully different in at least two of these ways:
- activity
- route/area
- pace
- type of stop
- theme

Do not force a different vibe from the one the user selected.

Do not invent local facts, businesses, prices, hours, addresses, or precise routing.

Return ONLY valid JSON matching this schema:
${RESPONSE_SCHEMA}`;

      const data = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'micro-adventure-mapper-regenerate' });

      if (!data.adventure) {
        return res.status(500).json({ error: 'Could not generate your adventure. Please try again.' });
      }
      return res.json(validateResult(data));
    }

    // ─── SWAP: Replace one stop ───
    if (action === 'swap') {
      const { location, currentItinerary, swapStopNumber } = req.body;
      if (!currentItinerary || !swapStopNumber) {
        return res.status(400).json({ error: 'Current itinerary and stop number required' });
      }

      const constraints = buildConstraintNotes(req.body);
      const currentStop = (currentItinerary.stops || []).find(s => s.number === swapStopNumber);
      const otherStops = (currentItinerary.stops || []).filter(s => s.number !== swapStopNumber).map(s => s.name);

      const prompt = `Replace one stop in this micro-adventure.

LOCATION:
${location || 'Same general area'}

${constraints}

ADVENTURE:
${currentItinerary.adventure?.name || 'Local outing'}

STOP TO REPLACE:
${JSON.stringify(currentStop)}

OTHER STOPS THAT REMAIN:
${otherStops.join(', ')}

Create one replacement that:
- preserves the overall theme
- fits approximately the same amount of time
- works with the user's transportation
- stays in the same general area when possible
- does not duplicate another stop
- does not rely on invented current local facts

If you cannot safely name a current venue, use a descriptive place type and tell the user what to verify.

Do not invent an address, cross street, price, opening hour, travel distance, or exact travel time.

Return ONLY valid JSON matching this shape:
{
  "stop": {
    "number": ${swapStopNumber},
    "name": "",
    "area": "",
    "duration_min": ${currentStop?.duration_min || 30},
    "description": "",
    "small_twist": "",
    "photo_op": "",
    "cost": "",
    "verify": ""
  },
  "transition": {
    "guidance": "",
    "estimated_time": ""
  }
}`;

      const data = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'micro-adventure-mapper-swap' });

      if (!data.stop) {
        return res.status(500).json({ error: 'Could not generate a replacement stop. Please try again.' });
      }
      return res.json(validateResult(data));
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate, regenerate, or swap' });

  } catch (error) {
    console.error('❌ MicroAdventureMapper error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js during the 2026-09-03 rewrite.
router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'tourism copy, invented clock times, insider claims about doors/staff/crowds, stated prices and opening states, and street addresses are blanked in code. The schema itself carries no address, no start time and no end time — the fields the old version used to invent into no longer exist.',
};

module.exports = router;
