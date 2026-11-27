#!/usr/bin/env node
// Make a usage-report code for one partner (owner, 2026-11-27):
//   node scripts/report-code.js example-cu        (or <consortium>/<member>)
// The partner opens deftbrain.com/partners/report and types the code to see
// its own usage report (backend/lib/partnerReport.js). Adds a hashed entry to
// backend/data/report-codes.json (the code itself is never stored); commit and
// push, and it works after the next deploy. Same key as pricing codes:
// PRICING_CODE_SECRET from the environment or backend/.env.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { REPORT_FILE, hashCode } = require('../backend/lib/pricingCodes');
const { resolvePartner, allPartnerIds } = require('../backend/lib/partners');

const id = (process.argv[2] || '').trim();
// A consortium's code shows all its members together; a member's code (<consortium>/<member>) shows that member.
const partner = resolvePartner(id);
if (!partner) {
  console.error(`Usage: node scripts/report-code.js <partner id>   (one of: ${allPartnerIds().join(', ')})`);
  process.exit(1);
}
const secret = process.env.PRICING_CODE_SECRET;
if (!secret) { console.error('PRICING_CODE_SECRET is not set (backend/.env). It must match the Railway variable.'); process.exit(1); }

const data = fs.existsSync(REPORT_FILE) ? JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8')) : { codes: [] };
const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const pick = n => Array.from(crypto.randomBytes(n), b => ABC[b % ABC.length]).join('');
const code = `rp-${pick(5)}-${pick(5)}`;
// One code per partner: a new one replaces the old.
data.codes = data.codes.filter(e => e.partner !== id);
data.codes.push({ partner: id, added: new Date().toISOString().slice(0, 10), hash: hashCode(code, secret) });
data.codes.sort((a, b) => a.partner.localeCompare(b.partner));
fs.writeFileSync(REPORT_FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Report code for ${partner.name}:  ${code}`);
console.log(`Added to ${path.relative(process.cwd(), REPORT_FILE)} (replacing any earlier code). It works after the next deploy.`);
