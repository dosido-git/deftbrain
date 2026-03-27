// src/components/ToolFinderWizard.js
// Dashboard sub-component — NOT a tool page.
// Uses CLR palette (Navy/Gold/Sand) to match the Dashboard.
// No tool conventions (no useTheme, no BRAND, no useRegisterActions).

import React, { useState, useCallback } from 'react';

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
  gold100: '#f9edd8',
  gold300: '#e8be7a',
  gold500: '#c8872e',
  warm500: '#8a8275',
  warm700: '#5a544a',
  warm800: '#3d3935',
};

// ════════════════════════════════════════════════════════════
// QUESTIONS
// ════════════════════════════════════════════════════════════
const QUESTIONS = [
  {
    question: "What's this about?",
    options: [
      { label: 'Work & productivity',   emoji: '🏢' },
      { label: 'Money & spending',      emoji: '💸' },
      { label: 'Relationships',         emoji: '🗣️' },
      { label: 'Food & home',           emoji: '🍳' },
      { label: 'Wellbeing & clarity',   emoji: '🧘' },
      { label: 'Travel',                emoji: '✈️' },
      { label: 'Something else',        emoji: '🎲' },
    ],
  },
  {
    question: 'What are you trying to do?',
    options: [
      { label: 'Make a decision',                emoji: '🤔' },
      { label: 'Handle a conflict or tough talk', emoji: '⚔️' },
      { label: 'Get organized',                  emoji: '🗂️' },
      { label: 'Understand something',           emoji: '🔍' },
      { label: 'Take action on a task',          emoji: '⚡' },
    ],
  },
  {
    question: 'Where are you in this situation?',
    options: [
      { label: 'Planning ahead',            emoji: '📅' },
      { label: 'Right in the middle of it', emoji: '🔥' },
      { label: 'Recovering / figuring out next steps', emoji: '🩹' },
      { label: 'Just exploring',            emoji: '😌' },
    ],
  },
];

// ════════════════════════════════════════════════════════════
// PILL WITH HOVER STATE
// ════════════════════════════════════════════════════════════
function HoverPill({ option, onPick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPick(option)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: `1.5px solid ${hovered ? CLR.gold500 : CLR.sand300}`,
        background: hovered ? CLR.gold100 : CLR.sand50,
        color: CLR.warm800,
        borderRadius: 10,
        padding: '6px 11px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{option.emoji}</span>
      {option.label}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function ToolFinderWizard() {
  const [step,      setStep]      = useState(0); // 0=intro 1-3=questions 4=results
  const [answers,   setAnswers]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState(null);
  const [error,     setError]     = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Build a natural-language query from the 3 answers
  const buildQuery = (ans) =>
    `I have a ${ans[0].label.toLowerCase()} situation. ` +
    `I need help to ${ans[1].label.toLowerCase()}. ` +
    `I am ${ans[2].label.toLowerCase()}.`;

  const handlePick = useCallback(async (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    if (newAnswers.length < 3) {
      setStep(prev => prev + 1);
      return;
    }

    // All 3 answered — call the tool-finder API
    setStep(4);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tool-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: buildQuery(newAnswers) }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResults(data);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  }, [answers]);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers([]);
    setResults(null);
    setError('');
  }, []);

  if (dismissed) return null;

  const currentQ = step >= 1 && step <= 3 ? QUESTIONS[step - 1] : null;

  return (
    <div style={{
      background: CLR.sand100,
      border: `1px solid ${CLR.sand200}`,
      borderRadius: 12,
      padding: '11px 14px 10px',
      marginBottom: 16,
      position: 'relative',
    }}>

      {/* ── Dismiss ── */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: CLR.warm500, fontSize: 15, lineHeight: 1, padding: 2,
        }}
      >✕</button>

      {/* ── Label / intro ── */}
      {step === 0 && (
        <p style={{ fontSize: 11, fontWeight: 600, color: CLR.warm700, marginBottom: 8 }}>
          🧰 Answer 3 questions — we'll find the right tool for you.
        </p>
      )}

      {/* ══════════════════════════════════════════
          STEP 0 — INTRO CTA
      ══════════════════════════════════════════ */}
      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          style={{
            background: CLR.navy500, color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 14px',
            fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}
        >
          Let's go →
        </button>
      )}

      {/* ══════════════════════════════════════════
          STEPS 1–3 — QUESTIONS
      ══════════════════════════════════════════ */}
      {currentQ && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: CLR.warm800, marginBottom: 9 }}>
            {currentQ.question}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {currentQ.options.map(opt => (
              <HoverPill key={opt.label} option={opt} onPick={handlePick} />
            ))}
          </div>
          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: CLR.warm500, fontSize: 11, marginTop: 10, padding: 0,
              }}
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          STEP 4 — RESULTS
      ══════════════════════════════════════════ */}
      {step === 4 && (
        <div>
          {/* Prior answers summary */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {answers.map((a, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 600,
                background: CLR.gold100, color: CLR.warm700,
                border: `1px solid ${CLR.gold300}`,
                borderRadius: 6, padding: '3px 8px',
              }}>
                {a.emoji} {a.label}
              </span>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <p style={{ fontSize: 13, color: CLR.warm500, margin: '8px 0' }}>
              🔍 Finding your best tools…
            </p>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: '#c0392b', margin: '8px 0' }}>{error}</p>
          )}

          {/* Tool cards */}
          {results && !loading && (
            <div>
              {results.understanding && (
                <p style={{
                  fontSize: 13, color: CLR.warm700, lineHeight: 1.5,
                  marginBottom: 12,
                }}>
                  {results.understanding}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(results.recommendations || []).slice(0, 3).map((rec) => (
                  <a
                    key={rec.id}
                    href={`/${rec.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: CLR.sand50,
                      border: `1.5px solid ${CLR.sand200}`,
                      borderRadius: 10, padding: '10px 14px',
                      textDecoration: 'none', color: CLR.warm800,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = CLR.gold500}
                    onMouseLeave={e => e.currentTarget.style.borderColor = CLR.sand200}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{rec.icon || '🔧'}</span>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: CLR.navy500, margin: 0 }}>
                        {rec.title}
                      </p>
                      <p style={{
                        fontSize: 11, color: CLR.warm500, margin: '2px 0 0',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {rec.why?.length > 90 ? rec.why.slice(0, 90) + '…' : rec.why}
                      </p>
                    </div>
                    <span style={{ color: CLR.gold500, flexShrink: 0, fontSize: 16 }}>→</span>
                  </a>
                ))}
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button
                  onClick={reset}
                  style={{
                    background: 'none',
                    border: `1px solid ${CLR.sand300}`,
                    borderRadius: 8, padding: '6px 14px',
                    fontSize: 12, fontWeight: 600,
                    color: CLR.warm500, cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
                <a
                  href="/ToolFinder"
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: CLR.navy400,
                    textDecoration: 'underline',
                  }}
                >
                  Open full ToolFinder →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
