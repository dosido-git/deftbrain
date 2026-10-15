// bothChecks — run the number check and the consistency check side by side.
//
// Speed (2026-10-14): routes ran withNumberCheck, then checkConsistency, on the
// same finished draft. Neither reads the other's output, so waiting for one
// before starting the other only added time — Analogy Engine averaged 76s for
// visitors, past Safari's ~60s cut-off. Each check now works on its own copy
// of the draft and the results are merged:
//   1. every number-check change is kept (it recomputed the arithmetic);
//   2. a consistency repair is applied only where the number check left the
//      value exactly as it was. If both changed the same field, or the number
//      check removed a list item (so the path now points somewhere else), the
//      consistency repair is dropped and logged — never half-applied.
// The checks themselves are unchanged; only their order is.
//
// Usage (in place of the two awaits):
//   await bothChecks(parsed,
//     d => withNumberCheck(d, { ...same options... }),
//     d => checkConsistency(d, { ...same options... }));
// Options may keep reading `parsed` (field lists, contexts): the copies have the
// same paths and values.

function leaves(v, path = [], out = new Map()) {
  if (Array.isArray(v)) { v.forEach((x, i) => leaves(x, [...path, i], out)); if (!v.length) out.set(JSON.stringify(path), v); }
  else if (v && typeof v === 'object') { const ks = Object.keys(v); ks.forEach(k => leaves(v[k], [...path, k], out)); if (!ks.length) out.set(JSON.stringify(path), v); }
  else out.set(JSON.stringify(path), v);
  return out;
}

function setAt(root, path, value) {
  let node = root;
  for (let i = 0; i < path.length - 1; i++) {
    if (node == null || typeof node !== 'object') return false;
    node = node[path[i]];
  }
  if (node == null || typeof node !== 'object') return false;
  node[path[path.length - 1]] = value;
  return true;
}

const clone = v => JSON.parse(JSON.stringify(v));

async function bothChecks(draft, numberCheck, consistencyCheck, { label = 'bothChecks' } = {}) {
  if (!draft || typeof draft !== 'object') return draft;
  const before = leaves(draft);
  const a = clone(draft);
  const b = clone(draft);
  // Both are already fail-open; allSettled keeps one failure from losing the other.
  await Promise.allSettled([numberCheck(a), consistencyCheck(b)]);

  // 1. Number check wins wholesale.
  for (const k of Object.keys(draft)) if (!(k in a)) delete draft[k];
  Object.assign(draft, a);

  // 2. Consistency repairs where the number check did not touch the value.
  const afterA = leaves(draft);
  let applied = 0, dropped = 0;
  for (const [key, val] of leaves(b)) {
    const orig = before.get(key);
    if (before.has(key) && JSON.stringify(orig) === JSON.stringify(val)) continue; // unchanged by consistency
    const path = JSON.parse(key);
    const untouched = before.has(key) && afterA.has(key) && JSON.stringify(afterA.get(key)) === JSON.stringify(orig);
    if (untouched && setAt(draft, path, val)) applied++;
    else dropped++;
  }
  if (dropped) console.log(`[${label}] consistency repair(s) dropped where the number check changed the same field: ${dropped} (applied ${applied})`);
  return draft;
}

module.exports = { bothChecks };
