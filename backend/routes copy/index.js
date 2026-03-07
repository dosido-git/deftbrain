// backend/routes/index.js
// Auto-discovers and mounts all route files in this directory.
// Each file exports an Express Router; routes are mounted under /api.

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Read all .js files in this directory (except index.js itself)
const routeDir = __dirname;
const files = fs.readdirSync(routeDir).filter(
  file => file.endsWith('.js') && file !== 'index.js'
);

files.forEach(file => {
  try {
    const routeModule = require(path.join(routeDir, file));
    router.use('/', routeModule);
    console.log(`  ✅ Loaded route: ${file}`);
  } catch (err) {
    console.error(`  ❌ Failed to load route ${file}:`, err.message);
  }
});

console.log(`\n📡 ${files.length} route files loaded\n`);

module.exports = router;
