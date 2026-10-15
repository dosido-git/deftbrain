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
// The checks themselves are unchanged; only their order is. If an earlier
// check corrected anything, the last one re-reads the merged answer (step 3).
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

// allChecks — the general form: any number of independent checks, listed in
// priority order. The first check's changes are kept wholesale; each later
// check's change applies only where every earlier check left the value as it
// was. Put the sourced or recomputed check first (world facts, then numbers),
// the consistency check last.
async function allChecks(draft, checks, { label = 'allChecks' } = {}) {
  if (!draft || typeof draft !== 'object' || !checks.length) return draft;
  const before = leaves(draft);
  const copies = checks.map(() => clone(draft));
  // Each is already fail-open; allSettled keeps one failure from losing the rest.
  await Promise.allSettled(checks.map((fn, i) => fn(copies[i])));

  // 1. The first check wins wholesale.
  for (const k of Object.keys(draft)) if (!(k in copies[0])) delete draft[k];
  Object.assign(draft, copies[0]);

  // 2. Later checks fill in where nothing earlier touched the value.
  let applied = 0, dropped = 0;
  for (const copy of copies.slice(1)) {
    const now = leaves(draft);
    for (const [key, val] of leaves(copy)) {
      const orig = before.get(key);
      if (before.has(key) && JSON.stringify(orig) === JSON.stringify(val)) continue; // this check left it alone
      const untouched = before.has(key) && now.has(key) && JSON.stringify(now.get(key)) === JSON.stringify(orig);
      if (untouched && setAt(draft, JSON.parse(key), val)) applied++;
      else dropped++;
    }
  }
  if (dropped) console.log(`[${label}] ${dropped} later-check change(s) dropped where an earlier check changed the same field (applied ${applied})`);

  // 3. A correction can create a contradiction the last check never saw — it
  // read the draft before the correction (2026-10-14: Paperwork Path's fact
  // check rewrote an item to an emissions-only inspection while its title and
  // step still said safety inspection). So when an earlier check changed
  // anything, the last check (the consistency check, by convention) reads the
  // merged answer once more. No correction, no second pass: the common case
  // keeps the full saving.
  const changedEarly = copies.slice(0, -1).some(c => {
    const l = leaves(c);
    if (l.size !== before.size) return true;
    for (const [k, v] of l) if (JSON.stringify(before.get(k)) !== JSON.stringify(v)) return true;
    return false;
  });
  if (checks.length > 1 && changedEarly) {
    console.log(`[${label}] an earlier check corrected the answer — re-running the last check on the merged result`);
    try { await checks[checks.length - 1](draft); } catch (_) { /* fail-open like the checks themselves */ }
  }
  return draft;
}

// Two-check form kept for the routes already using it (number, then consistency).
const bothChecks = (draft, numberCheck, consistencyCheck, opts) => allChecks(draft, [numberCheck, consistencyCheck], opts);

module.exports = { allChecks, bothChecks };
