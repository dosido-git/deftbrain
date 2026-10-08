import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { tools } from '../data/tools';
import ToolPageWrapper from './ToolPageWrapper';
import ToolErrorBoundary from './ToolErrorBoundary';
import NotFound from './NotFound';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { useDocumentHead } from '../hooks/useDocumentHead';
import TOOL_OG_SLUGS from '../data/tool-og-slugs.json';
import PublicProductDemo from './PublicProductDemo';

// Renamed tools keep their old URL alive: old id → current id. A client-side
// 301-equivalent so existing links, bookmarks, and search results don't break.
const TOOL_ALIASES = {
  Recall: 'HeartOfTheMatter', // renamed 2026-07-22 (broadened beyond lectures), then 2026-09-13 (rebrand) — chain collapsed
  // TheCrux deliberately has NO alias here (owner decision, 2026-09-13):
  // unlike Recall, visiting /TheCrux now 404s rather than forwarding.
  CrisisPrioritizer: 'ChaosPilot', // renamed 2026-09-19
  // ChaosPilot (the old routine-disruption tool, now Rut Buster) deliberately
  // has NO alias here: /ChaosPilot is reused live by this tool, not vacated —
  // see audit/RENAMES.md.
  IdeaAutopsy: 'ConceptCoach', // renamed 2026-08-31
  LuckSurface: 'GetNoticed',   // renamed 2026-09-02
  MeetingBSDetector: 'JustifyMyMeeting', // renamed 2026-09-02
  MeetingHijackPreventer: 'MeetingHijackStopper', // renamed 2026-09-03
  NoiseCanceler: 'DocumentDetective', // renamed 2026-07-16, then 2026-09-04 (chain collapsed)
  CutToTheChase: 'DocumentDetective', // renamed 2026-09-04
  OnePercenter: 'SmallChangeBigDifference', // renamed 2026-09-05
  PetWeirdnessDecoder: 'PetBehaviorDecoder', // renamed 2026-09-06
  PlotHole: 'PlotHoleFinder', // renamed 2026-09-06
  PlotTwist: 'DecisionPrism', // renamed 2026-09-06
  PreMortem: 'BreakMyPlan', // renamed 2026-09-07
  SensoryMinefieldMapper: 'TripRecon', // renamed 2026-09-09, then 2026-09-09 again (chain collapsed)
  SensoryScout: 'TripRecon', // renamed 2026-09-09
};

// Static example-output SEO experiment (see src/data/tools.js's own
// exampleOutput field + PublicProductDemo.js). Cohort 1 (LeaseTrapDetector,
// DoctorVisitPrep, FakeReviewDetective — 2026-09-15) predates this shared
// component: each of those 3 already renders its own copy of this same demo
// inline in its own tools/*.js file, so they're deliberately NOT in this set
// — adding them here too would render the demo twice. Cohort 2 (added
// 2026-09-23) uses the shared component instead, rendered once below.
// Not part of the experiment: tools given a real example later, as page
// content in its own right (2026-10-07, "Discovered – not indexed" pages).
const EXAMPLE_OUTPUT_TOOLS = new Set([
  'WhatsThatMean', 'SomeoneSaidItBetter', 'MissingLink', 'NotSoFast', 'TheWholeStory', 'ArgueSmarter', 'Mend',
  // 2026-10-07, second round: the indexable tools Google judged on the broken June pages.
  'WrongAnswersOnly', 'AlternatePath', 'RoastMe', 'MarkupDetective', 'ContextCollapse',
  'AwkwardSilenceFiller', 'WaitingModeLiberator', 'NameStorm', 'ChaosPilot', 'HistoryToday',
  'DoctorVisitTranslator', 'RentersDepositSaver', 'DifficultTalkCoach', 'ComplaintEscalationWriter',
  'VirtualBodyDouble', 'BillRescue', 'LayoverMaximizer', 'BragSheetBuilder',
  // 2026-10-08, strict index review: a tool is indexed once its page shows a real run.
  'ScamRadar', 'ContractDecoder', 'QuoteCheck', 'MoneyDiplomat', 'TicketTackler',
  'CultureBriefing', 'GriefGuide', 'PetBehaviorDecoder', 'PlantRescue', 'LaundroMat',
  'RecipeChaosSolver', 'BikeMedic', 'SleepArchitect', 'PronounceItRight', 'ToastWriter',
  'Giftology', 'VelvetHammer', 'ConflictCoach', 'LeverageLogic', 'SkillGapMap', 'DriveHome',
  'DecisionCoach', 'PaperworkPath', 'RoommateCourt', 'NameThatFeeling', 'ColdOpenCraft',
  'HecklerPrep', 'MagicMouth',
]);
const STATIC_CONTENT_COHORT_2 = new Set(['MentalHealthNavigator','ProcedureProbe','WhichLife','TheDebrief','DecoderRing','MiseEnPlace','GhostWriter','PlainTalk','SixDegreesOfMe','FinalWish']);

