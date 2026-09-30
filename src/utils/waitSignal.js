// A page-wide "is a tool answer on its way?" signal.
//
// Every tool calls the server through useClaudeAPI, but each tool draws its
// own loading state, so nothing above the tool knew a wait was happening.
// useClaudeAPI reports the start and end of every tracked call here, with
// which tool page started it and a short recap of what the visitor typed.
// WaitNotice (mounted once, above the routes) listens: it shows how long the
// answer usually takes, flips the tab title when it lands while the tab is
// hidden, and, if the visitor has moved to another page meanwhile, tells them
// it's ready with a link back. Counting in-flight calls (not a boolean) keeps
// fan-out tools and overlapping follow-ups correct: the wait ends when the
// last call does.

let active = [];          // [{ id, tool, summary, startedAt }]
let seq = 0;
const listeners = new Set();

function emit(event) {
  listeners.forEach(fn => { try { fn(event); } catch (_) { /* a listener never breaks a request */ } });
}

function snapshot() {
  const latest = active[active.length - 1] || null;
  return {
    inFlight: active.length,
    startedAt: active.length ? Math.min(...active.map(a => a.startedAt)) : 0,
    tool: latest ? latest.tool : null,
    summary: latest ? latest.summary : [],
  };
}

// meta: { tool, summary } — tool is the catalog id of the page that made the
// call (null off tool pages); summary is a few short strings the visitor typed.
// Returns a one-shot `end(outcome)` so a caller can end its wait early (a
// streaming call ends it on the first visible text) without double-counting.
export function beginWait(meta = {}) {
  const call = { id: ++seq, tool: meta.tool || null, summary: meta.summary || [], startedAt: Date.now() };
  active.push(call);
  emit({ type: 'start', ...snapshot() });
  let ended = false;
  return function endWait(outcome = 'ok') {
    if (ended) return;
    ended = true;
    active = active.filter(a => a.id !== call.id);
    emit({ type: 'end', ...snapshot(), outcome, endedTool: call.tool });
  };
}

export function subscribeWait(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentWait() {
  return snapshot();
}

// ── Recap: what the visitor typed, for "What you told us" during the wait ──
// Pulled from the request body, so it works for every tool without per-tool
// code. Only free text survives: settings, option ids, locale fields, file
// data and long pasted documents' tails are left out. A value must also be
// in a text box on the page: a picked option's label ("Work Happy Hour") is
// sent in English whatever the page language, and would read wrong in the
// other twelve, but nobody types into a picker.
const SKIP_KEY = /(^|_)(user)?(language|locale|currency|region)$|mode|action|^type$|tone|level|period|format|style|exclude|history|playbook|image|pdf|base64|file|data$|^id$|Id$|count|size|energy|hours|minutes|budget|age$|rhythm|emphasis|refresh/i;

const norm = str => String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();

const TEXT_BOX = 'textarea, input:not([type]), input[type="text"], input[type="search"], [contenteditable="true"]';
const boxValue = el => norm(el.value !== undefined ? el.value : el.textContent);

// Some tools clear a box once its text is added to a list, or swap the form
// for a loading screen before the call goes out, so the boxes are also
// remembered: as they're typed in, and just before any click or key press
// (capture phase, ahead of the tool's own handler). One entry per stretch of
// typing in a box; emptying the box starts a new one.
const remembered = [];          // [{ value }]
const openEntry = new Map();    // box → its entry still being typed
const MAX_REMEMBERED = 40;

function remember(el) {
  if (!el || typeof el.matches !== 'function' || !el.matches(TEXT_BOX)) return;
  const value = boxValue(el);
  if (!value) { openEntry.delete(el); return; }
  const entry = openEntry.get(el);
  if (entry) { entry.value = value; return; }
  const fresh = { value };
  remembered.push(fresh);
  openEntry.set(el, fresh);
  if (remembered.length > MAX_REMEMBERED) remembered.shift();
  if (openEntry.size > MAX_REMEMBERED) openEntry.delete(openEntry.keys().next().value);
}

if (typeof document !== 'undefined') {
  document.addEventListener('input', e => remember(e.target), true);
  const snapshot = () => document.querySelectorAll(TEXT_BOX).forEach(remember);
  document.addEventListener('pointerdown', snapshot, true);
  document.addEventListener('keydown', snapshot, true);
}

// What the visitor has typed into the page (null when there's no page).
function typedValues() {
  if (typeof document === 'undefined') return null;
  return [...document.querySelectorAll(TEXT_BOX)].map(boxValue)
    .concat(remembered.map(r => r.value))
    .filter(Boolean);
}

// Typed, not picked: the text is in a box, or a box's text is in it (a tool
// that joins two boxes into one field).
function wasTyped(text, typed) {
  if (!typed) return true;
  const n = norm(text);
  return typed.some(v => v.includes(n) || (v.length >= 12 && n.includes(v)));
}

function clip(str, n = 140) {
  const s = str.replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

export function summarizeRequest(data) {
  if (!data || typeof data !== 'object') return [];
  const out = [];
  const typed = typedValues();
  for (const [key, value] of Object.entries(data)) {
    if (out.length >= 2 || SKIP_KEY.test(key)) continue;
    let text = '';
    if (typeof value === 'string') text = wasTyped(value, typed) ? value : '';
    // A list counts only when it's phrases the visitor wrote (tasks,
    // interests), not a set of picks like ["hurt", "angry"] or ["be_heard"].
    else if (Array.isArray(value) && value.length && value.every(v => typeof v === 'string')
      && !value.some(v => v.includes('_')) && value.filter(v => /\s/.test(v.trim())).length * 2 >= value.length
      && value.every(v => wasTyped(v, typed))) {
      text = value.join(' · ');
    }
    text = (text || '').trim();
    // Free text has spaces and some length; ids and picks ("coworker",
    // "this_week") don't.
    if (text.length >= 12 && /\s/.test(text)) out.push(clip(text));
  }
  return out;
}

// The catalog id of the tool page we're on, from the path (/SkillGapMap).
export function toolFromPath(pathname) {
  const seg = String(pathname || '').split('/')[1] || '';
  return /^[A-Z][A-Za-z0-9]+$/.test(seg) ? seg : null;
}
