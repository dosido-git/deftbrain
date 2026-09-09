// Derive a coarse {device, os, browser} label from the User-Agent header at
// write time — same posture as lib/geoip's use in routes/metrics.js
// (locationOf): a lightweight, owned, offline classification, never the raw
// UA string itself stored per-event. Regex-based on purpose; a full UA-parser
// dependency is more precision than a "device vs. desktop, iOS vs. Android"
// dashboard column needs, and this stays a few small, readable rules instead
// of a black box.
//
// Order matters in every list below — several UA substrings are shared
// (Chrome/Edge/Opera/Samsung Internet all contain "Chrome"; iPadOS 13+
// reports as "Macintosh" unless touch points give it away), so the more
// specific check must run first.

// ── Browser ──────────────────────────────────────────────────────────────
function browserOf(ua) {
  if (/EdgA?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/Firefox\//.test(ua) && !/Seamonkey/.test(ua)) return 'Firefox';
  if (/CriOS\//.test(ua)) return 'Chrome'; // Chrome on iOS
  if (/FxiOS\//.test(ua)) return 'Firefox'; // Firefox on iOS
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Chromium\//.test(ua)) return 'Chromium';
  // Safari's UA also contains "Safari/" on Chrome/Chromium, so this must come
  // after every Chrome-family check above.
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return 'Safari';
  return 'Other';
}

// ── OS ───────────────────────────────────────────────────────────────────
function osOf(ua) {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  // iPadOS 13+ Safari reports a plain macOS UA on an iPad. The one signal
  // left in the header is Safari + touch, which UA text alone can't carry —
  // "Macintosh" + "Mobile Safari" without a "Chrome"/"Edg" token is the
  // closest UA-only proxy (real Macs never say "Mobile Safari").
  if (/Macintosh/.test(ua) && /Mobile\/\w+ Safari/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/CrOS/.test(ua)) return 'Chrome OS';
  if (/Windows Phone/.test(ua)) return 'Windows';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}

// ── Device category ──────────────────────────────────────────────────────
function deviceOf(ua) {
  if (/iPad/.test(ua)) return 'Tablet';
  if (/Macintosh/.test(ua) && /Mobile\/\w+ Safari/.test(ua)) return 'Tablet'; // iPadOS 13+, see osOf
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'Tablet'; // Android tablets omit "Mobile"
  if (/Tablet|Kindle|Silk|PlayBook/.test(ua)) return 'Tablet';
  if (/Mobi|iPhone|iPod|Android|IEMobile|Windows Phone|BlackBerry|BB10/.test(ua)) return 'Mobile';
  return 'Desktop';
}

// Single entry point — one UA string in, one small object out. Never throws:
// an empty/missing UA (already excluded upstream as a likely bot, but this
// function has no business assuming that) classifies as 'Other'/'Other'/'Desktop'
// rather than raising into the request path.
function deviceInfo(userAgent) {
  const ua = typeof userAgent === 'string' ? userAgent : '';
  if (!ua) return { device: 'Other', os: 'Other', browser: 'Other' };
  try {
    return { device: deviceOf(ua), os: osOf(ua), browser: browserOf(ua) };
  } catch (_) {
    return { device: 'Other', os: 'Other', browser: 'Other' };
  }
}

module.exports = { deviceInfo };
