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

export const PROTOTYPE_TOOLS = new Set(['BillRescue']);

const SCHEMES = {
  Money: {
    light: { field: '#fafbf6', envelope: '#eef1e6', line: '#d3dac4', card: '#ffffff', accent: '#5f7150', strong: '#3d4a33', onStrong: '#fafbf6', x: '#a23e5c', xText: '#7d2a44', xLine: '#e6bfcb' },
    dark:  { field: '#1b2018', envelope: '#232a1f', line: '#3a4433', card: '#1a1e17', accent: '#a9bd95', strong: '#d3e0c3', onStrong: '#1b2018', x: '#e08aa5', xText: '#eba8bd', xLine: '#5e2c3c' },
  },
};

// Warm clay (owner's pick, 2026-10-25).
const NUTSHELL = {
  light: { bg: '#f6e9e2', line: '#e3c6b6', head: '#6e3420', label: '#8f4b30', text: '#3b2219', ctl: '#fbf3ee' },
  dark:  { bg: '#2c1d17', line: '#5c3a2c', head: '#f2c9b4', label: '#e0a283', text: '#ecdcd3', ctl: '#36241c' },
};

const toVars = (prefix, o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [`--${prefix}-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`, v]));

export function nutshellStyle(isDark) {
  return toVars('nut', NUTSHELL[isDark ? 'dark' : 'light']);
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
  return { ...toVars('sc', s[isDark ? 'dark' : 'light']), ...nutshellStyle(isDark) };
}
