#!/usr/bin/env node
/**
 * check-orphans.js — internal-link reachability guard.
 *
 * THE LESSON THIS ENCODES: you can do every per-page SEO thing right (metadata,
 * canonicals, sitemaps, structured data) and still ship a broken site if a whole
 * content type is orphaned — reachable in the sitemap but not by internal links
 * from an authoritative page. That is exactly what happened to the ~570 guides:
 * the homepage and tool pages linked to ZERO of them, so Google crawled them,
 * found nothing vouching for them, and dropped most ("Crawled - currently not
 * indexed").
 *
 * This script does a breadth-first crawl of the PRERENDERED build, starting at the
 * homepage, following internal links, and records the shortest click-depth to each
 * page. It then checks every sitemap URL and every catalog tool for
 * reachability, including tools that aren't in a sitemap.
 *
 * Run AFTER prerender + guide-index build (it reads build/*.html):
 *   node scripts/check-orphans.js            # summary + fail (exit 1) on orphans
 *   node scripts/check-orphans.js --max-depth 4   # also warn on pages deeper than N
 *   node scripts/check-orphans.js --json
 *
 * Exit 1 if any sitemap URL or catalog tool is orphaned, so it can gate the build.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SITE = 'https://deftbrain.com';

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const mdIdx = args.indexOf('--max-depth');
const MAX_DEPTH_WARN = mdIdx >= 0 ? Number(args[mdIdx + 1]) : 0; // 0 = don't warn on depth

// ── Map a site URL path to the build file that serves it ──────────────────────
// The SPA prerenders tools as flat files (build/<ToolId>.html) and guides under
// build/guides/<cat>/<slug>.html, with index.html for hub/category pages.
function pathToFile(p) {
  let u = p.split('#')[0].split('?')[0];          // strip hash/query
  if (u.startsWith(SITE)) u = u.slice(SITE.length);
  if (!u.startsWith('/')) return null;            // external / non-path
  u = u.replace(/\/+$/, '') || '/';               // normalize trailing slash
  if (u === '/') return path.join(BUILD, 'index.html');
  const candidates = [
    path.join(BUILD, `${u.slice(1)}.html`),       // /Foo -> build/Foo.html ; /guides/x/y -> build/guides/x/y.html
    path.join(BUILD, u.slice(1), 'index.html'),   // /guides -> build/guides/index.html
  ];
  // A linked document such as /all-tools.pdf is its own file: reachable, but
  // it has no links of its own to follow (linksIn skips non-HTML).
  if (/\.(pdf)$/i.test(u)) candidates.unshift(path.join(BUILD, u.slice(1)));
  return candidates.find(f => fs.existsSync(f)) || null;
}

// canonical key for a URL (so /Foo, /Foo/, https://deftbrain.com/Foo all unify)
function normKey(p) {
  let u = p.split('#')[0].split('?')[0];
  if (u.startsWith(SITE)) u = u.slice(SITE.length);
  if (!u.startsWith('/')) return null;
  return u.replace(/\/+$/, '') || '/';
}

// extract internal link targets from an HTML file
function linksIn(file) {
  if (!file.endsWith('.html')) return new Set();
  const html = fs.readFileSync(file, 'utf8');
  const out = new Set();
  const re = /<a\b[^>]*?\s+href\s*=\s*(["'])(.*?)\1/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[2];
    if (href.startsWith('/') || href.startsWith(SITE)) {
      const k = normKey(href);
      if (k) out.add(k);
    }
  }
  return out;
}

// ── all sitemap URLs (the set that MUST be reachable) ─────────────────────────
function sitemapUrls() {
  const urls = new Set();
  for (const f of fs.readdirSync(BUILD).filter(f => /\.xml$/.test(f))) {
    const xml = fs.readFileSync(path.join(BUILD, f), 'utf8');
    const re = /<loc>([^<]+)<\/loc>/gi;
    let m;
    while ((m = re.exec(xml))) {
      const k = normKey(m[1].trim());
      // skip sitemap-index entries (other .xml files), keep page URLs
      if (k && !/\.xml$/.test(k)) urls.add(k);
    }
  }
  return urls;
}

function catalogToolUrls() {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'data', 'tools.js'), 'utf8');
  const tools = new Function(source.replace(/\bexport\s+const\b/g, 'const') + '\nreturn tools;')();
  return tools.map(tool => `/${tool.id}`);
}

function main() {
  if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
    console.error('check-orphans: build/index.html not found — run the build first.');
    process.exit(2);
  }

  // BFS from the homepage
  const depth = new Map([['/', 0]]);
  const queue = ['/'];
  while (queue.length) {
    const cur = queue.shift();
    const file = pathToFile(cur);
    if (!file) continue;
    const d = depth.get(cur);
    for (const next of linksIn(file)) {
      if (!depth.has(next) && pathToFile(next)) {
        depth.set(next, d + 1);
        queue.push(next);
      }
    }
  }

  const targets = sitemapUrls();
  const reachable = [...targets].filter(u => depth.has(u));
  const orphans = [...targets].filter(u => !depth.has(u));
  const catalog = catalogToolUrls();
  const catalogOrphans = catalog.filter(u => !depth.has(u));
  const failed = orphans.length > 0 || catalogOrphans.length > 0;

  // depth histogram over reachable sitemap URLs
  const hist = {};
  for (const u of reachable) { const d = depth.get(u); hist[d] = (hist[d] || 0) + 1; }
  const deep = MAX_DEPTH_WARN ? reachable.filter(u => depth.get(u) > MAX_DEPTH_WARN) : [];

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: targets.size, reachable: reachable.length, orphans, hist, deep, catalogOrphans }, null, 2));
    process.exit(failed ? 1 : 0);
  }

  console.log(`\ncheck-orphans: ${targets.size} sitemap URLs; ${reachable.length} reachable from homepage, ${orphans.length} orphaned.`);
  console.log(`Catalog tools: ${catalog.length - catalogOrphans.length}/${catalog.length} reachable from homepage.`);
  console.log('click-depth from homepage (reachable sitemap URLs):');
  for (const d of Object.keys(hist).sort((a, b) => a - b)) console.log(`   ${d} click(s): ${hist[d]}`);
  if (MAX_DEPTH_WARN && deep.length) {
    console.log(`\n⚠ ${deep.length} page(s) deeper than ${MAX_DEPTH_WARN} clicks (weaker crawl signal):`);
    for (const u of deep.slice(0, 10)) console.log(`   [${depth.get(u)}] ${u}`);
  }
  if (orphans.length) {
    console.log(`\n✖ ${orphans.length} ORPHAN(S) — in a sitemap but unreachable by internal links:`);
    for (const u of orphans.slice(0, 20)) console.log(`   ${u}`);
    if (orphans.length > 20) console.log(`   …and ${orphans.length - 20} more`);
    console.log('\nFix: link these from an authoritative page (homepage, a hub, or relevant tool pages).');
  }
  if (catalogOrphans.length) console.log(`Unreachable catalog tools: ${catalogOrphans.join(', ')}`);
  if (failed) process.exit(1);
  console.log('\n✅ No orphans — every sitemap URL is reachable from the homepage.');
  process.exit(0);
}

main();
