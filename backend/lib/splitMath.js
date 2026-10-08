// Bill-split arithmetic, done in code (2026-10-07).
//
// Money Diplomat /split used to have the model do the sums. The 2026-10-07
// quality audit caught it three ways on one birthday dinner: an "equal" share
// of $91.68 where the true figure was $89.61, proportional shares adding up
// to $401.18 of a $448.05 bill, and itemised orders summing to $390 against a
// stated $412 subtotal with nobody noticing. The number check could not
// rescue it — it fixes one field at a time and cannot rebalance a breakdown.
//
// So the model now only READS the bill (what each person ordered, what was
// shared, who is being treated) and this file does every sum. Rules:
//   - shared items divide equally among the people who shared them;
//   - tax and tip are allocated in proportion to what each person consumed;
//   - a person being covered (the birthday person) pays nothing, and their
//     consumption is split equally among everyone else;
//   - money in the stated subtotal that no listed item accounts for is
//     reported as `unassigned` and, in itemised splits, shared equally among
//     the payers — the visitor is told so rather than it vanishing;
//   - every split is rounded to cents with the remainder placed so the shares
//     add up to the grand total exactly.

const cents = n => Math.round(Number(n) * 100);
const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = String(v ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

// Split `totalCents` across `weights` (same order), exact to the cent.
function apportion(totalCents, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!weights.length) return [];
  if (sum <= 0) return apportion(totalCents, weights.map(() => 1));
  const raw = weights.map(w => (totalCents * w) / sum);
  const out = raw.map(Math.floor);
  let rest = totalCents - out.reduce((a, b) => a + b, 0);
  // largest remainders first; ties go to the earlier person
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) out[order[k][1]]++;
  return out;
}

/**
 * @param ledger { people: [{ name, covered }], items: [{ desc, amount, shared_by: 'all' | [names] }],
 *                 stated_subtotal, tax }
 * @param tipPct number (e.g. 20) or null — tip on the pre-tax subtotal
 * @returns null when the ledger is unusable, else the computed figures
 */
function computeSplit(ledger, tipPct) {
  const people = (Array.isArray(ledger?.people) ? ledger.people : [])
    .map(p => ({ name: String(p?.name || '').trim(), covered: p?.covered === true }))
    .filter(p => p.name);
  const names = people.map(p => p.name);
  const lower = new Map(names.map(n => [n.toLowerCase(), n]));
  const payers = people.filter(p => !p.covered).map(p => p.name);
  if (people.length < 2 || !payers.length) return null;

  const consumed = Object.fromEntries(names.map(n => [n, 0]));
  let itemCents = 0;
  for (const it of Array.isArray(ledger.items) ? ledger.items : []) {
    const c = cents(num(it?.amount) ?? NaN);
    if (!Number.isFinite(c) || c <= 0) continue;
    let who = it.shared_by === 'all' || !Array.isArray(it.shared_by)
      ? names
      : it.shared_by.map(n => lower.get(String(n).trim().toLowerCase())).filter(Boolean);
    if (!who.length) who = names;
    apportion(c, who.map(() => 1)).forEach((share, i) => { consumed[who[i]] += share; });
    itemCents += c;
  }
  if (!itemCents) return null;

  const stated = num(ledger.stated_subtotal);
  const subtotalCents = stated && stated > 0 ? cents(stated) : itemCents;
  const unassigned = subtotalCents - itemCents; // >0: money no item explains; <0: items exceed the subtotal
  const taxCents = Math.max(0, cents(num(ledger.tax) || 0));
  const tip = Number.isFinite(Number(tipPct)) && Number(tipPct) > 0 ? Number(tipPct) : 0;
  const tipCents = Math.round(subtotalCents * tip / 100);
  const grand = subtotalCents + taxCents + tipCents;

  // Itemised: own consumption, plus an equal slice of the covered people's and
  // of any unassigned money, plus tax and tip in proportion to consumption.
  const coveredCents = people.filter(p => p.covered).reduce((a, p) => a + consumed[p.name], 0);
  const extraEach = apportion(coveredCents + Math.max(0, unassigned), payers.map(() => 1));
  const base = payers.map((n, i) => consumed[n] + extraEach[i]);
  let baseScaled = base;
  if (unassigned < 0) baseScaled = apportion(subtotalCents, base); // items exceed subtotal: scale down
  const extras = apportion(taxCents + tipCents, baseScaled);
  const itemised = payers.map((n, i) => baseScaled[i] + extras[i]);

  const equal = apportion(grand, payers.map(() => 1));

  return {
    payers,
    covered: people.filter(p => p.covered).map(p => p.name),
    item_total: itemCents / 100,
    subtotal: subtotalCents / 100,
    unassigned: unassigned / 100,
    tax: taxCents / 100,
    tip_pct: tip,
    tip: tipCents / 100,
    grand_total: grand / 100,
    consumed: Object.fromEntries(names.map(n => [n, consumed[n] / 100])),
    equal: Object.fromEntries(payers.map((n, i) => [n, equal[i] / 100])),
    itemised: Object.fromEntries(payers.map((n, i) => [n, itemised[i] / 100])),
  };
}

module.exports = { computeSplit, apportion };
