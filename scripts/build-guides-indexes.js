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
const { GA_SNIPPET } = require('./lib/gaSnippet');

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

// ── Guides homepage — editorial front page (2026-09-22) ────────────────────
// Owner supplied a full redesign: hero+search, 6 curated "door" entry
// points, 2 featured picks, 5 curiosity picks, then a live searchable
// library of all 552 guides. Ported the design in; the DATA underneath is
// generated fresh from `specs`/KEEP_SET every build, same as the rest of
// this script — the supplied file had all of it baked into one static JSON
// blob, which drifts the moment a guide is added, renamed, or moves between
// kept/consolidated (audit/REWRITE-INSTALL-KIT.md: "a supplied rewrite is a
// draft, not a patch"). Only the EDITORIAL CHOICES below are hardcoded —
// which raw categories group into which door, and which specific guides are
// featured/curiosity picks — the same hardcoded-groupings pattern
// CATEGORY_META itself already uses for GROUP_ORDER.

// Six broad entry points, each grouping several of the 18 raw categories.
// Copy and grouping as supplied.
const DOOR_GROUPS = [
  { mark: '01', name: 'Money & Decisions',       desc: "Spend, compare, negotiate, and make choices with fewer surprises.", categories: ['money', 'decisions'] },
  { mark: '02', name: 'Home & Everyday Life',     desc: "Renting, repairs, cooking, pets, travel, and the practical stuff nobody hands you a manual for.", categories: ['home', 'practical', 'cooking', 'pets', 'travel'] },
  { mark: '03', name: 'Health & Care',            desc: "Understand appointments, questions, care decisions, and the language around your health.", categories: ['health', 'wellness'] },
  { mark: '04', name: 'People & Communication',   desc: "Relationships, conflict, apologies, boundaries, and conversations that are hard to get right.", categories: ['conversations', 'apologies'] },
  { mark: '05', name: 'Work & Career',            desc: "Jobs, meetings, presentations, workplace language, and professional decisions.", categories: ['career', 'workplace', 'meetings', 'presentations', 'speeches'] },
  { mark: '06', name: 'Learning & Planning',      desc: "Learn faster, organize what matters, and make sense of unfamiliar territory.", categories: ['learning', 'planning'] },
];

// Editorial picks name WHICH guides — every rendered detail (title, href,
// description) comes from the live spec at build time, so a rename or a
// kept/consolidated flip is picked up automatically instead of going stale.
const FEATURED_PICKS = [
  { category: 'health',    slug: 'how-to-get-a-second-opinion' },
  { category: 'decisions', slug: 'how-to-think-through-a-job-offer-when-youre-torn' },
];
const CURIOSITY_PICKS = [
  { category: 'wellness',  slug: 'why-do-i-dream-about-people-i-havent-seen-in-years' },
  { category: 'practical', slug: 'why-do-my-bike-brakes-squeak' },
  { category: 'workplace', slug: 'what-does-per-my-last-email-mean' },
  { category: 'travel',    slug: 'is-a-90-minute-layover-long-enough' },
  { category: 'home',      slug: 'how-to-tell-if-a-plant-is-overwatered-or-underwatered' },
];

// Kept guides have their own standalone page; consolidated ones render as an
// anchored section on their category hub (see renderCategoryPage) — same
// rule both places, kept in one function so it can't drift between them.
function hrefFor(spec, keepSet) {
  return keepSet.has(`${spec.category}/${spec.slug}`)
    ? `/guides/${spec.category}/${spec.slug}`
    : `/guides/${spec.category}#${spec.slug}`;
}

