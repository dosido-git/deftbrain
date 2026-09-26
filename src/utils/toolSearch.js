// src/utils/toolSearch.js
//
// Tool search for the home page (DashBoard) and /tools (AllToolsPage). The
// matching itself lives in searchCore.js, shared with the guide pages' search;
// this file decides what a TOOL is searched on and how much each part counts.
//
// Reads everything a tool says about the situations it handles: title,
// tagline, description, tags, categories, the preamble (primer.when /
// primer.get), the SEO title/description, and the Tool Finder metadata
// (problems, capabilities, primary intent, when to recommend). Before
// 2026-09-26 the home search checked only the first four, as one substring,
// so "boss" found Giftology alone.

import { toolFinderMetadata } from '../data/toolFinderMetadata';
import { makeDoc, rankDocs, TOOL_WEIGHTS } from './searchCore';

// The fields a tool is searched on. Exported for the build step that writes
// public/search/tools.json, so the guide pages search tools on the same text.
export function toolSearchFields(tool, categories, finder) {
  const p = tool.primer || {};
  const m = finder || {};
  return {
    title: tool.title,
    tags: (tool.tags || []).join(' | '),
    tagline: tool.tagline,
    description: tool.description,
    primer: [p.when, p.get].filter(Boolean).join(' '),
    finder: [...(m.problems || []), ...(m.capabilities || []), ...(m.accepts || []), m.primaryIntent, m.whenToRecommend]
      .filter(Boolean).join(' '),
    seo: [tool.seoTitle, tool.seoDescription].filter(Boolean).join(' '),
    categories: (categories || []).join(' | '),
  };
}

// Build once per tool list.
export function buildSearchIndex(tools, categoriesOf = t => t.categories || []) {
  return (tools || []).map(t =>
    makeDoc(t, toolSearchFields(t, categoriesOf(t), toolFinderMetadata[t.id]), t.tags));
}

// Tools best-first. Empty query → [].
export function searchTools(index, query) {
  return rankDocs(index, query, TOOL_WEIGHTS);
}
