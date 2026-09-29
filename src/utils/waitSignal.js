// A page-wide "is a tool answer on its way?" signal.
//
// Every tool calls the server through useClaudeAPI, but each tool draws its
// own loading state, so nothing above the tool knew a wait was happening.
// useClaudeAPI reports the start and end of every tracked call here; the page
// frame (WaitNotice in ToolPageWrapper) listens and shows the visitor how long
// it usually takes, and flips the tab title when an answer lands while they're
// on another tab. Counting in-flight calls (not a boolean) keeps fan-out tools
// and overlapping follow-ups correct: the wait ends when the last call does.

let inFlight = 0;
let startedAt = 0;
const listeners = new Set();

function emit(event) {
  listeners.forEach(fn => { try { fn(event); } catch (_) { /* a listener never breaks a request */ } });
}

// Returns a one-shot `end(outcome)` so a caller can end its wait early (a
// streaming call ends it on the first visible text) without double-counting.
export function beginWait() {
  if (inFlight === 0) startedAt = Date.now();
  inFlight += 1;
  emit({ type: 'start', inFlight, startedAt });
  let ended = false;
  return function endWait(outcome = 'ok') {
    if (ended) return;
    ended = true;
    inFlight = Math.max(0, inFlight - 1);
    emit({ type: 'end', inFlight, outcome, startedAt });
  };
}

export function subscribeWait(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentWait() {
  return { inFlight, startedAt };
}
