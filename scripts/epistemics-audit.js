#!/usr/bin/env node
// Gate: the epistemic contract must be unbypassable.
//
// It is applied by wrapping anthropic.messages.create inside lib/claude.js, so
// it reaches every route — including the eleven that call create() directly —
// without anyone having to remember it. This check exists to keep that true:
// it fails if a route constructs its own Anthropic client, which would be the
// one way to get a model call that never passes the wrapper.
const fs = require('fs');
const path = require('path');

const ROUTES = path.join(__dirname, '..', 'backend', 'routes');
const LIB = path.join(__dirname, '..', 'backend', 'lib', 'claude.js');
const problems = [];

const lib = fs.readFileSync(LIB, 'utf8');
if (!lib.includes('anthropic.messages.create = function')) {
  problems.push('backend/lib/claude.js no longer wraps anthropic.messages.create — the contract reaches nothing');
}
if (!lib.includes("require('./epistemics')")) {
  problems.push('backend/lib/claude.js no longer requires ./epistemics');
}

for (const f of fs.readdirSync(ROUTES).filter(n => n.endsWith('.js') && n !== 'index.js')) {
  const src = fs.readFileSync(path.join(ROUTES, f), 'utf8');
  if (/new\s+Anthropic\s*\(/.test(src)) {
    problems.push(`backend/routes/${f} constructs its own Anthropic client — import { anthropic } from lib/claude instead, or its calls skip the epistemic contract`);
  }
}

if (problems.length) {
  console.error('✖ epistemics-audit:');
  problems.forEach(p => console.error('   ' + p));
  process.exit(1);
}
console.log(`✅ epistemics-audit: contract wired at the client, no route builds its own.`);
