// Page-wide "the site is busy" signal (2026-10-05, surge mode).
//
// useClaudeAPI raises it when a run comes back { code: 'busy' } (the server
// answers that when the model API is overloaded — backend/lib/surge.js), and
// BusyNotice (src/components/BusyNotice.js) shows the visitor what is going
// on: "you're in line" while the hook waits and retries, a kind "try again in
// a minute" if it still could not finish, nothing once a run succeeds.

const EVENT = 'deft:busy';

export function signalBusy(phase) {
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: { phase } })); } catch (_) { /* never surface */ }
}

export function onBusy(handler) {
  const listener = (e) => handler(e.detail && e.detail.phase);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
