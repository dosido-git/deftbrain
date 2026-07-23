// Lightweight, owned, privacy-clean usage beacons.
// No cookies, no third party, no PII — just funnel signal so we can see whether
// real people open a tool, run it, and finish. Fire-and-forget: analytics must
// NEVER throw into or slow down the app.

const ENDPOINT = '/api/events';

// Resolve this session's source label. An explicit `?utm_source=` or `?ref=`
// query param wins — it survives referrers stripped by Slack/email/in-app
// browsers (Instagram, TikTok, LinkedIn) — else fall back to the referring
// hostname, else undefined ("direct"). Only read on the landing page of a new
// session; navigating further without params keeps the original source.
function resolveSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const explicit = (params.get('utm_source') || params.get('ref') || '').trim();
    if (explicit) return explicit.slice(0, 60);
  } catch (_) {}
  try {
    if (document.referrer && !document.referrer.includes(window.location.hostname)) {
      return (new URL(document.referrer)).hostname;
    }
  } catch (_) {}
  return undefined;
}

// Anonymous context: no identifier ever leaves the browser. The client alone
// knows whether it has been here before (localStorage timestamp) and reports
// only a boolean + a coarse recency bucket. Sessions are a sessionStorage flag.
function visitContext() {
  try {
    const now = Date.now();
    let first = null;
    try { first = parseInt(localStorage.getItem('db-first-seen'), 10) || null; } catch (_) {}
    const returning = !!first;
    if (!first) { try { localStorage.setItem('db-first-seen', String(now)); } catch (_) {} }
    const days = first ? Math.floor((now - first) / 86400000) : 0;
    const bucket = !returning ? 'new' : days <= 7 ? '1-7d' : days <= 30 ? '8-30d' : '30d+';
    let newSession = false;
    try {
      if (!sessionStorage.getItem('db-sess')) { sessionStorage.setItem('db-sess', '1'); newSession = true; }
    } catch (_) {}
    let ref;
    if (newSession) {
      ref = resolveSource();
      if (ref) { try { sessionStorage.setItem('db-ref', ref); } catch (_) {} }
    }
    try { if (window.location.pathname.startsWith('/guides')) sessionStorage.setItem('db-saw-guide', '1'); } catch (_) {}
    return {
      returning,
      bucket,
      newSession,
      ref,
      lang: (navigator.language || '').slice(0, 5) || undefined,
    };
  } catch (_) { return {}; }
}

function sessionContext() {
  const ctx = {};
  try {
    const ref = sessionStorage.getItem('db-ref');
    if (ref) ctx.ref = ref;
    if (sessionStorage.getItem('db-saw-guide')) ctx.sawGuide = true;
  } catch (_) {}
  return ctx;
}

function send(payload) {
  try {
    const body = JSON.stringify({
      ...sessionContext(),
      ...payload,
      path: window.location.pathname,
      ts: Date.now(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {
    /* swallow — a broken beacon must never surface to the user */
  }
}

// Track a named funnel event with optional properties.
//   track('tool_run', { tool: 'DoctorVisitTranslator' })
export function track(event, props = {}) {
  send({ event, props });
}

// ── Auto-track pageviews across client-side routing, without touching the
//    router. Patches history.pushState/replaceState + popstate so every SPA
//    navigation fires one page_view. Guarded so it only installs once. ──
let lastPath = null;
function pageView() {
  if (typeof window === 'undefined') return;
  const p = window.location.pathname;
  if (p === lastPath) return;
  lastPath = p;
  track('page_view', visitContext());
}

// ── Human-session signal: fire `interact` ONCE per session on the first real
// user gesture (click/tap/keypress/scroll). Page-loaders that never interact —
// headless bots with browser UAs, prefetches, link-preview renderers — never
// send it, so "interactive sessions" on the dashboard ≈ sessions with a human
// behind them. Behavioral, so it catches what UA and IP filters can't. ──
function armInteractSignal() {
  try {
    if (sessionStorage.getItem('db-int')) return;
  } catch (_) { return; }
  const fire = () => {
    try {
      if (sessionStorage.getItem('db-int')) return;
      sessionStorage.setItem('db-int', '1');
    } catch (_) { return; }
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t => window.removeEventListener(t, fire));
    track('interact');
  };
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t =>
    window.addEventListener(t, fire, { passive: true }));
}

if (typeof window !== 'undefined' && !window.__dbAnalyticsInit) {
  window.__dbAnalyticsInit = true;
  pageView();
  armInteractSignal();
  const wrap = (method) => {
    const orig = window.history[method];
    window.history[method] = function () {
      const result = orig.apply(this, arguments);
      pageView();
      return result;
    };
  };
  wrap('pushState');
  wrap('replaceState');
  window.addEventListener('popstate', pageView);
  // "Took it with them": a print is one of the strongest validation signals —
  // the result is leaving the screen for the real world. beforeprint catches
  // both the PrintBtn and Cmd/Ctrl+P, so buttons don't need their own beacon.
  window.addEventListener('beforeprint', () => track('print'));
}
