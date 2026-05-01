#!/usr/bin/env node
// ============================================================
// scripts/build-guides-indexes.js
// ============================================================
// Generates prerendered guide index pages:
//   build/guides/index.html              — by-category view (default at /guides)
//   build/guides/by-tool.html            — by-tool view (at /guides/by-tool)
//   build/guides/{category}/index.html   — per-category browse pages
//
// All pages share the editorial style of existing guide pages
// (uses /guides/guide.css). Tab control on /guides and /guides/by-tool
// links between the two main views. Category pages have a "back to all
// guides" link.
//
// Reads:  guides/{category}/{slug}.js  (the spec files)
// Writes: build/guides/index.html, build/guides/by-tool.html,
//         build/guides/{category}/index.html
//
// Hook into package.json:
//   "postbuild": "node scripts/prerender.js && node scripts/build-guides-indexes.js && node scripts/generate-guides-sitemap.js && node scripts/generate-sitemap-index.js"
// ============================================================

const fs   = require('fs');
const path = require('path');
const { getFooterHTML } = require('../src/seo/chrome');

const ROOT       = path.join(__dirname, '..');
const SPECS_DIR  = path.join(ROOT, 'guides');
const BUILD_DIR  = path.join(ROOT, 'build', 'guides');
const BASE_URL   = 'https://deftbrain.com';

// Category metadata — controls grouping order, editorial copy on
// the by-category index, and the per-category page introductions.
// Add/edit as new categories are introduced.
const CATEGORY_META = {
  workplace: {
    name: 'Workplace',
    desc: "Hard conversations, decoding the language of meetings, sending the email you mean to send.",
    examples: "How to tell your boss they're wrong without burning anything down. What \"k.\" actually means in a text. The email you write at 11 PM versus the email you should send.",
    group: 'work',
  },
  career: {
    name: 'Career',
    desc: "Self-reviews, promotion cases, the work of advocating for yourself professionally.",
    examples: "Building the brag sheet you'll need at your next performance review. Making the promotion case when the work was real but quiet. Remembering what you actually did six months ago.",
    group: 'work',
  },
  meetings: {
    name: 'Meetings',
    desc: "Notes that get read, action items that get done, decisions that stick.",
    examples: "The difference between meeting minutes and meeting notes. Capturing decisions in a way that survives the next meeting. Running a debrief that actually changes the next project.",
    group: 'work',
  },
  presentations: {
    name: 'Presentations',
    desc: "Decks that hold attention, talks that don't crater, the moments where you have to stand up and convince a room.",
    examples: "Cutting a deck from forty slides to twelve. Opening a talk so the room doesn't reach for their phones. The five-minute version of the thing you have an hour to say.",
    group: 'work',
  },
  learning: {
    name: 'Learning',
    desc: "Studying smarter, remembering more, and the metacognitive moves that separate effort from progress.",
    examples: "Reading a textbook chapter so it actually sticks. Spaced repetition without the apps. Knowing when you've actually learned something versus when you just feel like you have.",
    group: 'work',
  },

  home: {
    name: 'Home',
    desc: "Leases, landlords, the small print that becomes the year you actually live.",
    examples: "How to read a lease before signing it. Red flags in a rental lease. Getting your security deposit back when the landlord doesn't want to give it back.",
    group: 'practical',
  },
  health: {
    name: 'Health',
    desc: "Doctor's visits, lab results, diagnoses written in a language you didn't take in school.",
    examples: "Preparing for a 15-minute appointment so it actually counts. Reading blood test results without panicking. Understanding what your doctor actually said after you nodded along.",
    group: 'practical',
  },
  money: {
    name: 'Money',
    desc: "High-pressure sales, predatory fees, conversations where the other side has done this before and you haven't.",
    examples: "Recognizing sales manipulation tactics before they work on you. Negotiating with a car salesman without getting played. Pushing back on bank fees and actually getting them refunded.",
    group: 'practical',
  },
  travel: {
    name: 'Travel',
    desc: "Trip planning, packing, the small choices that determine whether a trip is good or just expensive.",
    examples: "Packing for a week in a carry-on. Building an itinerary that doesn't fall apart on day three. The guidebook moves locals quietly avoid.",
    group: 'practical',
  },
  cooking: {
    name: 'Cooking',
    desc: "Recipes, techniques, and the kitchen knowledge that turns adequate cooking into actual cooking.",
    examples: "Why your sauce broke and how to save it. Reading a recipe to understand what's actually load-bearing. Cooking from what's already in your fridge.",
    group: 'practical',
  },
  practical: {
    name: 'Practical',
    desc: "The everyday how-to questions — bike checks, pronunciations, gift ideas, all the small competencies of grown-up life.",
    examples: "Pronouncing French food names. Knowing when your bike actually needs a tune-up. Gift ideas for the person who has everything.",
    group: 'practical',
  },

  conversations: {
    name: 'Conversations',
    desc: "Comebacks, family dynamics, the hard verbal moments you'll be in again.",
    examples: "How to respond when someone says you're being too sensitive. What to say when family asks invasive questions at holidays. The comebacks you'll wish you'd thought of, prepared in advance.",
    group: 'personal',
  },
  apologies: {
    name: 'Apologies',
    desc: "Calibrating apologies to the actual harm, in the right register, without the hedging that undoes them.",
    examples: "The difference between an apology and an explanation. Apologizing to a partner without making it worse. Apologizing professionally without overcommitting.",
    group: 'personal',
  },
  speeches: {
    name: 'Speeches',
    desc: "Toasts and tributes for weddings, retirements, memorials — the moments where you have to speak and don't want to wing it.",
    examples: "Writing a wedding toast that lands without being saccharine. Speaking at a retirement that does justice to the career. The memorial speech when you weren't sure you could speak at all.",
    group: 'personal',
  },
  decisions: {
    name: 'Decisions',
    desc: "The hard calls — career moves, relationships, life-shaping choices where there's no obviously right answer.",
    examples: "Knowing when to leave a job. Deciding whether to move. The pre-mortem on a decision you're already attached to.",
    group: 'personal',
  },
  wellness: {
    name: 'Wellness',
    desc: "Mental and physical patterns — sleep, focus, the everyday signals your body and mind are sending that you're not always reading.",
    examples: "Why you're so tired by 3pm. Reading early signs of burnout before it lands. The difference between needing a nap and needing a week.",
    group: 'personal',
  },

  planning: {
    name: 'Planning',
    desc: "Pre-mortems, pressure-testing, finding holes in your own thinking before they find you.",
    examples: "The questions to ask before starting anything that costs you time. Pressure-testing a plan you've already gotten attached to. The failure modes you're not currently looking at.",
    group: 'other',
  },
  pets: {
    name: 'Pets',
    desc: "Decoding what your pet's behavior actually means.",
    examples: "Why your dog is doing the thing. What a cat's pattern is telling you. When behavior is signal versus when it's just animal.",
    group: 'other',
  },
};

