#!/usr/bin/env node
// ============================================================
// scripts/build-guides.js
// ============================================================
// Generates guide HTML from spec files.
//
// Usage:
//   node scripts/build-guides.js                 # rebuild all categories
//   node scripts/build-guides.js workplace       # rebuild one category
//
// Spec files live at:   guide-specs/{category}/{slug}.js
// Generated HTML goes:  public/guides/{category}/{slug}.html
//
// Related-grids are auto-populated from sibling specs in the
// same category — no manual sync needed. Add a new spec file,
// run this script, every sibling's related-grid updates.
//
// Integrates with package.json:
//   "prebuild": "node scripts/build-guides.js
//                 && node scripts/generate-og-images.js"
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT          = path.join(__dirname, '..');
const SPECS_DIR     = path.join(ROOT, 'guides');
const GUIDES_OUT    = path.join(ROOT, 'public', 'guides');
const AUDIT_SCRIPT  = path.join(ROOT, 'audit_guides.py');

// ── Helpers ───────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  return `${months[m-1]} ${d}, ${y}`;
}

// ── Validation ────────────────────────────────────────────
// Aggressive early validation → clearer errors than a bad template later.

function validate(spec, source) {
  const required = [
    'slug','category','categoryLabel',
    'title','shortTitle','navTitle',
    'description','deck',
    'published','modified',
    'ledes','steps','cta',
  ];
  for (const f of required) {
    if (spec[f] === undefined) {
      throw new Error(`${source}: missing required field '${f}'`);
    }
  }
  if (!/^[a-z0-9-]+$/.test(spec.slug))     throw new Error(`${source}: slug must be lowercase kebab-case`);
  if (!/^[a-z0-9-]+$/.test(spec.category)) throw new Error(`${source}: category must be lowercase kebab-case`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.published)) throw new Error(`${source}: published must be YYYY-MM-DD`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.modified))  throw new Error(`${source}: modified must be YYYY-MM-DD`);
  if (!Array.isArray(spec.ledes) || spec.ledes.length < 1) {
    throw new Error(`${source}: must have ≥1 lede paragraph`);
  }
  if (!Array.isArray(spec.steps) || spec.steps.length !== 5) {
    throw new Error(`${source}: must have exactly 5 steps`);
  }
  spec.steps.forEach((s, i) => {
    if (!s.name || !s.body) throw new Error(`${source}: step ${i+1} missing name or body`);
  });
  if (spec.callout) {
    const { afterStep, scriptedLine, explanation } = spec.callout;
    if (typeof afterStep !== 'number' || afterStep < 1 || afterStep > 4) {
      throw new Error(`${source}: callout.afterStep must be 1-4`);
    }
    if (!scriptedLine || !explanation) {
      throw new Error(`${source}: callout missing scriptedLine or explanation`);
    }
  }
  const { toolId, toolName, headline, body, features, glyph } = spec.cta;
  if (!toolId || !/^[A-Z][A-Za-z0-9]+$/.test(toolId)) {
    throw new Error(`${source}: cta.toolId must be PascalCase (got '${toolId}')`);
  }
  if (!toolName || !headline || !body || !glyph) {
    throw new Error(`${source}: cta missing required subfield`);
  }
  if (!Array.isArray(features) || features.length < 3 || features.length > 6) {
    throw new Error(`${source}: cta.features must be 3-6 items`);
  }
}

// ── Render ────────────────────────────────────────────────

