#!/usr/bin/env node
// Self-check for backend/lib/partnerReport.js: counts only sessions that
// started on the partner page, hides groups of 1-19, and hides a second cell
// when one hidden number could be worked out from a shown total.
const assert = require('node:assert');
const { buildPartnerReport, renderPartnerReportHTML, renderFunderSummaryHTML, suppressColumn, quarterRange, lastQuarter } = require('../backend/lib/partnerReport');

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
assert.deepStrictEqual(r.totals, { visits: 70, active: 45, started: 65, finished: 35 }, 'shown counts rounded to the nearest 5 (69, 66 raw)');
assert.deepStrictEqual(r.byMonth.map(m => m.visits), [null, null], 'December (9) hidden, and November with it: 69 - 9 would give it back');
assert.deepStrictEqual(r.byMonth.map(m => m.started), [65, 0]);
const tool = Object.fromEntries(r.byExperience.map(x => [x.label, x]));
assert.strictEqual(tool.ScamRadar.started, 40);
assert.strictEqual(tool.BillRescue.started, null, '4 runs: hidden');
assert.strictEqual(tool['Other DeftBrain experiences'].started, null, 'non-package tools folded into one row (22), hidden with Bill Rescue so 66 - 40 - 22 cannot give 4');
assert.strictEqual(tool.ScamRadar.finished, 35);
const link = Object.fromEntries(r.byLink.map(x => [x.label, x.visits]));
assert.strictEqual(link.email, 30);
assert.strictEqual(link.print, null);
assert.strictEqual(link.staff, null, 'two small channels hide each other; no third cell needed');
assert.strictEqual(link['no link (typed or bookmarked)'], 35, '34 rounded');

const only = buildPartnerReport(events, 'acme', { partner: { tools: [] }, from: '2026-12', to: '2026-12' });
assert.strictEqual(only.totals.visits, null, 'a total under 20 is hidden too');

const html = renderPartnerReportHTML(r, { toolTitles: { ScamRadar: 'Scam Radar' } });
assert.ok(html.includes('Scam Radar') && html.includes('fewer than 20') && !html.includes('/for/other'));
// Topics (first catalog category) and busiest days, same suppression.
const cat = { ScamRadar: 'Money', BillRescue: 'Money', PlainTalk: 'Learning' };
const rt = buildPartnerReport(events, 'acme', { partner: { tools: ['ScamRadar'] }, categoryOf: id => cat[id] || null });
const topic = Object.fromEntries(rt.byTopic.map(x => [x.label, x]));
assert.strictEqual(topic.Money.started, 45, 'Scam Radar 40 + Bill Rescue 4 = 44, rounded');
assert.strictEqual(topic.Learning.started, 20, '22 rounded');
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
  ...many(5, () => uev(`${U}/l2`, 'page_view', { props: { newSession: true }, ref: 'union/l2-print' })),
  ...many(7, () => uev('/for/unionx', 'page_view', { props: { newSession: true } })), // a different partner
];
const ur = buildPartnerReport(uevents, 'union', { partner: { name: 'Union', tools: [], members: { l1: { name: 'Local 1' }, l2: { name: 'Local 2' } } } });
assert.strictEqual(ur.totals.visits, 60, 'main page + members, not /for/unionx');
const um = Object.fromEntries(ur.byMember.map(x => [x.label, x.visits]));
assert.strictEqual(um['Local 2'], null, '5 visits hidden');
assert.strictEqual(um['Local 1'], null, 'next-smallest hidden too');
assert.strictEqual(um['Union (main page)'], 30);
assert.ok(ur.byLink.some(x => x.label === 'print'), "a member's tracked link counts under its channel, not 'other source'");
const lone = buildPartnerReport(uevents, 'union/l1', { partner: { name: 'Local 1', tools: [] } });
assert.strictEqual(lone.totals.visits, 25, 'a member sees only its own page');
assert.strictEqual(lone.byMember, null);
const fund = renderFunderSummaryHTML(rt);
assert.ok(fund.includes('fewer than 20') || fund.includes('70'), 'funder summary uses the suppressed totals');
assert.ok(!fund.includes('/for/other'));
// Trend: Money 25 in Oct, 40 in Nov -> rising; small months show no trend.
const tev = [
  ...many(25, () => ({ ...ev('tool_run', { path: '/ScamRadar' }), at: '2026-10-10T12:00:00Z' })),
  ...many(40, () => ev('tool_run', { path: '/ScamRadar' })),
  ...many(5, () => ev('tool_run', { path: '/PlainTalk' })),
];
const tr = buildPartnerReport(tev, 'acme', { partner: { tools: [] }, from: '2026-10', to: '2026-11', categoryOf: id => cat[id] || null });
assert.strictEqual(tr.byTopic.find(x => x.label === 'Money').trend, 'rising');
assert.strictEqual(tr.byTopic.find(x => x.label === 'Learning').trend, null, 'under 20: no trend');
assert.ok(renderPartnerReportHTML(tr).includes('Money (rising)'));
// Sensitive package: package totals only, no experiences or topics.
const sev = [
  ...many(30, () => ev('tool_run', { path: '/GriefGuide' })),
  ...many(25, () => ev('tool_run', { path: '/MentalHealthNavigator' })),
];
const sr = buildPartnerReport(sev, 'acme', { partner: { tools: ['MentalHealthNavigator', 'GriefGuide', 'NameThatFeeling'] }, categoryOf: () => 'Health & Wellness' });
assert.strictEqual(sr.sensitive, true);
assert.deepStrictEqual(sr.byExperience.map(x => x.label), ['All experiences in the package', 'Other DeftBrain experiences'], 'no per-experience rows');
assert.strictEqual(sr.byExperience[0].started, 55);
assert.deepStrictEqual(sr.byTopic, [], 'no topics');
assert.ok(!renderPartnerReportHTML(sr).includes('GriefGuide') && !renderFunderSummaryHTML(sr).includes('Health'), 'nothing per tool or topic rendered');
assert.strictEqual(r.sensitive, false);
// Self-serve windows: finished calendar quarters only.
const now = new Date('2026-11-27T12:00:00Z');
assert.deepStrictEqual(quarterRange('2026-Q3', now), { from: '2026-07', to: '2026-09' });
assert.strictEqual(quarterRange('2026-Q4', now), null, 'not over yet');
assert.strictEqual(quarterRange('2026-07', now), null);
assert.strictEqual(lastQuarter(now), '2026-Q3');
assert.strictEqual(lastQuarter(new Date('2026-02-01T00:00:00Z')), '2025-Q4');
assert.deepStrictEqual(quarterRange('2026-Q1', new Date('2026-04-01T00:00:00Z')), { from: '2026-01', to: '2026-03' }, 'a quarter opens the day after it ends');
// Day-exact window for pilot reports: only Nov 5 events, Dec 2 left out.
const dr = buildPartnerReport(events, 'acme', { partner: { tools: ['ScamRadar'] }, fromDay: '2026-11-01', toDay: '2026-11-30' });
assert.strictEqual(dr.totals.visits, 60, 'the 9 December visits are outside the days');
assert.ok(renderPartnerReportHTML(dr).includes('2026-11-01 to 2026-11-30'));
console.log('partner report: ok');
