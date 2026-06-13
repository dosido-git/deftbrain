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
];

const LANGS = Object.keys(base);

export const RESOURCES = Object.fromEntries(
  LANGS.map(lang => [
    lang,
    Object.assign({}, base[lang], ...TOOL_BLOCKS.map(block => block[lang] || {})),
  ])
);

export const SUPPORTED_LANGUAGES = Object.keys(RESOURCES);