function renderGuide(spec, siblings) {
  const canonical = `https://deftbrain.com/guides/${spec.category}/${spec.slug}`;
  const ogImage   = `https://deftbrain.com/og/guides/${spec.slug}.png`;
  // Allow titleHtml for <em> styling in h1; fall back to plain escaped title.
  const h1Html    = spec.titleHtml || esc(spec.title);

  // JSON-LD steps — JSON.stringify handles quote/unicode escaping correctly
  const stepsJsonLd = spec.steps
    .map(s => `      {"@type":"HowToStep","name":${JSON.stringify(s.name)},"text":${JSON.stringify(s.body)}}`)
    .join(',\n');

  // Body: steps with optional callout inserted after step N
  const stepsHtml = spec.steps.map((s, i) => {
    let block = `      <div class="step">
        <div class="step-num">${i+1}</div>
        <div class="step-body">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.body)}</p>
        </div>
      </div>`;
    if (spec.callout && spec.callout.afterStep === i+1) {
      block += `\n      <div class="callout">
        <div class="callout-label">What to say</div>
        <p class="say">&quot;${esc(spec.callout.scriptedLine)}&quot;</p>
        <p class="callout-note">${esc(spec.callout.explanation)}</p>
      </div>`;
    }
    return block;
  }).join('\n');

  const ledesHtml = spec.ledes
    .map(p => `      <p class="lede">${esc(p)}</p>`)
    .join('\n');

  const featuresHtml = spec.cta.features
    .map(f => `          <span class="cta-feature">${esc(f)}</span>`)
    .join('\n');

  // Related-grid: every sibling except self, in spec-file declaration order
  const relatedCards = siblings
    .filter(s => s.slug !== spec.slug)
    .map(s => `        <a href="/guides/${s.category}/${s.slug}" class="related-card">
          <div class="rel-cat">${esc(s.categoryLabel)}</div>
          <div class="rel-title">${esc(s.navTitle)}</div>
        </a>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(spec.title)} | DeftBrain</title>
  <meta name="description" content="${esc(spec.description)}">
  <link rel="canonical" href="${canonical}">

  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${esc(spec.title)}">
  <meta property="og:description" content="${esc(spec.description)}">
  <meta property="og:url"         content="${canonical}">
  <meta property="og:site_name"   content="DeftBrain">
  <meta property="og:image"        content="${ogImage}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="article:published_time" content="${spec.published}">
  <meta property="article:modified_time"  content="${spec.modified}">
  <meta property="article:section"        content="${esc(spec.categoryLabel)}">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(spec.title)}">
  <meta name="twitter:description" content="${esc(spec.description)}">
  <meta name="twitter:image"       content="${ogImage}">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": ${JSON.stringify(spec.title)},
    "description": ${JSON.stringify(spec.description)},
    "step": [
${stepsJsonLd}
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"DeftBrain","item":"https://deftbrain.com"},
      {"@type":"ListItem","position":2,"name":"Guides","item":"https://deftbrain.com/guides"},
      {"@type":"ListItem","position":3,"name":${JSON.stringify(spec.categoryLabel)},"item":"https://deftbrain.com/guides/${spec.category}"},
      {"@type":"ListItem","position":4,"name":${JSON.stringify(spec.shortTitle)}}
    ]
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/guides/guide.css">
</head>
<body>

  <header class="masthead">
    <a <a href="/" class="masthead-logo" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="masthead-logo-img" height="96" style="width:auto;height:96px;object-fit:contain;">
      <span class="masthead-logo-text">Deft<span>Brain</span></span>
    </a>
    <a <a href="/" class="masthead-cta">All tools →</a>
  </header>

  <main>
    <div class="container">

      <div class="eyebrow">
        <span class="tag">${esc(spec.categoryLabel)}</span>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>${h1Html}</h1>

      <p class="deck">${esc(spec.deck)}</p>

      <p class="meta-line">Updated ${formatDate(spec.modified)} · By the DeftBrain team</p>

${ledesHtml}

      <div class="section-rule"><span>How to do it</span></div>

${stepsHtml}

      <div class="cta-block" data-glyph="${spec.cta.glyph}">
        <div class="cta-eyebrow">Try it now — free</div>
        <h2>${esc(spec.cta.headline)}</h2>
        <p>${esc(spec.cta.body)}</p>
        <div class="cta-features">
${featuresHtml}
        </div>
        <a href="/${spec.cta.toolId}" class="cta-btn">
          Open ${esc(spec.cta.toolName)} →
        </a>
        <span class="cta-subtext">No account required to get started.</span>
      </div>

      <div class="section-rule"><span>Related situations</span></div>
      <div class="related-grid">
${relatedCards}
      </div>

    </div>
  </main>

  <footer>
    <a <a href="/" class="footer-brand" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="footer-brand-img" height="64" style="width:auto;height:64px;object-fit:contain;">
      <span class="footer-brand-text">Deft<span>Brain</span></span>
    </a>
    <nav class="footer-nav" style="display:flex;gap:1rem;font-family:'DM Sans',system-ui,sans-serif;font-size:0.92rem;">
      <a href="/guides" style="color:#2c4a6e;text-decoration:none;">Guides</a>
    </nav>
    <span class="footer-copy">© ${new Date().getFullYear()} DeftBrain · deftbrain.com</span>
  </footer>
  
</body>
</html>
`;
}

// ── Spec loading ──────────────────────────────────────────

function loadSpecs(onlyCategory) {
  if (!fs.existsSync(SPECS_DIR)) {
    throw new Error(`Specs directory not found: ${SPECS_DIR}`);
  }

  const categories = fs.readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !onlyCategory || name === onlyCategory);

  if (onlyCategory && !categories.includes(onlyCategory)) {
    throw new Error(`Category not found: ${onlyCategory}`);
  }

  const specs = [];
  for (const cat of categories) {
    const catDir = path.join(SPECS_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const filepath = path.join(catDir, file);
      delete require.cache[require.resolve(filepath)];
      const spec = require(filepath);
      validate(spec, path.relative(ROOT, filepath));
      // Sanity: filename must match spec.slug
      const expectedName = `${spec.slug}.js`;
      if (file !== expectedName) {
        throw new Error(`${filepath}: filename must match slug (expected ${expectedName})`);
      }
      if (spec.category !== cat) {
        throw new Error(`${filepath}: spec.category '${spec.category}' doesn't match folder '${cat}'`);
      }
      specs.push(spec);
    }
  }
  return specs;
}

// ── Main ──────────────────────────────────────────────────

function main() {
  const onlyCategory = process.argv[2];
  const specs = loadSpecs(onlyCategory);

  if (!specs.length) {
    console.log('No specs found.');
    return;
  }

  // Group by category so related-grids only pull from same-category siblings
  const byCategory = {};
  for (const s of specs) (byCategory[s.category] ||= []).push(s);

  let generated = 0;
  for (const spec of specs) {
    const siblings = byCategory[spec.category];
    const html = renderGuide(spec, siblings);
    const outPath = path.join(GUIDES_OUT, spec.category, `${spec.slug}.html`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`  ✓ ${spec.category}/${spec.slug}.html`);
    generated++;
  }

  console.log(`\n✓ Generated ${generated} guide(s) from ${Object.keys(byCategory).length} categor${Object.keys(byCategory).length === 1 ? 'y' : 'ies'}.`);

  // Audit whatever we just wrote. Always audit from the top-level guides
  // directory, not a subcategory — the audit computes canonical URLs from
  // the directory tree relative to the guides root and resolves related-card
  // target files the same way. Passing a subdir would break both.
  if (fs.existsSync(AUDIT_SCRIPT)) {
    console.log('\n── audit ──');
    const r = spawnSync('python3', [AUDIT_SCRIPT, GUIDES_OUT], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status || 1);
  }
}

try {
  main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
