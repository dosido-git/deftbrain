// Watches for quality audits going quiet.
//
// The audit waves are scheduled tasks in the Claude desktop app; a finished
// wave commits audit/QUALITY-AUDIT-YYYY-MM-DD.md, and the deploy carries the
// audit/ folder. So the newest report's date is the one signal that a wave
// actually completed — a run that starts and stalls leaves nothing behind.
// From 2026-08-29 to 2026-10-07 every run stalled on a permission prompt and
// nobody knew for five weeks. This checks every 15 minutes and emails once a
// day (09:00-09:14 New York time) while the newest report is too old.
const fs = require('fs');
const path = require('path');
const { reportAuditStale } = require('./alerts');

const AUDIT_DIR = path.join(__dirname, '..', '..', 'audit');
const STALE_DAYS = Number(process.env.AUDIT_STALE_DAYS) || 10;
const CHECK_MS = 15 * 60 * 1000;
const TZ = process.env.METRICS_TZ || 'America/New_York';
const REPORT = /^QUALITY-AUDIT-(\d{4}-\d{2}-\d{2})\.md$/;

function auditStatus(now = Date.now()) {
  let latest = null;
  try {
    for (const f of fs.readdirSync(AUDIT_DIR)) {
      const m = f.match(REPORT);
      if (m && (!latest || m[1] > latest)) latest = m[1];
    }
  } catch { /* no audit/ in this deploy — reported as missing */ }
  const ageDays = latest ? Math.floor((now - Date.parse(`${latest}T00:00:00Z`)) / 86400000) : null;
  return { latest, ageDays, threshold: STALE_DAYS, stale: latest === null || ageDays > STALE_DAYS };
}

let lastMailDay = null;
function check(now = Date.now()) {
  const status = auditStatus(now);
  if (!status.stale) return status;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: 'numeric', minute: 'numeric', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(now)).map(p => [p.type, p.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  if (Number(parts.hour) === 9 && Number(parts.minute) < 15 && lastMailDay !== day) {
    lastMailDay = day;
    reportAuditStale(status);
  }
  return status;
}

function startAuditWatch() {
  if (process.env.NODE_ENV !== 'production' || process.env.AUDIT_WATCH === 'off') return;
  setInterval(check, CHECK_MS).unref();
}

module.exports = { auditStatus, check, startAuditWatch };
