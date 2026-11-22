// Mail-server check: does each email's domain accept mail (MX, else A record)?
// Usage: node mxcheck.mjs <prospects.csv (Mac Roman)> <mx.json>   — cached; export.py drops domains marked false.
import fs from 'node:fs';
import { promises as dns } from 'node:dns';
const [, , csvPath, outPath] = process.argv;
const text = new TextDecoder('macintosh').decode(fs.readFileSync(csvPath));
const doms = [...new Set([...text.matchAll(/@([a-z0-9.-]+\.[a-z]{2,})/gi)].map(m => m[1].toLowerCase()))];
const cache = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
async function ok(d) {
  for (let i = 0; i < 2; i++) {
    try { const mx = await dns.resolveMx(d); return mx.some(m => m.exchange && m.exchange !== '.'); }  // null MX (".") = accepts no mail
    catch (e) {
      if (e.code === 'ENODATA') { try { await dns.resolve4(d); return true; } catch { return false; } }
      if (e.code === 'ENOTFOUND') return false;
    }
  }
  return null;  // lookup kept failing: unknown, keep the row
}
const todo = doms.filter(d => !(d in cache));
let i = 0;
await Promise.all(Array.from({ length: 16 }, async () => { while (i < todo.length) { const d = todo[i++]; const v = await ok(d); if (v !== null) cache[d] = v; } }));
fs.writeFileSync(outPath, JSON.stringify(cache, null, 1));
const bad = Object.entries(cache).filter(([d, v]) => !v && doms.includes(d)).map(([d]) => d);
console.log(`${doms.length} domains, ${bad.length} accept no mail${bad.length ? ': ' + bad.join(' ') : ''}`);
