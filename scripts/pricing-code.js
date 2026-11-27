#!/usr/bin/env node
// Make an access code for one organization's view of /organizations/pricing.
//   node scripts/pricing-code.js "Springfield Public Library"
// Prints the code to send them, and the entry to add to the Railway variable
// PRICING_ACCESS_CODES (entries separated by "; "). Each organization gets its
// own code so the metrics report shows who looked at pricing and when.
const crypto = require('crypto');

const org = process.argv.slice(2).join(' ').trim();
if (!org || /[;=]/.test(org)) {
  console.error('Usage: node scripts/pricing-code.js "Organization name"   (no ; or = in the name)');
  process.exit(1);
}
// Readable: no 0/O, 1/l/I. 10 characters from 31 ≈ 49 bits, plenty behind a rate limit.
const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const pick = n => Array.from(crypto.randomBytes(n), b => ABC[b % ABC.length]).join('');
const code = `db-${pick(5)}-${pick(5)}`;
console.log(`Code for ${org}:  ${code}`);
console.log('\nAdd this entry to PRICING_ACCESS_CODES on Railway (separate entries with "; "):');
console.log(`${code}=${org}`);
