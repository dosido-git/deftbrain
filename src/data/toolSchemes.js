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

export const PROTOTYPE_TOOLS = new Set(['BillRescue', 'SignalVsNoise', 'ScamRadar', 'UpsellShield', 'QuoteCheck', 'Giftology', 'FakeReviewDetective', 'DateNight', 'SomeoneSaidItBetter', 'MissingLink', 'ResearchDecoder', 'PlainTalk', 'CultureBriefing', 'FriendshipFadeAlerter', 'PartyArchitect', 'HeartOfTheMatter', 'HobbyMatch', 'PronounceItRight', 'MarkupDetective', 'BuyWise', 'MoneyDiplomat', 'AwkwardSilenceFiller', 'DriveHome', 'LayoverMaximizer', 'MicroAdventureMapper', 'AnalogyEngine', 'WhatsMyVibe', 'VelvetHammer', 'TruthBomb', 'ToastWriter', 'ComebackCooker', 'GratitudeDebtClearer', 'WhatsThatMean', 'NotSoFast', 'ContextCollapse', 'ConflictCoach', 'DecoderRing', 'MagicMouth', 'NerveCheck', 'ReadTheRoom', 'ComplaintEscalationWriter', 'DifficultTalkCoach', 'TheFinalWord', 'Mend', 'BreakMyPlan', 'SmallChangeBigDifference', 'WhichLife', 'DecisionPrism', 'DecisionCoach', 'TicketTackler', 'BeliefStressTest', 'TipOfTongue', 'AlternatePath', 'PlotHoleFinder', 'FanTheory', 'TimeWarp', 'WrongAnswersOnly', 'Bookmark', 'ArgueSmarter', 'HistoryToday', 'SixDegreesOfMe', 'BrainRoulette', 'ContractDecoder', 'ToolFinder', 'WhereDidTheTimeGo', 'DocumentDetective', 'MiseEnPlace', 'CaptionMagic', 'BatchFlow', 'FinalWish', 'BikeMedic', 'PlantRescue', 'LeaseTrapDetector', 'RecipeChaosSolver', 'WaitingModeLiberator', 'SafeWalk', 'RoommateCourt', 'RentersDepositSaver', 'LaundroMat', 'PaperworkPath', 'ConceptCoach', 'FutureProof', 'GetNoticed', 'BeforeHello', 'ColdOpenCraft', 'HecklerPrep', 'TheRunthrough', 'RoastMe', 'TheDebrief', 'TheWholeStory', 'GhostWriter', 'SkillGapMap', 'BragSheetBuilder', 'NameAudit', 'NameStorm', 'MeetingHijackStopper', 'EmailUrgencyTriager', 'LeverageLogic', 'JustifyMyMeeting', 'MentalHealthNavigator', 'GriefGuide', 'SleepArchitect', 'DoctorVisitPrep', 'ProcedureProbe', 'NameThatFeeling', 'SocialBatteryAdvisor', 'PEP', 'LazyWorkoutAdapter', 'FocusSoundArchitect', 'FocusPocus', 'TaskAvalancheBreaker', 'PetBehaviorDecoder', 'BeforeTheCrash', 'DreamPatternSpotter', 'DoctorVisitTranslator', 'TripRecon', 'ChaosPilot', 'VirtualBodyDouble', 'BrainDumpBuddy', 'GentlePushGenerator', 'BrainStateDeejay']);

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
  // v3.0 for the rest (owner, 2026-10-29): Home graphite, Career navy, Health
  // leaf green, Ideas ochre, Decisions copper. Light values from the palette
  // sheet (Home's graphite has none there, so all of it is from the formulas).
  'Home & Daily Life': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#BFBFBD', card: '#FFFFFF', accent: '#40454C', strong: '#40454C', onStrong: '#FFFFFF', button: '#40454C', buttonText: '#FFFFFF', border: '#7F8285', wash: '#E8E7E3', tab: '#E3E2DE', text: '#1F1E1B', muted: '#4B5563', x: '#5B4629', xText: '#5B4629', xLine: '#D6D0C7' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#3D4045', card: '#101216', accent: '#A0A2A6', strong: '#A0A2A6', onStrong: '#14130F', button: '#A0A2A6', buttonText: '#14130F', border: '#66696E', wash: '#2E323A', tab: '#25282D', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBC4BB', xText: '#CBC4BB', xLine: '#494A4B' },
  },
  // Travel & Events in pine, Conversations in deep teal (owner, 2026-10-29:
  // v3.0, midnight dark). Light ink, contrast, border, rule and wash are the
  // palette sheet's (docs/CATEGORY-COLOR-MAP-2.md); tab, contrast border and
  // the midnight set use the formulas measured from Relationships.
  'Travel & Events': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#B9C5BB', card: '#FFFFFF', accent: '#2D5A44', strong: '#2D5A44', onStrong: '#FFFFFF', button: '#2D5A44', buttonText: '#FFFFFF', border: '#708F80', wash: '#E7E8E2', tab: '#E1E4DD', text: '#1F1E1B', muted: '#4B5563', x: '#5B2942', xText: '#5B2942', xLine: '#D6CBCC' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#394243', card: '#101216', accent: '#90A89C', strong: '#90A89C', onStrong: '#14130F', button: '#90A89C', buttonText: '#14130F', border: '#5D6C69', wash: '#2D3339', tab: '#23282C', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBBBC4', xText: '#CBBBC4', xLine: '#49474E' },
  },
  'Career and Business': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#B7BBC2', card: '#FFFFFF', accent: '#27395A', strong: '#27395A', onStrong: '#FFFFFF', button: '#27395A', buttonText: '#FFFFFF', border: '#6C788F', wash: '#E7E6E4', tab: '#E0E0DF', text: '#1F1E1B', muted: '#4B5563', x: '#5B4A29', xText: '#5B4A29', xLine: '#D6D1C7' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#3C4049', card: '#101216', accent: '#9AA3B2', strong: '#9AA3B2', onStrong: '#14130F', button: '#9AA3B2', buttonText: '#14130F', border: '#636975', wash: '#2E323B', tab: '#24282F', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBC5BB', xText: '#CBC5BB', xLine: '#494A4B' },
  },
  'Health & Wellness': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#BACBB3', card: '#FFFFFF', accent: '#2F6F2A', strong: '#2F6F2A', onStrong: '#FFFFFF', button: '#2F6F2A', buttonText: '#FFFFFF', border: '#729D6E', wash: '#E7EAE0', tab: '#E1E6DA', text: '#1F1E1B', muted: '#4B5563', x: '#58295B', xText: '#58295B', xLine: '#D6CBD1' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#36433C', card: '#101216', accent: '#87AC84', strong: '#87AC84', onStrong: '#14130F', button: '#87AC84', buttonText: '#14130F', border: '#586E5C', wash: '#2B3336', tab: '#22292A', text: '#E8ECF2', muted: '#A1A1AA', x: '#C9BBCB', xText: '#C9BBCB', xLine: '#494750' },
  },
  'Conversations': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#B5C5C2', card: '#FFFFFF', accent: '#1F5A5C', strong: '#1F5A5C', onStrong: '#FFFFFF', button: '#1F5A5C', buttonText: '#FFFFFF', border: '#678F90', wash: '#E6E8E4', tab: '#E0E4DF', text: '#1F1E1B', muted: '#4B5563', x: '#5B2B29', xText: '#5B2B29', xLine: '#D6CBC7' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#374246', card: '#101216', accent: '#89A8A9', strong: '#89A8A9', onStrong: '#14130F', button: '#89A8A9', buttonText: '#14130F', border: '#596C70', wash: '#2C333A', tab: '#22282E', text: '#E8ECF2', muted: '#A1A1AA', x: '#CBBBBB', xText: '#CBBBBB', xLine: '#49474C' },
  },
  'Ideas & Diversions': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#D0C6AA', card: '#FFFFFF', accent: '#7A5C0C', strong: '#7A5C0C', onStrong: '#FFFFFF', button: '#7A5C0C', buttonText: '#FFFFFF', border: '#A5905A', wash: '#ECE8DE', tab: '#E9E4D7', text: '#1F1E1B', muted: '#4B5563', x: '#29375B', xText: '#29375B', xLine: '#CCCDD1' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#424037', card: '#101216', accent: '#B2A173', strong: '#B2A173', onStrong: '#14130F', button: '#B2A173', buttonText: '#14130F', border: '#706852', wash: '#313234', tab: '#272728', text: '#E8ECF2', muted: '#A1A1AA', x: '#BBC0CB', xText: '#BBC0CB', xLine: '#454950' },
  },
  'Decisions': {
    light: { field: '#FBFAF7', envelope: '#F5F3EE', line: '#D9BFAE', card: '#FFFFFF', accent: '#984719', strong: '#984719', onStrong: '#FFFFFF', button: '#984719', buttonText: '#FFFFFF', border: '#B98263', wash: '#EEE7DF', tab: '#ECE2D9', text: '#1F1E1B', muted: '#4B5563', x: '#29495B', xText: '#29495B', xLine: '#CCD1D1' },
    dark:  { field: '#171A20', envelope: '#1F232B', line: '#483D3B', card: '#101216', accent: '#C6997F', strong: '#C6997F', onStrong: '#14130F', button: '#C6997F', buttonText: '#14130F', border: '#7B6459', wash: '#333135', tab: '#282729', text: '#E8ECF2', muted: '#A1A1AA', x: '#BBC6CB', xText: '#BBC6CB', xLine: '#454A50' },
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
