// src/i18n/locales/index.js
// ──────────────────────────────────────────────────────────────────────
// Catalog assembler. Base UI-chrome keys live in ./base.js; each fully
// localized tool contributes a per-language block from ./tools/<tool>.js.
// This module merges them into the i18next-shaped RESOURCES object.
//
// To localize a new tool:
//   1. Create src/i18n/locales/tools/<tool>.js exporting `export const <name> = { en: {...}, ... }`
//   2. Import it below and add it to TOOL_BLOCKS.
// The localization scripts (localization-audit.js, localization-smoke.js)
// auto-discover the tools/ directory, so they need no per-tool change.
// ──────────────────────────────────────────────────────────────────────

import { base } from './base';
import { subscriptionGuiltTrip } from './tools/subscription-guilt-trip';
import { markupDetective } from './tools/markup-detective';
import { subSweep } from './tools/sub-sweep';
import { billRescue } from './tools/bill-rescue';
import { buyWise } from './tools/buy-wise';
import { scamRadar } from './tools/scam-radar';
import { mentalHealthNavigator } from './tools/mental-health-navigator';
import { cultureBriefing } from './tools/culture-briefing';
import { procedureProbe } from './tools/procedure-probe';
import { dateNight } from './tools/date-night';
import { contractDecoder } from './tools/contract-decoder';
import { griefGuide } from './tools/grief-guide';
import { ideaAutopsy } from './tools/idea-autopsy';
import { sleepArchitect } from './tools/sleep-architect';
import { conflictCoach } from './tools/conflict-coach';
import { noiseCanceler } from './tools/noise-canceler';
import { decoderRing } from './tools/decoder-ring';
import { doctorVisitPrep } from './tools/doctor-visit-prep';
import { jargonAssassin } from './tools/jargon-assassin';
import { plantRescue } from './tools/plant-rescue';
import { decisionCoach } from './tools/decision-coach';
import { fakeReviewDetective } from './tools/fake-review-detective';
import { plainTalk } from './tools/plain-talk';
import { rechargeRadar } from './tools/recharge-radar';
import { debateMe } from './tools/debate-me';
import { roommateCourt } from './tools/roommate-court';
import { researchDecoder } from './tools/research-decoder';
import { petWeirdnessDecoder } from './tools/pet-weirdness-decoder';
import { gratitudeDebtClearer } from './tools/gratitude-debt-clearer';
import { bragSheetBuilder } from './tools/brag-sheet-builder';
import { complaintEscalationWriter } from './tools/complaint-escalation-writer';
import { nameStorm } from './tools/name-storm';
import { wardrobeChaosHelper } from './tools/wardrobe-chaos-helper';
import { difficultTalkCoach } from './tools/difficult-talk-coach';
import { doctorVisitTranslator } from './tools/doctor-visit-translator';
import { nerveCheck } from './tools/nerve-check';
import { velvetHammer } from './tools/velvet-hammer';
import { whatsMyVibe } from './tools/whats-my-vibe';
import { onePercenter } from './tools/one-percenter';
import { wrongAnswersOnly } from './tools/wrong-answers-only';
import { egoKiller } from './tools/ego-killer';
import { timeWarp } from './tools/time-warp';
import { luckSurface } from './tools/luck-surface';
import { signalVsNoise } from './tools/signal-vs-noise';
import { crowdWisdom } from './tools/crowd-wisdom';
import { hecklerPrep } from './tools/heckler-prep';
import { nameThatFeeling } from './tools/name-that-feeling';
import { roastMe } from './tools/roast-me';
import { beliefStressTest } from './tools/belief-stress-test';
import { truthBomb } from './tools/truth-bomb';
import { toastWriter } from './tools/toast-writer';
import { whereDidTheTimeGo } from './tools/where-did-the-time-go';
import { gravityWell } from './tools/gravity-well';
import { chaosPilot } from './tools/chaos-pilot';
import { alternatePath } from './tools/alternate-path';
import { whatIf } from './tools/what-if';
import { preMortem } from './tools/pre-mortem';
import { hobbyMatch } from './tools/hobby-match';
import { theAlibi } from './tools/the-alibi';
import { upsellShield } from './tools/upsell-shield';
import { plotHole } from './tools/plot-hole';
import { analogyEngine } from './tools/analogy-engine';
import { coldOpenCraft } from './tools/cold-open-craft';
import { partyArchitect } from './tools/party-architect';
import { rulebookBreaker } from './tools/rulebook-breaker';
import { comebackCooker } from './tools/comeback-cooker';
import { argumentSimulator } from './tools/argument-simulator';
import { fanTheory } from './tools/fan-theory';
import { giftology } from './tools/giftology';
import { futureProof } from './tools/future-proof';
import { contextCollapse } from './tools/context-collapse';

// Every fully-localized tool's block, merged on top of the base chrome keys.
const TOOL_BLOCKS = [
  subscriptionGuiltTrip,
  markupDetective,
  subSweep,
  billRescue,
  buyWise,
  scamRadar,
  mentalHealthNavigator,
  cultureBriefing,
  procedureProbe,
  dateNight,
  contractDecoder,
  griefGuide,
  ideaAutopsy,
  sleepArchitect,
  conflictCoach,
  noiseCanceler,
  decoderRing,
  doctorVisitPrep,
  jargonAssassin,
  plantRescue,
  decisionCoach,
  fakeReviewDetective,
  plainTalk,
  rechargeRadar,
  debateMe,
  roommateCourt,
  researchDecoder,
  petWeirdnessDecoder,
  gratitudeDebtClearer,
  bragSheetBuilder,
  complaintEscalationWriter,
  nameStorm,
  wardrobeChaosHelper,
  difficultTalkCoach,
  doctorVisitTranslator,
  nerveCheck,
  velvetHammer,
  whatsMyVibe,
  onePercenter,
  wrongAnswersOnly,
  egoKiller,
  timeWarp,
  luckSurface,
  signalVsNoise,
  crowdWisdom,
  hecklerPrep,
  nameThatFeeling,
  roastMe,
  beliefStressTest,
  truthBomb,
  toastWriter,
  whereDidTheTimeGo,
  gravityWell,
  chaosPilot,
  alternatePath,
  whatIf,
  preMortem,
  hobbyMatch,
  theAlibi,
  upsellShield,
  plotHole,
  analogyEngine,
  coldOpenCraft,
  partyArchitect,
  rulebookBreaker,
  comebackCooker,
  argumentSimulator,
  fanTheory,
  giftology,
  futureProof,
  contextCollapse,
];

const LANGS = Object.keys(base);

export const RESOURCES = Object.fromEntries(
  LANGS.map(lang => [
    lang,
    Object.assign({}, base[lang], ...TOOL_BLOCKS.map(block => block[lang] || {})),
  ])
);

export const SUPPORTED_LANGUAGES = Object.keys(RESOURCES);
