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
const { getFooterHTML, getSiteHeaderHTML, getPageSearchHTML } = require('../src/seo/chrome');
const { categoriesFor } = require('./lib/toolCategories');
const { buildGuideShelves } = require('./lib/guideShelves');
const { guideListHtml, GUIDE_LIST_STYLE, GUIDE_LIST_SCRIPT, GUIDE_LIST_NOSCRIPT } = require('./lib/guideListHtml');
const { GA_SNIPPET } = require('./lib/gaSnippet');
const { THEME_SNIPPET } = require('./lib/themeSnippet');

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

// Each CATEGORY_META entry still carries a `group` field (work/practical/
// personal/other) — it grouped categories on the OLD homepage design, now
// replaced by DOOR_GROUPS below. GROUP_ORDER/GROUP_LABELS (the only things
// that ever read `.group`) were removed as dead code along with that design;
// `.group` itself was left in place rather than editing all 18 entries to
// strip a harmless, possibly-still-useful-someday field.

// ── Guides homepage (2026-10-05 rebuild) ────────────────────────────────────
// Was: 6 "door" buttons that filtered a library further down, featured and
// curiosity picks, and a library with 18 guide categories — three different
// maps of the same subjects, and nothing a visitor could open as a page. Now:
// search, then the SAME 14 categories the tools use (src/data/categoryMeta.js),
// in the same order, each with the same guide list its /tools/{slug} page
// shows (scripts/lib/guideShelves.js). One set of categories everywhere.

// Every guide links to its own page — non-keep-list ones are live but
// noindexed, never redirected (see backend/server.js). Kept in one function
// so the guides home and scripts/lib/guideShelves.js can't drift apart.
function hrefFor(spec) {
  return `/guides/${spec.category}/${spec.slug}`;
}

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

// ── Keep-list (SEO footprint prune, 2026-07) ───────────────────────────────
// guides/keep-list.json names the guides that keep their own URLs (signals from
// GSC: indexed, clicked, or ≥10 impressions). Every other guide is CONSOLIDATED:
// its content renders as an anchored section on the category hub page below, and
// the server 301s its old URL to /guides/{category}#{slug}. To re-release a guide,
// add its slug back to keep-list.json and rebuild.
function loadKeepSet() {
  const p = path.join(ROOT, 'guides', 'keep-list.json');
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const set = new Set();
  for (const [cat, slugs] of Object.entries(data.keep)) {
    slugs.forEach(slug => set.add(`${cat}/${slug}`));
  }
  return set;
}
const KEEP_SET = loadKeepSet();

