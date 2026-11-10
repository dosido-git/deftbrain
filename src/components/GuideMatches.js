// src/components/GuideMatches.js
//
// Guide results accompany matching tools in homepage search.
//
// The guide index (/search/guides.json, built by
// scripts/build-search-assets.js) is fetched the first time this renders,
// never on page load, and ranked by the same matcher as every other search.

import React, { useEffect, useState } from 'react';
import { makeDoc, rankDocs, GUIDE_WEIGHTS } from '../utils/searchCore';

let docsPromise = null;
function loadGuideDocs() {
  if (!docsPromise) {
    docsPromise = fetch('/search/guides.json')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(rows => rows.map(g => makeDoc(g, g.f, [])));
    docsPromise.catch(() => { docsPromise = null; });
  }
  return docsPromise;
}

const MAX = 5;

export default function GuideMatches({ query, colors }) {
  const [guides, setGuides] = useState(null);

  useEffect(() => {
    let live = true;
    setGuides(null);
    const q = String(query || '').trim();
    if (!q) return undefined;
    loadGuideDocs()
      .then(docs => { if (live) setGuides(rankDocs(docs, q, GUIDE_WEIGHTS)); })
      .catch(() => { if (live) setGuides([]); }); // steps aside silently
    return () => { live = false; };
  }, [query]);

  if (!guides || !guides.length) return null;

  return (
    <div className="max-w-xl mt-5 mb-8 text-start">
      <h2 className="text-sm font-semibold mb-2" style={{ color: colors.muted }}>
        Matching guides
      </h2>
      <ul className="space-y-1.5">
        {guides.slice(0, MAX).map(g => (
          <li key={g.href}>
            <a href={g.href} className="block rounded-lg border px-3 py-2 hover:underline" style={{ borderColor: colors.border, color: colors.text, background: colors.bg }}>
              <span className="text-sm font-semibold">{g.title}</span>
              <span className="block text-xs" style={{ color: colors.muted }}>{g.category}</span>
            </a>
          </li>
        ))}
      </ul>
      {guides.length > MAX && (
        <a href={`/guides?q=${encodeURIComponent(query.trim())}#library`} className="inline-block text-xs font-semibold mt-2 hover:underline" style={{ color: colors.link }}>
          All {guides.length} matching guides →
        </a>
      )}
    </div>
  );
}
