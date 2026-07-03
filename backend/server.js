// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { anthropic } = require('./lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('./lib/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Middleware ──
app.use(cors(
  IS_PRODUCTION
    ? { origin: ['https://deftbrain.com', 'https://www.deftbrain.com'] }
    : {}
));
app.use(express.json({ limit: '50mb' }));

// ── Crawler request logging ──
// One stdout line per search-engine-bot request (shows in Railway logs). Exists so
// the NEXT indexing incident is diagnosable from our side: GSC's crawl-stats window
// is only 90 days and its exports are samples. UA matching is spoofable but fine
// for trend forensics; verify suspicious hits against Google's published IP ranges.
const BOT_UA = /Googlebot|Google-InspectionTool|bingbot|AdsBot|DuckDuckBot|Applebot/i;
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (BOT_UA.test(ua)) {
    res.on('finish', () => {
      console.log(`[bot] ${res.statusCode} ${req.method} ${req.originalUrl} ← ${ua.slice(0, 60)}`);
    });
  }
  next();
});

// ── Canonical host + protocol redirect (production) ──
// ONE hop to the canonical origin: http and/or www variants 301 straight to
// https://deftbrain.com. (Previously two chained middlewares: http://www.X
// hopped to https://www.X, then to the apex — a 2-hop chain Google flags.)
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') return next();
    const isHttp = req.headers['x-forwarded-proto'] !== 'https';
    const isWww  = req.hostname.startsWith('www.');
    if (isHttp || isWww) {
      return res.redirect(301, `https://deftbrain.com${req.url}`);
    }
    next();
  });
}

// ── Security headers (production) ──
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// ── Rate limiting ──
// Apply default rate limit to all API POST routes (the ones that call Claude)
app.use('/api', (req, res, next) => {
  // Only rate-limit POST requests (the ones that cost money)
  if (req.method !== 'POST') return next();
  rateLimit(DEFAULT_LIMITS)(req, res, next);
});

// ── Case-insensitive tool route redirect ──
// IDs are hardcoded here so this works in production where src/ is not deployed.
// To add a new tool: append its exact id from tools.js to TOOL_IDS below.
// Redirects /namestorm → /NameStorm, /plantrescue → /PlantRescue, etc.
const fs = require('fs');
const TOOL_IDS = [
  'AlternatePath','AnalogyEngine','ApologyCalibrator','ArgumentSimulator',
  'AwkwardSilenceFiller','BatchFlow','BeliefStressTest','BikeMedic',
  'BillRescue','Bookmark','BragSheetBuilder','BrainDumpBuddy','BrainRoulette',
  'BrainStateDeejay','BuyWise','CaptionMagic','ChaosPilot','ColdOpenCraft',
  'ComebackCooker','ComplaintEscalationWriter','ConflictCoach','ContextCollapse',
  'ContractDecoder','ContrastReport','CrashPredictor','CrisisPrioritizer','CrowdWisdom','CultureBriefing','DateNight',
  'DebateMe','DecisionCoach','DecoderRing','DifficultTalkCoach','DoctorVisitPrep','DoctorVisitTranslator',
'DreamPatternSpotter','DriveHome','EgoKiller','EmailUrgencyTriager','PEP',
  'FakeReviewDetective','FanTheory','FinalWish','FocusPocus','FocusSoundArchitect',
  'FriendshipFadeAlerter','FutureProof','GentlePushGenerator','GhostWriter',
  'Giftology','GratitudeDebtClearer','GravityWell','GriefGuide','HecklerPrep','HistoryToday','IdeaAutopsy',
  'HobbyMatch','JargonAssassin','LaundroMat','LayoverMaximizer','LazyWorkoutAdapter',
  'LeaseTrapDetector','LeverageLogic','LuckSurface','MagicMouth','MarkupDetective',
  'MeetingBSDetector','MeetingHijackPreventer','MentalHealthNavigator','MicroAdventureMapper','MiseEnPlace',
'MoneyDiplomat','NameAudit','NerveCheck','NameStorm','NameThatFeeling','NoiseCanceler',
  'OnePercenter','PartyArchitect','PetWeirdnessDecoder','PlainTalk',
  'PlantRescue','PlotHole','PlotTwist','PreMortem','ProcedureProbe','Recall',
'RecipeChaosSolver','RechargeRadar','RentersDepositSaver','ResearchDecoder','RoastMe','RoomReader','RoommateCourt',
 'RulebookBreaker','SafeWalk','ScamRadar','PronounceItRight','SensoryMinefieldMapper','SignalVsNoise',
  'SixDegreesOfMe','SkillGapMap','SleepArchitect','SocialEnergyAudit','SpiralStopper','SubSweep',
  'SubscriptionGuiltTrip','TaskAvalancheBreaker','TheAlibi','TheDebrief',
  'TheFinalWord','TheGap','TheRunthrough','TimeWarp','TipOfTongue','ToastWriter',
  'ToolFinder','TruthBomb','UpsellShield','VelvetHammer','VirtualBodyDouble',
  'WaitingModeLiberator','WardrobeChaosHelper','WhatIf','WhatsMyVibe',
  'WhereDidTheTimeGo','WrongAnswersOnly',
];
const toolIdMap = {};
TOOL_IDS.forEach(id => { toolIdMap[id.toLowerCase()] = id; });
console.log(`Tool ID map: ${Object.keys(toolIdMap).length} tools`);

