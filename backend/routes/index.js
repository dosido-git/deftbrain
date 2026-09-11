// backend/routes/index.js
// Auto-discovers and mounts all route files in this directory.
// Each file exports an Express Router; routes are mounted under /api.

const express = require('express');
const fs = require('fs');
const path = require('path');
const { enterRouteStandard } = require('../lib/outputStandard');

const router = express.Router();

// Read all .js files in this directory (except index.js itself)
const routeDir = __dirname;
const files = fs.readdirSync(routeDir).filter(
  file => file.endsWith('.js') && file !== 'index.js'
);

files.forEach(file => {
  try {
    const routeModule = require(path.join(routeDir, file));
    // A reviewed tool sets `router.outputStandard = 'v2'` in its own file (see
    // PF-39). Every module mounts at '/', so this marker runs immediately
    // before its module and the last write before the matching handler wins.
    // Putting it in scope here rather than at each call site is the whole
    // point: a route's model calls inherit the contract without naming it,
    // including the ones that call anthropic.messages.create directly.
    const declared = routeModule.outputStandard || null;
    // The slug travels with the standard so every model call under this
    // request can attribute its token usage to the tool (see lib/claude.js).
    const slug = file.replace(/\.js$/, '');
    router.use('/', (req, res, next) => { enterRouteStandard(declared, slug); next(); });
    router.use('/', routeModule);
  } catch (err) {
    console.error(`  ❌ Failed to load route ${file}:`, err.message);
  }
});

module.exports = router;
