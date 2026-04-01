'use strict';

// src/seo/PageTemplate.js
// Pure function: takes a content record, returns a complete HTML string.
// No React, no dependencies — runs at build time via generatePages.js.

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Strip HTML escaping for JSON-LD where we control the surrounding context
const escJson = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');

function renderStep(step, index) {
  return `
      <div class="step">
        <div class="step-num">${index + 1}</div>
        <div class="step-body">
          <h3>${esc(step.heading)}</h3>
          <p>${esc(step.body)}</p>
        </div>
      </div>`;
}

function renderCallout(callout) {
  if (!callout) return '';
  return `
      <div class="callout">
        <div class="callout-label">${esc(callout.label)}</div>
        <p class="say">${esc(callout.quote)}</p>
        ${callout.note ? `<p class="callout-note">${esc(callout.note)}</p>` : ''}
      </div>`;
}

function PageTemplate(record) {
  const {
    slug,
    tool_id,
    tool_title        = 'Difficult Talk Coach',
    tool_url,
    category          = 'general',
    category_label    = 'General',
    title,
    meta_description,
    lede              = '',
    steps             = [],
    callout           = null,
    callout_after_step = 1,
    cta_headline      = `Practice this conversation before it happens`,
    cta_description   = `Get exact scripts, predicted responses, and live practice for your specific situation.`,
    cta_features      = [],
    related           = [],
    modified          = ''
  } = record;

  const canonicalUrl = `https://deftbrain.com/guides/${category}/${slug}`;
  const toolHref     = tool_url || `/tool/${tool_id}`;

  // Lede: split on double newline → multiple <p> tags
  const ledeParagraphs = lede
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `      <p class="lede">${esc(p)}</p>`)
    .join('\n');

  // Steps with optional callout spliced in
  const stepBlocks = [];
  steps.forEach((step, i) => {
    stepBlocks.push(renderStep(step, i));
    if (callout && i === callout_after_step) {
      stepBlocks.push(renderCallout(callout));
    }
  });
  // If callout_after_step is beyond step count, append it at the end
  if (callout && callout_after_step >= steps.length) {
    stepBlocks.push(renderCallout(callout));
  }

  // CTA features
  const featuresHtml = cta_features
    .map(f => `          <span class="cta-feature">${esc(f)}</span>`)
    .join('\n');

  // Related cards
  const relatedHtml = related
    .map(r => `
        <a href="/guides/${esc(r.category)}/${esc(r.slug)}" class="related-card">
          <div class="rel-cat">${esc(r.category_label || r.category)}</div>
          <div class="rel-title">${esc(r.title)}</div>
        </a>`)
    .join('');

  // JSON-LD HowTo schema
  const schemaSteps = steps
    .map(s => `{"@type":"HowToStep","name":"${escJson(s.heading)}","text":"${escJson(s.body.slice(0, 250))}"}`)
    .join(',');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(title)}</title>
  <meta name="description" content="${esc(meta_description)}">
  <link rel="canonical" href="${canonicalUrl}">

  <meta property="og:type"        content="article">
  <meta property="og:title"       content="${esc(title)}">
  <meta property="og:description" content="${esc(meta_description)}">
  <meta property="og:url"         content="${canonicalUrl}">
  <meta property="og:site_name"   content="DeftBrain">
  ${modified ? `<meta property="article:modified_time" content="${esc(modified)}">` : ''}

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "${escJson(title)}",
    "description": "${escJson(meta_description)}",
    "step": [${schemaSteps}]
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink:    #1a1816;
      --ink2:   #3d3a36;
      --ink3:   #6b6760;
      --paper:  #f7f4ef;
      --warm:   #f0ebe2;
      --accent: #c94f2c;
      --accent2:#e8935e;
      --rule:   #e0dbd2;
      --max:    720px;
      --col:    clamp(16px, 4vw, 24px);
    }

    body {
      background: var(--paper);
      color: var(--ink);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      line-height: 1.75;
      min-height: 100vh;
    }

    .masthead {
      border-bottom: 1px solid var(--rule);
      padding: 14px var(--col);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .masthead-logo {
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      font-size: 15px;
      color: var(--ink);
      text-decoration: none;
      letter-spacing: .03em;
    }
    .masthead-logo span { color: var(--accent); }
    .masthead-cta {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: var(--ink3);
      text-decoration: none;
      border-bottom: 1px solid var(--rule);
      padding-bottom: 1px;
      transition: color .15s, border-color .15s;
    }
    .masthead-cta:hover { color: var(--accent); border-color: var(--accent2); }

    .container {
      max-width: var(--max);
      margin: 0 auto;
      padding: 0 var(--col);
    }

    .eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 48px 0 20px;
    }
    .tag {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .09em;
      text-transform: uppercase;
      color: var(--accent);
      white-space: nowrap;
    }
    .eyebrow-rule { flex: 1; height: 1px; background: var(--rule); }

    h1 {
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      font-size: clamp(32px, 6vw, 52px);
      line-height: 1.1;
      letter-spacing: -.02em;
      color: var(--ink);
      margin-bottom: 24px;
    }
    h1 em { font-style: italic; color: var(--accent); }

    .deck {
      font-size: clamp(16px, 2.2vw, 19px);
      font-weight: 300;
      color: var(--ink2);
      line-height: 1.65;
      border-left: 3px solid var(--accent2);
      padding-left: 18px;
      margin-bottom: 40px;
    }

    .lede {
      font-size: clamp(16px, 2vw, 18px);
      font-weight: 300;
      line-height: 1.8;
      color: var(--ink2);
      margin-bottom: 20px;
    }

    .section-rule {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 40px 0 32px;
    }
    .section-rule span {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--ink3);
      white-space: nowrap;
    }
    .section-rule::before,
    .section-rule::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--rule);
    }

    h2 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(20px, 3vw, 26px);
      font-weight: 700;
      line-height: 1.25;
      color: var(--ink);
      margin-bottom: 12px;
    }

    .step {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 0 16px;
      margin-bottom: 32px;
      align-items: start;
    }
    .step-num {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--accent2);
      line-height: 1;
      padding-top: 3px;
      opacity: .5;
    }
    .step-body h3 {
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      font-size: 16px;
      color: var(--ink);
      margin-bottom: 6px;
      letter-spacing: .01em;
    }
    .step-body p {
      font-size: 15px;
      color: var(--ink2);
      line-height: 1.7;
    }

    .callout {
      background: var(--warm);
      border: 1px solid var(--rule);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      padding: 20px 24px;
      margin: 32px 0;
    }
    .callout-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 8px;
    }
    .callout .say {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 17px;
      color: var(--ink);
      line-height: 1.55;
    }
    .callout-note {
      margin-top: 10px;
      font-size: 15px;
      font-weight: 300;
      color: var(--ink2);
      line-height: 1.7;
    }

    .cta-block {
      background: var(--ink);
      border-radius: 12px;
      padding: clamp(28px, 5vw, 48px) clamp(24px, 5vw, 48px);
      margin: 48px 0;
      position: relative;
      overflow: hidden;
    }
    .cta-block::before {
      content: '🗣';
      position: absolute;
      right: 32px; top: 28px;
      font-size: 64px;
      opacity: .07;
    }
    .cta-block .cta-eyebrow {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--accent2);
      margin-bottom: 12px;
    }
    .cta-block h2 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(22px, 3.5vw, 30px);
      color: #f7f4ef;
      margin-bottom: 12px;
    }
    .cta-block p {
      font-size: 15px;
      font-weight: 300;
      color: #a8a39a;
      line-height: 1.7;
      max-width: 480px;
      margin-bottom: 24px;
    }
    .cta-features {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 28px;
    }
    .cta-feature {
      font-size: 12px;
      font-weight: 400;
      color: #c8c3ba;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 99px;
      padding: 4px 12px;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: .02em;
      padding: 13px 24px;
      border-radius: 6px;
      transition: background .15s, transform .1s;
    }
    .cta-btn:hover { background: #b04425; transform: translateY(-1px); }
    .cta-subtext {
      display: block;
      margin-top: 12px;
      font-size: 12px;
      color: #6b6760;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin: 16px 0 48px;
    }
    .related-card {
      border: 1px solid var(--rule);
      border-radius: 8px;
      padding: 14px 16px;
      text-decoration: none;
      transition: border-color .12s, background .12s;
    }
    .related-card:hover {
      border-color: var(--accent2);
      background: var(--warm);
    }
    .rel-cat {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--accent2);
      margin-bottom: 5px;
    }
    .rel-title {
      font-size: 13px;
      font-weight: 400;
      color: var(--ink2);
      line-height: 1.45;
    }

    footer {
      border-top: 1px solid var(--rule);
      padding: 24px var(--col);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer-brand {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink3);
      text-decoration: none;
    }
    .footer-brand span { color: var(--accent); }
    .footer-copy { font-size: 12px; color: var(--ink3); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .container > * { animation: fadeUp .5s ease both; }
    .eyebrow      { animation-delay: .05s; }
    h1            { animation-delay: .10s; }
    .deck         { animation-delay: .15s; }
    .lede         { animation-delay: .20s; }
    .section-rule { animation-delay: .25s; }

    @media (max-width: 480px) {
      .step { grid-template-columns: 28px 1fr; }
    }
  </style>
</head>
<body>

  <header class="masthead">
    <a href="https://deftbrain.com" class="masthead-logo">Deft<span>Brain</span></a>
    <a href="https://deftbrain.com" class="masthead-cta">All tools →</a>
  </header>

  <main>
    <div class="container">

      <div class="eyebrow">
        <span class="tag">${esc(category_label)}</span>
        <div class="eyebrow-rule"></div>
      </div>

      <h1>${esc(title)}</h1>

      <p class="deck">${esc(meta_description)}</p>

${ledeParagraphs}

      <div class="section-rule"><span>How to do it</span></div>

${stepBlocks.join('')}

      <div class="cta-block">
        <div class="cta-eyebrow">Try it now — free</div>
        <h2>${esc(cta_headline)}</h2>
        <p>${esc(cta_description)}</p>
        <div class="cta-features">
${featuresHtml}
        </div>
        <a href="${esc(toolHref)}" class="cta-btn">
          Open ${esc(tool_title)} →
        </a>
        <span class="cta-subtext">No account required to get started.</span>
      </div>

      ${related.length ? `
      <div class="section-rule"><span>Related situations</span></div>
      <div class="related-grid">${relatedHtml}
      </div>` : ''}

    </div>
  </main>

  <footer>
    <a href="https://deftbrain.com" class="footer-brand">Deft<span>Brain</span></a>
    <span class="footer-copy">© ${new Date().getFullYear()} DeftBrain · deftbrain.com</span>
  </footer>

</body>
</html>`;
}

module.exports = { PageTemplate };
