// Per-partner usage report (Partner Center promise: totals only, any group
// under 20 shown as "fewer than 20", never what anyone typed or saw).
//
// A partner session is one whose first page was /for/<partner>: analytics.js
// stamps that landing path on every event of the session, so a visitor who
// moves on to a tool is still counted for the partner. Nothing here reads
// typed text — the sink never holds it.
//
//   visits   = sessions that started on the partner page (new-session page_view)
//   active   = of those, sessions with at least one click or keypress (interact)
//   started  = guidance runs started (tool_run)
//   finished = guidance runs that finished (tool_complete)

const MIN_GROUP = 20;
const MEASURES = ['visits', 'active', 'started', 'finished'];

const monthOf = at => (typeof at === 'string' ? at.slice(0, 7) : ''); // UTC month
const toolOf = path => { const m = /^\/([A-Z][A-Za-z0-9]*)$/.exec(path || ''); return m ? m[1] : null; };

function measureOf(e) {
  if (e.event === 'page_view' && e.props && e.props.newSession) return 'visits';
  if (e.event === 'interact') return 'active';
  if (e.event === 'tool_run') return 'started';
  if (e.event === 'tool_complete') return 'finished';
  return null;
}

function monthsBetween(from, to) {
  const out = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

// Hide every count from 1 to MIN_GROUP-1 in one column of a breakdown. If that
// hides exactly one cell while the column total is shown, the total minus the
// others would give it back, so the next-smallest visible non-zero cell is
// hidden too. Zero is shown: it describes no one.
function suppressColumn(values, totalShown) {
  const out = values.map(v => (v > 0 && v < MIN_GROUP ? null : v));
  const hidden = out.filter(v => v === null).length;
  if (hidden === 1 && totalShown) {
    let at = -1;
    out.forEach((v, i) => { if (v > 0 && (at < 0 || v < out[at])) at = i; });
    if (at >= 0) out[at] = null;
  }
  return out;
}

function suppressTable(rows, totals) {
  const shown = {};
  for (const k of MEASURES) {
    if (!(k in totals)) continue;
    const t = totals[k];
    shown[k] = t > 0 && t < MIN_GROUP ? null : t;
    const col = suppressColumn(rows.map(r => r[k] || 0), shown[k] !== null);
    rows.forEach((r, i) => { r[k] = col[i]; });
  }
  return { rows, totals: shown };
}

function buildPartnerReport(events, partnerId, { partner = {}, from, to, categoryOf = () => null } = {}) {
  const landing = `/for/${partnerId}`;
  const mine = events.filter(e => e && e.kind === 'event' && e.landing === landing && measureOf(e));
  const months = mine.map(e => monthOf(e.at)).filter(Boolean).sort();
  const start = from || months[0] || new Date().toISOString().slice(0, 7);
  const end = to || months[months.length - 1] || start;
  const inRange = e => { const m = monthOf(e.at); return m >= start && m <= end; };
  const rows = mine.filter(inRange);

  const totals = Object.fromEntries(MEASURES.map(k => [k, 0]));
  for (const e of rows) totals[measureOf(e)] += 1;

  const byMonth = monthsBetween(start, end).map(m => ({ label: m, visits: 0, active: 0, started: 0, finished: 0 }));
  const monthAt = Object.fromEntries(byMonth.map(r => [r.label, r]));
  for (const e of rows) { const r = monthAt[monthOf(e.at)]; if (r) r[measureOf(e)] += 1; }

  // Experiences: the package's own tools always listed (zeros included), every
  // other tool folded into one row so a rarely used one can't single anyone out.
  const pkg = Array.isArray(partner.tools) ? partner.tools : [];
  const byTool = Object.fromEntries(pkg.map(id => [id, { label: id, started: 0, finished: 0 }]));
  const other = { label: 'Other DeftBrain experiences', started: 0, finished: 0 };
  for (const e of rows) {
    const k = measureOf(e);
    if (k !== 'started' && k !== 'finished') continue;
    const id = toolOf(e.path);
    (id && byTool[id] ? byTool[id] : other)[k] += 1;
  }

  // Where visits came from: the launch kit's tracked links are ?ref=<partner>-<channel>.
  const channels = {};
  for (const e of rows) {
    if (measureOf(e) !== 'visits') continue;
    const ref = typeof e.ref === 'string' ? e.ref : '';
    const label = ref.startsWith(`${partnerId}-`) ? ref.slice(partnerId.length + 1) : ref ? 'other source' : 'no link (typed or bookmarked)';
    channels[label] = (channels[label] || 0) + 1;
  }
  const byLink = Object.entries(channels).sort((a, b) => b[1] - a[1]).map(([label, visits]) => ({ label, visits }));

  // What people came for (partner perk, 2026-11-27): guidance by topic, the
  // tool's first catalog category, so the partner sees themes, not tools.
  const topicsAt = {};
  for (const e of rows) {
    const k = measureOf(e);
    if (k !== 'started' && k !== 'finished') continue;
    const topic = categoryOf(toolOf(e.path)) || 'Other topics';
    topicsAt[topic] = topicsAt[topic] || { label: topic, started: 0, finished: 0 };
    topicsAt[topic][k] += 1;
  }
  const byTopic = Object.values(topicsAt).sort((a, b) => b.started - a.started || a.label.localeCompare(b.label));

  // When people come: visits by weekday (UTC), Monday first.
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const byWeekday = DAYS.map(label => ({ label, visits: 0 }));
  for (const e of rows) {
    if (measureOf(e) !== 'visits' || typeof e.at !== 'string') continue;
    const d = new Date(e.at).getUTCDay();
    if (!Number.isNaN(d)) byWeekday[(d + 6) % 7].visits += 1;
  }

  const t = suppressTable(byMonth, totals);
  const topics = suppressTable(byTopic, { started: totals.started, finished: totals.finished });
  const days = suppressTable(byWeekday, { visits: totals.visits });
  const tools = suppressTable([...Object.values(byTool), other], { started: totals.started, finished: totals.finished });
  const links = suppressTable(byLink, { visits: totals.visits });
  return {
    partner: partnerId,
    name: partner.name || partnerId,
    from: start,
    to: end,
    minGroup: MIN_GROUP,
    totals: t.totals,
    byMonth: t.rows,
    byExperience: tools.rows,
    byLink: links.rows,
    byTopic: topics.rows,
    byWeekday: days.rows,
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (ym, short) => { const [y, m] = ym.split('-'); const n = MONTHS[Number(m) - 1] || ym; return `${short ? n.slice(0, 3) : n} ${y}`; };
const period = (a, b) => (a === b ? monthName(a) : `${monthName(a)} to ${monthName(b)}`);
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cell = v => (v === null ? '<td class="hid">fewer than 20</td>' : `<td>${Number(v).toLocaleString('en-US')}</td>`);

function renderPartnerReportHTML(r, { toolTitles = {} } = {}) {
  const table = (head, rows, keys, nameOf = x => x.label) => `<div class="scroll"><table><thead><tr><th>${head}</th>${keys.map(k => `<th>${k[1]}</th>`).join('')}</tr></thead><tbody>${
    rows.map(x => `<tr><td class="name">${esc(nameOf(x))}</td>${keys.map(k => cell(x[k[0]])).join('')}</tr>`).join('')}</tbody></table></div>`;
  const T = r.totals;
  const tile = (label, v) => `<div class="tile"><b>${v === null ? 'fewer than 20' : Number(v).toLocaleString('en-US')}</b><span>${label}</span></div>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(r.name)} usage report, ${period(r.from, r.to)}</title>
<style>
body{font-family:system-ui,sans-serif;color:#1f2937;max-width:860px;margin:0 auto;padding:28px 20px;background:#fff;line-height:1.5}
h1{font-family:Georgia,serif;color:#18324a;font-size:30px;margin:0 0 4px}
h2{font-family:Georgia,serif;color:#18324a;font-size:20px;margin:30px 0 10px}
.sub{color:#5c5650;margin:0 0 20px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.tile{border:1px solid #ded7cc;border-radius:10px;padding:12px}
.tile b{display:block;font-size:24px;color:#18324a}.tile span{font-size:13px;color:#5c5650}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px 10px;border-bottom:1px solid #e7e1d7;text-align:right}
th:first-child,td.name{text-align:left}th{background:#f2eee7;color:#18324a}
td.hid{color:#8a8275;font-style:italic}
td,th{white-space:nowrap}td.name{white-space:normal;min-width:9em}
.scroll{overflow-x:auto}
.note{font-size:13px;color:#5c5650;margin-top:24px;border-top:1px solid #e7e1d7;padding-top:12px}
@media(max-width:640px){.tiles{grid-template-columns:repeat(2,1fr)}h1{font-size:24px}th,td{padding:7px 6px}}
</style></head><body>
<h1>${esc(r.name)}: usage report</h1>
<p class="sub">${period(r.from, r.to)} · visits that started on deftbrain.com/for/${esc(r.partner)}</p>
<div class="tiles">${tile('Visits', T.visits)}${tile('Visits with activity', T.active)}${tile('Guidance started', T.started)}${tile('Guidance finished', T.finished)}</div>
<h2>By month</h2>
${table('Month', r.byMonth.map(m => ({ ...m, label: monthName(m.label, true) })), [['visits', 'Visits'], ['active', 'With activity'], ['started', 'Started'], ['finished', 'Finished']])}
<h2>By experience</h2>
${table('Experience', r.byExperience, [['started', 'Started'], ['finished', 'Finished']], x => toolTitles[x.label] || x.label)}
<h2>What people came for</h2>
${(r.byTopic || []).length ? table('Topic', r.byTopic, [['started', 'Started'], ['finished', 'Finished']]) : '<p>No guidance started in this period.</p>'}
<h2>Busiest days</h2>
${table('Day (UTC)', r.byWeekday || [], [['visits', 'Visits']])}
<h2>Where visits came from</h2>
${r.byLink.length ? table('Link', r.byLink, [['visits', 'Visits']]) : '<p>No visits in this period.</p>'}
<p class="note">Totals only. Any group of 1 to ${r.minGroup - 1} is shown as “fewer than 20”, and where one hidden number could be worked out from a total, a second is hidden too. This report never includes what anyone typed or was shown, names, email or IP addresses. Months are calendar months in UTC. Prepared by DeftBrain.</p>
</body></html>`;
}

module.exports = { buildPartnerReport, renderPartnerReportHTML, suppressColumn, MIN_GROUP };
