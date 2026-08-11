// Real-venue grounding for Date Night.
//
// Lifted out of routes/date-night.js so scripts/warm-venue-cache.js can call
// exactly the same prompt the route does — a seed generated from a different
// prompt than the one in production would be worse than no seed.

const { groundedFacts, normalizeKeyPart, stripCites } = require('./groundedFacts');

// So the name is required WHEN it can be verified and not otherwise. One
// bounded web_search per location fills a 14-day cache; groundedFacts never
// blocks the request, so the first visitor to a new location gets descriptive
// types and everyone after them gets real names. Whether a given stop ended up
// verified is decided HERE, by string-matching the model's answer against the
// verified list — never by asking the model to self-report, which it will
// happily get wrong for a name it just invented.

const VENUE_LINE = /^- "([^"]+)"/gm;

function verifiedNamesFrom(block) {
  if (!block) return [];
  return [...block.matchAll(VENUE_LINE)].map(m => m[1]);
}

// Loose enough to survive "The Automat" vs "Automat" and stray punctuation,
// strict enough that a different restaurant never matches.
const normVenue = (s) => String(s || '').toLowerCase()
  .replace(/^(the|a|an|le|la|el)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

function markVerified(itinerary, verifiedNames) {
  if (!Array.isArray(itinerary)) return itinerary;
  const known = new Set(verifiedNames.map(normVenue));
  for (const stop of itinerary) {
    if (stop && typeof stop === 'object') stop.venue_confirmed = known.has(normVenue(stop.venue_name));
  }
  return itinerary;
}

function venueFacts(location) {
  return groundedFacts({
    cacheKey: `date-venues:${normalizeKeyPart(location)}`,
    label: 'date-night-venues',
    ttlMs: 7 * 24 * 60 * 60 * 1000, // shorter than the 14-day default; restaurants close
    system: 'You verify that specific businesses and public places exist and are currently operating, using web search. Prefer the venue\'s own site, a current listing, or recent local coverage. Include a place ONLY if you can confirm it is open now — omit anything permanently closed, relocated, or that you cannot verify. Never invent a name. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Using web_search, list REAL venues in or within walking distance of "${location}" that are currently open, suitable for an evening out.

Cover as many of these as you can find: a bar or cocktail place, a casual restaurant, a nicer restaurant, a dessert or ice-cream place, a coffee or tea place, somewhere to walk (park, waterfront, plaza), and something to do (music, theatre, gallery, games).

Only include a place you can actually verify is open. Fewer real ones is better than padding the list.

Return ONLY valid JSON:
{ "venues": [ { "name": "Exact business name as it is written", "kind": "bar|dinner_casual|dinner_nice|dessert|coffee|walk|activity", "price": "$|$$|$$$|free", "note": "What it is, one short clause", "area": "Neighborhood or street" } ] }`,
    render: (facts) => {
      const list = Array.isArray(facts.venues) ? facts.venues.filter(v => v && v.name) : [];
      if (!list.length) return '';
      const lines = list.slice(0, 24)
        .map(v => `- "${v.name}" (${v.kind || 'venue'}, ${v.price || '?'}) — ${v.note || ''}${v.area ? ` · ${v.area}` : ''}`)
        .join('\n');
      return `\n\nVERIFIED VENUES NEAR ${location} — real places, confirmed open:
${lines}

VENUE RULE: for each stop, venue_name MUST be one of the names above, copied EXACTLY as written between the quotes. Do not shorten, expand, translate or re-style it. Build the evening from these places. Only if none of them can fill a stop, fall back to a descriptive venue type for that one stop.`;
    },
  });
}

// groundedFacts already strips <cite> tags before render(), but this block is
// the only web-derived text in the route and it goes straight into a prompt.
// Re-asserting it here keeps that guarantee local and visible instead of
// resting on a lib two files away.
async function venueBlockFor(location) {
  const loc = String(location || '').trim();
  return loc ? stripCites(await venueFacts(loc)) : '';
}


module.exports = { venueFacts, venueBlockFor, verifiedNamesFrom, markVerified, normVenue };
