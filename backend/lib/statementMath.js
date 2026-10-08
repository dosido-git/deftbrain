// Checks a bill's OWN arithmetic in code (2026-10-07).
//
// The 2026-10-07 quality audit gave Bill Rescue a statement where total
// charges $3,394.00 minus a $1,060.50 adjustment came to $2,333.50, yet the
// "amount due" line said $3,184.50 — $851 the visitor did not owe. The tool
// missed it: the number check takes whatever the visitor supplies as given,
// and the main call never recomputed the statement. A model reads the bill
// into numbers (no arithmetic); this file does the sums and names every
// mismatch and exact-duplicate line. The findings go to the main call as
// established facts, in English, to be reported in the visitor's language.
const c = n => Math.round(Number(n) * 100);
const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/**
 * @param st { line_items: [{ date, code, desc, amount }], stated_total_charges,
 *             credits: [{ desc, amount }], stated_amount_due }
 * @param fmt amount formatter
 * @returns array of finding strings (empty when everything adds up)
 */
function checkStatement(st, fmt = v => v.toFixed(2)) {
  const findings = [];
  const lines = (Array.isArray(st?.line_items) ? st.line_items : [])
    .map(l => ({ ...l, cents: c(num(l?.amount)) }))
    .filter(l => Number.isFinite(l.cents) && l.cents !== 0);
  if (!lines.length) return findings;
  const lineSum = lines.reduce((a, l) => a + l.cents, 0);

  const total = num(st.stated_total_charges);
  if (total !== null && Math.abs(c(total) - lineSum) >= 1) {
    findings.push(`The line items add up to ${fmt(lineSum / 100)}, but the statement's total charges say ${fmt(total)} — a difference of ${fmt(Math.abs(c(total) - lineSum) / 100)}.`);
  }
  const base = total !== null ? c(total) : lineSum;
  const credits = (Array.isArray(st.credits) ? st.credits : [])
    .map(x => ({ desc: String(x?.desc || 'credit'), cents: Math.abs(c(num(x?.amount))) }))
    .filter(x => Number.isFinite(x.cents) && x.cents > 0);
  const creditSum = credits.reduce((a, x) => a + x.cents, 0);
  const due = num(st.stated_amount_due);
  if (due !== null) {
    const expected = base - creditSum;
    if (Math.abs(c(due) - expected) >= 1) {
      findings.push(`Total charges ${fmt(base / 100)}${credits.length ? ` minus ${credits.map(x => `${x.desc} ${fmt(x.cents / 100)}`).join(' and ')}` : ''} = ${fmt(expected / 100)}, but the statement asks for ${fmt(due)} — ${fmt(Math.abs(c(due) - expected) / 100)} ${c(due) > expected ? 'MORE' : 'less'} than its own figures support.`);
    }
  }
  const seen = new Map();
  for (const l of lines) {
    const key = [l.date || '', String(l.code || '').trim(), l.cents].join('|');
    if (!(l.code || l.desc)) continue;
    if (seen.has(key)) findings.push(`Possible duplicate: "${l.desc || l.code}"${l.code ? ` (${l.code})` : ''} for ${fmt(l.cents / 100)} appears more than once${l.date ? ` on ${l.date}` : ''}.`);
    else seen.set(key, true);
  }
  return [...new Set(findings)];
}

module.exports = { checkStatement };
