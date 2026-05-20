// src/components/ToolFinderWizard.js
// Dashboard sub-component — NOT a tool page.
// Uses CLR palette (Navy/Gold/Sand) to match the Dashboard.
// No tool conventions (no useTheme, no BRAND, no useRegisterActions).
//
// v2 — Single-step free-text intake with scenario pill shortcuts.
// Replaces the 3-question wizard with a direct "what's going on?"
// text field. Pills pre-populate the field with concrete example
// situations; the user can edit before submitting.

import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';

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
// Texts pull from i18n keys so non-English users see translated pills.
// ════════════════════════════════════════════════════════════
const SCENARIOS = [
  { emoji: '😬', key: 'scenario_apologize' },
  { emoji: '🤔', key: 'scenario_decide' },
  { emoji: '⚡', key: 'scenario_overwhelmed' },
  { emoji: '🗣️', key: 'scenario_difficult_convo' },
  { emoji: '💸', key: 'scenario_unexpected_bill' },
  { emoji: '🩺', key: 'scenario_medical_appt' },
  { emoji: '🧠', key: 'scenario_understand_complex' },
  { emoji: '✈️', key: 'scenario_planning_trip' },
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

// Parses "/ToolId" tokens in workflow text and renders them as links
function renderWithToolLinks(text, linkStyle) {
  if (!text) return null;
  const parts = text.split(/(\/[A-Z][A-Za-z]+)/g);
  return parts.map((part, i) => {
    if (/^\/[A-Z][A-Za-z]+$/.test(part)) {
      const id = part.slice(1);
      return (
        <a key={i} href={`/${id}`} style={linkStyle}>
          {id}
        </a>
      );
    }
    return part;
  });
}
// ════════════════════════════════════════════════════════════
function ToolCard({ rec, rank }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const accentColor = rank === 1 ? CLR.gold500 : CLR.navy400;
  return (
    <a
      href={`/${rec.id}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: hovered ? CLR.sand100 : '#fff',
        border: `1.5px solid ${hovered ? accentColor : CLR.sand200}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 12,
        padding: '11px 14px 11px 12px',
        textDecoration: 'none',
        transition: 'all 0.14s',
        position: 'relative',
      }}
    >
      {/* Rank badge */}
      {rank === 1 && (
        <span style={{
          position: 'absolute',
          top: -7, left: 10,
          background: CLR.gold500,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.5,
          padding: '2px 7px',
          borderRadius: 4,
          textTransform: 'uppercase',
        }}>{t('best_match')}</span>
      )}
      <span style={{ fontSize: 24, flexShrink: 0, marginTop: 1 }}>{rec.icon || '🔧'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 800,
          fontSize: 13.5,
          color: hovered ? accentColor : CLR.navy500,
          margin: '0 0 3px',
          transition: 'color 0.14s',
          textDecoration: hovered ? 'underline' : 'none',
        }}>
          {rec.title}
        </p>
        <p style={{
          fontSize: 12,
          color: CLR.warm600 || CLR.warm500,
          margin: 0,
          lineHeight: 1.5,
        }}>
          {rec.why?.length > 120 ? rec.why.slice(0, 120) + '…' : rec.why}
        </p>
        {rec.what_to_do && (
          <p style={{
            fontSize: 11,
            color: CLR.navy400,
            margin: '5px 0 0',
            fontWeight: 600,
          }}>
            → {rec.what_to_do}
          </p>
        )}
      </div>
      <span style={{
        color: hovered ? accentColor : CLR.sand300,
        flexShrink: 0,
        fontSize: 18,
        alignSelf: 'center',
        transition: 'color 0.14s',
        fontWeight: 300,
      }}>→</span>
    </a>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function ToolFinderWizard() {
  const { t, i18n } = useTranslation();
  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState(null);
  const [error,     setError]     = useState('');
  const [isOpen,    setIsOpen]    = useState(false);
  const [focused,   setFocused]   = useState(false);

  const textareaRef = useRef(null);

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
      setError(t('something_wrong'));
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const reset = useCallback(() => {
    setResults(null);
    setError('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const canSubmit = query.trim().length > 0 && !loading;
  const activeScenario = SCENARIOS.find(s => t(s.key) === query.trim());

  // ── Collapsed state — always-visible toggle ──
  const toggleHeader = (
    <button
      onClick={() => setIsOpen(o => !o)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: 'none',
        border: `1.5px solid ${CLR.sand300}`,
        borderRadius: 12,
        padding: '9px 14px',
        fontSize: 12,
        fontWeight: 600,
        color: CLR.warm700,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = CLR.gold500;
        e.currentTarget.style.color = CLR.navy500;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = CLR.sand300;
        e.currentTarget.style.color = CLR.warm700;
      }}
    >
      <span>🔍 {t('wizard_intro')}</span>
      <span style={{ fontSize: 10, marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</span>
    </button>
  );

  if (!isOpen) return <div style={{ marginBottom: 16 }}>{toggleHeader}</div>;

  return (
    <div style={{
      background: '#ffffff',
      border: `1.5px solid ${focused && !results ? CLR.gold300 : CLR.sand300}`,
      borderRadius: 16,
      padding: '14px 20px 16px',
      marginBottom: 16,
      marginTop: 4,
      position: 'relative',
      boxShadow: focused && !results
        ? `0 2px 8px ${CLR.gold300}30`
        : `0 1px 3px ${CLR.warm500}10`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>

      {/* ══════════════════════════════════════════
          INPUT VIEW
      ══════════════════════════════════════════ */}
      {!results && (
        <div>
          {/* Label + input on one line, baseline-aligned */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            marginBottom: 10,
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                paddingBottom: 7,
              }}
            >
              <span style={{
                fontSize: 14,
                fontWeight: 800,
                color: CLR.navy500,
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}>
                🔍 {t('wizard_intro')}
              </span>
              <span style={{ fontSize: 9, color: CLR.warm400 }}>▲</span>
            </button>
            <div style={{
              flex: 1,
              background: CLR.sand50,
              border: `1.5px solid ${focused ? CLR.gold300 : CLR.sand200}`,
              borderRadius: 10,
              transition: 'border-color 0.15s',
            }}>
              <input
                ref={textareaRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={t('wizard_placeholder')}
                lang={i18n.language}
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '7px 12px',
                  fontSize: 13,
                  color: CLR.warm800,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0 7px',
                cursor: 'pointer',
                fontSize: 10,
                color: CLR.warm400,
                flexShrink: 0,
              }}
            >▲</button>
          </div>

          {/* Example pills — button is last child, right-aligned via marginLeft: auto */}
          <p style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: CLR.warm400,
            margin: '0 0 7px',
            letterSpacing: 0.3,
          }}>
            {t('try_example')}
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}>
            {SCENARIOS.map(s => (
              <ScenarioPill
                key={s.key}
                scenario={{ emoji: s.emoji, text: t(s.key) }}
                active={activeScenario?.key === s.key}
                onPick={handlePill}
              />
            ))}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                marginLeft: 'auto',
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
                flexShrink: 0,
              }}
            >
              {loading ? `🔍 ${t('thinking')}` : `${t('find_my_tools').replace(/→/g, '').trim()} ↓`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          RESULTS VIEW
      ══════════════════════════════════════════ */}
      {results && !loading && (
        <div>
          {/* Collapse toggle — full width, ▲ on right matching collapsed ▼ */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none', border: 'none', padding: '0 0 12px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', width: '100%',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: CLR.navy500 }}>
                🔍 {t('wizard_intro')}
              </span>
              <span style={{ fontSize: 9, color: CLR.warm400 }}>▲</span>
            </span>
            <span style={{ fontSize: 10, color: CLR.warm400 }}>▲</span>
          </button>

          {/* Situation callout */}
          <div style={{
            background: CLR.gold100,
            border: `1px solid ${CLR.gold300}`,
            borderRadius: 8,
            padding: '7px 12px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
          }}>
            <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>💬</span>
            <div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: CLR.gold500,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                display: 'block',
                marginBottom: 2,
              }}>{t('wizard_your_situation')}</span>
              <span style={{
                fontSize: 12,
                color: CLR.warm800,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}>"{query.trim()}"</span>
            </div>
          </div>

          {/* Understanding */}
          {results.understanding && (
            <p style={{
              fontSize: 13,
              color: CLR.warm700,
              lineHeight: 1.6,
              margin: '0 0 12px',
              paddingLeft: 12,
              borderLeft: `3px solid ${CLR.sand300}`,
            }}>
              {results.understanding}
            </p>
          )}

          {/* Tool cards */}
          {(results.recommendations || []).length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <p style={{
                fontSize: 10,
                fontWeight: 800,
                color: CLR.warm400,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                margin: '0 0 8px',
              }}>Recommended tools</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(results.recommendations || []).slice(0, 3).map((rec, i) => (
                  <ToolCard key={rec.id} rec={rec} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Workflow note */}
          {results.workflow && (
            <div style={{
              background: CLR.navy500 + '12',
              border: `1px solid ${CLR.navy500}30`,
              borderRadius: 10,
              padding: '9px 13px',
              marginTop: 12,
              display: 'flex',
              gap: 9,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔗</span>
              <p style={{
                fontSize: 12,
                color: CLR.navy500,
                margin: 0,
                lineHeight: 1.55,
              }}>
                <strong>{t('wizard_use_together')}</strong>{' '}
                {renderWithToolLinks(results.workflow, {
                  color: CLR.navy500,
                  fontWeight: 700,
                  textDecoration: 'underline',
                })}
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
                background: CLR.navy500,
                border: 'none',
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              🔍 Explore other tools…
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
              {t('open_full_toolfinder')}
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
              {t('wizard_finding_tools')}
            </p>
            <p style={{
              fontSize: 11, color: CLR.warm400,
              margin: '2px 0 0',
            }}>
              {t('wizard_reading')}
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
            {t('try_again')}
          </button>
        </div>
      )}

      {/* Spin keyframe — injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
