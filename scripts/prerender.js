// scripts/prerender.js
//
// Generates static HTML snapshots for every tool page + homepage.
// No headless browser needed — injects meta tags directly into the
// build/index.html template and writes per-route index.html files.
//
// How it works:
//   1. Reads build/index.html (the React shell)
//   2. Reads all tool IDs, titles, and descriptions from src/data/tools.js
//   3. For each tool, clones the shell and injects:
//        - <title>Tool Title | DeftBrain</title>
//        - <meta name="description"> with the tool's description
//        - Open Graph tags (og:title, og:description, og:url)
//        - <link rel="canonical">
//   4. Writes the result to build/{ToolId}/index.html
//
// Express's existing express.static() serves these files directly to crawlers.
// React still hydrates normally for real users — no change to runtime behavior.

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const BUILD_DIR  = path.join(__dirname, '..', 'build');
const TOOLS_FILE = path.join(__dirname, '..', 'src', 'data', 'tools.js');
const SITE_NAME  = 'DeftBrain';
const SITE_URL   = 'https://deftbrain.com';
const DEFAULT_DESCRIPTION = 'DeftBrain offers 100+ free AI-powered tools for productivity, communication, health, finance, and more. Get instant, intelligent help for real-life problems.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.png`;

// Must stay in sync with TOOL_OG_SLUGS in useDocumentHead.js
const TOOL_OG_SLUGS = {
  ToolFinder: 'tool-finder', CrowdWisdom: 'crowd-wisdom', FutureProof: 'future-proof',
  MarkupDetective: 'markup-detective', SignalVsNoise: 'signal-vs-noise', PreMortem: 'pre-mortem',
  ChaosPilot: 'chaos-pilot', OnePercenter: 'one-percenter', EgoKiller: 'ego-killer',
  BeliefStressTest: 'belief-stress-test', LuckSurface: 'luck-surface', GravityWell: 'gravity-well',
  RulebookBreaker: 'rulebook-breaker', TruthBomb: 'truth-bomb', AnalogyEngine: 'analogy-engine',
  ColdOpenCraft: 'cold-open-craft', ToastWriter: 'toast-writer', WhatIf: 'what-if-machine',
  HobbyMatch: 'hobby-match', BeforeYouBook: 'before-you-book', UpsellShield: 'upsell-shield',
  HecklerPrep: 'heckler-prep', PartyArchitect: 'party-architect', WhereDidItGo: 'where-did-it-go',
  AntiGiftPanic: 'anti-gift-panic', AwkwardSilenceFiller: 'awkward-silence-filler',
  TipOfTongue: 'tip-of-tongue', MagicMouth: 'magic-mouth', NameThatFeeling: 'name-that-feeling',
  WhatsMyVibe: 'whats-my-vibe', TheRunthrough: 'the-runthrough', ContrastReport: 'contrast-report',
  ComebackCooker: 'comeback-cooker', AlternatePath: 'alternate-path',
  ArgumentSimulator: 'argument-simulator', PlotHole: 'plot-hole', FanTheory: 'fan-theory',
  RoastMe: 'roast-me', TimeWarp: 'time-warp', WrongAnswersOnly: 'wrong-answers-only',
  SocialEnergyAudit: 'social-energy-audit', PronounceItRight: 'pronounce-it-right', TheDebrief: 'the-debrief',
  Recall: 'recall', TheAlibi: 'the-alibi', NoiseCanceler: 'noise-canceler',
  ContextCollapse: 'context-collapse', Bookmark: 'bookmark', DecoderRing: 'decoder-ring',
  PlotTwist: 'plot-twist', MiseEnPlace: 'mise-en-place', GhostWriter: 'ghost-writer',
  CaptionMagic: 'caption-magic', LazyWorkoutAdapter: 'lazy-workout-adapter',
  JargonAssassin: 'jargon-assassin', DebateMe: 'debate-me', ResearchDecoder: 'research-decoder',
  RoomReader: 'room-reader', MoneyDiplomat: 'money-diplomat', SkillGapMap: 'skill-gap-map',
  HistoryToday: 'history-today', BragSheetBuilder: 'brag-sheet-builder',
  LayoverMaximizer: 'layover-maximizer', TheFinalWord: 'the-final-word', NameAudit: 'name-audit',
  NameStorm: 'name-storm', GratitudeDebtClearer: 'gratitude-debt-clearer',
  DifficultTalkCoach: 'difficult-talk-coach', ComplaintEscalationWriter: 'complaint-escalation-writer',
  FocusSoundArchitect: 'focus-sound-architect', FocusPocus: 'focus-pocus',
  DecisionCoach: 'decision-coach', SixDegreesOfMe: 'six-degrees-of-me', FinalWish: 'final-wish',
  BikeMedic: 'bike-medic', ConflictCoach: 'conflict-coach',
  TaskAvalancheBreaker: 'task-avalanche-breaker', PetWeirdnessDecoder: 'pet-weirdness-decoder',
  FakeReviewDetective: 'fake-review-detective', CrashPredictor: 'crash-predictor',
  DreamPatternSpotter: 'dream-pattern-spotter', MeetingHijackPreventer: 'meeting-hijack-preventer',
  DoctorVisitTranslator: 'doctor-visit-translator', EmailUrgencyTriager: 'email-urgency-triager',
  LeaseTrapDetector: 'lease-trap-detector', FriendshipFadeAlerter: 'friendship-fade-alerter',
  SensoryMinefieldMapper: 'sensory-minefield-mapper', LeverageLogic: 'leverage-logic',
  MeetingBSDetector: 'meeting-b-s-detector', RecipeChaosSolver: 'recipe-chaos-solver',
  BillRescue: 'bill-rescue', SubSweep: 'sub-sweep', ApologyCalibrator: 'apology-calibrator',
  MicroAdventureMapper: 'micro-adventure-mapper', DateNight: 'date-night',
  CrisisPrioritizer: 'crisis-prioritizer', VirtualBodyDouble: 'virtual-body-double',
  WaitingModeLiberator: 'waiting-mode-liberator', BrainDumpStructurer: 'brain-dump-structurer',
  GentlePushGenerator: 'gentle-push-generator', BrainStateDeejay: 'brain-state-deejay',
  VelvetHammer: 'velvet-hammer', TheGap: 'the-gap', BuyWise: 'buy-wise', SafeWalk: 'safe-walk',
  RoommateCourt: 'roommate-court', RentersDepositSaver: 'renters-deposit-saver',
  LaundroMat: 'laundro-mat', DopamineMenuBuilder: 'dopamine-menu-builder', BatchFlow: 'batch-flow',
  PlainTalk: 'plain-talk', BrainRoulette: 'brain-roulette',
  WardrobeChaosHelper: 'wardrobe-chaos-helper', PlantRescue: 'plant-rescue',
  SpiralStopper: 'spiral-stopper', MoneyMoves: 'money-moves', NerveCheck: 'nerve-check',
  RechargeRadar: 'recharge-radar', SubscriptionGuiltTrip: 'subscription-guilt-trip',
};

