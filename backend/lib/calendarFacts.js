// Calendar facts computed in code (2026-10-07).
//
// Ticket Tackler handed a visitor "was Sept 22 the 4th Tuesday?" to check —
// a question a calendar answers with certainty. Street-cleaning, permit and
// meter rules turn on exactly these facts (2nd & 4th Tuesday, weekday vs
// weekend), so the dates in the case are resolved here and given to the
// model as established facts instead of left for it to guess or punt.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORD = ['1st', '2nd', '3rd', '4th', '5th'];

function describe(d) {
  const nth = Math.floor((d.getUTCDate() - 1) / 7);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7)).getUTCMonth() !== d.getUTCMonth();
  const name = `${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  return `${name} is a ${DAYS[d.getUTCDay()]} — the ${ORD[nth]} ${DAYS[d.getUTCDay()]} of the month${last ? ` (and the last one)` : ''}.`;
}

/** Every date found in the texts, described; `defaultYear` fills dates written without a year. */
function calendarFacts(texts, defaultYear = new Date().getUTCFullYear()) {
  const found = new Map();
  const add = (y, m, d) => {
    if (m < 0 || m > 11 || d < 1 || d > 31) return;
    const dt = new Date(Date.UTC(y, m, d));
    if (dt.getUTCMonth() !== m) return;
    found.set(dt.getTime(), dt);
  };
  for (const t of texts.filter(Boolean).map(String)) {
    for (const m of t.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g)) {
      const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
      add(y, Number(m[1]) - 1, Number(m[2]));
    }
    for (const m of t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/gi)) {
      const mi = MONTHS.findIndex(x => x.startsWith(m[1].toLowerCase().slice(0, 3)));
      add(m[3] ? Number(m[3]) : defaultYear, mi, Number(m[2]));
    }
  }
  return [...found.values()].sort((a, b) => a - b).slice(0, 8).map(describe);
}

module.exports = { calendarFacts };
