// Pay-offer arithmetic, done in code (2026-10-08).
//
// Decision Coach compared two job offers and got the direction wrong: it said
// a one-time $5,000 signing bonus "narrows" a gap that it widened (the same
// offer already led), and called losing a discretionary $8,000 bonus a change
// "slightly but not the direction" when it made the gap 8–9× larger. A prompt
// rule ("compute the NET difference") was already there. So the model now only
// READS the offers into a ledger and this file does the comparison:
//   - recurring pay (salary, guaranteed bonus, employer match) per year;
//   - one-time pay (signing bonus, relocation) counted in year one only;
//   - pay that may not come (discretionary bonus, equity of uncertain value)
//     kept apart — it is the open question, not part of the guaranteed gap.

const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const PER_YEAR = { annual: 1, yearly: 1, monthly: 12, biweekly: 26, weekly: 52, hourly: 2080 };

/**
 * @param ledger { options: [{ name, components: [{ label, amount, period: 'annual'|'monthly'|'weekly'|'biweekly'|'hourly'|'one_time', certain: boolean }] }] }
 * @returns null unless at least two options carry money, else per-option totals and the comparison
 */
function comparePay(ledger) {
  const options = (Array.isArray(ledger?.options) ? ledger.options : []).map(o => {
    const t = { name: String(o?.name || '').trim(), recurring: 0, oneTime: 0, uncertainYearly: 0, uncertainOnce: 0, parts: [] };
    for (const c of Array.isArray(o?.components) ? o.components : []) {
      const amt = num(c?.amount);
      if (amt == null || amt === 0) continue;
      const period = String(c?.period || 'annual').toLowerCase().replace(/[\s-]/g, '_');
      const certain = c?.certain !== false;
      if (period === 'one_time' || period === 'once') {
        if (certain) t.oneTime += amt; else t.uncertainOnce += amt;
      } else {
        const yearly = amt * (PER_YEAR[period] || 1);
        if (certain) t.recurring += yearly; else t.uncertainYearly += yearly;
      }
      t.parts.push({ label: String(c?.label || '').trim(), amount: amt, period, certain });
    }
    t.yearOne = t.recurring + t.oneTime;
    t.later = t.recurring;
    t.yearOneIfAll = t.yearOne + t.uncertainYearly + t.uncertainOnce;
    t.laterIfAll = t.recurring + t.uncertainYearly;
    return t;
  }).filter(t => t.name && t.parts.length);
  if (options.length < 2) return null;

  // Rank on guaranteed year-one pay; the comparison is between the top two.
  const [a, b] = [...options].sort((x, y) => y.yearOne - x.yearOne);
  const gap = (x, y, k) => x[k] - y[k];
  const leader = (k) => (a[k] === b[k] ? null : (a[k] > b[k] ? a.name : b.name));
  return {
    options,
    pair: [a.name, b.name],
    yearOne: { leader: leader('yearOne'), gap: Math.abs(gap(a, b, 'yearOne')) },
    later: { leader: leader('later'), gap: Math.abs(gap(a, b, 'later')) },
    // If every uncertain amount is paid: does the leader change?
    yearOneIfAll: { leader: leader('yearOneIfAll'), gap: Math.abs(gap(a, b, 'yearOneIfAll')) },
    laterIfAll: { leader: leader('laterIfAll'), gap: Math.abs(gap(a, b, 'laterIfAll')) },
    hasUncertain: options.some(t => t.uncertainYearly || t.uncertainOnce),
  };
}

// Cheap gate: only read a ledger when the text plausibly compares paid options.
function looksLikePayComparison(text) {
  const s = String(text || '');
  const amounts = s.match(/(?:[$€£¥₹]\s?\d[\d,.]*\s?[kKmM]?|\d[\d,.]*\s?(?:[kK]\b|USD|EUR|GBP|dollars|euros|pounds))/g) || [];
  return amounts.length >= 2 && /salary|offer|pay|bonus|wage|raise|comp|stipend|income|job|role/i.test(s);
}

module.exports = { comparePay, looksLikePayComparison };
