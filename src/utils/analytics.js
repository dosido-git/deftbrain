// Lightweight, owned, privacy-clean usage beacons.
// No cookies, no third party, no PII — just funnel signal so we can see whether
// real people open a tool, run it, and finish. Fire-and-forget: analytics must
// NEVER throw into or slow down the app.

const ENDPOINT = '/api/events';

function send(payload) {
  try {
    const body = JSON.stringify({
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
  track('page_view');
}

if (typeof window !== 'undefined' && !window.__dbAnalyticsInit) {
  window.__dbAnalyticsInit = true;
  pageView();
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
}
