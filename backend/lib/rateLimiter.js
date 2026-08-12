// backend/lib/rateLimiter.js
//
// In-memory rate limiting per IP.
// Tracks two windows:
//   - Short burst:  max requests per minute  (prevents rapid-fire)
//   - Daily budget: max requests per day     (protects API spend)
//
// For multi-server deployments, swap the Maps for Redis.
// ─────────────────────────────────────────────────────────────

const SHORT_WINDOW_MS  = 60 * 1000;          // 1 minute
const DAILY_WINDOW_MS  = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 10 * 60 * 1000;      // purge stale entries every 10 min

// ── Default limits (can be overridden per-route) ──
const DEFAULT_LIMITS = {
  perMinute: 12,    // max API calls per minute per IP
  perDay:    200,   // max API calls per day per IP
};

// ── "Creative / Generation" limits (heavy token usage: NameStorm, NameAudit) ──
const CREATIVE_LIMITS = {
  perMinute: 4,     // each call is 6000+ tokens — no need for rapid fire
  perDay:    40,    // ~40 full generations per day is very generous
};

// ── "Fun / Diversions" limits (tighter for addictive tools) ──
const DIVERSION_LIMITS = {
  perMinute: 8,
  perDay:    30,
};

// ── Storage ──
const shortWindow = new Map();  // key: ip -> { count, resetAt }
const dailyWindow = new Map();  // key: ip -> { count, resetAt }

// Hard cap on tracked keys — a backstop so a flood of distinct keys can't grow
// the Maps without bound between the 10-min cleanups.
const MAX_TRACKED_IPS = 50000;
function evictOldest(map) {
  // Drop the ~10% of entries that reset soonest (closest to expiry / oldest).
  const entries = [...map.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  const drop = Math.ceil(entries.length * 0.1);
  for (let i = 0; i < drop; i++) map.delete(entries[i][0]);
}

// ── Periodic cleanup of expired entries ──
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of shortWindow) {
    if (now > val.resetAt) shortWindow.delete(key);
  }
  for (const [key, val] of dailyWindow) {
    if (now > val.resetAt) dailyWindow.delete(key);
  }
}, CLEANUP_INTERVAL);

// ── Helper: get or create a window bucket ──
function getBucket(map, key, windowMs) {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  return bucket;
}

// ── Middleware factory ──
// Options:
//   limits    — { perMinute, perDay }
//   keyPrefix — separate bucket namespace (e.g., 'namestorm:' so creative
//               tools don't eat into the global budget and vice versa)
// Actions a TOOL fires on the visitor's behalf, not ones they clicked. Date
// Night warms the venue cache as they type a location, and asks for next-step
// suggestions the moment a plan renders. Charging those to the same bucket as
// the plan meant two plans produced "please slow down" for normal use.
//
// The knowledge lives HERE rather than in server.js because /api is limited in
// two places — app level and per route — and if the two disagree about which
// bucket an action belongs in, the automatic call lands in the user's bucket
// anyway under the other key. One definition, both layers, same answer.
const AUTOMATIC_ACTIONS = new Set(['warm-venues', 'next-help']);
const AUTOMATIC_LIMITS = { perMinute: 40, perDay: 600 };

function rateLimit(limits = DEFAULT_LIMITS, keyPrefix = '') {
  return (req, res, next) => {
    // ── Perf-probe bypass (development only) ──
    if (req.headers['x-perf-probe'] === '1' && process.env.NODE_ENV !== 'production') {
      return next();
    }

    // req.ip is derived by Express from the trusted proxy hop (see
    // `app.set('trust proxy', 1)` in server.js) — NOT the client-controlled
    // leftmost X-Forwarded-For value, which was spoofable to mint a fresh
    // bucket per request and bypass every limit.
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // An automatic action is redirected to its own bucket whatever the caller
    // asked for, so both limiting layers agree and the visitor's own budget is
    // untouched by chatter the tool generated.
    const automatic = AUTOMATIC_ACTIONS.has(req.body && req.body.action);
    const effLimits = automatic ? AUTOMATIC_LIMITS : limits;
    const key = (automatic ? 'auto:' : keyPrefix) + ip;

    // COUNT ONCE PER REQUEST. server.js rate-limits every POST to /api, and
    // 128 route files ALSO apply their own rateLimit() — same limits, same
    // empty keyPrefix, so the same bucket was incremented twice for every
    // single request. DEFAULT_LIMITS says 12 a minute; the real ceiling was 6,
    // and had been for as long as both layers existed. Measured on
    // /api/the-crux: 6 POSTs, then 429.
    //
    // Marking the request means the first limiter to see it decides, and any
    // later one is a no-op. Deliberately keyed on the KEY, not a bare boolean,
    // so a deliberately different bucket (the automatic-actions limiter, which
    // uses its own prefix) is still free to count separately.
    req._rateLimitedKeys = req._rateLimitedKeys || new Set();
    if (req._rateLimitedKeys.has(key)) return next();
    req._rateLimitedKeys.add(key);

    // Backstop against unbounded Map growth (a spoof/rotation attack, or simply
    // huge traffic, would otherwise grow the daily Map for 24h between cleanups
    // → OOM). Once the maps are very large, evict the oldest-resetting entries.
    if (shortWindow.size > MAX_TRACKED_IPS) evictOldest(shortWindow);
    if (dailyWindow.size > MAX_TRACKED_IPS) evictOldest(dailyWindow);

    const shortBucket = getBucket(shortWindow, key, SHORT_WINDOW_MS);
    const dailyBucket = getBucket(dailyWindow, key, DAILY_WINDOW_MS);

    // ── Check daily limit ──
    if (dailyBucket.count >= effLimits.perDay) {
      const retryAfter = Math.ceil((dailyBucket.resetAt - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Daily-Limit', String(effLimits.perDay));
      res.set('X-RateLimit-Daily-Remaining', '0');
      res.set('X-RateLimit-Daily-Reset', new Date(dailyBucket.resetAt).toISOString());
      return res.status(429).json({
        error: 'Daily limit reached. Come back tomorrow!',
        retryAfter,
        limitType: 'daily',
        limit: effLimits.perDay,
      });
    }

    // ── Check per-minute limit ──
    if (shortBucket.count >= effLimits.perMinute) {
      const retryAfter = Math.ceil((shortBucket.resetAt - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Minute-Limit', String(effLimits.perMinute));
      res.set('X-RateLimit-Minute-Remaining', '0');
      return res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfter,
        limitType: 'minute',
        limit: effLimits.perMinute,
      });
    }

    // ── Allowed — increment counters ──
    shortBucket.count++;
    dailyBucket.count++;

    // ── Add informational headers ──
    res.set('X-RateLimit-Minute-Remaining', String(Math.max(0, effLimits.perMinute - shortBucket.count)));
    res.set('X-RateLimit-Daily-Remaining', String(Math.max(0, effLimits.perDay - dailyBucket.count)));

    next();
  };
}

module.exports = {
  AUTOMATIC_ACTIONS,
  AUTOMATIC_LIMITS, rateLimit, DEFAULT_LIMITS, CREATIVE_LIMITS, DIVERSION_LIMITS };
