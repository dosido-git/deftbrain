// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { anthropic } = require('./lib/claude');
const { rateLimit, DEFAULT_LIMITS, DIVERSION_LIMITS } = require('./lib/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Middleware ──
app.use(cors(
  IS_PRODUCTION
    ? { origin: ['https://deftbrain.com', 'https://www.deftbrain.com'] }
    : {}
));
app.use(express.json({ limit: '50mb' }));

// ── HTTPS redirect (production) ──
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// ── Redirect www → apex ──
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.hostname.startsWith('www.')) {
      return res.redirect(301, `https://deftbrain.com${req.url}`);
    }
    next();
  });
}

// ── Tool ID map (used by renamed, legacy, and case-insensitive redirects) ──
const fs = require('fs');
const toolIdMap = {};
try {
  const buildDir = path.join(__dirname, '..', 'build');
  if (fs.existsSync(buildDir)) {
    fs.readdirSync(buildDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .forEach(d => { toolIdMap[d.name.toLowerCase()] = d.name; });
    console.log(`Tool ID map loaded from build/: ${Object.keys(toolIdMap).length} tools`);
  } else {
    const toolsContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'tools.js'), 'utf8');
    const idRegex = /\bid:\s*['"]([^'"]*)['"]/g;
    let m;
    while ((m = idRegex.exec(toolsContent)) !== null) {
      if (m[1]) toolIdMap[m[1].toLowerCase()] = m[1];
    }
    console.log(`Tool ID map loaded from tools.js: ${Object.keys(toolIdMap).length} tools`);
  }
} catch (e) {
  console.warn('Could not load tool ID map:', e.message);
}

// ── Renamed tool redirects (301 permanent — preserves SEO equity) ──
// Keys are lowercase for case-insensitive matching.
// Add future renames here: '/oldtoolname': '/NewToolName'
const RENAMED_TOOLS = {
  '/whatifmachine':         '/WhatIf',
  '/plothole':              '/PlotTwist',
  '/roommatecourtroom':     '/RoommateCourt',
  '/fridgealchemy':         '/MiseEnPlace',
  '/foodswap':              '/MiseEnPlace',
  '/pdf-fixer':             '/PlainTalk',
  '/timevanishingexplainer':'/WhereDidTheTimeGo',
  '/wherediditgo':          '/WhereDidTheTimeGo',
  '/sayitright':            '/PronounceItRight',
};
app.use((req, res, next) => {
  const redirect = RENAMED_TOOLS[req.path.toLowerCase()];
  if (redirect) return res.redirect(301, redirect);
  next();
});

// ── Legacy /tool/kebab-case → /PascalCase redirect ──
// Handles old URL format e.g. /tool/renters-deposit-saver → /RentersDepositSaver
app.use((req, res, next) => {
  if (!req.path.startsWith('/tool/')) return next();
  const kebab = req.path.slice(6); // strip '/tool/'
  const pascal = kebab
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  const canonical = toolIdMap[pascal.toLowerCase()];
  if (canonical) return res.redirect(301, `/${canonical}`);
  next();
});

// ── Security headers (production) ──
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// ── Rate limiting ──
// Apply default rate limit to all API POST routes (the ones that call Claude)
app.use('/api', (req, res, next) => {
  // Only rate-limit POST requests (the ones that cost money)
  if (req.method !== 'POST') return next();
  rateLimit(DEFAULT_LIMITS)(req, res, next);
});

// ── Case-insensitive tool route redirect ──
// Redirects /namestorm → /NameStorm, /plantrescue → /PlantRescue, etc.
app.use((req, res, next) => {
  // Only apply to non-API, non-static asset paths
  if (req.path.startsWith('/api') || req.path.includes('.')) return next();
  const slug = req.path.slice(1).replace(/\/$/, ''); // strip leading / and trailing /
  if (!slug) return next();       // skip homepage
  const canonical = toolIdMap[slug.toLowerCase()];
  if (canonical && canonical !== slug) {
    return res.redirect(301, `/${canonical}`);
  }
  next();
});

