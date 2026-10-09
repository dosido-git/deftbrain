#!/usr/bin/env node
//
// guide-review.js — sort every guide into what it needs, without reading
// 500 pages by hand first (guide review, 2026-10-09).
// ───────────────────────────────────────────────────────────────────────────
// Free and offline: reads guides/<category>/<slug>.js only. For each guide it
// measures what the index review asked about (audit/INDEX-REVIEW-2026-10-08.md:
// "keep good answers, improve thin tool-adverts, merge duplicates") and the
// defect types that showed up in guides already (audit/DEFECT-TYPES.md):
//
//   DEAD_TOOL    CTA points at a tool id the catalog no longer has
//   ADVERT       most of the body is about the tool rather than the question
//   THIN         under ~350 words of actual answer
//   NO_ANSWER    no answer-first deck/answerList (the indexed guides all have one)
//   STATS        percentages, dollar figures or "studies show" with no sources
//   OVERLAP      another guide's title asks nearly the same question
//   LONG_ANSWER  the deck (the direct answer) runs past 50 words
//   HEADINGS     fewer than 3 step headings phrased as a search question
//   NO_SOURCES   health/money/home/travel/pets, or any numbers, with no sources
//   UNREVIEWED   not yet through the 2026-10 rewrite (spec field reviewed: true)
//
// A guide with no flags is index-ready: add it to guides/keep-list.json.
//
// Output: a table to audit/GUIDE-REVIEW.md (with --write) and a tally.
// Usage: node scripts/guide-review.js [--write] [--all]   (--all includes indexed guides)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'guides');
const keep = JSON.parse(fs.readFileSync(path.join(DIR, 'keep-list.json'), 'utf8')).keep;
const indexed = new Set(Object.entries(keep).flatMap(([c, ss]) => ss.map(s => `${c}/${s}`)));
const toolsSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'tools.js'), 'utf8');
const toolIds = new Set([...toolsSrc.matchAll(/^\s*id: "([A-Za-z]+)"/gm)].map(m => m[1]));
const toolTitles = Object.fromEntries([...toolsSrc.matchAll(/^\s*id: "([A-Za-z]+)"[\s\S]*?\n\s*title: "([^"]+)"/gm)].map(m => [m[1], m[2]]));

const STOP = new Set('a an the to of for and or in on at with your you how what when why do does is are be it this that without from vs my me i can should'.split(' '));
const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));

