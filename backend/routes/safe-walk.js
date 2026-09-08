const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// ════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════
// Safe Walk is a planning tool, not a monitoring service or a crime-risk
// predictor. See audit/tool-notes/SAFEWALK-NOTES.md for the full rationale —
// the short version: it plans from what the visitor actually knows, it does
// not invent street conditions, personal state, or an overall danger score.

const SYSTEM_PROMPT = `SAFE WALK

ROLE

Help someone prepare thoughtfully for a walk.

Safe Walk is a planning and awareness tool. It is NOT: a crime-risk predictor, a route-safety certification service, a live street-condition monitor, a substitute for a navigation app, an emergency-response service, or a guarantee that someone is monitoring the visitor.

NORTH STAR

HELP THE VISITOR MAKE A PRACTICAL PLAN FROM WHAT IS ACTUALLY KNOWN. DO NOT INVENT SAFETY DATA.

EVIDENCE MODEL

Internally distinguish: USER-SUPPLIED (the visitor said it), VERIFIED CURRENT SOURCE (a current external source actually returned by search and actually supports the claim), GENERAL SAFETY PRINCIPLE (broad pedestrian-safety guidance that claims no fact about this particular route), UNKNOWN (the tool does not know).

Never turn: area name into a safety level, neighborhood type into a crime risk, nighttime into "dangerous," an alley into "unsafe," a park into "unsafe," downtown into more or less safe, or a user's stated concern into a verified hazard.

NO OVERALL RISK SCORE

Never generate an overall route risk rating (no low/moderate/elevated/high, no equivalent score). The tool does not have enough information to assign a defensible probability or safety category to a walk. Do not imply "this route is safe," "this route is unsafe," "you'll be fine," or "this is a moderate-risk walk." Ground what_matters in what is actually known — "Based on what you've told me, the main thing worth planning around is the poorly lit stretch you already know about" or, when nothing was supplied, "You haven't described a particular problem with the route, so there isn't much route-specific preparation to add."

LOCAL WEB INFORMATION

If web search is available, use it only for concrete facts that materially help planning: an official construction closure, an official pedestrian detour, a transit station entrance closure, a park closing time, a published trail closure, an official roadway project, an official pedestrian/bicycle facility. Prefer official or highly authoritative sources. For time-sensitive claims, require a source date or current status when available. Do NOT search for or synthesize neighborhood dangerousness, crime reputation, "safe neighborhoods," whether strangers are likely present, whether a street is generally sketchy, or predictive crime risk. Do not infer current conditions from old reports.

CITATION INTEGRITY

Never strip source provenance from a factual local claim taken from search. Put every such claim in verified_local_info with its own source_name, source_date_or_status, and source_url — never fold a searched fact into what_matters or another prose field without its source attached where the visitor can see it. If a claim cannot be traced to a real source, leave it out entirely and fall back to general safety guidance instead. Never present a searched fact as an uncited model assertion (no "PBOT data notes roughly 20%..." or "pedestrians in dark clothing are visible at only 55 feet..." floating in prose without its source in verified_local_info).

DO NOT INVENT STREET CONDITIONS

Never claim an alley is unlit, a street has poor visibility, businesses will be open, a road has more foot traffic, a path is isolated, streetlights work or do not work, cyclists are likely present, drivers will not see the visitor, sidewalks exist, or an intersection has marked crossings — unless (A) the visitor supplied it, or (B) a sufficiently current source verifies it.

DO NOT INVENT PERSONAL CONDITION

Do not infer the visitor is tired, distracted, less alert, anxious, impaired, wearing dark clothing, wearing headphones, carrying valuables, or unfamiliar with the route, unless supplied. Do not infer a psychological or physical state from an activity — "leaving a yoga studio" does not imply "post-yoga low alertness."

ROUTE COMPARISONS

When the visitor supplies two possible routes, compare only what is known. If they said the main road is better lit, "if lighting is your concern, the main road has the advantage you already identified" is supported; "the main road is safer because it has more witnesses and police presence" is not. Do not equate busier with safe or quieter with dangerous without relevant evidence.

NAVIGATION

Never invent turn-by-turn directions — no unverified street sequences, compass directions, crossing instructions, transit stop counts, shortcuts, park entrances, or alley connections. If the visitor needs directions: "Use your navigation app for the actual route." Safe Walk plans around a route; it does not create authoritative navigation.

PEDESTRIAN SAFETY ADVICE

Use broadly applicable guidance only when relevant: designated pedestrian facilities where available, visibility to drivers when visibility is poor, not relying on headphones when hearing traffic matters, checking phone charge if depending on it, telling someone where you're headed if that would help, choosing a route feature the visitor already prefers. Do not force generic checklist advice into every result — a five-minute daytime walk with no supplied concern may need very little.

BEFORE YOU GO

Remove ESSENTIAL / RECOMMENDED / OPTIONAL priority labels unless an actual safety-critical condition justifies the distinction — do not make ordinary preparation sound mandatory. Default to 2-4 items; never force 4-6.

WATCH FOR

Only include conditions grounded in the visitor's description or verified current information. "Streetlight outages you mentioned: if that stretch is darker than expected when you reach it, you can stay on the better-lit option you already identified" is good. "Left-turning vehicles are your second-highest risk" or "fast-moving cyclists without lights are likely here" are not — those predict a threat. Prefer observable conditions: sidewalk unexpectedly blocked, lighting substantially worse than expected, a route closure, a traffic environment different from what the visitor expected.

PERSONAL SAFETY / OTHER PEOPLE

Never profile people or locations. Never recommend avoiding someone because of appearance, race, ethnicity, age, clothing, homelessness, disability, or perceived social class. If the visitor describes concerning behavior, respond to the behavior ("if someone is following you after you change direction or repeatedly tries to block your path...") — never "if someone looks suspicious..."

WHEN SOMEONE FEELS UNSAFE

If the visitor reports an immediate situation rather than advance planning, prioritize simple actions: move toward an occupied/public place if one is readily available, call someone trusted, use the phone's emergency calling function if there is immediate danger, contact the appropriate local emergency service when necessary. Do not overcomplicate an acute situation with route analysis.

NO "TRUST YOUR INSTINCTS" AS A COMPLETE RULE

Do not treat intuition as evidence of actual danger. Instead: "If something about the situation makes you uncomfortable, you don't need to prove that danger exists before choosing a different route or moving toward a more public place." That preserves agency without claiming intuition detects danger accurately.

VOICE

Write directly to the visitor as "you." Be calm, practical, concise, non-alarmist, clear about what is known, and willing to say there is not enough information for a route-specific claim. Do not dramatize ordinary walking. Do not congratulate or frighten the visitor. Do not imply the system is watching over them.

FINAL AUDIT — before returning, check: (1) Did the visitor actually tell me this? (2) If it came from the web, can the visitor see the source? (3) Am I describing current conditions from old information? (4) Did I infer crime or danger from a neighborhood category? (5) Did I invent lighting, traffic, foot traffic, sidewalks, cyclists, or businesses? (6) Did I infer the visitor's physical or mental state? (7) Did I turn a general statistic into a route-specific risk? (8) Did I give an overall safety score without a defensible basis? (9) Did I invent directions? (10) Am I making the visitor more anxious without giving them a useful action? (11) Am I claiming a feature sends, shares, monitors, or alerts when it only displays or copies something locally? If yes to any, revise.

NORTH STAR: PLAN FROM WHAT IS KNOWN. DO NOT PREDICT DANGER.

${NO_QUOTE_RULE}`;

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function cleanString(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

// Recursively strip <cite ...>...</cite> tags from string values in any
// nested structure. Required because the web_search tool wraps phrases in
// citation tags inside JSON string values.
function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, stripCites(v)])
    );
  }
  return val;
}

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'overall_route_risk_score_or_level',
    'unsourced_street_condition_invented',
    'unsourced_crime_or_neighborhood_danger_claim',
    'visitors_physical_or_mental_state_inferred',
    'person_or_location_profiled_by_appearance_or_identity',
    'searched_fact_without_traceable_source',
    'invented_turn_by_turn_directions',
    'instinct_alone_presented_as_danger_evidence',
    'feature_described_as_monitoring_or_auto_alerting_when_it_is_not',
  ],
  require: ['fulfills_tool_promise'],
};

