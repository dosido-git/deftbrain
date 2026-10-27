// PROTOTYPE (2026-10-25, uncommitted): category colour schemes.
//
// Owner's rules: every tool takes its category's colour in four shades —
//   field     lightest  text boxes
//   envelope  light     the panel that wraps the whole tool, top to bottom
//   accent    medium    labels, outline controls, typed text
//   strong    dark      titles, filled controls
// plus `x`, a contrasting colour a tool may use for one special emphasis.
// "In a nutshell", the sample answer, related tools and the FAQ share one
// colour on every tool (NUTSHELL), so they read as "about the tool".
//
// Exposed as CSS variables (--sc-*, --nut-*) so one set of classes
// (bg-[var(--sc-field)] …) serves light and dark. Only tools in PROTOTYPE_TOOLS
// get a scheme; everything else renders exactly as before.

export const PROTOTYPE_TOOLS = new Set(['BillRescue', 'SignalVsNoise', 'ScamRadar', 'UpsellShield', 'QuoteCheck', 'Giftology', 'FakeReviewDetective', 'DateNight', 'SomeoneSaidItBetter', 'MissingLink', 'ResearchDecoder', 'PlainTalk']);

const SCHEMES = {
  Money: {
    light: { field: '#fafbf6', envelope: '#eef1e6', line: '#d3dac4', card: '#ffffff', accent: '#5f7150', strong: '#3d4a33', onStrong: '#fafbf6', button: '#3d4a33', buttonText: '#fafbf6', x: '#a23e5c', xText: '#7d2a44', xLine: '#e6bfcb' },
    dark:  { field: '#1b2018', envelope: '#232a1f', line: '#3a4433', card: '#1a1e17', accent: '#a9bd95', strong: '#d3e0c3', onStrong: '#1b2018', button: '#d3e0c3', buttonText: '#1b2018', x: '#e08aa5', xText: '#eba8bd', xLine: '#5e2c3c' },
  },
  // Learning in Bill Rescue's style (owner, 2026-10-26: the deployed Bill
  // Rescue over the restrained try): honey shades in the same four roles,
  // plum as the one contrasting colour.
  Learning: {
    light: { field: '#fdfbf4', envelope: '#f4eedd', line: '#e2d5b3', card: '#ffffff', accent: '#7a632c', strong: '#4c3d18', onStrong: '#fdfbf4', button: '#4c3d18', buttonText: '#fdfbf4', x: '#8a4a7a', xText: '#733d66', xLine: '#e4c8dc' },
    dark:  { field: '#211d13', envelope: '#2a2518', line: '#463d27', card: '#1d1a11', accent: '#d2bd8a', strong: '#ecdfbd', onStrong: '#211d13', button: '#ecdfbd', buttonText: '#211d13', x: '#d79ac6', xText: '#e2b2d5', xLine: '#553048' },
  },
  // Relationships in rose (owner, 2026-10-27: "a red or pink variation"),
  // deep teal as the one contrasting colour.
  Relationships: {
    light: { field: '#fdf8f9', envelope: '#f8ecee', line: '#ebd2d7', card: '#ffffff', accent: '#94445a', strong: '#5c2536', onStrong: '#fdf8f9', button: '#5c2536', buttonText: '#fdf8f9', x: '#2c6a73', xText: '#225860', xLine: '#bcd9dc' },
    dark:  { field: '#22171a', envelope: '#2c1d21', line: '#4b3038', card: '#1e1417', accent: '#e2a2b3', strong: '#f3d4dc', onStrong: '#22171a', button: '#f3d4dc', buttonText: '#22171a', x: '#7fc4cc', xText: '#a3d6dc', xLine: '#2e5257' },
  },
};

// Brand gold — the "Brain" in the logo (owner's pick, 2026-10-25): In a
// nutshell and the sample answer.
const NUTSHELL = {
  // Paler since 2026-10-26: it drew the eye away from the tool (owner).
  light: { bg: '#fcf8ef', line: '#efe3c6', head: '#6b4c12', label: '#8a6419', text: '#4a3c22', ctl: '#fdfaf3' },
  dark:  { bg: '#241f14', line: '#4a3c20', head: '#f0d9a3', label: '#d9b56a', text: '#eadfc6', ctl: '#352c18' },
};

// Ink teal: related guides and tools, below the tool.
const RELATED = {
  light: { bg: '#e3f0ef', line: '#bcdad7', head: '#123f3c', label: '#1f6661', text: '#16302e' },
  dark:  { bg: '#142826', line: '#2f514e', head: '#bfe3df', label: '#7cc4bd', text: '#d6ecea' },
};

// Restrained schemes (those with shared neutrals) keep the side panels
// neutral too: gold and teal beside a tinted panel was three colours where
// the page needs one (owner, 2026-10-26).
const QUIET = {
  light: { bg: '#ffffff', line: '#e7e2d8', head: '#2b2824', label: '#6b655c', text: '#3d3934', ctl: '#fdfcf9' },
  dark:  { bg: '#1d1b18', line: '#34302a', head: '#ece8e1', label: '#aaa398', text: '#d9d4cc', ctl: '#26231e' },
};
const isQuiet = (tool) => Boolean(SCHEMES[schemeCategory(tool)]?.light?.text);

const toVars = (prefix, o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [`--${prefix}-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`, v]));

export function nutshellStyle(isDark, tool) {
  return toVars('nut', (isQuiet(tool) ? QUIET : NUTSHELL)[isDark ? 'dark' : 'light']);
}

// Related links use the --nut-* names too, with ink-teal values.
export function relatedStyle(isDark, tool) {
  return toVars('nut', (isQuiet(tool) ? QUIET : RELATED)[isDark ? 'dark' : 'light']);
}

// The category whose colours a tool wears: its first category that has a
// scheme. shortcut: prototype has only Money, so Bill Rescue (listed
// Conversations first) wears Money; with all 14 schemes this is just [0].
export function schemeCategory(tool) {
  return (tool?.categories || []).find(cat => SCHEMES[cat]) || null;
}

// CSS variables for a tool's scheme, or null when it has none.
export function schemeStyle(tool, isDark) {
  if (!tool || !PROTOTYPE_TOOLS.has(tool.id)) return null;
  const s = SCHEMES[schemeCategory(tool)];
  if (!s) return null;
  return { ...toVars('sc', s[isDark ? 'dark' : 'light']), ...nutshellStyle(isDark, tool) };
}