// Editorial picks reference a real guide by category+slug rather than a
// baked href/title/description — this is what makes that safe: a pick whose
// guide was renamed or removed is skipped with a warning instead of
// rendering (or silently shipping) a broken link.
function findPick(specs, pick, label) {
  const spec = specs.find(s => s.category === pick.category && s.slug === pick.slug);
  if (!spec) console.warn(`  ⚠ guides-home: ${label} pick not found, skipped — ${pick.category}/${pick.slug}`);
  return spec;
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
function renderHead({ title, description, canonicalPath, extraStyle = '' }) {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${GA_SNIPPET}

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
    .tool-section:last-child { border-bottom: none; }
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

  <header class="masthead">
    <a href="/" class="masthead-logo" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="DeftBrain" class="masthead-logo-img" height="96" style="width:auto;height:96px;object-fit:contain;">
      <span class="masthead-logo-word">
        <span class="masthead-logo-text">Deft<span>Brain</span></span>
        <span class="masthead-logo-tag"><b>deft</b> <i>(adj.)</i> — skillful, nimble, clever.</span>
      </span>
    </a>
    <a href="/tools" class="masthead-cta">All tools →</a>
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

function renderGuidesHome(specs, keepSet) {
  const categoryCounts = {};
  for (const spec of specs) categoryCounts[spec.category] = (categoryCounts[spec.category] || 0) + 1;

  const doorHtml = DOOR_GROUPS.map(door => {
    const count = door.categories.reduce((sum, cat) => sum + (categoryCounts[cat] || 0), 0);
    return `<button class="gh-door" type="button" data-categories="${escHtml(door.categories.join(','))}">
          <span class="gh-door-mark">${door.mark}</span>
          <h3>${escHtml(door.name)}</h3>
          <p>${escHtml(door.desc)}</p>
          <span class="gh-door-link">Explore ${count} guide${count === 1 ? '' : 's'} →</span>
        </button>`;
  }).join('\n        ');

  const [featureMainPick, featureSecondaryPick] = FEATURED_PICKS.map((p, i) => findPick(specs, p, `featured #${i + 1}`));
  const featureMainHtml = featureMainPick ? `<a class="gh-feature-card gh-feature-main" href="${escHtml(hrefFor(featureMainPick, keepSet))}">
            <span class="gh-feature-eyebrow">${escHtml(CATEGORY_META[featureMainPick.category]?.name || featureMainPick.category)}</span>
            <h3>${escHtml(featureMainPick.title)}</h3>
            <p>${escHtml(featureMainPick.description || '')}</p>
            <span class="gh-read-link">Read guide →</span>
          </a>` : '';
  const featureSecondaryHtml = featureSecondaryPick ? `<a class="gh-feature-card" href="${escHtml(hrefFor(featureSecondaryPick, keepSet))}">
            <span class="gh-feature-eyebrow">${escHtml(CATEGORY_META[featureSecondaryPick.category]?.name || featureSecondaryPick.category)}</span>
            <h3>${escHtml(featureSecondaryPick.title)}</h3>
            <p>${escHtml(featureSecondaryPick.description || '')}</p>
            <span class="gh-read-link">Read guide →</span>
          </a>` : '';

  const curiosityHtml = CURIOSITY_PICKS
    .map((p, i) => findPick(specs, p, `curiosity #${i + 1}`))
    .filter(Boolean)
    .map(spec => `<a class="gh-curiosity-card" href="${escHtml(hrefFor(spec, keepSet))}">
          <span class="gh-feature-eyebrow">${escHtml(CATEGORY_META[spec.category]?.name || spec.category)}</span>
          <h3>${escHtml(spec.title)}</h3>
          <span>Take a look →</span>
        </a>`).join('\n        ');

  // Alphabetical, not GROUP_ORDER — this is a flat scanning list, not the
  // grouped editorial page renderByCategory used to be.
  const categoryPanelHtml = Object.entries(CATEGORY_META)
    .filter(([catKey]) => categoryCounts[catKey])
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([catKey, meta]) => `<button type="button" data-cat="${escHtml(catKey)}">${escHtml(meta.name)} <span>${categoryCounts[catKey]}</span></button>`)
    .join('');

  const guidesData = JSON.stringify(specs.map(spec => ({
    slug: spec.slug,
    category: spec.category,
    categoryLabel: CATEGORY_META[spec.category]?.name || spec.category,
    title: spec.title,
    description: spec.description || '',
    href: hrefFor(spec, keepSet),
  })));

  return renderHead({
    title: 'Guides for Everyday Life | DeftBrain',
    description: 'Clear, practical DeftBrain guides for everyday questions about money, health, home, relationships, work, travel, and more.',
    canonicalPath: '/guides',
    extraStyle: GUIDES_HOME_STYLE,
  }) + `

  <main class="gh-page">
    <section class="gh-hero gh-shell">
      <p class="gh-kicker">DEFTBRAIN GUIDES</p>
      <h1>Guides for everyday life.</h1>
      <p class="gh-hero-deck">Clear explanations for the things nobody teaches you.</p>
      <p class="gh-hero-sub">Money, health, home, relationships, technology, work, and all the other things you're somehow expected to know.</p>
      <form class="gh-hero-search" id="heroSearch">
        <label for="q">What would you like to understand?</label>
        <div class="gh-search-box">
          <input id="q" autocomplete="off" placeholder="Try &ldquo;security deposit,&rdquo; &ldquo;medical bill,&rdquo; or &ldquo;talking to my boss&rdquo;&hellip;">
          <button type="submit">Find guides</button>
        </div>
      </form>
    </section>

    <section class="gh-section gh-shell">
      <div class="gh-section-head">
        <div><p class="gh-kicker">EXPLORE</p><h2>Where should we start?</h2></div>
        <p>Pick an area, or just wander. You don't need to know the right category first.</p>
      </div>
      <div class="gh-door-grid">
        ${doorHtml}
      </div>
    </section>

    <section class="gh-section gh-feature-section">
      <div class="gh-shell">
        <div class="gh-section-head">
          <div><p class="gh-kicker">WORTH KNOWING</p><h2>A few good places to begin.</h2></div>
          <p>Useful ideas, explained without making them harder than they need to be.</p>
        </div>
        <div class="gh-feature-grid">
          ${featureMainHtml}
          ${featureSecondaryHtml}
        </div>
      </div>
    </section>

    <section class="gh-section gh-shell">
      <div class="gh-section-head">
        <div><p class="gh-kicker">DISCOVER</p><h2>Things you might be glad you know.</h2></div>
        <p>Not everything useful starts with a search.</p>
      </div>
      <div class="gh-curiosity-row">
        ${curiosityHtml}
      </div>
    </section>

    <section class="gh-library gh-section" id="library">
      <div class="gh-shell">
        <div class="gh-library-intro">
          <p class="gh-kicker">THE LIBRARY</p>
          <h2>Browse all ${specs.length} guides.</h2>
          <p>Search a situation, choose a subject, or browse alphabetically.</p>
        </div>
        <div class="gh-sticky-controls">
          <div class="gh-library-search">
            <input id="libraryQ" placeholder="Search guides…">
            <button id="clearSearch" type="button" aria-label="Clear search">×</button>
          </div>
          <button class="gh-filter-toggle" id="filterToggle" type="button">All subjects ▾</button>
          <button class="gh-sort-toggle active" id="sortAZ" type="button">A–Z</button>
        </div>
        <div class="gh-category-panel" id="categoryPanel">
          <button type="button" data-cat="all" class="active">All <span>${specs.length}</span></button>
          ${categoryPanelHtml}
        </div>
        <p class="gh-result-note" id="resultNote"></p>
        <div class="gh-guide-list" id="guideList"></div>
        <button class="gh-load-more" id="loadMore" type="button">Show more guides</button>
        <p class="gh-by-tool-note">Prefer to browse by tool instead? <a href="/guides/by-tool">See every guide grouped by tool →</a></p>
      </div>
    </section>

    <section class="gh-tool-bridge">
      <div class="gh-shell gh-bridge-inner">
        <div><p class="gh-kicker">READY TO DO SOMETHING ABOUT IT?</p><h2>Understanding is the start. DeftBrain tools help with the next step.</h2></div>
        <a href="/tools">Explore tools →</a>
      </div>
    </section>

    <section class="gh-final-search gh-shell">
      <h2>Still wondering about something?</h2>
      <p>Describe what you're curious about. We'll look through the whole guide library.</p>
      <form id="bottomSearch">
        <input placeholder="Why does my mechanic always…">
        <button type="submit">Find a guide →</button>
      </form>
    </section>
  </main>

  <script>window.DEFT_GUIDES=${guidesData};</script>
  <script>
  (()=>{
    const all=window.DEFT_GUIDES||[];
    const list=document.querySelector('#guideList');
    const q=document.querySelector('#libraryQ');
    const note=document.querySelector('#resultNote');
    const load=document.querySelector('#loadMore');
    const panel=document.querySelector('#categoryPanel');
    const toggle=document.querySelector('#filterToggle');
    let cat='all',shown=36;
    const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ');
    function matches(g){
      const query=norm(q.value).trim();
      const inCat=cat==='all'||g.category===cat;
      if(!inCat)return false;
      if(!query)return true;
      const hay=norm([g.title,g.description,g.categoryLabel].join(' '));
      const words=query.split(/\\s+/).filter(Boolean);
      return hay.includes(query)||words.every(w=>hay.includes(w));
    }
    function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function render(reset=false){
      if(reset)shown=36;
      const arr=all.filter(matches).sort((a,b)=>a.title.replace(/^The /i,'').localeCompare(b.title.replace(/^The /i,'')));
      list.innerHTML=arr.slice(0,shown).map(g=>\`<a class="gh-guide-item" id="\${g.slug}" href="\${g.href}"><span class="gh-cat">\${esc(g.categoryLabel)}</span><h3>\${esc(g.title)}</h3><p>\${esc(g.description||'')}</p></a>\`).join('');
      note.textContent=\`\${arr.length} guide\${arr.length===1?'':'s'}\${q.value.trim()?' matching "'+q.value.trim()+'"':''}\`;
      load.style.display=arr.length>shown?'block':'none';
    }
    q.addEventListener('input',()=>render(true));
    document.querySelector('#clearSearch').onclick=()=>{q.value='';q.focus();render(true)};
    toggle.onclick=()=>panel.classList.toggle('open');
    panel.addEventListener('click',e=>{
      const b=e.target.closest('[data-cat]');
      if(!b)return;
      cat=b.dataset.cat;
      panel.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));
      toggle.textContent=(cat==='all'?'All subjects':b.childNodes[0].textContent.trim())+' ▾';
      panel.classList.remove('open');
      render(true);
    });
    load.onclick=()=>{shown+=36;render()};
    function sendSearch(input){
      const v=input.value.trim();
      q.value=v;
      document.querySelector('#library').scrollIntoView({behavior:'smooth'});
      render(true);
      setTimeout(()=>q.focus(),450);
    }
    document.querySelector('#heroSearch').onsubmit=e=>{e.preventDefault();sendSearch(document.querySelector('#q'))};
    document.querySelector('#bottomSearch').onsubmit=e=>{e.preventDefault();sendSearch(e.currentTarget.querySelector('input'))};
    document.querySelectorAll('.gh-door').forEach(d=>d.onclick=()=>{
      const cs=d.dataset.categories.split(',');
      cat='__group__';
      q.value='';
      const arr=all.filter(g=>cs.includes(g.category)).sort((a,b)=>a.title.localeCompare(b.title));
      shown=36;
      list.innerHTML=arr.slice(0,shown).map(g=>\`<a class="gh-guide-item" href="\${g.href}"><span class="gh-cat">\${esc(g.categoryLabel)}</span><h3>\${esc(g.title)}</h3><p>\${esc(g.description||'')}</p></a>\`).join('');
      note.textContent=\`\${arr.length} guides in this area\`;
      load.style.display='none';
      document.querySelector('#library').scrollIntoView({behavior:'smooth'});
    });
    render(true);
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
      <p class="index-outro">Looking for a guide on a topic instead? Switch to the <a href="/guides">by-category view</a>.</p>

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
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), renderGuidesHome(specs, keepSet), 'utf8');
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
