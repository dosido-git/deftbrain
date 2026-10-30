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

export const PROTOTYPE_TOOLS = new Set(['BillRescue', 'SignalVsNoise', 'ScamRadar', 'UpsellShield', 'QuoteCheck', 'Giftology', 'FakeReviewDetective', 'DateNight', 'SomeoneSaidItBetter', 'MissingLink', 'ResearchDecoder', 'PlainTalk', 'CultureBriefing', 'FriendshipFadeAlerter', 'PartyArchitect', 'HeartOfTheMatter', 'HobbyMatch', 'PronounceItRight', 'MarkupDetective', 'BuyWise', 'MoneyDiplomat', 'AwkwardSilenceFiller', 'DriveHome', 'LayoverMaximizer', 'MicroAdventureMapper', 'AnalogyEngine', 'WhatsMyVibe', 'VelvetHammer', 'TruthBomb', 'ToastWriter', 'ComebackCooker', 'GratitudeDebtClearer', 'WhatsThatMean', 'NotSoFast']);

const SCHEMES = {
  // v3.0 (owner, 2026-10-29; docs/CATEGORY-COLOR-MAP-2.md): one ink per
  // category on warm neutral surfaces, midnight dark. Light ink, contrast,
  // border, rule and wash are the palette sheet's; tab, contrast border and
  // the midnight set use the formulas measured from Relationships.
  Money: { // olive
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#C3C4B7', card: '#FFFFFF', accent: '#4F5738', strong: '#4F5738', onStrong: '#FFFFFF', button: '#4F5738', buttonText: '#FFFFFF', border: '#878D78', wash: '#E9E8E1', tab: '#E4E3DC', text: '#1F1E1B', muted: '#4B5563', x: '#36295B', xText: '#36295B', xLine: '#CFCBD1' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#3D4140', card: '#101216', accent: '#A0A493', strong: '#A0A493', onStrong: '#14130F', button: '#A0A493', buttonText: '#14130F', border: '#666A64', wash: '#2E3237', tab: '#25282C', text: '#E8ECF2', muted: '#A1A1AA', x: '#BFBBCB', xText: '#BFBBCB', xLine: '#464750' },
  },
  Learning: { // aubergine
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#C7BCC6', card: '#FFFFFF', accent: '#5A3D6A', strong: '#5A3D6A', onStrong: '#FFFFFF', button: '#5A3D6A', buttonText: '#FFFFFF', border: '#8F7B9A', wash: '#EAE6E5', tab: '#E6E1E1', text: '#1F1E1B', muted: '#4B5563', x: '#3B5B29', xText: '#3B5B29', xLine: '#D0D5C7' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#413F49', card: '#101216', accent: '#AC9DB4', strong: '#AC9DB4', onStrong: '#14130F', button: '#AC9DB4', buttonText: '#14130F', border: '#6C6676', wash: '#30323B', tab: '#26272F', text: '#E8ECF2', muted: '#A1A1AA', x: '#C2CBBB', xText: '#C2CBBB', xLine: '#474C4B' },
  },
  // Relationships in raspberry (owner, 2026-10-29: serious, restrained;
  // warm neutral surfaces, one deep ink, deep green as the one contrasting
  // colour). Midnight dark mode. Source: docs/CATEGORY-COLOR-MAP-2.md v3.0.
  // `accent` (small text, outline controls) is the ink; `border` is the
  // medium shade for panel borders and chips (ink would shout there).
  Relationships: {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#D5BAC0', card: '#FFFFFF', accent: '#8A3556', strong: '#8A3556', onStrong: '#FFFFFF', button: '#8A3556', buttonText: '#FFFFFF', border: '#AF768C', wash: '#EEE6E3', tab: '#EAE0DF', text: '#1F1E1B', muted: '#4B5563', x: '#295B48', xText: '#295B48', xLine: '#C5D6CF' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#473D46', card: '#101216', accent: '#C296A7', strong: '#C296A7', onStrong: '#14130F', button: '#C296A7', buttonText: '#14130F', border: '#79626F', wash: '#33313A', tab: '#28262E', text: '#E8ECF2', muted: '#A1A1AA', x: '#BBCBC4', xText: '#BBCBC4', xLine: '#475651' },
  },
  // The other seven (owner, 2026-10-27: "as distinct from the others as
  // possible"): hues spread round the wheel away from sage, honey and
  // terracotta; text contrast >= 5.4:1 light and dark.
  'Home & Daily Life': { // warm graphite
    light: { field: '#fbfbfb', envelope: '#f2f1f0', line: '#d8d6d5', card: '#ffffff', accent: '#605c57', strong: '#3b3835', onStrong: '#fbfbfb', button: '#3b3835', buttonText: '#fbfbfb', x: '#2c6a73', xText: '#2c6a73', xLine: '#c8e6ea' },
    dark:  { field: '#1d1c1b', envelope: '#262524', line: '#444241', card: '#191818', accent: '#c1bdb9', strong: '#e2e1de', onStrong: '#1d1c1b', button: '#e2e1de', buttonText: '#1d1c1b', x: '#7fc4cc', xText: '#7fc4cc', xLine: '#2d4f53' },
  },
  // Travel & Events in pine, Conversations in deep teal (owner, 2026-10-29:
  // v3.0, midnight dark). Light ink, contrast, border, rule and wash are the
  // palette sheet's (docs/CATEGORY-COLOR-MAP-2.md); tab, contrast border and
  // the midnight set use the formulas measured from Relationships.
  'Travel & Events': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#B9C5BB', card: '#FFFFFF', accent: '#2D5A44', strong: '#2D5A44', onStrong: '#FFFFFF', button: '#2D5A44', buttonText: '#FFFFFF', border: '#708F80', wash: '#E7E8E2', tab: '#E1E4DD', text: '#1F1E1B', muted: '#4B5563', x: '#5B2942', xText: '#5B2942', xLine: '#D6CBCC' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#394243', card: '#101216', accent: '#90A89C', strong: '#90A89C', onStrong: '#14130F', button: '#90A89C', buttonText: '#14130F', border: '#5D6C69', wash: '#2D3339', tab: '#23282C', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBBBC4', xText: '#CBBBC4', xLine: '#49474E' },
  },
  'Career and Business': { // indigo
    light: { field: '#fafafd', envelope: '#edecf6', line: '#cdcbe1', card: '#ffffff', accent: '#3e397f', strong: '#232050', onStrong: '#fafafd', button: '#232050', buttonText: '#fafafd', x: '#a8462c', xText: '#a8462c', xLine: '#eacfc8' },
    dark:  { field: '#181821', envelope: '#201f2b', line: '#39384d', card: '#15141c', accent: '#a39fdb', strong: '#d3d1f0', onStrong: '#181821', button: '#d3d1f0', buttonText: '#181821', x: '#eba38e', xText: '#eba38e', xLine: '#53352d' },
  },
  'Health & Wellness': { // jade
    light: { field: '#f9fdfb', envelope: '#ecf6f1', line: '#cae2d7', card: '#ffffff', accent: '#2c6d4f', strong: '#1d533a', onStrong: '#f9fdfb', button: '#1d533a', buttonText: '#f9fdfb', x: '#a23e5c', xText: '#a23e5c', xLine: '#eac8d2' },
    dark:  { field: '#17211c', envelope: '#1e2c25', line: '#364e43', card: '#141d19', accent: '#9cdebf', strong: '#d0f1e2', onStrong: '#17211c', button: '#d0f1e2', buttonText: '#17211c', x: '#e08aa5', xText: '#e08aa5', xLine: '#532d39' },
  },
  'Conversations': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#B5C5C2', card: '#FFFFFF', accent: '#1F5A5C', strong: '#1F5A5C', onStrong: '#FFFFFF', button: '#1F5A5C', buttonText: '#FFFFFF', border: '#678F90', wash: '#E6E8E4', tab: '#E0E4DF', text: '#1F1E1B', muted: '#4B5563', x: '#5B2B29', xText: '#5B2B29', xLine: '#D6CBC7' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#374246', card: '#101216', accent: '#89A8A9', strong: '#89A8A9', onStrong: '#14130F', button: '#89A8A9', buttonText: '#14130F', border: '#596C70', wash: '#2C333A', tab: '#22282E', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBBBBB', xText: '#CBBBBB', xLine: '#49474C' },
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