const ToolRenderer = ({ college }) => {
  const { toolId } = useParams();

  // Ids are matched exactly, so /conceptcoach and /ConceptCoach were two
  // different things and only one of them existed — a visitor told the tool's
  // name and typing it in gets nothing. Case-insensitive resolution is the
  // last step before a 404, so it costs nothing when the id is already right:
  // an exact match never reaches it, and the redirect below sends the visitor
  // to the canonical casing so only one URL is ever rendered.
  const canonicalId = tools.some(i => i.id === toolId)
    ? null
    : (Object.keys(TOOL_ALIASES).find(k => k.toLowerCase() === toolId?.toLowerCase())
       || tools.find(i => i.id.toLowerCase() === toolId?.toLowerCase())?.id);

  const aliasTarget = TOOL_ALIASES[toolId]
    || (canonicalId ? (TOOL_ALIASES[canonicalId] || canonicalId) : undefined);
  const toolData = tools.find(i => i.id === toolId);

  // Hooks must run before any conditional return (react-hooks/rules-of-hooks),
  // so compute the head unconditionally, then redirect a renamed tool's old URL.
  useDocumentHead({
    // Title leads with the distinctive tool NAME (so tabs/history/bookmarks and
    // branded search keep it), then the keyword phrase: "Name — seoTitle" (or
    // "Name — tagline"). Skip the prefix if seoTitle already contains the name.
    // MUST match the static prerender title in scripts/prerender.js (injectMeta).
    title: toolData?.seoTitle
      ? (toolData.seoTitle.includes(toolData.title) ? toolData.seoTitle : `${toolData.title} — ${toolData.seoTitle}`)
      : (toolData?.tagline ? `${toolData.title} — ${toolData.tagline}` : toolData?.title),
    description: toolData?.seoDescription || toolData?.description,
    canonicalPath: toolId ? `/${toolId}` : undefined,
    ogImageSlug: TOOL_OG_SLUGS[toolId],
  });

  if (aliasTarget) return <Navigate to={`/${aliasTarget}`} replace />;

  const ToolComponent = lazy(() =>
    import(`../tools/${toolId}.js`).catch(() => ({
      default: () => (
        <div className="p-20 text-center text-slate-500 italic font-mono uppercase tracking-widest">
          [ Error: Intelligence Component Missing in /tools/ ]
        </div>
      )
    }))
  );

  if (!toolData) {
    return (
      <NotFound
        headline="No tool lives at this address."
        message={`Maybe renamed, maybe retired, maybe a typo. Whatever you came here to do, one of the ${TOOL_COUNT_LABEL} tools probably still does it.`}
      />
    );
  }

  // Links inside a tool open in a new tab (owner, 2026-10-05): leaving the
  // page mid-tool, or from its results, would lose the visitor's work. One
  // capture-phase handler covers every tool's links (360+ of them, plain <a>
  // and router <Link> alike) without touching the tool files; a modified click
  // (⌘/Ctrl/Shift, middle button) keeps the browser's own behaviour. The ↗
  // marker is CSS (src/styles/index.css, [data-tool-body]).
  const openOutside = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api') || href.split(/[?#]/)[0] === `/${toolId}`) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(href, '_blank', 'noopener');
  };

  return (
    <ToolPageWrapper 
      tool={toolData}
      toolId={toolId}
    >
      <div data-tool-body style={{ display: 'contents' }} onClickCapture={openOutside}>
      <Suspense fallback={
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-600 font-mono text-[10px] tracking-widest uppercase">Loading…</p>
        </div>
      }>
        {/* Every tool page routes through here, so this is the one place a
            render crash can be caught and reported (tool_render_error). */}
        <ToolErrorBoundary toolId={toolId}>
          <ToolComponent college={college} tool={toolData} />
        </ToolErrorBoundary>
        {(STATIC_CONTENT_COHORT_2.has(toolId) || EXAMPLE_OUTPUT_TOOLS.has(toolId)) && <PublicProductDemo tool={toolData} />}
      </Suspense>
      </div>
    </ToolPageWrapper>
  );
};

export default ToolRenderer;
