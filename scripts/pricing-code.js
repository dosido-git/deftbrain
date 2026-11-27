#!/usr/bin/env node
// Make an access code for one organization's view of /organizations/pricing.
//   node scripts/pricing-code.js "Springfield Public Library" libraries
// The audience (libraries, credit-unions, campuses, community, employers, health-plans, unions) is
// optional; with it the page shows only that audience's price.
//
// Adds the organization to backend/data/pricing-codes.json with a keyed hash of
// the code (the code itself is never stored) and prints the code to send them.
// Commit and push the file; the code works after the next deploy. To close an
// organization's access, delete its entry. The key is PRICING_CODE_SECRET, read
// from the environment or backend/.env, and must match the one on Railway.
//
// --existing <code> "Organization name" [audience] adds a code made earlier.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { FILE, hashCode } = require('../backend/lib/pricingCodes');

const AUDIENCES = require('../backend/data/pricing.json').audiences.map(a => a.key);
let args = process.argv.slice(2).map(x => x.trim());
let existing = '';
if (args[0] === '--existing') { existing = args[1] || ''; args = args.slice(2); }
const [org = '', audience = ''] = args;
if (!org || (audience && !AUDIENCES.includes(audience)) || (args[0] === undefined)) {
  console.error(`Usage: node scripts/pricing-code.js "Organization name" [${AUDIENCES.join('|')}]`);
  process.exit(1);
}
const secret = process.env.PRICING_CODE_SECRET;
if (!secret) {
  console.error('PRICING_CODE_SECRET is not set (backend/.env). It must match the Railway variable.');
  process.exit(1);
}

const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { codes: [] };
if (data.codes.some(e => e.org.toLowerCase() === org.toLowerCase())) {
  console.error(`${org} already has a code. Delete its entry in ${path.relative(process.cwd(), FILE)} first to issue a new one.`);
  process.exit(1);
}

// Readable: no 0/O, 1/l/I. 10 characters from 31 ≈ 49 bits, behind a rate limit and a secret key.
const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const pick = n => Array.from(crypto.randomBytes(n), b => ABC[b % ABC.length]).join('');
const code = existing || `db-${pick(5)}-${pick(5)}`;

data.codes.push({ org, audience: audience || null, added: new Date().toISOString().slice(0, 10), hash: hashCode(code, secret) });
data.codes.sort((a, b) => a.org.localeCompare(b.org));
fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Code for ${org}:  ${code}`);
console.log(`Added to ${path.relative(process.cwd(), FILE)}. It works after the next deploy.`);
