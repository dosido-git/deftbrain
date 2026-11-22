// Fit check: does each prospect row make sense to pitch? KEEP/DROP per row, cached.
// Usage: node judge.mjs <prospects.csv (Mac Roman, owner format)> <verdicts.json>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/SRsr/Desktop/deftbrain/backend/package.json');
const Anthropic = require('@anthropic-ai/sdk');

const [, , csvPath, outPath] = process.argv;
const env = fs.readFileSync('/Users/SRsr/Desktop/deftbrain/backend/.env', 'utf8');
const apiKey = (env.match(/^ANTHROPIC_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const client = new Anthropic({ apiKey });

// Taglines so the judge knows what each tool offers.
const toolsSrc = fs.readFileSync('/Users/SRsr/Desktop/deftbrain/src/data/tools.js', 'utf8');
const tagline = {};
for (const m of toolsSrc.matchAll(/title:\s*"([^"]+)",\s*\n\s*tagline:\s*"([^"]+)"/g)) tagline[m[1]] = m[2];

function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\r') {}
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  row.push(f); rows.push(row);
  const [h, ...data] = rows;
  return data.filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

const rows = parseCsv(new TextDecoder('macintosh').decode(fs.readFileSync(csvPath)));
const verdicts = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
const todo = rows.filter(r => !verdicts[r.prospect_url + '|' + r.dead_url]);

const SYSTEM = `You screen broken-link outreach prospects. A web page links to a resource that is now broken. We will email the page owner, mention the broken link, and suggest our free tool as a replacement or addition.

Answer KEEP only if all hold:
1. The broken link was an informational resource for the public (an article, guide, fact sheet, tips or help page, complaint or report page), not a login, store, event, job, news item, local business or service provider, or an organisation's front page.
2. The tool genuinely serves the same need the broken link served, for the page's readers.
3. The page is the kind an owner would update for readers (a resource, tips or help page), not a press release, minutes, a product page or an archived notice.

Otherwise answer DROP. Reply with KEEP or DROP, then a dash and at most 8 words of reason.`;

async function judge(r) {
  const tool = r.offer_desc;
  const user = `Page title: ${r.page_name}
Page URL: ${r.prospect_url}
Broken link text: ${r.which_link}
Broken link URL: ${r.dead_url}
Our tool: ${tool} (${tagline[tool] || ''})`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-5-5', max_tokens: 60, thinking: { type: 'disabled' },
        system: SYSTEM, messages: [{ role: 'user', content: user }],
      });
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      return { keep: /^KEEP/i.test(text), why: text.slice(0, 120) };
    } catch (e) {
      if (e.status === 400 || e.status === 401) throw e;
      await new Promise(res => setTimeout(res, 2000 * (attempt + 1)));
    }
  }
  return null;
}

let i = 0;
async function worker() {
  while (i < todo.length) {
    const r = todo[i++];
    const v = await judge(r);
    if (v) verdicts[r.prospect_url + '|' + r.dead_url] = v;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
fs.writeFileSync(outPath, JSON.stringify(verdicts, null, 1));
const all = rows.map(r => verdicts[r.prospect_url + '|' + r.dead_url]).filter(Boolean);
console.log(`${todo.length} judged now; ${all.filter(v => v.keep).length} keep / ${all.filter(v => !v.keep).length} drop of ${rows.length}`);
