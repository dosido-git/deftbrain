import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { tools } from '../data/tools';
import ToolPageWrapper from './ToolPageWrapper';
import ToolErrorBoundary from './ToolErrorBoundary';
import NotFound from './NotFound';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { useDocumentHead } from '../hooks/useDocumentHead';
import TOOL_OG_SLUGS from '../data/tool-og-slugs.json';

// Renamed tools keep their old URL alive: old id → current id. A client-side
// 301-equivalent so existing links, bookmarks, and search results don't break.
const TOOL_ALIASES = {
  Recall: 'TheCrux',          // renamed 2026-07-22 (broadened beyond lectures)
  IdeaAutopsy: 'ConceptCoach', // renamed 2026-08-31
  LuckSurface: 'GetNoticed',   // renamed 2026-09-02
};

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

  return (
    <ToolPageWrapper 
      tool={toolData}
      toolId={toolId}
    >
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
      </Suspense>
    </ToolPageWrapper>
  );
};

export default ToolRenderer;
