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

export const PROTOTYPE_TOOLS = new Set(['BillRescue', 'SignalVsNoise']);

const SCHEMES = {
  // Restrained, like Learning below (owner, 2026-10-26). `x` is kept for one
  // job only: a real warning (an urgent or damaged status).
  Money: {
    light: { field: '#fcfdf9', envelope: '#f3f5ee', line: '#e4e3db', edge: '#c9c6bc', card: '#ffffff', accent: '#6b655c', strong: '#3f4a2e', onStrong: '#ffffff', button: '#3f4a2e', buttonText: '#ffffff', x: '#9a4a3a', xText: '#8a3f31', xLine: '#e8cfc8', text: '#2b2824', muted: '#6b655c' },
    dark:  { field: '#1c1e19', envelope: '#22251e', line: '#363a30', edge: '#4d5145', card: '#1c1e19', accent: '#a8a69c', strong: '#d5e0c4', onStrong: '#1c1e19', button: '#d5e0c4', buttonText: '#1c1e19', x: '#e0a093', xText: '#e8b3a8', xLine: '#5a342c', text: '#ece9e2', muted: '#a8a69c' },
  },
  // Restrained (owner, 2026-10-26: "orderly, calming, elegant, understated
  // but distinct"): the category shows in three places only — a whisper tint
  // on the panel, the title and section rules, and the one main button. Every
  // other colour is a shared warm neutral (text, muted, line, accent).
  Learning: {
    light: { field: '#fdfcf9', envelope: '#f8f4ea', line: '#e7e2d8', edge: '#cbc4b7', card: '#ffffff', accent: '#6b655c', strong: '#57471f', onStrong: '#ffffff', button: '#57471f', buttonText: '#ffffff', x: '#57471f', xText: '#57471f', xLine: '#e7e2d8', text: '#2b2824', muted: '#6b655c' },
    dark:  { field: '#1f1c17', envelope: '#26221b', line: '#3b362e', edge: '#524b40', card: '#1f1c17', accent: '#aaa398', strong: '#e5d6b0', onStrong: '#1f1c17', button: '#e5d6b0', buttonText: '#1f1c17', x: '#e5d6b0', xText: '#e5d6b0', xLine: '#3b362e', text: '#ece8e1', muted: '#aaa398' },
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