// Shared <head> markup — common to all index pages
function renderHead({ title, description, canonicalPath, extraStyle = '', search = true }) {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${GA_SNIPPET}
  ${THEME_SNIPPET}

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

  <!-- Self-hosted fonts (no third-party request) — see public/fonts/ -->
  <link rel="stylesheet" href="/fonts/playfair-display/playfair-display.css">
  <link rel="stylesheet" href="/fonts/dm-sans/dm-sans.css">

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
      color: #165b9a;
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
      color: #6e675c;
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
      color: #165b9a;
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
      color: #165b9a;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* Tool-grouping (by-tool view) */
    .tool-section {
      margin: 2rem 0;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e8e1d5;
    }
    .tool-section:last-of-type { border-bottom: none; }
    /* The closing line, styled like the guides page's "Prefer to browse by
       tool?" note (.gh-by-tool-note), with less room below (2026-10-05). */
    .by-tool-outro { text-align: center; margin: 0.5rem 0 1.75rem; font-family: 'DM Sans', system-ui, sans-serif; font-size: 14px; color: #657483; }
    .by-tool-outro a { color: #2467a8; font-weight: 700; }
    :root[data-theme="dark"] .by-tool-outro { color: #a8a29e; }
    :root[data-theme="dark"] .by-tool-outro a { color: #85afd6; }
    .tool-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #165b9a;
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
      color: #6e675c;
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
      color: #165b9a;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s;
    }
    .tool-guides a:hover {
      border-bottom-color: #165b9a;
    }
    .tool-guides .cat-tag {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.78rem;
      color: #6e675c;
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
      color: #165b9a;
      text-decoration: none;
      line-height: 1.5;
    }
    .cat-guides-list a:hover {
      border-bottom: 1px solid #165b9a;
    }
    ${extraStyle}
  </style>
</head>
<body>

  ${getSiteHeaderHTML()}
  ${search ? getPageSearchHTML({ tools: 2, guides: 8, placeholder: 'Search guides and tools…' }) : ''}`;
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

const GUIDES_HOME_STYLE = `
    /* Guides homepage (2026-09-22) — every custom property and class here is
       "gh-" prefixed and scoped under .gh-page rather than :root, since this
       <style> block shares the page with guide.css's own global :root
       variables (--ink, --paper, ...) and the masthead/footer that use
       them — redefining those names at :root here would have recolored the
       masthead and footer too. Body font is this site's own DM Sans
       (already loaded by renderHead's Google Fonts link), not the supplied
       design's Inter, so this page doesn't pull in a font nothing else uses. */
    .gh-page{--gh-ink:#18324b;--gh-muted:#657483;--gh-blue:#2467a8;--gh-blue2:#174c7d;--gh-line:#dedbd4;--gh-serif:'Playfair Display',Georgia,'Times New Roman',serif;color:var(--gh-ink)}
    .gh-shell{width:min(1180px,calc(100% - 40px));margin-inline:auto}
    .gh-hero{padding:72px 0 64px;text-align:center;max-width:930px}
    .gh-kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:var(--gh-blue);margin:0 0 12px}
    .gh-hero h1{font-family:var(--gh-serif);font-weight:500;font-size:clamp(40px,6vw,64px);letter-spacing:-.04em;line-height:1;margin:0}
    .gh-hero-deck{font-family:var(--gh-serif);font-size:clamp(21px,3vw,28px);margin:18px 0 8px;color:#29465f}
    .gh-hero-sub{max-width:720px;margin:0 auto;color:var(--gh-muted);font-size:16px;line-height:1.65}
    .gh-hero-search{max-width:760px;margin:38px auto 0;text-align:left}
    .gh-hero-search label{display:block;font-family:var(--gh-serif);font-size:18px;margin:0 0 10px}
    .gh-search-box{display:flex;background:#fff;border:1px solid #d5d2cb;border-radius:14px;padding:6px;box-shadow:0 8px 30px rgba(31,51,71,.07)}
    .gh-search-box input{flex:1;border:0;outline:0;font-size:15px;padding:15px 16px;background:transparent;min-width:0;font-family:inherit}
    .gh-search-box button,.gh-final-search button{border:0;border-radius:10px;background:var(--gh-blue);color:#fff;font-weight:750;padding:0 22px;cursor:pointer;font-family:inherit}
    .gh-section{padding:64px 0}
    .gh-section-head{display:flex;justify-content:space-between;gap:40px;align-items:end;margin-bottom:28px}
    .gh-section-head h2,.gh-library-intro h2,.gh-tool-bridge h2,.gh-final-search h2{font-family:var(--gh-serif);font-weight:500;letter-spacing:-.025em;font-size:clamp(28px,4vw,40px);margin:0}
    .gh-section-head>p{color:var(--gh-muted);max-width:430px;line-height:1.6;margin:0}
    .gh-door-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--gh-line);border-left:1px solid var(--gh-line)}
    .gh-door{appearance:none;text-align:left;background:transparent;border:0;border-right:1px solid var(--gh-line);border-bottom:1px solid var(--gh-line);padding:28px;min-height:225px;color:var(--gh-ink);cursor:pointer;transition:.2s;font-family:inherit}
    .gh-door:hover{background:#fff;transform:translateY(-2px);box-shadow:0 12px 34px rgba(37,56,75,.06)}
    .gh-door-mark{font-family:var(--gh-serif);font-size:13px;color:#9b948b}
    .gh-door h3{font-family:var(--gh-serif);font-size:24px;font-weight:500;margin:30px 0 10px}
    .gh-door p{font-size:14px;line-height:1.55;color:var(--gh-muted);margin:0 0 18px}
    .gh-door-link{font-size:12px;font-weight:800;color:var(--gh-blue)}
    .gh-feature-section{background:#eaf0f4}
    .gh-feature-grid{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:1fr 1fr;gap:14px}
    .gh-feature-card{background:#fff;padding:28px;text-decoration:none;color:var(--gh-ink);min-height:200px;display:flex;flex-direction:column;border-radius:4px;transition:.2s}
    .gh-feature-card:hover{transform:translateY(-2px);box-shadow:0 14px 38px rgba(30,53,75,.08)}
    .gh-feature-main{grid-row:1/3;min-height:414px;justify-content:flex-end;background:var(--gh-blue2);color:#fff}
    .gh-feature-eyebrow{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:var(--gh-blue);display:block}
    .gh-feature-main .gh-feature-eyebrow{color:#c8dced}
    .gh-feature-card h3{font-family:var(--gh-serif);font-size:25px;line-height:1.15;font-weight:500;margin:12px 0}
    .gh-feature-main h3{font-size:38px}
    .gh-feature-card p{font-size:14px;line-height:1.55;color:var(--gh-muted);margin:0 0 18px}
    .gh-feature-main p{color:#d8e4ed}
    .gh-read-link{font-size:12px;font-weight:800;margin-top:auto}
    .gh-curiosity-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    .gh-curiosity-card{min-height:205px;background:#fff;border:1px solid var(--gh-line);padding:20px;text-decoration:none;color:var(--gh-ink);display:flex;flex-direction:column}
    .gh-curiosity-card:nth-child(even){background:#f0ece5}
    .gh-curiosity-card h3{font-family:var(--gh-serif);font-weight:500;font-size:19px;line-height:1.18;margin:16px 0}
    .gh-curiosity-card>span:last-child{font-size:12px;color:var(--gh-blue);font-weight:800;margin-top:auto}
    .gh-library{background:#fff}
    .gh-library-intro{text-align:center;max-width:720px;margin:0 auto 32px}
    .gh-library-intro p:last-child{color:var(--gh-muted)}
    .gh-sticky-controls{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:12px 0;border-bottom:1px solid #eee}
    .gh-library-search{position:relative}
    .gh-library-search input{width:100%;border:1px solid #d7d9dc;border-radius:10px;padding:12px 40px 12px 14px;font-size:14px;outline:0;font-family:inherit}
    .gh-library-search input:focus{border-color:#74a6d4;box-shadow:0 0 0 3px #e8f2fb}
    .gh-library-search button{position:absolute;right:8px;top:6px;border:0;background:transparent;font-size:22px;color:#89949d;cursor:pointer}
    .gh-filter-toggle,.gh-sort-toggle{border:1px solid #d7d9dc;background:#fff;border-radius:10px;padding:0 15px;font-weight:750;color:var(--gh-ink);cursor:pointer;font-family:inherit}
    .gh-sort-toggle.active{background:#edf4fa;border-color:#aac7df}
    .gh-category-panel{display:none;flex-wrap:wrap;gap:8px;padding:16px 0;border-bottom:1px solid #eee}
    .gh-category-panel.open{display:flex}
    .gh-category-panel button{border:1px solid #dfe2e4;background:#fff;border-radius:999px;padding:8px 12px;font-size:12px;color:var(--gh-ink);cursor:pointer;font-family:inherit}
    .gh-category-panel button span{color:#89949d;margin-left:4px}
    .gh-category-panel button.active{background:var(--gh-ink);color:#fff;border-color:var(--gh-ink)}
    .gh-result-note{font-size:13px;color:var(--gh-muted);margin:22px 0 8px}
    .gh-tool-hits{margin:22px 0 0;padding:14px 16px;border:1px solid #d9e6f1;background:#f5f9fc;border-radius:12px}
    .gh-tool-hits[hidden]{display:none}
    .gh-tool-hits p{margin:0 0 8px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--gh-blue)}
    .gh-tool-hits a{display:block;padding:6px 0;text-decoration:none;color:var(--gh-ink)}
    .gh-tool-hits a b{font-weight:750}
    .gh-tool-hits a span{color:var(--gh-muted);font-size:13px}
    .gh-tool-hits a:hover b{color:var(--gh-blue)}
    .gh-guide-list{display:grid;grid-template-columns:repeat(3,1fr);column-gap:40px}
    .gh-guide-item{padding:24px 0;border-bottom:1px solid #e8e8e5;text-decoration:none;color:var(--gh-ink);display:block}
    .gh-guide-item .gh-cat{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gh-blue);font-weight:800}
    .gh-guide-item h3{font-family:var(--gh-serif);font-size:20px;line-height:1.2;font-weight:500;margin:8px 0}
    .gh-guide-item p{font-size:13px;line-height:1.5;color:var(--gh-muted);margin:0}
    .gh-guide-item:hover h3{color:var(--gh-blue)}
    .gh-load-more{display:block;margin:32px auto 0;border:1px solid #b8c4cd;background:#fff;border-radius:10px;padding:12px 22px;color:var(--gh-ink);font-weight:800;cursor:pointer;font-family:inherit}
    .gh-by-tool-note{text-align:center;margin:10px 0 0;font-size:12px;color:var(--gh-muted)}
    .gh-by-tool-note a{color:var(--gh-blue);font-weight:700}
    .gh-tool-bridge{background:var(--gh-ink);color:#fff;padding:60px 0}
    .gh-bridge-inner{display:flex;align-items:center;justify-content:space-between;gap:50px}
    .gh-tool-bridge .gh-kicker{color:#9fc5e6}
    .gh-tool-bridge h2{max-width:760px;font-size:32px}
    .gh-tool-bridge a{white-space:nowrap;color:#fff;border:1px solid #698096;border-radius:10px;padding:14px 18px;text-decoration:none;font-weight:800}
    .gh-final-search{text-align:center;padding:80px 0}
    .gh-final-search>p{color:var(--gh-muted)}
    .gh-final-search form{max-width:650px;margin:24px auto 0;display:flex;border:1px solid #d6d3cc;background:#fff;padding:6px;border-radius:13px}
    .gh-final-search input{flex:1;border:0;outline:0;padding:14px;font-size:14px;min-width:0;font-family:inherit}
    @media(max-width:850px){
      .gh-door-grid{grid-template-columns:repeat(2,1fr)}
      .gh-curiosity-row{grid-template-columns:repeat(2,1fr)}
      .gh-curiosity-card:last-child{grid-column:1/3}
      .gh-guide-list{grid-template-columns:repeat(2,1fr)}
      .gh-feature-grid{grid-template-columns:1fr;grid-template-rows:auto}
      .gh-feature-main{grid-row:auto;min-height:320px}
      .gh-section-head{align-items:start;flex-direction:column}
      .gh-bridge-inner{align-items:flex-start;flex-direction:column}
    }
    @media(max-width:600px){
      .gh-hero{padding:48px 0}
      .gh-search-box{flex-direction:column}
      .gh-search-box button{padding:13px}
      .gh-section{padding:44px 0}
      .gh-door-grid,.gh-guide-list,.gh-curiosity-row{grid-template-columns:1fr}
      .gh-curiosity-card:last-child{grid-column:auto}
      .gh-door{min-height:180px}
      .gh-feature-main h3{font-size:30px}
      .gh-sticky-controls{grid-template-columns:1fr auto}
      .gh-sort-toggle{display:none}
      .gh-guide-item{padding:20px 0}
      .gh-final-search form{flex-direction:column}
      .gh-final-search button{padding:13px}
      .gh-bridge-inner{gap:22px}
      .gh-hero-sub{font-size:14px}
    }`;

// categoryMeta.js and tools.js are plain ES-module data files with no imports:
// strip `export const` and evaluate, as build-tools-category-pages.js does.
function loadModuleData(relPath, exportName) {
  const body = fs.readFileSync(path.join(ROOT, relPath), 'utf8').replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\n;return typeof ${exportName} !== 'undefined' ? ${exportName} : [];`)();
}

const GUIDES_BROWSE_STYLE = `
    /* Hero, tightened (owner, 2026-10-05): the toolbox's heading size and
       search box (src/components/AllToolsPage.css .at-hero h1 / .at-nav-search),
       the box wider here. Overrides GUIDES_HOME_STYLE's larger hero. */
    .gh-hero{padding:28px 0 32px}
    .gh-hero h1{font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-weight:700;font-size:30px;line-height:.98;letter-spacing:-.035em}
    @media(min-width:640px){.gh-hero h1{font-size:34px}}
    @media(min-width:1024px){.gh-hero h1{font-size:38px}}
    .gh-hero-search{margin:20px auto 0;max-width:640px}
    .gh-hero-search label{font-size:16px;margin:0 0 12px}
    .gh-find{display:flex;gap:8px}
    .gh-find-field{position:relative;flex:1;min-width:0}
    .gh-find-field input{width:100%;box-sizing:border-box;border-radius:8px;border:1px solid #d5cab8;padding:10px 44px 10px 14px;font-size:12px;font-family:inherit;font-weight:600;color:var(--gh-ink);background:#fff;outline:none}
    .gh-find-field input:focus{box-shadow:0 0 0 2px rgba(30,42,58,.15)}
    .gh-find-field input::placeholder{color:#999185}
    .gh-kbd{position:absolute;right:7px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:600;letter-spacing:.2px;color:#6e6659;background:#f3efe8;border:1px solid #e8e1d5;border-radius:4px;padding:1px 4px;pointer-events:none}
    .gh-kbd[hidden]{display:none}
    .gh-find button{border:0;border-radius:8px;padding:10px 16px;font-size:11px;font-weight:800;color:#fff;background:#1e2a3a;white-space:nowrap;cursor:pointer;font-family:inherit}
    @media(max-width:640px){.gh-kbd{display:none}}
    :root[data-theme="dark"] .gh-find-field input{background:#18181b;border-color:#71717a;color:#f4f4f5}
    :root[data-theme="dark"] .gh-find-field input:focus{box-shadow:0 0 0 2px rgba(127,179,224,.35)}
    :root[data-theme="dark"] .gh-find-field input::placeholder{color:#71717a}
    :root[data-theme="dark"] .gh-kbd{color:#a1a1aa;background:#27272a;border-color:#3f3f46}
    :root[data-theme="dark"] .gh-find button{background:#2f6fb0}
    .gh-browse{padding:8px 0 0}
    .gh-browse-head h2{font-family:var(--gh-serif);font-weight:500;letter-spacing:-.025em;font-size:25px;margin:0 0 12px}
    .gh-jump{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
    .gh-jump a{border:1px solid var(--gh-line);border-radius:999px;padding:7px 13px;font-size:13px;font-weight:700;color:var(--gh-ink);text-decoration:none;white-space:nowrap}
    .gh-jump a:hover{border-color:var(--gh-blue);color:var(--gh-blue)}
    .gh-cat{padding:10px 0 14px;scroll-margin-top:20px}
    .gh-cat-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-bottom:6px}
    .gh-cat-head h3{font-family:var(--gh-serif);font-weight:500;font-size:19px;margin:0}
    .gh-cat-head a{font-size:13px;font-weight:800;color:var(--gh-blue);text-decoration:none;white-space:nowrap}
    .gh-cat-head a:hover{text-decoration:underline}
    .gh-results{padding:0 0 40px}
    .gh-results[hidden]{display:none}
    .gh-results-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-bottom:14px}
    .gh-results-head p{margin:0;color:var(--gh-muted);font-size:15px}
    .gh-results-head button{border:0;background:transparent;color:var(--gh-blue);font:inherit;font-size:13px;font-weight:800;cursor:pointer;padding:0}
    .gh-by-tool-note{margin:10px 0 28px;color:var(--gh-muted);font-size:14px}
    .gh-by-tool-note a{color:var(--gh-blue);font-weight:700}
    .gh-page{--gl-ink:var(--gh-ink);--gl-link:var(--gh-blue);--gl-muted:var(--gh-muted);--gl-line:var(--gh-line)}${GUIDE_LIST_STYLE}`;

function renderGuidesHome(specs) {
  const categories = loadModuleData(path.join('src', 'data', 'categoryMeta.js'), 'CATEGORY_META');
  const tools = loadModuleData(path.join('src', 'data', 'tools.js'), 'tools');
  const shelves = buildGuideShelves(tools, categoriesFor);
  const shown = categories.filter(c => c.slug && shelves[c.name] && shelves[c.name].guides.length);

  const jumpHtml = shown.map(c => `<a href="#${escHtml(c.slug)}">${escHtml(c.emoji.trim())} ${escHtml(c.name)}</a>`).join('\n        ');
  const sectionsHtml = shown.map(c => `
      <section class="gh-cat" id="${escHtml(c.slug)}" aria-labelledby="gh-cat-${escHtml(c.slug)}">
        <div class="gh-cat-head">
          <h3 id="gh-cat-${escHtml(c.slug)}">${escHtml(c.emoji.trim())} ${escHtml(c.name)}</h3>
          <a href="/tools/${escHtml(c.slug)}">${escHtml(c.name)} tools →</a>
        </div>
${guideListHtml(shelves[c.name].guides, '        ')}
      </section>`).join('\n');

  // Search data: one entry per guide (a guide filed in two folders once).
  const seen = new Set();
  const guidesData = JSON.stringify(specs
    .filter(spec => !seen.has(spec.slug) && seen.add(spec.slug))
    .map(spec => ({
      slug: spec.slug,
      title: spec.title,
      description: spec.description || '',
      href: hrefFor(spec),
    })));

  return renderHead({
    title: 'Guides for Everyday Life | DeftBrain',
    description: 'Clear, practical DeftBrain guides for everyday questions about money, health, home, relationships, work, travel, and more.',
    canonicalPath: '/guides',
    extraStyle: GUIDES_HOME_STYLE + GUIDES_BROWSE_STYLE,
    // The guides home has its own search, in the hero.
    search: false,
  }) + `

  <main class="gh-page">
    <section class="gh-hero gh-shell">
      <h1>Guides for everyday life.</h1>
      <form class="gh-hero-search" id="heroSearch" role="search">
        <label for="q">What would you like to explore?</label>
        <div class="gh-find">
          <div class="gh-find-field">
            <input id="q" autocomplete="off" placeholder="Try &ldquo;security deposit,&rdquo; &ldquo;medical bill,&rdquo; or &ldquo;talking to my boss&rdquo;&hellip;">
            <span class="gh-kbd" id="qKbd" aria-hidden="true">⌘K</span>
          </div>
          <button type="submit">Search</button>
        </div>
      </form>
    </section>

    <section class="gh-results gh-shell" id="results" hidden aria-live="polite">
      <div class="gh-results-head">
        <p id="resultNote"></p>
        <button type="button" id="clearSearch">Clear search</button>
      </div>
      <div class="gh-tool-hits" id="toolHits" hidden></div>
      <ul class="gl-list" id="resultList"></ul>
    </section>

    <section class="gh-browse gh-shell" id="browse">
      <div class="gh-browse-head"><h2>Browse our library.</h2></div>
      <nav class="gh-jump" aria-label="Jump to a category">
        ${jumpHtml}
      </nav>
${sectionsHtml}
      <p class="gh-by-tool-note">Prefer to browse by tool? <a href="/guides/by-tool">See every guide grouped by tool →</a></p>
    </section>
  </main>
  ${GUIDE_LIST_NOSCRIPT}
  ${GUIDE_LIST_SCRIPT}

  <script>window.DEFT_GUIDES=${guidesData};</script>
  <script src="/search/deft-search.js"></script>
  <script>
  (()=>{
    // Search: ranked by the shared matcher (/search/deft-search.js, the same
    // one the home page and every guide page use), with the tool or two that
    // best fit shown above the guides. If that can't load, a plain word match.
    // An empty box puts the categories back.
    const all=window.DEFT_GUIDES||[];
    const q=document.querySelector('#q');
    const results=document.querySelector('#results');
    const list=document.querySelector('#resultList');
    const note=document.querySelector('#resultNote');
    const toolHits=document.querySelector('#toolHits');
    const browse=document.querySelector('#browse');
    const byHref=new Map(all.map(g=>[g.href,g]));
    const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ');
    let seq=0;
    function paint(arr,query,tools){
      list.innerHTML=arr.slice(0,48).map(g=>\`<li><a href="\${g.href}">\${esc(g.title)}</a></li>\`).join('');
      note.textContent=arr.length?\`Guides matching “\${query}”\`:\`No guides match “\${query}” yet. Try other words, or browse below.\`;
      toolHits.innerHTML=tools.length?'<p>Tools that can help</p>'+tools.map(t=>\`<a href="/\${esc(t.id)}"><b>\${esc(t.title)}</b> <span>— \${esc(t.tagline)}</span></a>\`).join(''):'';
      toolHits.hidden=!tools.length;
      results.hidden=false;
    }
    function run(){
      const query=q.value.trim();
      const mine=++seq;
      if(!query){results.hidden=true;return;}
      const plain=()=>{const words=norm(query).split(/\\s+/).filter(Boolean);paint(all.filter(g=>{const hay=norm(g.title+' '+g.description);return words.every(w=>hay.includes(w));}),query,[]);};
      if(!window.DeftSearch)return plain();
      window.DeftSearch.search(query).then(res=>{
        if(mine!==seq)return;
        const seen=new Set();
        const arr=res.guides.map(g=>[g.href,...(g.alt||[])].map(h=>byHref.get(h)).find(Boolean)).filter(g=>g&&!seen.has(g.slug)&&seen.add(g.slug));
        paint(arr,query,res.tools.slice(0,2));
      }).catch(()=>{if(mine===seq)plain();});
    }
    let t;
    const kbd=document.querySelector('#qKbd');
    const syncKbd=()=>{kbd.hidden=!!q.value;};
    q.addEventListener('input',()=>{syncKbd();clearTimeout(t);t=setTimeout(run,180);});
    // ⌘K / Ctrl+K focuses the search, as on the toolbox; Esc clears it.
    window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();q.focus();q.select();}});
    q.addEventListener('keydown',e=>{if(e.key==='Escape'){q.value='';syncKbd();run();q.blur();}});
    document.querySelector('#heroSearch').onsubmit=e=>{e.preventDefault();run();results.scrollIntoView({behavior:'smooth',block:'start'});};
    document.querySelector('#clearSearch').onclick=()=>{q.value='';syncKbd();run();q.focus();};
    // /guides?q=… (the "All matching guides" link in the guide pages' search)
    // opens the page already searched.
    const fromUrl=new URLSearchParams(location.search).get('q');
    if(fromUrl){q.value=fromUrl;syncKbd();run();}
  })();
  </script>
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
${group.items.map(g => {
          // Every guide has a real standalone page (all 552 are built and
          // served); the non-keep-list ones are noindexed rather than
          // redirected, so a link labelled as a guide leads to the guide.
          const cat = escHtml(CATEGORY_META[g.category]?.name || g.category);
          return `          <li><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">${escHtml(g.title)}</a><span class="cat-tag">${cat}</span></li>`;
        }).join('\n')}
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
      <p class="by-tool-outro">Prefer to browse by category? <a href="/guides">See every guide by category →</a></p>

    </div>
  </main>
${renderFooter()}`;
}

function renderCategoryPage(catKey, meta, guidesInCat, keepSet) {
  const sorted = [...guidesInCat].sort((a, b) => a.title.localeCompare(b.title));
  const kept    = sorted.filter(g => keepSet.has(`${g.category}/${g.slug}`));
  const folded  = sorted.filter(g => !keepSet.has(`${g.category}/${g.slug}`));

  const listHtml = kept.map(g =>
    `        <li><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">${escHtml(g.title)}</a></li>`
  ).join('\n');

  // Consolidated topics: each folded guide renders as an anchored section built
  // from its spec (deck + step names + tool CTA). The old article URL 301s here.
  const foldedHtml = folded.map(g => {
    const steps = (g.steps || []).map(st =>
      `            <li>${escHtml(st.name)}</li>`).join('\n');
    const cta = g.cta?.toolId
      ? `\n          <p class="hub-topic-cta"><a href="/${escHtml(g.cta.toolId)}">${escHtml(g.cta.glyph || '🔧')} ${escHtml(g.cta.toolName || g.cta.toolId)}</a> does this for you.</p>`
      : '';
    // The summary is an overview, not a replacement — link through to the full
    // guide, which is a live standalone page (noindexed, not redirected).
    const full = `\n          <p class="hub-topic-more"><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">Read the full guide &rarr;</a></p>`;
    return `
        <section class="hub-topic" id="${escHtml(g.slug)}">
          <h3><a href="/guides/${escHtml(g.category)}/${escHtml(g.slug)}">${escHtml(g.title)}</a></h3>
          <p>${escHtml(g.deck || g.description || '')}</p>
          <ol class="hub-topic-steps">
${steps}
          </ol>${full}${cta}
        </section>`;
  }).join('\n');

  const foldedBlock = folded.length ? `
      <div class="section-rule"><span>${folded.length} more ${escHtml(meta.name)} topics, condensed</span></div>
      <p class="lede">Quick answers to more ${escHtml(meta.name.toLowerCase())} questions — each with the tool that does the heavy lifting.</p>
${foldedHtml}` : '';

  return renderHead({
    title: `${meta.name} guides — DeftBrain`,
    description: meta.desc,
    canonicalPath: `/guides/${catKey}`,
    extraStyle: `
      .hub-topic { margin: 2.2rem 0; padding-bottom: 1.4rem; border-bottom: 1px solid #e5e2da; }
      .hub-topic h3 { font-size: 1.15rem; margin-bottom: .4rem; }
      .hub-topic-steps { margin: .6rem 0 0 1.2rem; }
      .hub-topic-steps li { margin: .25rem 0; }
      .hub-topic-cta { margin-top: .6rem; font-size: .95rem; }
      .hub-topic-more { margin-top: .7rem; font-size: .95rem; font-weight: 500; }
      .hub-topic h3 a { color: inherit; text-decoration: none; }
      .hub-topic h3 a:hover { text-decoration: underline; }`,
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

      <div class="section-rule"><span>${kept.length} guide${kept.length === 1 ? '' : 's'}</span></div>

      <ul class="cat-guides-list">
${listHtml}
      </ul>
${foldedBlock}
      <p class="index-outro">Looking for something different? See <a href="/guides">all guides</a> or <a href="/guides/by-tool">browse by tool</a>.</p>

    </div>
  </main>
${renderFooter()}`;
}

function main() {
  console.log('📑  Building guides indexes...');
  const specs = loadSpecs();
  if (!specs.length) { console.warn('  ⚠ No specs found.'); return; }
  const keepSet = KEEP_SET;

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // Main index — editorial homepage (2026-09-22 redesign)
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), renderGuidesHome(specs), 'utf8');
  console.log(`  ✓ build/guides/index.html — guides homepage`);

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
      renderCategoryPage(catKey, meta, guidesInCat, keepSet),
      'utf8'
    );
    catCount++;
  }
  console.log(`  ✓ ${catCount} per-category index pages`);

  const keptCount = specs.filter(sp => keepSet.has(`${sp.category}/${sp.slug}`)).length;
  console.log(`  ✓ ${specs.length} guides indexed (${keptCount} kept as standalone pages, ${specs.length - keptCount} consolidated into hubs)`);
}

try {
  main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
