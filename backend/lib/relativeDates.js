// relativeDates — resolve a relative deadline against the day it was written
// (2026-10-17, T2 in audit/DEFECT-TYPES.md: dates are arithmetic, and
// arithmetic belongs in code).
//
// "Report by today 17:00" means the day the email was SENT, not the day it was
// pasted. Email Urgency Triager read every relative word against the reader's
// clock, so a Thursday "today" pasted on Saturday came out as due now, not two
// days overdue. The model's only job is to copy what the message says (the
// sent date as printed, the deadline phrase sorted into a kind); this file
// turns that into a calendar date and a status.
//
// Dates are plain 'YYYY-MM-DD' strings in the reader's own calendar; no time
// zones are converted (a sent header's zone is often absent, and a deadline is
// a day-level promise far more often than a minute-level one).

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ymd = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const parseYmd = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const onOrAfter = (d, weekday) => addDays(d, (weekday - d.getUTCDay() + 7) % 7);

// The reader's today, and the time now, in their own time zone.
function todayIn(timeZone, now = new Date()) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now).map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` };
  } catch {
    return { date: ymd(now), time: now.toISOString().slice(11, 16) };
  }
}

// deadline: { kind, weekday?, date?, time? } as the model sorted the phrase —
//   same_day | next_day | end_of_week | weekday | date | none
// anchor: the day it was written ('YYYY-MM-DD'), or null when unknown.
// Returns { date, time, anchored } or null when there is nothing to resolve.
function resolveDeadline(deadline, anchor, today) {
  if (!deadline || !deadline.kind || deadline.kind === 'none') return null;
  const base = parseYmd(anchor) || parseYmd(today);
  if (!base) return null;
  const time = /^\d{1,2}:\d{2}$/.test(String(deadline.time || '')) ? String(deadline.time).padStart(5, '0') : null;
  let d = null;
  switch (deadline.kind) {
    case 'same_day': d = base; break;
    case 'next_day': d = addDays(base, 1); break;
    // End of the working week: the Friday on or after the day it was written.
    case 'end_of_week': d = onOrAfter(base, 5); break;
    case 'weekday': {
      const w = WEEKDAYS.indexOf(String(deadline.weekday || '').toLowerCase());
      if (w < 0) return null;
      d = onOrAfter(base, w);
      break;
    }
    case 'date': d = parseYmd(deadline.date); break;
    default: return null;
  }
  return d ? { date: ymd(d), time, anchored: Boolean(parseYmd(anchor)) } : null;
}

// overdue | today | upcoming, against the reader's today (and time, when the
// deadline has one and falls today).
function deadlineStatus(resolved, today) {
  if (!resolved) return null;
  if (resolved.date < today.date) return 'overdue';
  if (resolved.date > today.date) return 'upcoming';
  if (resolved.time && today.time && resolved.time < today.time) return 'overdue';
  return 'today';
}

const daysBetween = (a, b) => {
  const x = parseYmd(a), y = parseYmd(b);
  return x && y ? Math.round((y - x) / 86400000) : null;
};
const weekdayOf = (s) => { const d = parseYmd(s); return d ? WEEKDAYS[d.getUTCDay()] : null; };

module.exports = { todayIn, resolveDeadline, deadlineStatus, daysBetween, weekdayOf };