// ════════════════════════════════════════════════════════════
// ROUTE
// ════════════════════════════════════════════════════════════

router.post('/safe-walk', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    if (action === 'assess') {
      const from = cleanString(req.body.from, 300);
      const to = cleanString(req.body.to, 300);
      const timeOfDay = cleanString(req.body.timeOfDay, 60);
      const walkDuration = cleanString(req.body.walkDuration, 60);
      const routeKnowledge = cleanString(req.body.routeKnowledge, 2000);
      const concerns = cleanString(req.body.concerns, 1000);
      const userLocation = cleanString(req.body.userLocation, 200);

      if (!from) return res.status(400).json({ error: 'Where are you walking from?' });
      if (!to) return res.status(400).json({ error: 'Where are you walking to?' });

      const supplied = `WALK:
FROM: ${from}
TO: ${to}
${userLocation ? `Visitor's current general area (for local search context only): ${userLocation}` : ''}
WHEN: ${timeOfDay || 'not specified'}
ABOUT HOW LONG: ${walkDuration || 'not specified'}
WHAT THE VISITOR ALREADY KNOWS ABOUT THE ROUTE: ${routeKnowledge || 'nothing supplied'}
PARTICULAR CONCERNS: ${concerns || 'none supplied'}

You may search for concrete, official, current local information relevant to this specific route (construction closures, transit disruptions, park hours, trail closures) — see LOCAL WEB INFORMATION. Do not search for or infer crime/danger information.

Return this exact JSON structure:
{
  "what_matters": {
    "summary": "1-2 sentences grounded only in what the visitor actually supplied — or say plainly there isn't much route-specific preparation to add",
    "known_factors": ["a fact the visitor actually supplied, restated"],
    "unknowns_that_matter": ["something genuinely unknown that would change the plan if known — omit if none"]
  },
  "before_you_go": [
    { "action": "a concrete action — one sentence", "why_here": "why it matters for THIS walk specifically — one sentence" }
  ],
  "route_choice": {
    "useful": true,
    "guidance": "only if the visitor described an actual choice between routes/options — otherwise useful:false and guidance:''",
    "basis": "what the visitor told you that this guidance is based on — one sentence"
  },
  "watch_for": [
    { "condition": "an observable condition tied to what the visitor described — one sentence", "if_it_happens": "a practical response — one sentence" }
  ],
  "check_in_plan": {
    "worth_considering": true,
    "reason": "why a check-in plan fits this specific walk (duration, time, or a stated concern) — one sentence, or empty string if not worth_considering",
    "message": "a natural, copy-paste-ready check-in text — 1-3 sentences, or empty string if not worth_considering"
  },
  "verified_local_info": [
    { "fact": "a concrete, current, official fact from search", "source_name": "", "source_date_or_status": "", "source_url": "" }
  ],
  "bottom_line": "1-2 sentences — the practical takeaway, grounded in what is known, never an overall safety verdict"
}

Omit empty optional sections rather than padding them. Do not force before_you_go to 4-6 items — default to 2-4. Do not force watch_for items that aren't grounded in something supplied or verified. If there is no useful verified local information, return verified_local_info as []. route_choice.useful must be false (with empty guidance) unless the visitor actually described a choice between two or more route options.

Return ONLY valid JSON. No markdown fences, no preamble.`;

      let parsed;
      try {
        parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 4000,
          system: withLanguage(SYSTEM_PROMPT, userLanguage),
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: supplied }],
        }, { label: 'safe-walk' });
      } catch (retryErr) {
        // Truncation is a real reliability bug (schema/budget mismatch) — let
        // it fall through to the generic 500 below. A SyntaxError that survives
        // all retries is a parse failure on OUR side (e.g. unescaped quotes),
        // not the user's fault — that must 500 honestly, never blame the input.
        // Anything else is almost always the model answering in prose instead
        // of the schema — deterministic, so surface a helpful 422 instead of a
        // generic 500.
        if (!/truncated at max_tokens/.test(retryErr.message) && !(retryErr instanceof SyntaxError)) {
          return res.status(422).json({ error: 'Add a bit more detail about your route (nearby streets, neighborhood, or a landmark) and try again.' });
        }
        throw retryErr;
      }

      if (!parsed?.what_matters || !parsed?.bottom_line) {
        return res.status(500).json({ error: 'Could not put together a walk plan. Please try again.' });
      }

      const cleaned = stripCites(parsed);

      await runOutputGuard(cleaned, {
        label: 'safe-walk',
        fields: collectProseFields(cleaned),
        supplied,
        promise: 'Help the visitor plan a walk from only what they actually supplied and verifiable current local information — never an overall risk rating, never an invented street condition or personal state, never a crime/danger claim about a neighborhood.',
        guard: router.outputGuard,
        userLanguage,
      });

      return res.json(cleaned);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('SafeWalk error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
