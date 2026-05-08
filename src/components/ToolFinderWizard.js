// src/components/ToolFinderWizard.js
// Dashboard sub-component — NOT a tool page.
// Uses CLR palette (Navy/Gold/Sand) to match the Dashboard.
// No tool conventions (no useTheme, no BRAND, no useRegisterActions).
//
// v2 — Single-step free-text intake with scenario pill shortcuts.
// Replaces the 3-question wizard with a direct "what's going on?"
// text field. Pills pre-populate the field with concrete example
// situations; the user can edit before submitting.

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ════════════════════════════════════════════════════════════
// PALETTE — mirrors DashBoard.js CLR
// ════════════════════════════════════════════════════════════
const CLR = {
  sand50:  '#faf8f5',
  sand100: '#f3efe8',
  sand200: '#e8e1d5',
  sand300: '#d5cab8',
  navy400: '#4a6a8a',
  navy500: '#2c4a6e',
  navy600: '#1e3550',
  gold100: '#f9edd8',
  gold300: '#e8be7a',
  gold500: '#c8872e',
  warm400: '#a09688',
  warm500: '#8a8275',
  warm700: '#5a544a',
  warm800: '#3d3935',
};

// ════════════════════════════════════════════════════════════
// EXAMPLE SCENARIOS — click to populate the textarea
// Concrete and relatable, not abstract category labels.
// ════════════════════════════════════════════════════════════
const SCENARIOS = [
  { emoji: '😬', text: "I need to apologize for something I said" },
  { emoji: '🤔', text: "I can't decide between two options" },
  { emoji: '⚡', text: "I'm overwhelmed and don't know where to start" },
  { emoji: '🗣️', text: "I need to have a difficult conversation" },
  { emoji: '💸', text: "I got an unexpected bill I can't afford" },
  { emoji: '🩺', text: "I'm preparing for a medical appointment" },
  { emoji: '🧠', text: "I need to understand something complex" },
  { emoji: '✈️', text: "I'm planning a trip" },
];

// ════════════════════════════════════════════════════════════
// SCENARIO PILL
// ════════════════════════════════════════════════════════════
function ScenarioPill({ scenario, active, onPick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPick(scenario.text)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        border: `1.5px solid ${active ? CLR.gold500 : hovered ? CLR.gold300 : CLR.sand300}`,
        background: active ? CLR.gold100 : hovered ? '#fdf5e8' : CLR.sand50,
        color: active ? CLR.warm700 : CLR.warm700,
        borderRadius: 20,
        padding: '5px 11px 5px 9px',
        fontSize: 11.5,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.14s',
        lineHeight: 1.3,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 13 }}>{scenario.emoji}</span>
      {scenario.text}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// TOOL CARD — result recommendation
