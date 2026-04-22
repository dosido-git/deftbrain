#!/usr/bin/env node
// ============================================================
// scripts/generate-og-images.js
// ============================================================
// Generates 1200×630 PNG social-preview images for every guide.
// One-time setup:
//
//   1. Install deps (only once):
//      npm install --save-dev satori @resvg/resvg-js
//
//   2. Download fonts into scripts/fonts/ (commit them — OFL-licensed):
//      - PlayfairDisplay-Bold.ttf   (from fonts.google.com/specimen/Playfair+Display)
//      - DMSans-Regular.ttf          (from fonts.google.com/specimen/DM+Sans)
//      - DMSans-Medium.ttf           (same source)
//      Static (non-variable) TTF files are easiest.
//
//   3. Add to package.json so images regenerate on every build:
//      "scripts": {
//        "prebuild": "node scripts/generate-og-images.js",
//        "build":    "react-scripts build",
//        "postbuild": "node scripts/prerender.js
//                       && node scripts/generate-guides-sitemap.js
//                       && node scripts/generate-sitemap-index.js"
//      }
//
// Reads guides from:  public/guides/**/*.html
// Writes PNGs to:     public/og/guides/{slug}.png
//
// Incremental by default: skips PNGs that are newer than their
// source HTML. Pass --force to rebuild everything (e.g., when
// you change the template design below).
// ============================================================

const fs = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────
const ROOT          = path.join(__dirname, '..');
const GUIDES_SRC    = path.join(ROOT, 'public', 'guides');
const OG_OUT_DIR    = path.join(ROOT, 'public', 'og', 'guides');
const FONTS_DIR     = path.join(__dirname, 'fonts');

const FORCE = process.argv.includes('--force');

// ── Fonts ──────────────────────────────────────────────────
function loadFont(filename) {
  const p = path.join(FONTS_DIR, filename);
  if (!fs.existsSync(p)) {
    console.error(`✗ Missing font: ${p}`);
    console.error('  See setup instructions at the top of this file.');
    process.exit(2);
  }
  return fs.readFileSync(p);
}

// ── HTML metadata extraction (cheap regex, no parser needed) ──
function extractTitle(html) {
  // Prefer the og:title (already stripped of site suffix)
  const og = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html);
  if (og) return decodeEntities(og[1]);
  // Fallback to <title>, stripping the " | DeftBrain" suffix
  const t = /<title>([^<]+)<\/title>/i.exec(html);
  if (t) return decodeEntities(t[1].replace(/\s*\|\s*DeftBrain\s*$/i, ''));
  return null;
}

function extractCategory(html) {
  const m = /<meta\s+property=["']article:section["']\s+content=["']([^"']+)["']/i.exec(html);
  return m ? decodeEntities(m[1]).toUpperCase() : null;
}

function decodeEntities(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>');
}

// ── Layout ─────────────────────────────────────────────────
// Dynamic font size so long titles don't overflow. Satori wraps
// automatically; we just pick a sane base size per length bucket.
function titleFontSize(title) {
  const n = title.length;
  if (n <= 36) return 80;
  if (n <= 56) return 64;
  if (n <= 80) return 52;
  return 44;
}

function buildTemplate({ title, category }) {
  // Satori uses a subset of flexbox CSS. No `display: block`;
  // everything must be flex or absolute. Colors/tokens match guide.css.
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 80px',
        backgroundColor: '#f7f4ef',            // --paper
        fontFamily: 'DM Sans',
        position: 'relative',
      },
      children: [
        // ── Masthead: DeftBrain wordmark + right-side URL ──
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '22px',
              color: '#1a1816',
              fontWeight: 500,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex' },
                  children: [
                    { type: 'span', props: { children: 'Deft' } },
                    { type: 'span', props: { style: { color: '#c94f2c' }, children: 'Brain' } },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '14px',
                    color: '#6b6760',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  },
                  children: 'deftbrain.com',
                },
              },
            ],
          },
        },

        // ── Body: category tag + title, vertically centered ──
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
            },
            children: [
              category && {
                type: 'div',
                props: {
                  style: {
                    fontSize: '18px',
                    color: '#c94f2c',
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                    marginBottom: '32px',
                    fontWeight: 500,
                  },
                  children: category,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Playfair Display',
                    fontSize: `${titleFontSize(title)}px`,
                    fontWeight: 700,
                    color: '#1a1816',
                    lineHeight: 1.08,
                    letterSpacing: '-1px',
                  },
                  children: title,
                },
              },
            ].filter(Boolean),
          },
        },

        // ── Footer: rule + tagline ──
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '20px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    height: '1px',
                    backgroundColor: '#e0dbd2',  // --rule
                    width: '100%',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '18px',
                    color: '#6b6760',
                    fontWeight: 400,
                  },
                  children: 'A DeftBrain guide',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ── Walk + generate ───────────────────────────────────────
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== '_template.html') {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  // Dynamic import because satori is ESM-only
  const { default: satori }  = await import('satori');
  const { Resvg }            = await import('@resvg/resvg-js');

  const fonts = [
    { name: 'Playfair Display', data: loadFont('PlayfairDisplay-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'DM Sans',           data: loadFont('DMSans-Regular.ttf'),       weight: 400, style: 'normal' },
    { name: 'DM Sans',           data: loadFont('DMSans-Medium.ttf'),        weight: 500, style: 'normal' },
  ];

  fs.mkdirSync(OG_OUT_DIR, { recursive: true });

  const guides = walk(GUIDES_SRC);
  if (!guides.length) {
    console.log('No guides found under public/guides/. Nothing to do.');
    return;
  }

  let generated = 0, skipped = 0, errors = 0;

  for (const guidePath of guides) {
    const slug = path.basename(guidePath, '.html');
    const outPath = path.join(OG_OUT_DIR, `${slug}.png`);

    // Incremental: skip if PNG newer than HTML (and --force not passed)
    if (!FORCE && fs.existsSync(outPath)) {
      const htmlMtime = fs.statSync(guidePath).mtimeMs;
      const pngMtime  = fs.statSync(outPath).mtimeMs;
      if (pngMtime >= htmlMtime) {
        skipped++;
        continue;
      }
    }

    try {
      const html = fs.readFileSync(guidePath, 'utf8');
      const title = extractTitle(html);
      const category = extractCategory(html);

      if (!title) {
        console.warn(`  ⚠ ${slug}: no <title> or og:title — skipping`);
        errors++;
        continue;
      }

      const tree = buildTemplate({ title, category });
      const svg = await satori(tree, { width: 1200, height: 630, fonts });
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

      fs.writeFileSync(outPath, png);
      generated++;
      console.log(`  ✓ ${slug}.png  (${(png.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      errors++;
      console.error(`  ✗ ${slug}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped (up-to-date), ${errors} error${errors === 1 ? '' : 's'}.`);
  if (errors > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
