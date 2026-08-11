// Google Places enrichment — opening hours, operating status, coordinates.
//
// WHY: web search gives us venues that are REAL, which is not the same as
// venues that are OPEN when the plan says to be there. A plan that says
// "Reserve dinner at Uchi" without knowing Uchi is shut on Mondays is a good
// suggestion, not an executable evening. One lookup per venue supplies the
// difference, and because it happens while the grounding block is being built
// — not while a plan is being served — it is paid once per location per cache
// window, never per request.
//
// DORMANT WITHOUT A KEY. Every function here returns its input unchanged when
// GOOGLE_PLACES_KEY is unset, the quota is spent, the network fails, or the
// name does not match confidently. Grounding already degrades gracefully; this
// must never be the thing that breaks it.

const KEY = () => process.env.GOOGLE_PLACES_KEY || '';

// Places API (New). searchText returns the details inline given a field mask,
// so this is ONE billed call per venue rather than a search followed by a
// details fetch. The mask is deliberately narrow — every extra field can move
// the call into a more expensive SKU.
const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.businessStatus',
  'places.location',
  'places.regularOpeningHours.periods',
  'places.priceLevel',
].join(',');

const TIMEOUT_MS = 6000;

// Same normalisation the verified-name matcher uses, so "The Automat" and
// "Automat" agree here too.
const norm = (s) => String(s || '').toLowerCase()
  .replace(/^(the|a|an|le|la|el)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * One venue -> { placeId, status, lat, lng, periods, priceLevel } or null.
 * null means "we learned nothing", never "assume the worst".
 */
async function lookup(name, locationHint) {
  if (!KEY() || !name) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SEARCH_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY(),
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: locationHint ? `${name}, ${locationHint}` : name,
        maxResultCount: 1,
      }),
    });
    if (!res.ok) {
      console.error(`[places] ${res.status} for "${name}" — skipping enrichment`);
      return null;
    }
    const json = await res.json();
    const p = json && Array.isArray(json.places) ? json.places[0] : null;
    if (!p) return null;

    // The whole risk of this feature is putting the wrong Noir on the card.
    // A weak match is worse than no match, so require the names to agree
    // after normalisation and drop it otherwise.
    const got = norm(p.displayName && p.displayName.text);
    const want = norm(name);
    if (!got || !(got === want || got.startsWith(want) || want.startsWith(got))) {
      console.log(`[places] name mismatch for "${name}" (got "${p.displayName && p.displayName.text}") — skipping`);
      return null;
    }

    return {
      placeId: p.id || null,
      status: p.businessStatus || null,
      lat: p.location ? p.location.latitude : null,
      lng: p.location ? p.location.longitude : null,
      periods: (p.regularOpeningHours && p.regularOpeningHours.periods) || null,
      priceLevel: p.priceLevel || null,
    };
  } catch (err) {
    if (err.name !== 'AbortError') console.error(`[places] lookup failed for "${name}":`, err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Enrich a venue list in place-ish (returns a new array). Permanently closed
 * venues are dropped: a verified name for a shut restaurant is exactly the
 * failure this whole feature exists to prevent.
 */
async function enrich(venues, locationHint) {
  if (!KEY() || !Array.isArray(venues) || !venues.length) return venues;
  const out = [];
  // Sequential on purpose. This runs on a cache miss, nothing is waiting on
  // it, and a burst of parallel calls is the fastest way to trip a quota.
  for (const v of venues) {
    const info = await lookup(v && v.name, locationHint);
    if (info && info.status === 'CLOSED_PERMANENTLY') {
      console.log(`[places] dropping "${v.name}" — permanently closed`);
      continue;
    }
    out.push(info ? { ...v, ...info } : v);
  }
  return out;
}

// ── Pure helpers (no API, unit-testable) ────────────────────────────────────

const DAY_MIN = 24 * 60;

/**
 * Is a venue open at a given weekday/time?
 * `periods` is Places' shape: [{ open:{day,hour,minute}, close:{day,hour,minute} }]
 * day is 0=Sunday. A period with no `close` means open 24h.
 * Returns true / false / null, where null is "we don't know" — which callers
 * must treat as "say nothing", never as "closed".
 */
function isOpenAt(periods, day, minutes) {
  if (!Array.isArray(periods) || !periods.length) return null;
  if (!Number.isInteger(day) || !Number.isFinite(minutes)) return null;
  const target = day * DAY_MIN + minutes;
  for (const p of periods) {
    if (!p || !p.open) continue;
    if (!p.close) return true; // open 24 hours
    const start = p.open.day * DAY_MIN + (p.open.hour || 0) * 60 + (p.open.minute || 0);
    let end = p.close.day * DAY_MIN + (p.close.hour || 0) * 60 + (p.close.minute || 0);
    if (end <= start) end += 7 * DAY_MIN; // wraps past midnight / into next week
    // compare the target in both this week and the next, so a Sunday-night
    // period that closes Monday morning still matches a Monday-morning target
    if ((target >= start && target < end) || (target + 7 * DAY_MIN >= start && target + 7 * DAY_MIN < end)) return true;
  }
  return false;
}

/** Which weekdays a venue is never open. [] when unknown. */
function closedDays(periods) {
  if (!Array.isArray(periods) || !periods.length) return [];
  const open = new Set(periods.filter(p => p && p.open).map(p => p.open.day));
  return [0, 1, 2, 3, 4, 5, 6].filter(d => !open.has(d));
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Great-circle metres between two coordinates. */
function metresBetween(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(s))));
}

/**
 * Walking minutes between two coordinates. 80 m/min is a normal urban pace;
 * the 1.25 factor is because streets are not straight lines. Deliberately a
 * rough number — it replaces an asserted "mostly walkable", not a routing API.
 */
function walkMinutes(a, b) {
  const m = metresBetween(a, b);
  if (m == null) return null;
  return Math.max(1, Math.round((m * 1.25) / 80));
}

module.exports = {
  enabled: () => !!KEY(),
  lookup,
  enrich,
  isOpenAt,
  closedDays,
  metresBetween,
  walkMinutes,
  DAY_NAMES,
};