// ── Tool metadata map (for OG tag injection) ──
const toolMeta = {};   // id → { title, tagline, icon, slug }
const ogSlugMap = {};  // id → kebab-slug
try {
  // Load slug map from public/og/slug-map.json if available
  const slugMapPath = path.join(__dirname, '..', 'build', 'og', 'slug-map.json');
  if (fs.existsSync(slugMapPath)) {
    Object.assign(ogSlugMap, JSON.parse(fs.readFileSync(slugMapPath, 'utf8')));
  }
  // Parse tool metadata from tools.js (available in dev) or derive from toolIdMap
  const toolsPath = path.join(__dirname, '..', 'src', 'data', 'tools.js');
  if (fs.existsSync(toolsPath)) {
    const src = fs.readFileSync(toolsPath, 'utf8');
    const blocks = src.split(/\n\{[\s\n]*\n?\s*modified:/);
    for (const block of blocks.slice(1)) {
      const id  = (block.match(/\bid:\s*['"]([^'"]+)['"]/)  || [])[1];
      const title   = (block.match(/title:\s*['"]([^'"]+)['"]/)   || [])[1];
      const tagline = (block.match(/tagline:\s*['"]([^'"]+)['"]/) || [])[1];
      const icon    = (block.match(/icon:\s*['"]([^'"]+)['"]/)    || [])[1];
      if (id && title) {
        const slug = ogSlugMap[id] || id.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase();
        toolMeta[id] = { title, tagline, icon, slug };
      }
    }
    console.log(`Tool metadata loaded: ${Object.keys(toolMeta).length} tools`);
  }
} catch (e) {
  console.warn('Could not load tool metadata:', e.message);
}

// ── OG tag injector ──
const BASE_URL = 'https://deftbrain.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og/default.png`;

function injectOgTags(html, toolId) {
  const meta = toolId ? toolMeta[toolId] : null;
  const title    = meta ? `${meta.title} | DeftBrain` : 'DeftBrain — Intelligence on Demand';
  const desc     = meta?.tagline || 'DeftBrain offers 100+ free AI-powered tools for productivity, communication, health, finance, and more.';
  const imgUrl   = meta ? `${BASE_URL}/og/${meta.slug}.png` : DEFAULT_OG_IMAGE;
  const pageUrl  = meta ? `${BASE_URL}/${toolId}` : BASE_URL;

  const tags = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${imgUrl}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="DeftBrain" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${imgUrl}" />`,
  ].join('\n    ');

  return html.replace('</head>', `  <!-- OG: ${toolId || 'default'} -->\n    ${tags}\n  </head>`);
}

// ── Startup diagnostics ──
console.log('📁 Current directory:', __dirname);
console.log('🔑 API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES ✓' : 'NO ✗');
console.log('🌍 Environment:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');

// ── Quick health-check / test endpoint ──
app.get('/api/test', async (req, res) => {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello!' }]
    });
    res.json({ success: true, response: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Mount all tool routes from /routes directory ──
const routes = require('./routes');
app.use('/api', routes);

// ── Dynamic endpoint listing ──
app.get('/api/endpoints', (req, res) => {
  const routeList = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routeList.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routeList.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: '/api' + handler.route.path,
          });
        }
      });
    }
  });
  res.json({ endpoints: routeList, count: routeList.length });
});

// ── Serve React build (production) ──
if (IS_PRODUCTION) {
  app.use(express.static(path.join(__dirname, '..', 'build')));
  app.get('*', (req, res) => {
    const slug = req.path.replace(/^\/|\/$/g, '');
    const canonical = slug ? toolIdMap[slug.toLowerCase()] : null;
    const htmlPath = canonical && fs.existsSync(path.join(__dirname, '..', 'build', canonical, 'index.html'))
      ? path.join(__dirname, '..', 'build', canonical, 'index.html')
      : path.join(__dirname, '..', 'build', 'index.html');
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(injectOgTags(html, canonical || null));
    } catch (e) {
      res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    }
  });
}

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Hit /api/endpoints for a full route listing\n`);
});