const guides = [];
for (const cat of fs.readdirSync(DIR)) {
  const d = path.join(DIR, cat);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('.js'))) {
    let g;
    try { g = require(path.join(d, f)); } catch (e) { guides.push({ key: `${cat}/${f}`, flags: ['BROKEN'], note: e.message }); continue; }
    const key = `${cat}/${g.slug || f.replace(/\.js$/, '')}`;
    const body = [...(g.ledes || []), ...(g.steps || []).map(s => `${s.name}. ${s.body}`)].join(' ');
    const wc = body.split(/\s+/).filter(Boolean).length;
    const toolId = g.cta && g.cta.toolId;
    const toolName = (g.cta && g.cta.toolName) || toolTitles[toolId] || '';
    const toolMentions = toolName ? (body.match(new RegExp(toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0;
    const stats = (body.match(/\b\d{1,3}(?:\.\d+)?\s?%|\$\s?\d[\d,.]*|\b(?:studies|research|surveys?) (?:show|find|suggest)s?\b/gi) || []).length;
    const flags = [];
    // Index-ready standard (owner, 2026-10-09): a direct answer in the first
    // 50 words, headings that are the questions people actually search, and
    // sources wherever the guide states checkable facts.
    const deckWords = String(g.deck || '').split(/\s+/).filter(Boolean).length;
    const qHeads = (g.steps || []).filter(st => /\?\s*$/.test(st.name || '') || /^(how|what|why|when|where|which|who|can|should|is|are|do|does|will)\b/i.test(st.name || '')).length;
    const needsSources = ['health', 'money', 'home', 'travel', 'pets'].includes(cat) || stats > 0;
    if (deckWords > 50) flags.push('LONG_ANSWER');
    if (qHeads < 3) flags.push('HEADINGS');
    // sourcesReview: a reviewer's recorded judgment that the guide's numbers
    // are worked examples ('examples-only') or that it states no checkable
    // facts ('no-factual-claims'), so it needs no sources.
    const sourcesWaived = ['examples-only', 'no-factual-claims'].includes(g.sourcesReview);
    if (needsSources && !sourcesWaived && !(Array.isArray(g.sources) && g.sources.length)) flags.push('NO_SOURCES');
    if (toolId && !toolIds.has(toolId)) flags.push('DEAD_TOOL');
    // A reviewed guide has had its in-body tool pitches rewritten; a tool name
    // that is also an ordinary phrase ('date night') is not an advert.
    if (g.reviewed !== true && (toolMentions >= 3 || /\b(?:this tool|our tool|DeftBrain)\b/i.test(body))) flags.push('ADVERT');
    if (wc < 350) flags.push('THIN');
    if (!g.deck || !Array.isArray(g.answerList) || !g.answerList.length) flags.push('NO_ANSWER');
    if (stats && !sourcesWaived && !(Array.isArray(g.sources) && g.sources.length)) flags.push('STATS');
    if (g.reviewed !== true) flags.push('UNREVIEWED');
    guides.push({ key, reviewed: g.reviewed === true, title: g.title || '', wc, stats, toolMentions, toolId, indexed: indexed.has(key), flags, tokens: new Set(words(g.shortTitle || g.title)) });
  }
}

// Overlap: titles sharing most of their meaningful words.
for (let i = 0; i < guides.length; i++) {
  for (let j = i + 1; j < guides.length; j++) {
    const a = guides[i].tokens, b = guides[j].tokens;
    if (!a || !b || a.size < 2 || b.size < 2) continue;
    const inter = [...a].filter(x => b.has(x)).length;
    const jac = inter / (a.size + b.size - inter);
    if (jac >= 0.6) {
      (guides[i].overlap = guides[i].overlap || []).push(guides[j].key);
      (guides[j].overlap = guides[j].overlap || []).push(guides[i].key);
    }
  }
}
// A reviewed guide has been read against its look-alikes; it stays separate on purpose.
for (const g of guides) if (g.overlap && !g.reviewed) g.flags.push('OVERLAP');

const scope = process.argv.includes('--all') ? guides : guides.filter(g => !g.indexed);
const tally = {};
for (const g of scope) for (const f of g.flags) tally[f] = (tally[f] || 0) + 1;
const clean = scope.filter(g => !g.flags.length).length;
console.log(`guide-review: ${scope.length} guide(s) in scope (${guides.length} total, ${indexed.size} indexed). Clean: ${clean}.`);
console.log(Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([f, n]) => `  ${f}: ${n}`).join('\n'));

// --promote: put every index-ready guide (no flags) on the guide keep-list.
if (process.argv.includes('--promote')) {
  const kp = path.join(DIR, 'keep-list.json');
  const data = JSON.parse(fs.readFileSync(kp, 'utf8'));
  let added = 0;
  for (const g of guides) {
    if (g.flags.length) continue;
    const [cat, slug] = g.key.split('/');
    const list = data.keep[cat] = data.keep[cat] || [];
    if (!list.includes(slug)) { list.push(slug); added++; }
  }
  fs.writeFileSync(kp, JSON.stringify(data, null, 2) + '\n');
  console.log(`guide-review: ${added} index-ready guide(s) added to guides/keep-list.json`);
}

if (process.argv.includes('--write')) {
  const rows = scope.sort((a, b) => b.flags.length - a.flags.length || a.key.localeCompare(b.key))
    .map(g => `| ${g.key} | ${g.indexed ? 'yes' : ''} | ${g.wc ?? ''} | ${g.flags.join(', ')} | ${g.overlap ? g.overlap.join('<br>') : ''} |`);
  const md = `# Guide review (generated by scripts/guide-review.js — rerun, don't hand-edit the table)

Generated ${new Date().toISOString().slice(0, 10)}. ${scope.length} guides in scope, ${clean} with no flags.

${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([f, n]) => `- **${f}**: ${n}`).join('\n')}

| Guide | Indexed | Words | Flags | Overlaps with |
|---|---|---|---|---|
${rows.join('\n')}
`;
  fs.writeFileSync(path.join(ROOT, 'audit', 'GUIDE-REVIEW.md'), md);
  console.log('wrote audit/GUIDE-REVIEW.md');
}
