#!/usr/bin/env node
// check-math.js — the arithmetic DeftBrain moved out of the model and into code.
//
// Each helper in backend/lib exists because a model got a sum wrong in a real
// audit run, and each case below is that run. If a helper regresses, the tool
// shows a wrong figure with full confidence and no other gate notices: goldens
// check structure, not cents. No model calls, no network, about 50ms.
const assert = require('assert');
const { computeSplit, apportion } = require('../backend/lib/splitMath');
const { comparePay } = require('../backend/lib/payMath');
const { checkStatement } = require('../backend/lib/statementMath');
const { todayIn, resolveDeadline, deadlineStatus, daysBetween, weekdayOf } = require('../backend/lib/relativeDates');

const sum = a => a.reduce((x, y) => x + y, 0);
const round2 = n => Math.round(n * 100) / 100;

// ── splitMath (Money Diplomat /split, audit 2026-10-07) ──
assert.deepStrictEqual(apportion(100, [1, 1, 1]), [34, 33, 33], 'tied remainder cent goes to the first person');
assert.deepStrictEqual(apportion(5, [1, 2]), [2, 3], 'leftover cent goes to the largest remainder (1.67 beats 3.33)');
assert.strictEqual(sum(apportion(44805, [3, 7, 11, 2])), 44805, 'shares add up to the total exactly');
assert.deepStrictEqual(apportion(10, [0, 0]), [5, 5], 'zero weights fall back to equal');

const split = computeSplit({
  people: [{ name: 'A' }, { name: 'B' }, { name: 'C', covered: true }],
  items: [
    { desc: 'steak', amount: 30, shared_by: ['A'] },
    { desc: 'nachos', amount: 20, shared_by: 'all' },
    { desc: 'cake', amount: 10, shared_by: ['c'] }, // name matched case-insensitively
  ],
  stated_subtotal: 60, tax: 5.4,
}, 20);
assert.strictEqual(split.grand_total, 77.4);
assert.deepStrictEqual(split.itemised, { A: 58.05, B: 19.35 }, 'covered person split equally, tax+tip by consumption');
assert.strictEqual(round2(sum(Object.values(split.itemised))), split.grand_total, 'itemised shares add up to the bill');
assert.strictEqual(round2(sum(Object.values(split.equal))), split.grand_total, 'equal shares add up to the bill');

const short = computeSplit({ people: [{ name: 'A' }, { name: 'B' }], items: [{ amount: 390, shared_by: 'all' }], stated_subtotal: 412 }, 0);
assert.strictEqual(short.unassigned, 22, 'items short of the stated subtotal are reported, not dropped');
assert.strictEqual(round2(sum(Object.values(short.itemised))), 412);
assert.strictEqual(computeSplit({ people: [{ name: 'A' }], items: [{ amount: 5 }] }), null, 'one person is not a split');

// ── payMath (Decision Coach, audit 2026-10-07) ──
const pay = comparePay({ options: [
  { name: 'Brightline', components: [{ amount: 101000, period: 'annual' }, { amount: 5000, period: 'one_time' }] },
  { name: 'Other', components: [{ amount: 100000, period: 'annual' }, { amount: 8000, period: 'annual', certain: false }] },
] });
assert.deepStrictEqual(pay.yearOne, { leader: 'Brightline', gap: 6000 }, 'a signing bonus on the leading offer WIDENS the year-one gap');
assert.deepStrictEqual(pay.later, { leader: 'Brightline', gap: 1000 }, 'one-time pay counts in year one only');
assert.deepStrictEqual(pay.laterIfAll, { leader: 'Other', gap: 7000 }, 'uncertain pay kept apart, and can flip the leader');
assert.strictEqual(pay.hasUncertain, true);
assert.strictEqual(comparePay({ options: [{ name: 'X', components: [{ amount: 1 }] }] }), null);
assert.strictEqual(comparePay({ options: [{ name: 'H', components: [{ amount: 25, period: 'hourly' }] }, { name: 'S', components: [{ amount: 50000 }] }] }).later.gap, 2000, 'hourly x 2080');

// ── statementMath (Bill Rescue, audit 2026-10-07) ──
const bill = checkStatement({
  line_items: [{ desc: 'room', amount: 2394 }, { desc: 'lab', amount: 1000 }],
  stated_total_charges: 3394, credits: [{ desc: 'insurance adjustment', amount: -1060.5 }], stated_amount_due: 3184.5,
});
assert.strictEqual(bill.length, 1);
assert(/= 2333\.50, but the statement asks for 3184\.50 — 851\.00 MORE/.test(bill[0]), bill[0]);
assert.deepStrictEqual(checkStatement({ line_items: [{ desc: 'x', amount: 10 }], stated_total_charges: 10, stated_amount_due: 10 }), [], 'a bill that adds up has no findings');
assert(/add up to 15\.00, but the statement's total charges say 20\.00/.test(checkStatement({ line_items: [{ desc: 'a', amount: 5 }, { desc: 'b', amount: 10 }], stated_total_charges: 20 })[0]));
assert(/Possible duplicate/.test(checkStatement({ line_items: [{ date: '2026-10-01', code: '99213', desc: 'visit', amount: 120 }, { date: '2026-10-01', code: '99213', desc: 'visit', amount: 120 }] }).join(' ')));

// ── relativeDates (Email Urgency Triager, 2026-10-17) ──
// A Thursday "today 17:00" pasted on Saturday is two days overdue, not due now.
const thu = resolveDeadline({ kind: 'same_day', time: '17:00' }, '2026-10-15', '2026-10-17');
assert.deepStrictEqual(thu, { date: '2026-10-15', time: '17:00', anchored: true });
assert.strictEqual(deadlineStatus(thu, { date: '2026-10-17', time: '09:00' }), 'overdue');
assert.strictEqual(daysBetween('2026-10-15', '2026-10-17'), 2);
assert.strictEqual(weekdayOf('2026-10-15'), 'thursday');
assert.strictEqual(resolveDeadline({ kind: 'end_of_week' }, '2026-10-17', null).date, '2026-10-23', 'Saturday → next Friday');
assert.strictEqual(resolveDeadline({ kind: 'weekday', weekday: 'Thursday' }, '2026-10-15', null).date, '2026-10-15', 'same weekday = that day');
assert.strictEqual(resolveDeadline({ kind: 'next_day' }, '2026-12-31', null).date, '2027-01-01');
assert.strictEqual(deadlineStatus({ date: '2026-10-17', time: '17:00' }, { date: '2026-10-17', time: '17:30' }), 'overdue', 'later the same day');
assert.strictEqual(resolveDeadline({ kind: 'weekday', weekday: 'someday' }, '2026-10-15', null), null);
// 05:00 UTC on Oct 20 is still Oct 19 in American Samoa and already Oct 20 in Kiritimati.
const at = new Date('2026-10-20T05:00:00Z');
assert.strictEqual(todayIn('Pacific/Pago_Pago', at).date, '2026-10-19');
assert.strictEqual(todayIn('Pacific/Kiritimati', at).date, '2026-10-20');
assert.strictEqual(todayIn('Not/AZone', at).date, '2026-10-20', 'unknown zone falls back to UTC');

console.log('✅ check-math: split, pay, statement and date helpers all add up.');
