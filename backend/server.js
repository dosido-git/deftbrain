// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { anthropic } = require('./lib/claude');
const { rateLimit, DEFAULT_LIMITS, DIVERSION_LIMITS } = require('./lib/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Rate limiting ──
// Apply default rate limit to all API POST routes (the ones that call Claude)
app.use('/api', (req, res, next) => {
  // Only rate-limit POST requests (the ones that cost money)
  if (req.method !== 'POST') return next();
  rateLimit(DEFAULT_LIMITS)(req, res, next);
});

// ── Startup diagnostics ──
console.log('📁 Current directory:', __dirname);
console.log('🔑 API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES ✓' : 'NO ✗');
if (process.env.ANTHROPIC_API_KEY) {
  console.log('🔑 API Key starts with:', process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...');
}

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
      // Direct routes on app
      routeList.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      // Mounted routers
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
