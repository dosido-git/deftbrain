// src/hooks/useDocumentHead.js
// Lightweight per-page SEO: updates document title, meta tags, Open Graph, and Twitter Card.
// No external dependencies needed (replaces react-helmet).

import { useEffect } from 'react';

const SITE_NAME = 'DeftBrain — Intelligence on Demand';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 70+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';
const BASE_URL = 'https://deftbrain.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og/default.png`; // 1200×630 fallback

/**
 * Maps tool component IDs (from tools.js) to their OG image slugs.
 * Images live at /public/og/<slug>.png
 */
const TOOL_OG_SLUGS = {
  ToolFinder: 'tool-finder',
  CrowdWisdom: 'crowd-wisdom',
  FutureProof: 'future-proof',
  MarkupDetective: 'markup-detective',
  SignalVsNoise: 'signal-vs-noise',
  PreMortem: 'pre-mortem',
  ChaosPilot: 'chaos-pilot',
  OnePercenter: 'one-percenter',
  EgoKiller: 'ego-killer',
  BeliefStressTest: 'belief-stress-test',
  LuckSurface: 'luck-surface',
  GravityWell: 'gravity-well',
  RulebookBreaker: 'rulebook-breaker',
  TruthBomb: 'truth-bomb',
  AnalogyEngine: 'analogy-engine',
  ColdOpenCraft: 'cold-open-craft',
  ToastWriter: 'toast-writer',
  WhatIfMachine: 'what-if-machine',
  HobbyMatch: 'hobby-match',
  BeforeYouBook: 'before-you-book',
  UpsellShield: 'upsell-shield',
  HecklerPrep: 'heckler-prep',
  PartyArchitect: 'party-architect',
  WhereDidItGo: 'where-did-it-go',
  AntiGiftPanic: 'anti-gift-panic',
  AwkwardSilenceFiller: 'awkward-silence-filler',
  TipOfTongue: 'tip-of-tongue',
  MagicMouth: 'magic-mouth',
  NameThatFeeling: 'name-that-feeling',
  WhatsMyVibe: 'whats-my-vibe',
  TheRunthrough: 'the-runthrough',
  ContrastReport: 'contrast-report',
  ComebackCooker: 'comeback-cooker',
  AlternatePath: 'alternate-path',
  ArgumentSimulator: 'argument-simulator',
  PlotHole: 'plot-hole',
  FanTheory: 'fan-theory',
  RoastMe: 'roast-me',
  TimeWarp: 'time-warp',
  WrongAnswersOnly: 'wrong-answers-only',
  SocialEnergyAudit: 'social-energy-audit',
  SayItRight: 'say-it-right',
  TheDebrief: 'the-debrief',
  Recall: 'recall',
  TheAlibi: 'the-alibi',
  NoiseCanceler: 'noise-canceler',
  ContextCollapse: 'context-collapse',
  Bookmark: 'bookmark',
  DecoderRing: 'decoder-ring',
  PlotTwist: 'plot-twist',
  MiseEnPlace: 'mise-en-place',
  GhostWriter: 'ghost-writer',
  CaptionMagic: 'caption-magic',
  LazyWorkoutAdapter: 'lazy-workout-adapter',
  JargonAssassin: 'jargon-assassin',
  DebateMe: 'debate-me',
  PaperDigest: 'paper-digest',
  RoomReader: 'room-reader',
  MoneyDiplomat: 'money-diplomat',
  SkillGapMap: 'skill-gap-map',
  HistoryToday: 'history-today',
  BragSheetBuilder: 'brag-sheet-builder',
  LayoverMaximizer: 'layover-maximizer',
  TheFinalWord: 'the-final-word',
  NameAudit: 'name-audit',
  NameStorm: 'name-storm',
  GratitudeDebtClearer: 'gratitude-debt-clearer',
  DifficultTalkCoach: 'difficult-talk-coach',
  ComplaintEscalationWriter: 'complaint-escalation-writer',
  FocusSoundArchitect: 'focus-sound-architect',
  FocusPocus: 'focus-pocus',
  DecisionCoach: 'decision-coach',
  SixDegreesOfMe: 'six-degrees-of-me',
  FinalWish: 'final-wish',
  BikeMedic: 'bike-medic',
  ConflictCoach: 'conflict-coach',
  TaskAvalancheBreaker: 'task-avalanche-breaker',
  PetWeirdnessDecoder: 'pet-weirdness-decoder',
  FakeReviewDetective: 'fake-review-detective',
  CrashPredictor: 'crash-predictor',
  DreamPatternSpotter: 'dream-pattern-spotter',
  MeetingHijackPreventer: 'meeting-hijack-preventer',
  DoctorVisitTranslator: 'doctor-visit-translator',
  EmailUrgencyTriager: 'email-urgency-triager',
  LeaseTrapDetector: 'lease-trap-detector',
  FriendshipFadeAlerter: 'friendship-fade-alerter',
  SensoryMinefieldMapper: 'sensory-minefield-mapper',
  LeverageLogic: 'leverage-logic',
  MeetingBSDetector: 'meeting-b-s-detector',
  RecipeChaosSolver: 'recipe-chaos-solver',
  BillRescue: 'bill-rescue',
  SubSweep: 'sub-sweep',
  ApologyCalibrator: 'apology-calibrator',
  MicroAdventureMapper: 'micro-adventure-mapper',
  DateNight: 'date-night',
  CrisisPrioritizer: 'crisis-prioritizer',
  VirtualBodyDouble: 'virtual-body-double',
  WaitingModeLiberator: 'waiting-mode-liberator',
  BrainDumpStructurer: 'brain-dump-structurer',
  GentlePushGenerator: 'gentle-push-generator',
  BrainStateDeejay: 'brain-state-deejay',
  VelvetHammer: 'velvet-hammer',
  TheGap: 'the-gap',
  BuyWise: 'buy-wise',
  SafeWalk: 'safe-walk',
  RoommateCourt: 'roommate-court',
  RentersDepositSaver: 'renters-deposit-saver',
  LaundroMat: 'laundro-mat',
  DopamineMenuBuilder: 'dopamine-menu-builder',
  BatchFlow: 'batch-flow',
  PlainTalk: 'plain-talk',
  BrainRoulette: 'brain-roulette',
  WardrobeChaosHelper: 'wardrobe-chaos-helper',
  PlantRescue: 'plant-rescue',
  SpiralStopper: 'spiral-stopper',
  MoneyMoves: 'money-moves',
  NerveCheck: 'nerve-check',
  RechargeRadar: 'recharge-radar',
  SubscriptionGuiltTrip: 'subscription-guilt-trip',
};