function getOgImage(toolId) {
  const slug = TOOL_OG_SLUGS[toolId];
  return slug ? `${SITE_URL}/og/${slug}.png` : DEFAULT_OG_IMAGE;
}

// ─── Parse tools.js ───────────────────────────────────────────────────────────

function getTools() {
  const content = fs.readFileSync(TOOLS_FILE, 'utf8');
  const tools   = [];

  const titleRegex   = /\btitle:\s*['"]([^'"]+)['"]/;
  const descRegex    = /\bdescription:\s*['"`]([\s\S]*?)['"`]\s*(?:,|\n\s*\w)/;
  const taglineRegex = /\btagline:\s*['"]([^'"]+)['"]/;

  const idSearch = /\bid:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = idSearch.exec(content)) !== null) {
    const id = match[1];
    if (!id) continue;

    const windowStart = Math.max(0, match.index - 50);
    const windowEnd   = Math.min(content.length, match.index + 1500);
    const chunk       = content.slice(windowStart, windowEnd);

    const titleMatch   = titleRegex.exec(chunk);
    const descMatch    = descRegex.exec(chunk);
    const taglineMatch = taglineRegex.exec(chunk);

    const title       = titleMatch   ? titleMatch[1].trim() : id;
    const description = descMatch
      ? descMatch[1].replace(/\s+/g, ' ').replace(/\\n/g, ' ').trim().slice(0, 160)
      : DEFAULT_DESCRIPTION;
    const tagline     = taglineMatch ? taglineMatch[1].trim() : '';

    tools.push({ id, title, description, tagline });
  }

  // Remove duplicates — keep first occurrence
  const seen = new Set();
  return tools.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

// ─── HTML injection ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectMeta(template, { id, title, description }) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}/${id}`;
  const ogImage   = getOgImage(id);
  const safeTitle = escapeHtml(fullTitle);
  const safeDesc  = escapeHtml(description);
  const safeUrl   = escapeHtml(canonical);
  const safeImage = escapeHtml(ogImage);

  const metaBlock = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<link rel="canonical" href="${safeUrl}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${safeTitle}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
    `<meta name="twitter:site" content="@deftbrain" />`,
    `<meta name="author" content="DeftBrain.com" />`,
  ].join('\n    ');

  let html = template;

  // Strip existing tags that we'll replace with tool-specific versions
  html = html.replace(/<title>[^<]*<\/title>/gi, '');
  html = html.replace(/<meta\s+name="description"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="author"[^>]*>/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>/gi, '');
  html = html.replace('</head>', `    ${metaBlock}\n  </head>`);

  return html;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('build/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  const templatePath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('build/index.html not found.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const tools    = getTools();

  console.log(`\nPrerendering ${tools.length} tool pages...\n`);

  let succeeded = 0;
  let failed    = 0;

  for (const tool of tools) {
    try {
      const html = injectMeta(template, tool);
      const dir  = path.join(BUILD_DIR, tool.id);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      console.log(`  OK  /${tool.id}`);
      succeeded++;
    } catch (err) {
      console.error(`  FAIL  /${tool.id}  ->  ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${succeeded} pages generated, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main();
