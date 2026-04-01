'use strict';

// src/seo/generatePages.js
//
// Build script — run with:  node src/seo/generatePages.js
// Or add to package.json:   "build:seo": "node src/seo/generatePages.js"
//
// Reads every JSON file under content/
// Renders each via PageTemplate
// Writes to public/guides/[category]/[slug].html
// Then calls buildSitemap to regenerate guides-sitemap.xml

const fs   = require('fs');
const path = require('path');

const { PageTemplate } = require('./PageTemplate');
const { buildSitemap } = require('./buildSitemap');

// ── Find project root by walking up from this file ───────────────────────────
function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json')) &&
        fs.existsSync(path.join(dir, 'src'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not find project root — no package.json + src/ found above ' + start);
    dir = parent;
  }
}
const ROOT        = findProjectRoot(__dirname);
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_DIR  = path.join(ROOT, 'public', 'guides');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Recursively collect all .json files under a directory
function collectJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    console.error(`❌  Content directory not found: ${dir}`);
    console.error(`    Create it and add at least one tool subdirectory with JSON records.`);
    process.exit(1);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

// Parse a JSON file, skip and warn on parse error
function loadRecord(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`  ⚠️  Skipping ${filePath} — JSON parse error: ${err.message}`);
    return null;
  }
}

// Validate the minimum required fields
function validateRecord(record, filePath) {
  const required = ['slug', 'tool_id', 'category', 'title', 'meta_description', 'lede'];
  const missing  = required.filter(k => !record[k]);
  if (missing.length) {
    console.warn(`  ⚠️  Skipping ${path.basename(filePath)} — missing fields: ${missing.join(', ')}`);
    return false;
  }
  if (!record.steps || !record.steps.length) {
    console.warn(`  ⚠️  Skipping ${path.basename(filePath)} — no steps defined`);
    return false;
  }
  return true;
}

// Write a file, creating parent directories as needed
function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🔨  DeftBrain SEO page builder');
  console.log(`    Content: ${CONTENT_DIR}`);
  console.log(`    Output:  ${OUTPUT_DIR}\n`);

  const jsonFiles = collectJsonFiles(CONTENT_DIR);
  console.log(`📂  Found ${jsonFiles.length} content file(s)\n`);

  const written  = [];
  const skipped  = [];
  const allRecords = [];

  for (const filePath of jsonFiles) {
    const record = loadRecord(filePath);
    if (!record) { skipped.push(filePath); continue; }

    // Skip draft pages
    if (record.published === false) {
      console.log(`  ⏭️  Skipping draft: ${record.slug}`);
      skipped.push(filePath);
      continue;
    }

    if (!validateRecord(record, filePath)) { skipped.push(filePath); continue; }

    try {
      const html     = PageTemplate(record);
      const outPath  = path.join(OUTPUT_DIR, record.category, `${record.slug}.html`);
      writeFile(outPath, html);

      const relPath = path.relative(ROOT, outPath);
      console.log(`  ✅  ${relPath}`);
      written.push(record);
      allRecords.push(record);
    } catch (err) {
      console.error(`  ❌  Error rendering ${path.basename(filePath)}: ${err.message}`);
      skipped.push(filePath);
    }
  }

  console.log(`\n📄  ${written.length} page(s) written, ${skipped.length} skipped`);

  // Regenerate sitemap
  if (written.length) {
    console.log('\n🗺️   Updating sitemap...');
    buildSitemap(allRecords);
  }

  console.log('\n✨  Done.\n');
}

main();