// ── Retired tools → 410 Gone ──
// Tells Google these pages no longer exist (avoids soft-404 from homepage redirect).
// Add slug exactly as Google knows it (case-sensitive).
// Orphan tools (per RENAMES.md "Known orphans") that Google has crawled get
// added here so they're explicitly de-indexed instead of soft-404'd.
const RETIRED_SLUGS = [
  '/Impartial', '/Presenter', '/TheNetwork',
  '/GradeGraveyard', '/PDF-Fixer',
  '/LedeBuilder', // internal content-pipeline tool; never meant to be public. De-index the soft-404 Google crawled.
];
RETIRED_SLUGS.forEach(slug => {
  app.get(slug, (req, res) => res.status(410).send('This tool has been retired.'));
});

// ── Legacy /tool/ route redirects ──
const LEGACY_REDIRECTS = {
  // Legacy /tool/ routes
 '/tool/renters-deposit-saver': '/RentersDepositSaver',
 '/tool/bill-rescue':           '/BillRescue',

  // Renamed tools (existing)
  '/SayItRight':                 '/PronounceItRight',
  '/WhatIfMachine':              '/WhatIf',
  '/PlotHole':                   '/PlotTwist',
  '/RoommateCourtroom':          '/RoommateCourt',
  '/FridgeAlchemy':              '/MiseEnPlace',
  '/FoodSwap':                   '/MiseEnPlace',
  '/TimeVanishingExplainer':     '/WhereDidTheTimeGo',
  '/WhereDidItGo':               '/WhereDidTheTimeGo',
  '/PaperDigest':               '/ResearchDecoder',
  '/DopamineMenuBuilder':               '/PEP',
  '/MoneyMoves':                 '/MoneyDiplomat',

  // Renamed tools (new — were "no server.js redirect (added pre-launch)" in RENAMES.md)
  '/BillGuiltEraser':            '/BillRescue',
  '/BrainDumpStructurer':        '/BrainDumpBuddy',
  '/BurnoutBreadcrumbTracker':   '/PEP',
  '/ConfrontationCoach':         '/ConflictCoach',
  '/ConflictTextCoach':          '/ConflictCoach',
  '/DifficultTalkRehearser':     '/DifficultTalkCoach',
  '/LeftoverRoulette':           '/MiseEnPlace',
  '/RoutineRuptureManager':      '/PEP',
  '/SocialBatteryForecaster':    '/SocialEnergyAudit',
  '/SpoonBudgeter':              '/PEP',

  // Kebab-case variants Google has crawled. The case-insensitive middleware
  // below normalizes /Ego-Killer → /EgoKiller, but only for slugs whose
  // dash-stripped form is in TOOL_IDS. For renamed tools (whose old name
  // is no longer a current tool ID), kebab variants need explicit entries.
  '/say-it-right':               '/PronounceItRight',
  '/where-did-it-go':            '/WhereDidTheTimeGo',
};
Object.entries(LEGACY_REDIRECTS).forEach(([from, to]) => {
  app.get(from, (req, res) => res.redirect(301, to));
});

// ── Guide index pages ──
// These must come BEFORE the case-insensitive tool slug middleware below,
// so /guides isn't interpreted as a tool ID lookup.
// express.static with extensions:['html'] handles individual guide pages
// (/guides/{category}/{slug}) but does NOT auto-serve directory index files,
// so /guides, /guides/by-tool, and /guides/{category} need explicit routes.
//
// Each handler checks for the prerendered file and falls through to the
// React app's NotFound (404) when it's missing. This way, partial discovery
// rollouts don't return 5xx — categories without authored guides cleanly
// 404 until their index page is built.
function sendGuideIndexOr404(res, filePath) {
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).sendFile(path.join(__dirname, '..', 'build', 'index.html'));
}

app.get('/guides', (req, res) => {
  sendGuideIndexOr404(res, path.join(__dirname, '..', 'build', 'guides', 'index.html'));
});
app.get('/guides/by-tool', (req, res) => {
  sendGuideIndexOr404(res, path.join(__dirname, '..', 'build', 'guides', 'by-tool.html'));
});