const GROUP_ORDER  = ['work', 'practical', 'personal', 'other'];
const GROUP_LABELS = { work: 'Work life', practical: 'Practical life', personal: 'Personal life', other: 'Other' };

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadSpecs() {
  if (!fs.existsSync(SPECS_DIR)) throw new Error(`Specs dir not found: ${SPECS_DIR}`);
  const specs = [];
  for (const cat of fs.readdirSync(SPECS_DIR, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    const catDir = path.join(SPECS_DIR, cat.name);
    for (const file of fs.readdirSync(catDir).filter(f => f.endsWith('.js'))) {
      const filepath = path.join(catDir, file);
      delete require.cache[require.resolve(filepath)];
      try {
        const spec = require(filepath);
        if (spec.slug && spec.category && spec.title) specs.push(spec);
      } catch (err) {
        console.warn(`  ⚠ Skipping ${path.relative(ROOT, filepath)} — ${err.message}`);
      }
    }
  }
  return specs;
}

// Shared <head> markup — common to all index pages
function renderHead({ title, description, canonicalPath, extraStyle = '' }) {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}">
  <link rel="canonical" href="${escHtml(canonical)}">

  <meta property="og:type"        content="website">
  <meta property="og:title"       content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(description)}">
  <meta property="og:url"         content="${escHtml(canonical)}">
  <meta property="og:site_name"   content="DeftBrain">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(description)}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/guides/guide.css">

  <style>
    .tabs {
      display: flex;
      gap: 0;
      margin: 1.5rem 0 2rem;
      border-bottom: 1px solid #e8e1d5;
    }
    .tabs a {
      padding: 0.65rem 1.2rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.92rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      color: #5a544a;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }
    .tabs a:hover { color: #c8872e; }
    .tabs a.active {
      color: #2c4a6e;
      border-bottom-color: #c8872e;
      font-weight: 600;
    }

    .group-heading {
      margin: 3rem 0 1.25rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8a8275;
    }
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .category-card {
      display: flex;
      flex-direction: column;
      padding: 1.25rem 1.4rem 1.4rem;
      background: #faf8f5;
      border: 1px solid #e8e1d5;
      border-radius: 10px;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, transform 0.15s;
    }
    .category-card:hover {
      border-color: #c8872e;
      transform: translateY(-1px);
    }
    .category-card .cat-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: #2c4a6e;
      margin: 0 0 0.4rem;
    }
    .category-card .cat-desc {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.95rem;
      font-style: italic;
      color: #5a544a;
      margin: 0 0 0.8rem;
      line-height: 1.45;
    }
    .category-card .cat-examples {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.88rem;
      color: #5a544a;
      margin: 0 0 0.9rem;
      line-height: 1.55;
    }
    .category-card .cat-meta {
      margin-top: auto;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #c8872e;
    }
    .index-outro {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e8e1d5;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.95rem;
      color: #5a544a;
      line-height: 1.55;
    }
    .index-outro a {
      color: #2c4a6e;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* Tool-grouping (by-tool view) */
    .tool-section {
      margin: 2rem 0;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e8e1d5;
    }
    .tool-section:last-child { border-bottom: none; }
    .tool-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #2c4a6e;
      margin: 0 0 0.4rem;
    }
    .tool-name a {
      color: inherit;
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: border-color 0.15s;
    }
    .tool-name a:hover {
      border-bottom-color: #c8872e;
    }
    .tool-meta {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.85rem;
      color: #8a8275;
      margin: 0 0 1rem;
    }
    .tool-guides {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .tool-guides li {
      padding: 0.4rem 0;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .tool-guides a {
      color: #2c4a6e;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s;
    }
    .tool-guides a:hover {
      border-bottom-color: #2c4a6e;
    }
    .tool-guides .cat-tag {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.78rem;
      color: #8a8275;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Per-category page styles */
    .cat-back {
      display: inline-block;
      margin-bottom: 1.5rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      color: #5a544a;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    .cat-back:hover { color: #c8872e; }
    .cat-guides-list {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0 2rem;
    }
    .cat-guides-list li {
      padding: 0.7rem 0;
      border-bottom: 1px solid #f0eadd;
    }
    .cat-guides-list li:last-child { border-bottom: none; }
    .cat-guides-list a {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1rem;
      color: #2c4a6e;
      text-decoration: none;
      line-height: 1.5;
    }
    .cat-guides-list a:hover {
      border-bottom: 1px solid #2c4a6e;
    }
    ${extraStyle}
  </style>
</head>
<body>

  <header class="masthead">
    <a href="/" class="masthead-logo" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="masthead-logo-img" height="96" style="width:auto;height:96px;object-fit:contain;">
      <span class="masthead-logo-text">Deft<span>Brain</span></span>
    </a>
    <a href="/" class="masthead-cta">All tools →</a>
  </header>`;
}

function renderFooter() {
  return `
${getFooterHTML()}

</body>
</html>`;
}

function renderTabs(activeView) {
  const cls = (v) => v === activeView ? 'active' : '';
  return `
      <div class="tabs">
        <a href="/guides" class="${cls('category')}">By category</a>
        <a href="/guides/by-tool" class="${cls('tool')}">By tool</a>
      </div>`;
}

function renderByCategory(specs) {
  const byGroup = {};
  for (const groupKey of GROUP_ORDER) byGroup[groupKey] = [];
  for (const [catKey, meta] of Object.entries(CATEGORY_META)) {
    const guidesInCat = specs.filter(s => s.category === catKey);
    if (guidesInCat.length === 0) continue;
    if (!byGroup[meta.group]) byGroup[meta.group] = [];
    byGroup[meta.group].push({ catKey, meta, count: guidesInCat.length });
  }

  let body = '';
  for (const groupKey of GROUP_ORDER) {
    const groupCats = byGroup[groupKey] || [];
    if (groupCats.length === 0) continue;
    body += `\n      <div class="section-rule"><span>${escHtml(GROUP_LABELS[groupKey])}</span></div>\n      <div class="category-grid">\n`;
    for (const { catKey, meta, count } of groupCats) {
      body += `\n        <a href="/guides/${escHtml(catKey)}" class="category-card">
          <h3 class="cat-name">${escHtml(meta.name)}</h3>
          <p class="cat-desc">${escHtml(meta.desc)}</p>
          <p class="cat-examples">${escHtml(meta.examples)}</p>
          <span class="cat-meta">Browse ${escHtml(meta.name)} guides · ${count} →</span>
        </a>\n`;
    }
    body += `      </div>\n`;
  }

  return renderHead({
    title: 'DeftBrain Guides — Practical writing for specific moments',
    description: "A growing collection of guides for the moments when something specific is on your mind — a hard conversation, a confusing diagnosis, a lease that doesn't sit right.",
    canonicalPath: '/guides',
  }) + `

  <main>
    <div class="container">

      <div class="eyebrow">
        <span class="tag">Guides</span>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>Practical writing for specific moments</h1>

      <p class="deck">Guides for the moments when something specific is on your mind — a hard conversation, a confusing diagnosis, a lease that doesn&#39;t sit right.</p>

<p class="lede">Each guide gets to the point, and ends with a tool that does the work for you. Find the one that matches your situation and start there.</p>
${renderTabs('category')}
${body}
      <p class="index-outro">More guides shipping regularly. If there&#39;s a moment we haven&#39;t written for yet, the <a href="/">tool catalog</a> is where the work continues.</p>

    </div>
  </main>
${renderFooter()}`;
}

function renderByTool(specs) {
  const byTool = {};
  for (const spec of specs) {
    const toolId   = spec.cta?.toolId   || '(other)';
    const toolName = spec.cta?.toolName || 'Other';
    if (!byTool[toolId]) byTool[toolId] = { toolId, toolName, items: [] };
    byTool[toolId].items.push(spec);
  }

  const toolKeys = Object.keys(byTool).sort((a, b) =>
    byTool[a].toolName.localeCompare(byTool[b].toolName)
  );
  for (const k of toolKeys) {
    byTool[k].items.sort((a, b) => a.title.localeCompare(b.title));
  }

  let body = '';
  for (const toolKey of toolKeys) {
    const group = byTool[toolKey];
    const headerInner = (group.toolId !== '(other)')
      ? `<a href="/${escHtml(group.toolId)}">${escHtml(group.toolName)}</a>`
      : escHtml(group.toolName);

    body += `
      <section class="tool-section">
        <h2 class="tool-name">${headerInner}</h2>
        <p class="tool-meta">${group.items.length} guide${group.items.length === 1 ? '' : 's'}</p>
        <ul class="tool-guides">
${group.items.map(g => `          <li><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">${escHtml(g.title)}</a><span class="cat-tag">${escHtml(CATEGORY_META[g.category]?.name || g.category)}</span></li>`).join('\n')}
        </ul>
      </section>
`;
  }

  return renderHead({
    title: 'DeftBrain Guides — Browse by tool',
    description: "Every DeftBrain guide, grouped by the tool it pairs with. Find a tool by the question someone might search to need it.",
    canonicalPath: '/guides/by-tool',
  }) + `

  <main>
    <div class="container">

      <div class="eyebrow">
        <span class="tag">Guides</span>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>Browse by tool</h1>

      <p class="deck">Every guide grouped by the tool it pairs with. Each tool name links to the tool itself; each guide title links to the guide.</p>
${renderTabs('tool')}
${body}
      <p class="index-outro">Looking for a guide on a topic instead? Switch to the <a href="/guides">by-category view</a>.</p>

    </div>
  </main>
${renderFooter()}`;
}

function renderCategoryPage(catKey, meta, guidesInCat) {
  const sorted = [...guidesInCat].sort((a, b) => a.title.localeCompare(b.title));

  const listHtml = sorted.map(g =>
    `        <li><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">${escHtml(g.title)}</a></li>`
  ).join('\n');

  return renderHead({
    title: `${meta.name} guides — DeftBrain`,
    description: meta.desc,
    canonicalPath: `/guides/${catKey}`,
  }) + `

  <main>
    <div class="container">

      <a href="/guides" class="cat-back">← All guides</a>

      <div class="eyebrow">
        <span class="tag">${escHtml(meta.name)}</span>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>${escHtml(meta.name)} guides</h1>

      <p class="deck">${escHtml(meta.desc)}</p>

      <p class="lede">${escHtml(meta.examples)}</p>

      <div class="section-rule"><span>${sorted.length} guide${sorted.length === 1 ? '' : 's'}</span></div>

      <ul class="cat-guides-list">
${listHtml}
      </ul>

      <p class="index-outro">Looking for something different? See <a href="/guides">all guides</a> or <a href="/guides/by-tool">browse by tool</a>.</p>

    </div>
  </main>
${renderFooter()}`;
}

function main() {
  console.log('📑  Building guides indexes...');
  const specs = loadSpecs();
  if (!specs.length) { console.warn('  ⚠ No specs found.'); return; }

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // Main index (by category)
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), renderByCategory(specs), 'utf8');
  console.log(`  ✓ build/guides/index.html — by-category view`);

  // By-tool view
  fs.writeFileSync(path.join(BUILD_DIR, 'by-tool.html'), renderByTool(specs), 'utf8');
  console.log(`  ✓ build/guides/by-tool.html — by-tool view`);

  // Per-category pages
  let catCount = 0;
  for (const [catKey, meta] of Object.entries(CATEGORY_META)) {
    const guidesInCat = specs.filter(s => s.category === catKey);
    if (guidesInCat.length === 0) continue;
    const catDir = path.join(BUILD_DIR, catKey);
    fs.mkdirSync(catDir, { recursive: true });
    fs.writeFileSync(
      path.join(catDir, 'index.html'),
      renderCategoryPage(catKey, meta, guidesInCat),
      'utf8'
    );
    catCount++;
  }
  console.log(`  ✓ ${catCount} per-category index pages`);

  console.log(`  ✓ ${specs.length} guides indexed`);
}

try {
  main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
