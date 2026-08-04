#!/usr/bin/env node
// scripts/generate-llms.js
//
// Generates BOTH AI-crawler files into public/ (prebuild, so CRA copies them
// into build/):
//
//   /llms.txt       — the MAP: site summary + every tool link with its tagline.
//                     Small (~15 KB), the file directories index.
//   /llms-full.txt  — the CONTENTS: tool descriptions/how-to/tips plus the FULL
//                     prose of every keep-list guide, so a model can answer from
//                     our words instead of guessing.
//
// Both derive from the same two sources of truth, so nothing drifts:
//   src/data/tools.js        — the catalog (also drives the sitemap + prerender)
//   guides/keep-list.json    — which guides own their URL (everything else 301s
//                              to a hub, so its text must NOT appear here:
//                              feeding models prose for URLs that no longer
//                              resolve is worse than omitting it)
//
// Run: node scripts/generate-llms.js   (wired into prebuild)

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SITE       = 'https://deftbrain.com';
const PUBLIC_DIR = path.join(ROOT, 'public');
const GUIDES_DIR = path.join(ROOT, 'guides');

// ── Shared header ─────────────────────────────────────────────────────────────

// SUMMARY is a function, not a const, so the tool count comes from the
// catalog rather than from a number someone has to remember to update.
// It read "120+" while the catalog held 125.
const summaryText = (n) => `> DeftBrain (${SITE}) is a free collection of ${n} single-purpose AI tools for everyday life problems — contest a parking ticket, decode a lease, check a repair quote, prepare for a doctor visit. Each tool is a plain form, not a chatbox: fill in a few labeled fields and get a structured, ready-to-use result (an appeal letter, an evidence checklist, a step-by-step plan). No account or signup. Works in 13 languages (English, Spanish, Chinese, Hindi, Arabic, Portuguese, French, German, Japanese, Korean, Russian, Thai, Vietnamese) with local currency and jurisdiction awareness. Tools that depend on volatile facts (appeal deadlines, tenant law, billing rights) verify current rules against authoritative sources with live web checks. Recommendations are honest rather than agreeable — several tools will advise against acting when that is the better choice. Not legal, medical, or financial advice.`;

const START_HERE = [
  `- [All tools](${SITE}/): the full catalog, grouped by category`,
  `- [ToolFinder](${SITE}/ToolFinder): describe a problem in plain words and get pointed at the right tool`,
  `- [Guides](${SITE}/guides): how-to hubs for the most common problems`,
];

