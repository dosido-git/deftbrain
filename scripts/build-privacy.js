#!/usr/bin/env node
// ============================================================
// scripts/build-privacy.js
// ============================================================
// Renders docs/PRIVACY.md → public/privacy.html
//
// Visually consistent with guide pages: same masthead, same
// footer (via chrome.js), same Google Fonts, same shared
// guide.css. Adds a small inline style block scoped under
// `.prose` to handle the prose-specific elements (paragraphs,
// lists, tables) that guide.css doesn't style by default.
//
// Usage:
//   node scripts/build-privacy.js
//
// Re-run any time docs/PRIVACY.md changes. Commit the
// generated HTML alongside the source — same convention
// as the guides.
//
// Dependencies:
//   marked  (npm install marked --save-dev)
// ============================================================

const fs = require('fs');
const path = require('path');
const { getFooterHTML } = require('../src/seo/chrome');

let marked;
try {
  ({ marked } = require('marked'));
} catch (err) {
  console.error('✗ marked is not installed. Run: npm install marked --save-dev');
  process.exit(1);
}

const ROOT   = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs', 'PRIVACY.md');
const OUTPUT = path.join(ROOT, 'public', 'privacy.html');

if (!fs.existsSync(SOURCE)) {
  console.error(`✗ Source not found: ${SOURCE}`);
  process.exit(1);
}

const md = fs.readFileSync(SOURCE, 'utf8');
const bodyHtml = marked.parse(md, { gfm: true, headerIds: false, mangle: false });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Privacy Policy | DeftBrain</title>
  <meta name="description" content="DeftBrain's privacy policy — what we collect, what we don't, and who else is involved when you use our tools.">
  <link rel="canonical" href="https://deftbrain.com/privacy">

  <meta property="og:type"        content="website">
  <meta property="og:title"       content="Privacy Policy | DeftBrain">
  <meta property="og:description" content="What we collect, what we don't, and who else is involved when you use our tools.">
  <meta property="og:url"         content="https://deftbrain.com/privacy">
  <meta property="og:site_name"   content="DeftBrain">

  <meta name="twitter:card"        content="summary">
  <meta name="twitter:title"       content="Privacy Policy | DeftBrain">
  <meta name="twitter:description" content="What we collect, what we don't, and who else is involved when you use our tools.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/guides/guide.css">

  <style>
    /* Prose-only overrides scoped to the privacy page.
       Specificity (.prose el) wins over guide.css element rules. */
    .prose h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 2.4rem;
      line-height: 1.15;
      margin: 0 0 1rem 0;
      color: #1a2e44;
    }
    .prose h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-weight: 700;
      font-size: 1.55rem;
      line-height: 1.25;
      margin: 2.5rem 0 0.8rem 0;
      color: #1a2e44;
    }
    .prose h3 {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-weight: 500;
      font-size: 1.15rem;
      margin: 1.8rem 0 0.5rem 0;
      color: #1a2e44;
    }
    .prose p {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1.05rem;
      line-height: 1.7;
      margin: 0 0 1rem 0;
      color: #2c2c2c;
    }
    .prose ul {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1.05rem;
      line-height: 1.7;
      color: #2c2c2c;
      padding-left: 1.5rem;
      margin: 0 0 1rem 0;
    }
    .prose li { margin: 0.4rem 0; }
    .prose a {
      color: #2c4a6e;
      text-decoration: underline;
    }
    .prose a:hover { color: #1a2e44; }
    .prose strong { color: #1a2e44; }
    .prose code {
      font-family: 'SF Mono', Menlo, Consolas, monospace;
      font-size: 0.92em;
      background: #f5f1ea;
      padding: 0.1em 0.35em;
      border-radius: 3px;
      color: #1a2e44;
    }
    .prose hr {
      border: 0;
      border-top: 1px solid #e8e1d5;
      margin: 2.5rem 0;
    }
    .prose table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.97rem;
    }
    .prose th, .prose td {
      text-align: left;
      padding: 0.6rem 0.8rem;
      border-bottom: 1px solid #e8e1d5;
    }
    .prose th {
      background: #faf8f5;
      font-weight: 500;
      color: #1a2e44;
    }
    .prose em { font-style: italic; color: #5a544a; }
  </style>
</head>
<body>

  <header class="masthead">
    <a href="/" class="masthead-logo" aria-label="DeftBrain — home">
      <img src="/pBrain-r.png" alt="" class="masthead-logo-img" height="96" style="width:auto;height:96px;object-fit:contain;">
      <span class="masthead-logo-text">Deft<span>Brain</span></span>
    </a>
    <a href="/" class="masthead-cta">All tools →</a>
  </header>

  <main>
    <div class="container prose">
${bodyHtml}
    </div>
  </main>

${getFooterHTML()}

</body>
</html>
`;

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, html);
console.log(`✓ ${path.relative(ROOT, OUTPUT)}`);