// ════════════════════════════════════════════════════════════
function ToolCard({ rec, rank }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={`/${rec.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: hovered ? CLR.sand100 : CLR.sand50,
        border: `1.5px solid ${hovered ? CLR.gold300 : CLR.sand200}`,
        borderRadius: 12,
        padding: '11px 14px',
        textDecoration: 'none',
        transition: 'all 0.14s',
        position: 'relative',
      }}
    >
      {/* Rank badge */}
      {rank === 1 && (
        <span style={{
          position: 'absolute',
          top: -6, left: 12,
          background: CLR.gold500,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.5,
          padding: '2px 7px',
          borderRadius: 4,
          textTransform: 'uppercase',
        }}>Best match</span>
      )}
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{rec.icon || '🔧'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 700, fontSize: 13,
          color: CLR.navy500, margin: 0, marginBottom: 2,
        }}>
          {rec.title}
        </p>
        <p style={{
          fontSize: 11.5, color: CLR.warm500,
          margin: 0, lineHeight: 1.5,
        }}>
          {rec.why?.length > 110 ? rec.why.slice(0, 110) + '…' : rec.why}
        </p>
        {rec.what_to_do && (
          <p style={{
            fontSize: 10.5, color: CLR.navy400,
            margin: '4px 0 0',
            fontStyle: 'italic',
          }}>
            → {rec.what_to_do}
          </p>
        )}
      </div>
      <span style={{
        color: hovered ? CLR.gold500 : CLR.sand300,
        flexShrink: 0,
        fontSize: 16,
        alignSelf: 'center',
        transition: 'color 0.14s',
      }}>→</span>
    </a>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function ToolFinderWizard() {
  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState(null);
  const [error,     setError]     = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [focused,   setFocused]   = useState(false);

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [query]);

  const handlePill = useCallback((text) => {
    setQuery(text);
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await fetch('/api/tool-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: trimmed }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResults(data);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const reset = useCallback(() => {
    setResults(null);
    setError('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  if (dismissed) return (
    <button
      onClick={() => setDismissed(false)}
      style={{
        display: 'block',
        width: '100%',
        background: 'none',
        border: `1px dashed ${CLR.sand300}`,
        borderRadius: 12,
        padding: '9px 16px',
        marginBottom: 16,
        fontSize: 12,
        fontWeight: 600,
        color: CLR.warm400,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = CLR.gold300;
        e.currentTarget.style.color = CLR.warm700;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = CLR.sand300;
        e.currentTarget.style.color = CLR.warm400;
      }}
    >
      🔍 Not sure where to start? Find the right tool →
    </button>
  );

  const canSubmit = query.trim().length > 0 && !loading;
  const activeScenario = SCENARIOS.find(s => s.text === query.trim());

  return (
    <div style={{
      background: '#ffffff',
      border: `1.5px solid ${focused && !results ? CLR.gold300 : CLR.sand300}`,
      borderRadius: 16,
      padding: '18px 20px 16px',
      marginBottom: 16,
      position: 'relative',
      boxShadow: focused && !results
        ? `0 2px 8px ${CLR.gold300}30`
        : `0 1px 3px ${CLR.warm500}10`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>

      {/* ── Dismiss ── */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 12, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: CLR.warm400, fontSize: 15, lineHeight: 1, padding: 2,
        }}
      >✕</button>

      {/* ══════════════════════════════════════════
          INPUT VIEW
      ══════════════════════════════════════════ */}
      {!results && (
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: CLR.gold500,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            margin: '0 0 4px',
          }}>
            Not sure where to start?
          </p>
          <h2 style={{
            fontSize: 17,
            fontWeight: 800,
            color: CLR.warm800,
            lineHeight: 1.25,
            margin: '0 0 12px',
            paddingRight: 20,
          }}>
            What's going on?
          </h2>

          {/* Textarea */}
          <div style={{
            background: CLR.sand50,
            border: `1.5px solid ${focused ? CLR.gold300 : CLR.sand200}`,
            borderRadius: 10,
            transition: 'border-color 0.15s',
            marginBottom: 10,
          }}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={'Describe your situation in plain language — e.g. "I need to tell my boss I can\'t take on more work"'}
              rows={1}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '7px 12px',
                fontSize: 13,
                color: CLR.warm800,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                minHeight: 34,
              }}
            />
          </div>

          {/* Example pills */}
          <p style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: CLR.warm400,
            margin: '0 0 7px',
            letterSpacing: 0.3,
          }}>
            Or try an example:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 12,
          }}>
            {SCENARIOS.map(s => (
              <ScenarioPill
                key={s.text}
                scenario={s}
                active={activeScenario?.text === s.text}
                onPick={handlePill}
              />
            ))}
          </div>

          {/* Submit */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 10.5, color: CLR.warm400,
            }}>
              {query.trim() ? '⌘↵ to submit' : '120+ tools across 18 categories'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? CLR.navy500 : CLR.sand200,
                color: canSubmit ? '#fff' : CLR.warm400,
                border: 'none',
                borderRadius: 9,
                padding: '8px 18px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {loading ? '🔍 Finding…' : 'Find my tools →'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          RESULTS VIEW
      ══════════════════════════════════════════ */}
      {results && !loading && (
        <div>
          {/* Query recap */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: CLR.warm400,
              flexShrink: 0,
              paddingTop: 2,
            }}>Your situation:</span>
            <span style={{
              fontSize: 11.5,
              color: CLR.warm700,
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}>"{query.trim()}"</span>
          </div>

          {/* Understanding */}
          {results.understanding && (
            <p style={{
              fontSize: 13,
              color: CLR.warm700,
              lineHeight: 1.55,
              margin: '0 0 12px',
              paddingBottom: 12,
              borderBottom: `1px solid ${CLR.sand200}`,
            }}>
              {results.understanding}
            </p>
          )}

          {/* Tool cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(results.recommendations || []).slice(0, 3).map((rec, i) => (
              <ToolCard key={rec.id} rec={rec} rank={i + 1} />
            ))}
          </div>

          {/* Workflow note */}
          {results.workflow && (
            <div style={{
              background: CLR.navy500 + '08',
              border: `1px solid ${CLR.navy400}20`,
              borderRadius: 8,
              padding: '9px 12px',
              marginTop: 10,
              display: 'flex',
              gap: 8,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🔗</span>
              <p style={{
                fontSize: 11.5,
                color: CLR.navy500,
                margin: 0,
                lineHeight: 1.5,
              }}>
                <strong>Use these together:</strong> {results.workflow}
              </p>
            </div>
          )}

          {/* No perfect fit note */}
          {results.no_perfect_fit && (
            <p style={{
              fontSize: 11.5,
              color: CLR.warm500,
              fontStyle: 'italic',
              margin: '10px 0 0',
              lineHeight: 1.5,
            }}>
              {results.no_perfect_fit}
            </p>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${CLR.sand200}`,
          }}>
            <button
              onClick={reset}
              style={{
                background: 'none',
                border: `1.5px solid ${CLR.sand300}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: CLR.warm500,
                cursor: 'pointer',
              }}
            >
              ↩ Try a different situation
            </button>
            <a
              href="/ToolFinder"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: CLR.navy400,
                textDecoration: 'underline',
                marginLeft: 'auto',
              }}
            >
              Open full ToolFinder →
            </a>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 0',
        }}>
          <span style={{
            fontSize: 18,
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}>🔍</span>
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600,
              color: CLR.warm700, margin: 0,
            }}>
              Finding your best tools…
            </p>
            <p style={{
              fontSize: 11, color: CLR.warm400,
              margin: '2px 0 0',
            }}>
              Reading your situation
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 8, padding: '8px 0',
        }}>
          <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>
          <button
            onClick={reset}
            style={{
              background: 'none', border: 'none',
              color: CLR.navy400, fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Spin keyframe — injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
