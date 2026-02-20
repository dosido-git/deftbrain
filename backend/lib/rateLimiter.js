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
function rateLimit(limits = DEFAULT_LIMITS, keyPrefix = '') {
  return (req, res, next) => {
    // Use X-Forwarded-For if behind a proxy, otherwise remoteAddress
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.connection?.remoteAddress
            || 'unknown';

    const key = keyPrefix + ip;

    const shortBucket = getBucket(shortWindow, key, SHORT_WINDOW_MS);
    const dailyBucket = getBucket(dailyWindow, key, DAILY_WINDOW_MS);

    // ── Check daily limit ──
    if (dailyBucket.count >= limits.perDay) {
      const retryAfter = Math.ceil((dailyBucket.resetAt - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Daily-Limit', String(limits.perDay));
      res.set('X-RateLimit-Daily-Remaining', '0');
      res.set('X-RateLimit-Daily-Reset', new Date(dailyBucket.resetAt).toISOString());
      return res.status(429).json({
        error: 'Daily limit reached. Come back tomorrow!',
        retryAfter,
        limitType: 'daily',
        limit: limits.perDay,
      });
    }

    // ── Check per-minute limit ──
    if (shortBucket.count >= limits.perMinute) {
      const retryAfter = Math.ceil((shortBucket.resetAt - Date.now()) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Minute-Limit', String(limits.perMinute));
      res.set('X-RateLimit-Minute-Remaining', '0');
      return res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfter,
        limitType: 'minute',
        limit: limits.perMinute,
      });
    }

    // ── Allowed — increment counters ──
    shortBucket.count++;
    dailyBucket.count++;

    // ── Add informational headers ──
    res.set('X-RateLimit-Minute-Remaining', String(Math.max(0, limits.perMinute - shortBucket.count)));
    res.set('X-RateLimit-Daily-Remaining', String(Math.max(0, limits.perDay - dailyBucket.count)));

    next();
  };
}

module.exports = { rateLimit, DEFAULT_LIMITS, CREATIVE_LIMITS, DIVERSION_LIMITS };
