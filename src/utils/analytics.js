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

// ── Operator self-exclusion (browser-level, network-independent). ──
// IP-based exclusion (METRICS_EXCLUDE_IPS) silently fails behind WARP/iCloud
// Private Relay: requests egress from rotating Cloudflare IPs, so the
// operator's home IP never appears in any hop. This flag lives in the browser
// instead: visit any page with ?operator=1 once (per browser/profile) and
// every beacon from it no-ops forever; ?operator=0 re-enables.
function operatorFlagFromUrl() {
  try {
    const v = new URLSearchParams(window.location.search).get('operator');
    if (v === '1') localStorage.setItem('db-operator', '1');
    else if (v === '0') localStorage.removeItem('db-operator');
  } catch (_) {}
  try {
    if (isOperator()) {
      console.info('[DeftBrain] operator mode ON — this browser sends no metrics (?operator=0 to undo)');
    }
  } catch (_) {}
}
function isOperator() {
  try { return localStorage.getItem('db-operator') === '1'; } catch (_) { return false; }
}

function send(payload) {
  if (isOperator()) return;
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

// ── Section depth: which parts of a page people actually reach. ──
// Percentage-of-document depth would mislead here. The home page carries the
// whole catalog below the intro, so the closing call-to-action sits about a
// sixth of the way down a document that prints to eighteen pages — "reached
// 50%" would say nothing about whether anyone saw it. Named markers answer
// the question instead: an element opts in with data-db-section, and the
// first time any part of it is on screen we report it once per page load.
//
// idx is the element's position among the markers on that page, so the
// dashboard can order the funnel without the backend having to know the
// running order of a page it never sees.
function armSectionMarkers() {
  if (typeof IntersectionObserver === 'undefined') return;
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const name = e.target.getAttribute('data-db-section');
      if (!name || seen.has(name)) continue;
      seen.add(name);
      io.unobserve(e.target);
      track('section_view', { section: String(name).slice(0, 40), idx: e.target.__dbIdx });
    }
  }, { threshold: 0.01 });

  // React has usually not painted when a route change fires, and some blocks
  // arrive later still, so rescan a couple of times rather than once. Already
  // observed nodes are skipped; nodes from a previous route are gone with it.
  const scan = () => {
    try {
      document.querySelectorAll('[data-db-section]').forEach((el, i) => {
        if (el.__dbObserved) return;
        el.__dbObserved = true;
        el.__dbIdx = i;
        io.observe(el);
      });
    } catch (_) {}
  };
  const rescan = () => { seen.clear(); scan(); setTimeout(scan, 400); setTimeout(scan, 1500); };
  rescan();
  return rescan;
}
let rescanSections = null;

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
  trackSecondTool(p);
  if (rescanSections) rescanSections();
}

// ── "What did they open next?" ────────────────────────────────────────────
// Events carry no session id — deliberately, there is nothing to join on — so
// the pairing has to happen in the browser. The first tool page of a session
// is remembered in sessionStorage; the next DIFFERENT tool page fires one
// `second_tool` with both ends of the hop, and the flag is retired so a
// session reports at most one pair. Third and fourth tools are not tracked:
// the question is what a tool leads to, not the whole path.
//
// Tool routes are the catalog's own convention — /PascalCase at the root.
// Matching the shape rather than importing the catalog keeps this file free
// of a 5,000-line dependency it would only use for an includes() check.
const TOOL_PATH = /^\/[A-Z][A-Za-z0-9]*$/;
function trackSecondTool(path) {
  if (!TOOL_PATH.test(path)) return;
  try {
    const first = sessionStorage.getItem('db-first-tool');
    if (!first) { sessionStorage.setItem('db-first-tool', path); return; }
    if (first === path) return;              // reload or a return trip, not a hop
    sessionStorage.removeItem('db-first-tool');
    track('second_tool', { from: first.slice(1), to: path.slice(1) });
  } catch (_) { /* private mode — the pair is simply not reported */ }
}

// ── Variant depth: when a tool offers several takes on one result, which ones
// do people actually open? A tool can hand back three letters or five angles
// and have no idea whether anyone looks past the first — the question is not
// answerable from tool_run, which fires once per generation regardless.
//
// The first variant is auto-selected rather than chosen, so it is reported
// separately: `auto` is what the tool picked, `click` is a deliberate move to
// another one. Comparing the two is the whole point — if `click` never
// happens, the extra variants are costing generation time nobody spends.
//
// Deduped per result set, so re-reading a tab does not inflate the count.
const seenVariants = new Set();
export function trackVariant(tool, variant, how = 'click') {
  if (!tool || !variant) return;
  const key = `${tool}:${variant}:${how}`;
  if (seenVariants.has(key)) return;
  seenVariants.add(key);
  track('variant_view', { tool: String(tool).slice(0, 40), variant: String(variant).slice(0, 40), how });
}

// Call when a fresh result set replaces the last one, so the next run's
// variants are counted again rather than suppressed as already-seen.
export function resetVariants() {
  seenVariants.clear();
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
  operatorFlagFromUrl();
  pageView();
  armInteractSignal();
  rescanSections = armSectionMarkers();
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
  // the result is leaving the screen for the real world.
  //
  // beforeprint catches the PrintBtn and Cmd/Ctrl+P — in every engine except
  // Safari, which has never implemented it and announces a print only by
  // switching the print media query. A Safari user printing to PDF was
  // therefore invisible, and "took it" read 0 for sessions that ended in a
  // saved file. Both paths now funnel through one guarded call, so a browser
  // that fires both does not count the same print twice.
  let printingNow = false;
  const notePrint = () => {
    if (printingNow) return;
    printingNow = true;
    track('print');
    setTimeout(() => { printingNow = false; }, 3000);
  };
  window.addEventListener('beforeprint', notePrint);
  try {
    const printMq = window.matchMedia('print');
    const onPrintMq = (e) => { if (e.matches) notePrint(); };
    if (printMq.addEventListener) printMq.addEventListener('change', onPrintMq);
    else if (printMq.addListener) printMq.addListener(onPrintMq);   // older Safari
  } catch (_) { /* matchMedia absent — nothing to fall back to */ }
}
