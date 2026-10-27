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

export const PROTOTYPE_TOOLS = new Set(['BillRescue', 'SignalVsNoise', 'ScamRadar', 'UpsellShield', 'QuoteCheck', 'Giftology', 'FakeReviewDetective', 'DateNight', 'SomeoneSaidItBetter', 'MissingLink', 'ResearchDecoder', 'PlainTalk', 'CultureBriefing', 'FriendshipFadeAlerter', 'PartyArchitect', 'HeartOfTheMatter', 'HobbyMatch', 'PronounceItRight', 'MarkupDetective', 'BuyWise', 'MoneyDiplomat']);

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
  // Relationships in terracotta (owner, 2026-10-27, after red read as an
  // alert and dusty rose felt uncomfortable), deep teal as the one
  // contrasting colour.
  Relationships: {
    light: { field: '#fdf9f6', envelope: '#f7ede6', line: '#e8d3c6', card: '#ffffff', accent: '#9a4a2e', strong: '#5f2d1b', onStrong: '#fdf9f6', button: '#5f2d1b', buttonText: '#fdf9f6', x: '#2c6a73', xText: '#225860', xLine: '#bcd9dc' },
    dark:  { field: '#221a16', envelope: '#2c211b', line: '#4c3a30', card: '#1e1714', accent: '#e4a98e', strong: '#f3dacd', onStrong: '#221a16', button: '#f3dacd', buttonText: '#221a16', x: '#7fc4cc', xText: '#a3d6dc', xLine: '#2e5257' },
  },
  // The other seven (owner, 2026-10-27: "as distinct from the others as
  // possible"): hues spread round the wheel away from sage, honey and
  // terracotta; text contrast >= 5.4:1 light and dark.
  'Home & Daily Life': { // warm graphite
    light: { field: '#fbfbfb', envelope: '#f2f1f0', line: '#d8d6d5', card: '#ffffff', accent: '#605c57', strong: '#3b3835', onStrong: '#fbfbfb', button: '#3b3835', buttonText: '#fbfbfb', x: '#2c6a73', xText: '#2c6a73', xLine: '#c8e6ea' },
    dark:  { field: '#1d1c1b', envelope: '#262524', line: '#444241', card: '#191818', accent: '#c1bdb9', strong: '#e2e1de', onStrong: '#1d1c1b', button: '#e2e1de', buttonText: '#1d1c1b', x: '#7fc4cc', xText: '#7fc4cc', xLine: '#2d4f53' },
  },
  'Travel & Events': { // teal
    light: { field: '#f9fcfd', envelope: '#ecf5f6', line: '#cadfe2', card: '#ffffff', accent: '#2f6b74', strong: '#1d4c53', onStrong: '#f9fcfd', button: '#1d4c53', buttonText: '#f9fcfd', x: '#a8462c', xText: '#a8462c', xLine: '#eacfc8' },
    dark:  { field: '#172021', envelope: '#1e2a2c', line: '#364b4e', card: '#141b1d', accent: '#9cd5de', strong: '#d0edf1', onStrong: '#172021', button: '#d0edf1', buttonText: '#172021', x: '#eba38e', xText: '#eba38e', xLine: '#53352d' },
  },
  'Career and Business': { // indigo
    light: { field: '#fafafd', envelope: '#edecf6', line: '#cdcbe1', card: '#ffffff', accent: '#3e397f', strong: '#232050', onStrong: '#fafafd', button: '#232050', buttonText: '#fafafd', x: '#a8462c', xText: '#a8462c', xLine: '#eacfc8' },
    dark:  { field: '#181821', envelope: '#201f2b', line: '#39384d', card: '#15141c', accent: '#a39fdb', strong: '#d3d1f0', onStrong: '#181821', button: '#d3d1f0', buttonText: '#181821', x: '#eba38e', xText: '#eba38e', xLine: '#53352d' },
  },
  'Health & Wellness': { // jade
    light: { field: '#f9fdfb', envelope: '#ecf6f1', line: '#cae2d7', card: '#ffffff', accent: '#2c6d4f', strong: '#1d533a', onStrong: '#f9fdfb', button: '#1d533a', buttonText: '#f9fdfb', x: '#a23e5c', xText: '#a23e5c', xLine: '#eac8d2' },
    dark:  { field: '#17211c', envelope: '#1e2c25', line: '#364e43', card: '#141d19', accent: '#9cdebf', strong: '#d0f1e2', onStrong: '#17211c', button: '#d0f1e2', buttonText: '#17211c', x: '#e08aa5', xText: '#e08aa5', xLine: '#532d39' },
  },
  'Conversations': { // violet
    light: { field: '#fbfafd', envelope: '#f2edf5', line: '#d8cce0', card: '#ffffff', accent: '#623d7b', strong: '#3c234e', onStrong: '#fbfafd', button: '#3c234e', buttonText: '#fbfafd', x: '#2c6a73', xText: '#2c6a73', xLine: '#c8e6ea' },
    dark:  { field: '#1d1820', envelope: '#26202a', line: '#44394c', card: '#19151c', accent: '#c2a2d7', strong: '#e3d3ee', onStrong: '#1d1820', button: '#e3d3ee', buttonText: '#1d1820', x: '#7fc4cc', xText: '#7fc4cc', xLine: '#2d4f53' },
  },
  'Ideas & Diversions': { // orchid
    light: { field: '#fcfafc', envelope: '#f5edf3', line: '#dfcdda', card: '#ffffff', accent: '#793f67', strong: '#4c2440', onStrong: '#fcfafc', button: '#4c2440', buttonText: '#fcfafc', x: '#2c6a73', xText: '#2c6a73', xLine: '#c8e6ea' },
    dark:  { field: '#20181e', envelope: '#2a2027', line: '#4b3946', card: '#1b151a', accent: '#d6a4c7', strong: '#edd4e5', onStrong: '#20181e', button: '#edd4e5', buttonText: '#20181e', x: '#7fc4cc', xText: '#7fc4cc', xLine: '#2d4f53' },
  },
  'Decisions': { // blue
    light: { field: '#f9fbfd', envelope: '#ecf0f6', line: '#cad5e2', card: '#ffffff', accent: '#355782', strong: '#1d3553', onStrong: '#f9fbfd', button: '#1d3553', buttonText: '#f9fbfd', x: '#a8462c', xText: '#a8462c', xLine: '#eacfc8' },
    dark:  { field: '#171b21', envelope: '#1e242c', line: '#36414e', card: '#14181d', accent: '#9cb8de', strong: '#d0def1', onStrong: '#171b21', button: '#d0def1', buttonText: '#171b21', x: '#eba38e', xText: '#eba38e', xLine: '#53352d' },
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