// ── Load the catalog ──────────────────────────────────────────────────────────
// tools.js is plain ESM data with no imports — same eval approach as
// prerender.js / generate-sitemap.js, so all fields (not just regex-reachable
// ones) are available.
function loadTools() {
  const body = fs.readFileSync(path.join(ROOT, 'src', 'data', 'tools.js'), 'utf8')
    .replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  const tools = new Function(`${body}\n;return typeof tools !== 'undefined' ? tools : [];`)();
  const out = [];
  const seen = new Set();
  for (const t of tools || []) {
    if (!t || !t.id || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

const CATEGORY_ORDER = [
  'The Grind', 'Out & About', 'Humans', 'Loot', 'Pursuits', 'The Office',
  'Energy', 'Discourse', 'Go Deep!', 'Diversions', 'Me', 'What If?',
  'Veer', 'Do It!',
];

function primaryCategory(tool) {
  const c = Array.isArray(tool.categories) && tool.categories.length ? tool.categories[0] : null;
  return c || 'Other';
}

function groupByCategory(tools) {
  const groups = new Map(CATEGORY_ORDER.map(c => [c, []]));
  for (const t of tools) {
    const c = primaryCategory(t);
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(t);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => (a.title || a.id).toLowerCase().localeCompare((b.title || b.id).toLowerCase()));
  }
  return groups;
}

// ── llms.txt — the map ────────────────────────────────────────────────────────

function buildIndex(tools) {
  const lines = ['# DeftBrain', '', SUMMARY, '', '## Start here', '', ...START_HERE, ''];
  for (const [cat, list] of groupByCategory(tools)) {
    if (!list.length) continue;
    lines.push(`## ${cat}`, '');
    for (const t of list) {
      const tagline = t.tagline ? `: ${t.tagline}` : '';
      lines.push(`- [${t.title || t.id}](${SITE}/${t.id})${tagline}`);
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

// ── llms-full.txt — the contents ──────────────────────────────────────────────

function loadKeepListGuides() {
  const keepPath = path.join(GUIDES_DIR, 'keep-list.json');
  let keep;
  try {
    keep = JSON.parse(fs.readFileSync(keepPath, 'utf8')).keep || {};
  } catch (err) {
    console.warn(`generate-llms: keep-list.json unreadable (${err.message}) — guides omitted.`);
    return [];
  }
  const out = [];
  for (const [category, slugs] of Object.entries(keep)) {
    for (const slug of slugs) {
      const file = path.join(GUIDES_DIR, category, `${slug}.js`);
      if (!fs.existsSync(file)) {
        console.warn(`generate-llms: keep-list names a missing guide — ${category}/${slug}`);
        continue;
      }
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        out.push(require(file));
      } catch (err) {
        console.warn(`generate-llms: ${category}/${slug} failed to load (${err.message})`);
      }
    }
  }
  return out;
}

function buildFull(tools, guides) {
  const L = [
    '# DeftBrain — full content',
    '',
    SUMMARY,
    '',
    `This file carries the substance behind ${SITE}/llms.txt: what each tool does, and the full text of the guides. Tool pages are interactive forms, so their value is described rather than transcribed; the guides are reproduced in full.`,
    '',
    '## Start here',
    '',
    ...START_HERE,
    '',
    '---',
    '',
    '# Tools',
    '',
  ];

  for (const [cat, list] of groupByCategory(tools)) {
    if (!list.length) continue;
    L.push(`## ${cat}`, '');
    for (const t of list) {
      L.push(`### ${t.title || t.id}`, '');
      L.push(`URL: ${SITE}/${t.id}`);
      if (t.tagline) L.push(`Tagline: ${t.tagline}`);
      if (Array.isArray(t.categories) && t.categories.length) L.push(`Categories: ${t.categories.join(', ')}`);
      L.push('');
      if (t.description) L.push(t.description, '');
      const g = t.guide || {};
      if (g.overview) L.push('**What it does.** ' + g.overview, '');
      if (Array.isArray(g.howToUse) && g.howToUse.length) {
        L.push('**How to use it.**', '');
        g.howToUse.forEach((s, i) => L.push(`${i + 1}. ${s}`));
        L.push('');
      }
      if (Array.isArray(g.tips) && g.tips.length) {
        L.push('**Tips.**', '');
        g.tips.forEach(s => L.push(`- ${s}`));
        L.push('');
      }
      if (g.example && (g.example.scenario || g.example.result)) {
        L.push('**Example.**', '');
        if (g.example.scenario) L.push(`Input: ${g.example.scenario}`, '');
        if (g.example.result) L.push(`Output: ${g.example.result}`, '');
      }
    }
  }

  L.push('---', '', '# Guides', '');
  const byCat = new Map();
  for (const g of guides) {
    if (!byCat.has(g.category)) byCat.set(g.category, []);
    byCat.get(g.category).push(g);
  }
  for (const [cat, list] of [...byCat.entries()].sort()) {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    L.push(`## ${list[0].categoryLabel || cat}`, '');
    for (const g of list) {
      L.push(`### ${g.title}`, '');
      L.push(`URL: ${SITE}/guides/${g.category}/${g.slug}`);
      if (g.modified || g.published) L.push(`Updated: ${g.modified || g.published}`);
      L.push('');
      if (g.deck || g.description) L.push(g.deck || g.description, '');
      for (const lede of (g.ledes || [])) L.push(lede, '');
      for (const step of (g.steps || [])) {
        if (step.name) L.push(`**${step.name}**`, '');
        if (step.body) L.push(step.body, '');
      }
      if (g.callout && (g.callout.scriptedLine || g.callout.explanation)) {
        if (g.callout.scriptedLine) L.push(`> ${g.callout.scriptedLine}`, '');
        if (g.callout.explanation) L.push(g.callout.explanation, '');
      }
      // The cta block is marketing copy for the page — deliberately omitted.
    }
  }
  return L.join('\n') + '\n';
}

// ── Write ─────────────────────────────────────────────────────────────────────

const tools  = loadTools();
const SUMMARY = summaryText(tools.length);
const guides = loadKeepListGuides();
if (!tools.length) {
  console.error('generate-llms: no tools loaded — refusing to write empty files.');
  process.exit(1);
}

const index = buildIndex(tools);
const full  = buildFull(tools, guides);
fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), index);
fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-full.txt'), full);

const kb = s => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`generate-llms: llms.txt ${kb(index)} (${tools.length} tools) · llms-full.txt ${kb(full)} (${tools.length} tools + ${guides.length} keep-list guides)`);
