// parallelChunks.js — a long check as several short ones, side by side.
//
// Speed is primary (owner, 2026-10-27). A call's wait is set by how much it
// writes: the evidence-fit check wrote ~3,300 tokens before its repairs and
// took 48s (p90 127s); the certainty check ~1,600 tokens, 29s; the analogy
// check 21s. Each looks at fields one item at a time anyway, so the fields are
// split by list item ("claims[0]", "claims[1]", …) into at most `max` chunks
// that run at once. Wait ≈ the slowest chunk, ~5–15s.
//
//   const chunks = chunkByItem(fields, 6);      // fields: [[path, value], …]
//   const outs = await runChunks(chunks, chunk => callClaudeWithRetry(…));

// The unit a field belongs to: its first list item ("claims[2]"), else its
// top-level key.
const unitOf = path => (path.match(/^[^.[]+\[\d+\]/) || [path.split(/[.[]/)[0]])[0];

// Group fields by unit, in order, then merge the smallest neighbouring groups
// until there are at most `max`. Order is kept, so a chunk reads as a stretch
// of the page.
function chunkByItem(fields, max = 6) {
  const groups = [];
  for (const f of fields) {
    const u = unitOf(f[0]);
    const last = groups[groups.length - 1];
    if (last && last.unit === u) last.fields.push(f);
    else groups.push({ unit: u, fields: [f] });
  }
  let chunks = groups.map(g => g.fields);
  const size = ch => ch.reduce((n, [, v]) => n + String(v).length, 0);
  while (chunks.length > Math.max(1, max)) {
    let best = 0;
    for (let i = 1; i < chunks.length - 1; i++) if (size(chunks[i]) + size(chunks[i + 1]) < size(chunks[best]) + size(chunks[best + 1])) best = i;
    chunks = [...chunks.slice(0, best), [...chunks[best], ...chunks[best + 1]], ...chunks.slice(best + 2)];
  }
  return chunks;
}

// Run one call per chunk at once. A chunk that fails gives null; the others
// still count (each check is fail-open).
async function runChunks(chunks, run) {
  const settled = await Promise.allSettled(chunks.map((ch, i) => run(ch, i)));
  return settled.map(s => (s.status === 'fulfilled' ? s.value : null));
}

module.exports = { chunkByItem, runChunks, unitOf };

// Self-check: node backend/lib/parallelChunks.js
if (require.main === module) {
  const assert = require('assert');
  const f = p => [p, 'x'.repeat(10)];
  const ch = chunkByItem([f('verdict'), f('claims[0].a'), f('claims[0].b'), f('claims[1].a'), f('claims[2].a'), f('note')], 3);
  assert.strictEqual(ch.length, 3);
  assert.deepStrictEqual(ch.flat().map(x => x[0]), ['verdict', 'claims[0].a', 'claims[0].b', 'claims[1].a', 'claims[2].a', 'note']);
  assert.ok(ch.every(c => c.length));
  assert.strictEqual(unitOf('claims[3].finding'), 'claims[3]');
  console.log('parallelChunks ok');
}
