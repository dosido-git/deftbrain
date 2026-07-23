import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { tools } from '../data/tools';
import ToolPageWrapper from './ToolPageWrapper';
import NotFound from './NotFound';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { useDocumentHead } from '../hooks/useDocumentHead';
import TOOL_OG_SLUGS from '../data/tool-og-slugs.json';

// Renamed tools keep their old URL alive: old id → current id. A client-side
// 301-equivalent so existing links, bookmarks, and search results don't break.
const TOOL_ALIASES = {
  Recall: 'TheCrux', // renamed 2026-07-22 (broadened beyond lectures)
};

const ToolRenderer = ({ college }) => {
  const { toolId } = useParams();
  const aliasTarget = TOOL_ALIASES[toolId];
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
<ToolComponent college={college} tool={toolData} />
      </Suspense>
    </ToolPageWrapper>
  );
};

export default ToolRenderer;
