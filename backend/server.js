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
// Reads canonical IDs from prerendered build/ subdirectories in production
// (src/ is not deployed to Railway). Falls back to parsing tools.js in dev.
// Redirects /namestorm → /NameStorm, /plantrescue → /PlantRescue, etc.
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

app.use((req, res, next) => {
  // Only apply to non-API, non-static asset paths
  if (req.path.startsWith('/api') || req.path.includes('.')) return next();
  const slug = req.path.slice(1); // strip leading /
  if (!slug) return next();       // skip homepage
  const canonical = toolIdMap[slug.toLowerCase()];
  if (canonical && canonical !== slug) {
    return res.redirect(301, `/${canonical}`);
  }
  next();
});

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
    // Strip leading slash and trailing slash, then look up canonical ID
    const slug = req.path.replace(/^\/|\/$/g, '');
    const canonical = slug ? toolIdMap[slug.toLowerCase()] : null;
    if (canonical) {
      const prerendered = path.join(__dirname, '..', 'build', canonical, 'index.html');
      const exists = fs.existsSync(prerendered);
      console.log(`[serve] slug="${slug}" canonical="${canonical}" exists=${exists}`);
      if (exists) return res.sendFile(prerendered);
    } else if (slug) {
      console.log(`[serve] slug="${slug}" not in toolIdMap`);
    }
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
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