// Per-category guide index pages
// Each /guides/{category} resolves to build/guides/{category}/index.html.
// Listed explicitly (rather than wildcard) so unknown categories fall through
// to a proper 404 instead of returning a misleading "OK" with empty content.
const GUIDE_CATEGORIES = [
  'apologies','career','conversations','cooking','decisions','health',
  'home','learning','meetings','money','pets','planning','practical',
  'presentations','speeches','travel','wellness','workplace'
];
GUIDE_CATEGORIES.forEach(cat => {
  app.get(`/guides/${cat}`, (req, res) => {
    sendGuideIndexOr404(res, path.join(__dirname, '..', 'build', 'guides', cat, 'index.html'));
  });
});

app.use((req, res, next) => {
  // Only apply to non-API, non-static asset paths
  if (req.path.startsWith('/api') || req.path.includes('.')) return next();
  // Skip /guides/* — these are not tool IDs
  if (req.path === '/guides' || req.path.startsWith('/guides/')) return next();
  const slug = req.path.replace(/^\//, '').replace(/\/$/, '');
  if (!slug) return next();       // skip homepage
  // Normalize: lowercase + strip dashes for kebab-case matching.
  // /ego-killer → 'egokiller' lookup → matches 'EgoKiller'.
  // /Plant-Rescue (typo) → 'plantrescue' lookup → matches 'PlantRescue'.
  const canonical = toolIdMap[slug.toLowerCase().replace(/-/g, '')];
  if (canonical && canonical !== slug) {
    res.set('Cache-Control', 'no-store');
    return res.redirect(301, `/${canonical}`);
  }
  next();
});

// ── Startup diagnostics ──
console.log('📁 Current directory:', __dirname);
console.log('🔑 API Key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES ✓' : 'NO ✗');
console.log('🌍 Environment:', IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT');

// ── Quick health-check / test endpoint ──
app.get('/api/test', async (req, res) => {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello!' }]
    });
    res.json({ success: true, response: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Mount all tool routes from /routes directory ──
const routes = require('./routes');
app.use('/api', routes);

// ── Dynamic endpoint listing ──
app.get('/api/endpoints', (req, res) => {
  const routeList = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routeList.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routeList.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: '/api' + handler.route.path,
          });
        }
      });
    }
  });
  res.json({ endpoints: routeList, count: routeList.length });
});

// ── Serve static build assets ──
// Hoisted out of the IS_PRODUCTION block so /guides/{category}/{slug} works
// in dev too (so we can locally test the guide URLs we just enabled).
// extensions: ['html'] serves prerendered flat files at clean URLs:
//   /SpiralStopper → build/SpiralStopper.html
//   /guides/workplace/how-to-stop-email-anxiety → build/guides/workplace/how-to-stop-email-anxiety.html
app.use(express.static(path.join(__dirname, '..', 'build'), {
  redirect: false,
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.includes(path.sep + 'guides' + path.sep) && filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
    }
  },
}));

// ── Serve React build (production) ──
if (IS_PRODUCTION) {
  // ── Trailing slash redirect — must be before catch-all ──
  // Prerendered tool pages are now flat files (build/ToolName.html) rather than
  // directories (build/ToolName/index.html), so static servers have no slash
  // variant to serve. This middleware handles any slash URLs that Google or
  // external links may have cached, redirecting them to the canonical form.
  app.use((req, res, next) => {
    if (req.path !== '/' && req.path.endsWith('/')) {
      const slug = req.path.slice(1, -1); // strip leading / and trailing /
      const canonical = toolIdMap[slug.toLowerCase()];
      const cleanPath = canonical ? `/${canonical}` : req.path.slice(0, -1);
      const query = req.url.slice(req.path.length);
      return res.redirect(301, cleanPath + query);
    }
    next();
  });

  app.get('*', (req, res) => {
    const slug = req.path.replace(/^\//, '');
    const canonical = slug ? toolIdMap[slug.toLowerCase()] : null;

    // If case doesn't match, redirect — never serve at the wrong URL
    if (canonical && canonical !== slug) {
      res.set('Cache-Control', 'no-store');
      return res.redirect(301, `/${canonical}`);
    }

    // Case already correct — serve prerendered flat file if it exists
    if (canonical) {
      const prerendered = path.join(__dirname, '..', 'build', `${canonical}.html`);
      if (fs.existsSync(prerendered)) return res.sendFile(prerendered);
    }

    // Homepage: serve React app with 200 OK
    if (req.path === '/') {
      return res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    }

    // Anything else falling through here was not matched by static files,
    // explicit guide routes, retired-tool slugs, or known tool IDs — serve
    // the React app with HTTP 404 status. React Router's catch-all renders
    // <NotFound />. The 404 status prevents soft-404s in Google Search Console.
    res.status(404).sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  });
}

// ── Global error handler ──
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Hit /api/endpoints for a full route listing\n`);
});