/**
 * Returns the absolute OG image URL for a given tool ID, or the default.
 * @param {string} toolId - Tool component ID (e.g. 'PlantRescue')
 * @returns {string}
 */
export function getToolOgImage(toolId) {
  const slug = TOOL_OG_SLUGS[toolId];
  return slug ? `${BASE_URL}/og/${slug}.png` : DEFAULT_OG_IMAGE;
}

/**
 * Updates document <head> for SEO on each page.
 *
 * @param {Object} options
 * @param {string} options.title           - Page title (appended with site name)
 * @param {string} options.description     - Meta description for this page
 * @param {string} [options.canonicalPath] - Canonical URL path (e.g., '/PlantRescue')
 * @param {string} [options.toolId]        - Tool ID for automatic OG image lookup (e.g. 'BillRescue')
 * @param {string} [options.image]         - Override: absolute URL to OG image (1200×630).
 *                                           Falls back to toolId lookup, then DEFAULT_OG_IMAGE.
 *                                           Pass null to suppress all image tags.
 */
export function useDocumentHead({ title, description, canonicalPath, toolId, image } = {}) {
  useEffect(() => {
    // ── Title ──
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    // ── Meta description ──
    const desc = description || DEFAULT_DESCRIPTION;
    setMeta('description', desc);

    // ── Canonical URL ──
    const canonicalHref = canonicalPath
      ? `${BASE_URL}${canonicalPath}`
      : window.location.href;

    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', canonicalHref);

    // ── Resolve OG image ──
    // Explicit image prop → toolId lookup → site default. null = suppress all image tags.
    const resolvedImage = image !== undefined
      ? image
      : (toolId ? getToolOgImage(toolId) : DEFAULT_OG_IMAGE);

    // ── Open Graph ──
    setMeta('og:title',       fullTitle,     'property');
    setMeta('og:description', desc,          'property');
    setMeta('og:type',        'website',     'property');
    setMeta('og:site_name',   'DeftBrain',   'property');
    setMeta('og:url',         canonicalHref, 'property');

    if (resolvedImage !== null) {
      setMeta('og:image',        resolvedImage, 'property');
      setMeta('og:image:width',  '1200',        'property');
      setMeta('og:image:height', '630',         'property');
      setMeta('og:image:alt',    fullTitle,     'property');
    }

    // ── Twitter Card ──
    setMeta('twitter:card',        resolvedImage ? 'summary_large_image' : 'summary', 'name');
    setMeta('twitter:title',       fullTitle,   'name');
    setMeta('twitter:description', desc,        'name');
    setMeta('twitter:site',        '@deftbrain', 'name');

    if (resolvedImage) {
      setMeta('twitter:image',     resolvedImage, 'name');
      setMeta('twitter:image:alt', fullTitle,     'name');
    }

    // ── Cleanup: restore defaults on unmount ──
    return () => {
      document.title = SITE_NAME;
      setMeta('description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, canonicalPath, toolId, image]);
}

/**
 * Helper: create-or-update a <meta> tag in <head>.
 */
function setMeta(identifier, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${identifier}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, identifier);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default useDocumentHead;
