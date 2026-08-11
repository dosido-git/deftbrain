// Real-venue grounding for Date Night.
//
// Lifted out of routes/date-night.js so scripts/warm-venue-cache.js can call
// exactly the same prompt the route does — a seed generated from a different
// prompt than the one in production would be worse than no seed.

const { groundedFacts, normalizeKeyPart, stripCites } = require('./groundedFacts');
const places = require('./places');

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
    render: async (facts) => {
      const list = Array.isArray(facts.venues) ? facts.venues.filter(v => v && v.name) : [];
      if (!list.length) return '';
      // Opening hours, operating status and coordinates, when a Places key is
      // configured. Dormant otherwise — `enrich` hands back exactly what it was
      // given. This runs while the block is being BUILT, on a cache miss, so it
      // is paid once per location per TTL and never on the path of a request.
      // Permanently-closed venues are dropped inside enrich().
      const enriched = await places.enrich(list.slice(0, 24), location);

      const lines = enriched.map(v => {
        const shut = places.closedDays(v.periods);
        // Only the closures go in the prompt. Full weekly hours for 20 venues
        // would be most of the context window, and "closed Mondays" is the
        // part that changes what the model may schedule.
        const closed = shut.length && shut.length < 7
          ? ` · closed ${shut.map(d => places.DAY_NAMES[d]).join(', ')}`
          : '';
        return `- "${v.name}" (${v.kind || 'venue'}, ${v.price || '?'}) — ${v.note || ''}${v.area ? ` · ${v.area}` : ''}${closed}`;
      }).join('\n');

      const anyHours = enriched.some(v => Array.isArray(v.periods) && v.periods.length);
      return {
        block: `\n\nVERIFIED VENUES NEAR ${location} — real places, confirmed open:
${lines}

VENUE RULE: for each stop, venue_name MUST be one of the names above, copied EXACTLY as written between the quotes. Do not shorten, expand, translate or re-style it. Build the evening from these places. Only if none of them can fill a stop, fall back to a descriptive venue type for that one stop.${anyHours ? `
CLOSING DAYS ARE HARD CONSTRAINTS: never place a stop at a venue on a day it is marked closed. Choose another verified venue instead.` : ''}`,
        // Structured copy for anything that needs more than prose: open-at-time
        // checks and walking distances between stops.
        data: enriched.map(v => ({
          name: v.name, kind: v.kind || null, placeId: v.placeId || null,
          lat: v.lat ?? null, lng: v.lng ?? null, periods: v.periods || null,
          // utcOffset is what lets "open tonight" be evaluated in the venue's
          // own timezone instead of the server's. attachPlaceFacts reads it.
          utcOffset: v.utcOffset ?? null,
        })),
      };
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


/**
 * Attach what we know about each stop as a place rather than a name:
 *   walk_minutes  minutes on foot from the PREVIOUS stop
 *   open_at       true / false / undefined for "open at this stop's own time"
 *
 * Everything here is omitted rather than guessed. A stop we cannot match, a
 * clock string we cannot parse (stop.time is only reliably "7:45 PM" in
 * English), a venue with no hours, or a date we cannot pin to the venue's own
 * weekday all produce no field at all — the frontend then says nothing, which
 * is the honest outcome. open_at is never set to false out of ignorance.
 */
function attachPlaceFacts(itinerary, data, plannedDate) {
  if (!Array.isArray(itinerary) || !Array.isArray(data) || !data.length) return itinerary;
  const byName = new Map(data.map(d => [normVenue(d.name), d]));
  let prev = null;

  for (const stop of itinerary) {
    if (!stop || typeof stop !== 'object') continue;
    const d = byName.get(normVenue(stop.venue_name));
    if (!d) { prev = null; continue; }

    if (prev) {
      const mins = places.walkMinutes(prev, d);
      if (mins != null) stop.walk_minutes = mins;
    }

    // Which weekday to test. An explicit date is unambiguous — it is the local
    // date the visitor picked. "Tonight" has to come from the venue's own UTC
    // offset, or we would be asking whether it is open in the server's timezone.
    let day = null;
    if (plannedDate && /^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
      day = new Date(`${plannedDate}T12:00:00Z`).getUTCDay();
    } else {
      const now = places.localNow(d.utcOffset);
      if (now) day = now.day;
    }
    const mins = places.clockToMinutes(stop.time);
    if (day != null && mins != null) {
      const open = places.isOpenAt(d.periods, day, mins);
      if (open === true || open === false) stop.open_at = open;
    }
    prev = d;
  }
  return itinerary;
}

module.exports = { venueFacts, venueBlockFor, verifiedNamesFrom, markVerified, normVenue, attachPlaceFacts };
