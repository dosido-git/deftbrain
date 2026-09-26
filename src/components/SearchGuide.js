// SearchGuide — "where to start" for a search written as a sentence.
//
// The home page search invites "Describe what you're dealing with…", but on
// its own it only word-matches, so it can hand back a list and never say
// which one fits or why. The 2026-09-21 external review tested "My landlord
// won't return my security deposit" and got five loosely related tools with
// nothing to choose between them. This puts the Tool Finder's answer (one
// starting point, why it fits, what to tell it) above the word matches, and
// lets the visitor correct it in their own words — the refinement the
// /tool-finder route already supports.
//
// Only for sentence-like queries (see isSentenceQuery): "lease" or "bill"
// stays instant word-matching. The in-catalog search box updates on every
// keystroke, so the call waits for typing to settle and drops stale answers.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale';
import { track } from '../utils/analytics';

const CLR = {
  sand100: '#f3efe8',
  sand200: '#e8e1d5',
  sand300: '#d5cab8',
  navy500: '#165b9a',
  navy700: '#1e2a3a',
  gold100: '#f9edd8',
  gold500: '#c8872e',
  gold700: '#9c691c',
  warm500: '#6e6659',
  warm700: '#5a544a',
};

const SETTLE_MS = 900;

// Four or more words reads as a description of a situation rather than a
// keyword. Deliberately simple: a false "yes" costs one cheap call and still
// shows the word matches below; a false "no" is just today's behaviour.
export function isSentenceQuery(q) {
  const s = String(q || '').trim();
  return s.length >= 15 && s.split(/\s+/).length >= 4;
}

// Same query, same answer, for the life of the page — going back to the
// results or re-rendering never pays for a second call.
const cache = new Map();

export default function SearchGuide({ problem }) {
  const { userLanguage } = useLocale();
  const [state, setState] = useState({ status: 'idle', data: null });
  const [refinement, setRefinement] = useState('');
  const [refineOpen, setRefineOpen] = useState(false);
  const reqId = useRef(0);

  const run = (body, key) => {
    const id = ++reqId.current;
    if (cache.has(key)) { setState({ status: 'done', data: cache.get(key) }); return; }
    setState({ status: 'loading', data: null });
    fetch('/api/tool-finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, userLanguage }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(data => {
        if (id !== reqId.current) return; // a newer query won
        cache.set(key, data);
        setState({ status: 'done', data });
        const top = (data.recommendations || [])[0];
        track('search_guide', { pick: top ? top.id : null, refined: !!body.refinement });
      })
      .catch(() => {
        // Quietly step aside: the word matches below still answer the search.
        if (id === reqId.current) setState({ status: 'error', data: null });
      });
  };

  useEffect(() => {
    setRefineOpen(false);
    setRefinement('');
    const q = problem.trim();
    const key = `${userLanguage}|${q}`;
    if (cache.has(key)) { setState({ status: 'done', data: cache.get(key) }); return undefined; }
    setState({ status: 'waiting', data: null });
    const timer = setTimeout(() => run({ problem: q }, key), SETTLE_MS);
    return () => { clearTimeout(timer); reqId.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, userLanguage]);

  const submitRefinement = (e) => {
    e.preventDefault();
    const r = refinement.trim();
    if (!r) return;
    const rejected = (state.data?.recommendations || []).map(x => x.id);
    run({ problem: problem.trim(), refinement: r, rejected }, `${userLanguage}|${problem.trim()}|${r}`);
    setRefineOpen(false);
  };

  if (state.status === 'error' || state.status === 'idle') return null;

  const box = {
    background: '#fff',
    border: `1.5px solid ${CLR.sand200}`,
    borderInlineStart: `4px solid ${CLR.gold500}`,
    borderRadius: 12,
    padding: '14px 16px',
    margin: '10px 0 14px',
  };
  const eyebrow = { fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: CLR.gold700, margin: 0 };

  if (state.status !== 'done') {
    return (
      <div style={box} aria-live="polite">
        <p style={eyebrow}>Where to start</p>
        <p style={{ fontSize: 13, color: CLR.warm500, margin: '6px 0 0' }}>Reading what you wrote…</p>
      </div>
    );
  }

  const { understanding, recommendations = [], no_perfect_fit: noFit } = state.data || {};
  const [first, second] = recommendations;

  return (
    <section style={box} aria-live="polite" aria-label="Where to start">
      <p style={eyebrow}>Where to start</p>
      {understanding && <p style={{ fontSize: 13, lineHeight: 1.5, color: CLR.warm700, margin: '6px 0 0' }}>{understanding}</p>}

      {first && (
        <div style={{ marginTop: 10 }}>
          <Link to={`/${first.id}`} className="!no-underline hover:!underline" style={{ fontSize: 16, fontWeight: 800, color: CLR.navy700 }}>
            <span aria-hidden="true">{first.icon} </span>{first.title} →
          </Link>
          {first.why && <p style={{ fontSize: 13, lineHeight: 1.5, color: CLR.warm700, margin: '4px 0 0' }}>{first.why}</p>}
          {first.what_to_do && <p style={{ fontSize: 12, lineHeight: 1.5, color: CLR.navy500, fontWeight: 600, margin: '6px 0 0' }}>When you open it: {first.what_to_do}</p>}
        </div>
      )}

      {second && (
        <p style={{ fontSize: 12.5, lineHeight: 1.5, color: CLR.warm700, margin: '10px 0 0' }}>
          Also possible:{' '}
          <Link to={`/${second.id}`} style={{ fontWeight: 700, color: CLR.navy700 }}>{second.title}</Link>
          {second.why ? ` — ${second.why}` : ''}
        </p>
      )}

      {noFit && <p style={{ fontSize: 13, lineHeight: 1.5, color: CLR.warm700, margin: first ? '10px 0 0' : '6px 0 0' }}>{noFit}</p>}

      <div style={{ marginTop: 12, borderTop: `1px solid ${CLR.sand200}`, paddingTop: 10 }}>
        {!refineOpen ? (
          <button type="button" onClick={() => setRefineOpen(true)}
            style={{ all: 'unset', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: CLR.gold700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Not quite it? Say what's different
          </button>
        ) : (
          <form onSubmit={submitRefinement} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="search-guide-refine" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>What's different about your situation</label>
            <input id="search-guide-refine" autoFocus value={refinement} onChange={e => setRefinement(e.target.value)} maxLength={400}
              placeholder="e.g. I've already moved out and they're keeping it"
              style={{ flex: '1 1 240px', minWidth: 0, padding: '8px 12px', borderRadius: 8, border: `1px solid ${CLR.sand300}`, fontSize: 13, background: '#fff', color: CLR.navy700 }} />
            <button type="submit" disabled={!refinement.trim()}
              style={{ padding: '8px 16px', borderRadius: 8, border: 0, background: CLR.navy700, color: '#fff', fontSize: 13, fontWeight: 600, cursor: refinement.trim() ? 'pointer' : 'default', opacity: refinement.trim() ? 1 : 0.5 }}>
              Try again
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
