// Real places inside an airport, for Layover Maximizer (2026-10-08).
//
// The tool-page example run named "Rijsttafel Schiphol" and other airport
// restaurants that may not exist; the prompt asked for "real restaurants" and
// the model supplied plausible ones. One bounded web search per airport fills
// a 30-day cache. It never blocks a request: the first traveller through a new
// airport gets kinds of places ("a sit-down restaurant airside near the D
// gates"), everyone after them gets verified names. Same shape as venues.js.

const { groundedFacts, normalizeKeyPart, stripCites } = require('./groundedFacts');

function airportPlacesFacts(airport) {
  return groundedFacts({
    cacheKey: `airport-places:${normalizeKeyPart(airport)}`,
    label: 'layover-airport-places',
    ttlMs: 30 * 24 * 60 * 60 * 1000,
    coldWaitMs: 0,
    maxUses: 3,
    maxTokens: 3000,
    system: 'You verify that specific restaurants, cafes, lounges and rest areas currently operate inside a given airport, using web search. Prefer the airport\'s own website and its shop and dine directory. Include a place ONLY if a current source confirms it; never invent a name. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Using web_search, list up to 16 places currently operating inside the airport "${airport}": restaurants and cafes (at least 6 if the airport has them), lounges, and rest or sleep areas. For each, say where it is (terminal, pier or gate area, and airside or landside if known).
Return ONLY valid JSON:
{ "places": [ { "name": "Exact name as the airport lists it", "kind": "restaurant|cafe|bar|lounge|rest_area|other", "where": "terminal / gates / airside or landside" } ] }`,
    render: facts => {
      const list = (Array.isArray(facts?.places) ? facts.places : []).filter(p => p && p.name).slice(0, 16);
      if (!list.length) return '';
      return `\n\nVERIFIED PLACES INSIDE ${airport} — confirmed by a current source:\n${list.map(p => `- "${p.name}" (${p.kind || 'place'}) — ${p.where || 'location not stated'}`).join('\n')}\n`;
    },
  });
}

// The prompt block for one airport: the verified list when we have it, and
// the naming rule either way.
async function airportPlacesBlock(airport) {
  const a = String(airport || '').trim();
  let block = '';
  if (a) { try { block = stripCites(await airportPlacesFacts(a)) || ''; } catch (_) { block = ''; } }
  return `${block}
NAMING RULE FOR PLACES INSIDE THE AIRPORT: name a restaurant, cafe, bar or lounge ONLY if it appears in a verified list above, copied exactly. Otherwise describe the kind of place and where to find it (a sit-down restaurant airside near the D gates, the pay-per-use lounge in Terminal 2) — never a name from memory, however likely it seems. Airport outlets change often and a confident wrong name sends a traveller walking for nothing.`;
}

module.exports = { airportPlacesBlock };
