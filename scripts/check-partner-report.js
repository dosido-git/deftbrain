#!/usr/bin/env node
// Self-check for backend/lib/partnerReport.js: counts only sessions that
// started on the partner page, hides groups of 1-19, and hides a second cell
// when one hidden number could be worked out from a shown total.
const assert = require('node:assert');
const { buildPartnerReport, renderPartnerReportHTML, suppressColumn } = require('../backend/lib/partnerReport');

// suppressColumn
assert.deepStrictEqual(suppressColumn([50, 5, 0], true), [null, null, 0], 'lone hidden cell takes the next-smallest with it');
assert.deepStrictEqual(suppressColumn([50, 5, 3], true), [50, null, null], 'two hidden cells are already safe');
assert.deepStrictEqual(suppressColumn([50, 40], true), [50, 40]);
assert.deepStrictEqual(suppressColumn([50, 5], false), [50, null], 'no shown total, nothing to back out');

const L = '/for/acme';
const ev = (event, extra = {}) => ({ kind: 'event', event, at: '2026-11-05T12:00:00Z', landing: L, ...extra });
const many = (n, make) => Array.from({ length: n }, make);
const events = [
  ...many(30, () => ev('page_view', { props: { newSession: true }, ref: 'acme-email' })),
  ...many(25, () => ev('page_view', { props: { newSession: true } })),
  ...many(3, () => ev('page_view', { props: { newSession: true }, ref: 'acme-print' })),
  ...many(2, () => ev('page_view', { props: { newSession: true }, ref: 'acme-staff' })),
  ...many(40, () => ev('page_view', { props: {} })), // not new sessions: not visits
  ...many(45, () => ev('interact')),
  ...many(40, () => ev('tool_run', { path: '/ScamRadar' })),
  ...many(35, () => ev('tool_complete', { path: '/ScamRadar' })),
  ...many(4, () => ev('tool_run', { path: '/BillRescue' })),
  ...many(22, () => ev('tool_run', { path: '/PlainTalk' })), // outside the package
  ...many(99, () => ({ ...ev('tool_run', { path: '/ScamRadar' }), landing: '/for/other' })),
  ...many(9, () => ({ ...ev('page_view', { props: { newSession: true } }), at: '2026-12-02T12:00:00Z' })),
];

const r = buildPartnerReport(events, 'acme', { partner: { name: 'Acme CU', tools: ['ScamRadar', 'BillRescue'] } });
assert.strictEqual(r.from, '2026-11'); assert.strictEqual(r.to, '2026-12');
assert.deepStrictEqual(r.totals, { visits: 69, active: 45, started: 66, finished: 35 });
assert.deepStrictEqual(r.byMonth.map(m => m.visits), [null, null], 'December (9) hidden, and November with it: 69 - 9 would give it back');
assert.deepStrictEqual(r.byMonth.map(m => m.started), [66, 0]);
const tool = Object.fromEntries(r.byExperience.map(x => [x.label, x]));
assert.strictEqual(tool.ScamRadar.started, 40);
assert.strictEqual(tool.BillRescue.started, null, '4 runs: hidden');
assert.strictEqual(tool['Other DeftBrain experiences'].started, null, 'non-package tools folded into one row (22), hidden with Bill Rescue so 66 - 40 - 22 cannot give 4');
assert.strictEqual(tool.ScamRadar.finished, 35);
const link = Object.fromEntries(r.byLink.map(x => [x.label, x.visits]));
assert.strictEqual(link.email, 30);
assert.strictEqual(link.print, null);
assert.strictEqual(link.staff, null, 'two small channels hide each other; no third cell needed');
assert.strictEqual(link['no link (typed or bookmarked)'], 34);

const only = buildPartnerReport(events, 'acme', { partner: { tools: [] }, from: '2026-12', to: '2026-12' });
assert.strictEqual(only.totals.visits, null, 'a total under 20 is hidden too');

const html = renderPartnerReportHTML(r, { toolTitles: { ScamRadar: 'Scam Radar' } });
assert.ok(html.includes('Scam Radar') && html.includes('fewer than 20') && !html.includes('/for/other'));
// Topics (first catalog category) and busiest days, same suppression.
const cat = { ScamRadar: 'Money', BillRescue: 'Money', PlainTalk: 'Learning' };
const rt = buildPartnerReport(events, 'acme', { partner: { tools: ['ScamRadar'] }, categoryOf: id => cat[id] || null });
const topic = Object.fromEntries(rt.byTopic.map(x => [x.label, x]));
assert.strictEqual(topic.Money.started, 44, 'Scam Radar 40 + Bill Rescue 4');
assert.strictEqual(topic.Learning.started, 22);
assert.strictEqual(rt.byTopic[0].label, 'Money', 'most started first');
assert.strictEqual(rt.byWeekday.length, 7);
const day = Object.fromEntries(rt.byWeekday.map(x => [x.label, x.visits]));
assert.strictEqual(day.Wednesday, null, '2026-12-02 (9 visits) is hidden');
assert.strictEqual(day.Thursday, null, '2026-11-05 (60) hidden too: 69 - 60 would give Wednesday back');
assert.strictEqual(day.Monday, 0, 'zero describes no one');
assert.ok(renderPartnerReportHTML(rt).includes('What people came for'));
// Consortium roll-up: its own page plus every member page, one row each.
const U = '/for/union';
const uev = (landing, event, extra = {}) => ({ kind: 'event', event, at: '2026-11-05T12:00:00Z', landing, ...extra });
const uevents = [
  ...many(30, () => uev(U, 'page_view', { props: { newSession: true } })),
  ...many(25, () => uev(`${U}/l1`, 'page_view', { props: { newSession: true } })),
  ...many(5, () => uev(`${U}/l2`, 'page_view', { props: { newSession: true } })),
  ...many(7, () => uev('/for/unionx', 'page_view', { props: { newSession: true } })), // a different partner
];
const ur = buildPartnerReport(uevents, 'union', { partner: { name: 'Union', tools: [], members: { l1: { name: 'Local 1' }, l2: { name: 'Local 2' } } } });
assert.strictEqual(ur.totals.visits, 60, 'main page + members, not /for/unionx');
const um = Object.fromEntries(ur.byMember.map(x => [x.label, x.visits]));
assert.strictEqual(um['Local 2'], null, '5 visits hidden');
assert.strictEqual(um['Local 1'], null, 'next-smallest hidden too');
assert.strictEqual(um['Union (main page)'], 30);
const lone = buildPartnerReport(uevents, 'union/l1', { partner: { name: 'Local 1', tools: [] } });
assert.strictEqual(lone.totals.visits, 25, 'a member sees only its own page');
assert.strictEqual(lone.byMember, null);
console.log('partner report: ok');
