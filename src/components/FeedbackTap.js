import React, { useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * FeedbackTap — a tiny "Was this helpful?" prompt for the bottom of a tool's
 * output. The single highest-signal validation instrument: it captures whether
 * a real person felt the tool addressed their concern, plus an optional note on
 * what was missing.
 *
 * Owned + privacy-clean: posts to /api/feedback (no third party, no PII).
 * Fire-and-forget — never blocks or errors into the tool.
 *
 * Usage:  <FeedbackTap tool="DoctorVisitTranslator" />
 */
export default function FeedbackTap({ tool = 'unknown', className = '' }) {
  const { isDark } = useTheme();
  const [choice, setChoice] = useState(null);   // null | 'yes' | 'no'
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const post = useCallback((helpful, note) => {
    try {
      const body = JSON.stringify({
        tool,
        helpful,
        comment: note || '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
      });
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch (_) { /* never surface */ }
  }, [tool]);

  const pick = (helpful) => {
    setChoice(helpful ? 'yes' : 'no');
    post(helpful, '');           // record the vote immediately…
  };

  const submitNote = () => {
    if (comment.trim()) post(choice === 'yes', comment.trim());  // …upgrade with the note
    setDone(true);
  };

  const c = {
    wrap:   isDark ? 'border-zinc-700 text-zinc-400' : 'border-gray-200 text-gray-500',
    btn:    isDark ? 'border-zinc-600 hover:bg-zinc-700 text-zinc-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700',
    input:  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
    send:   isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    muted:  isDark ? 'text-zinc-500' : 'text-gray-400',
  };

  if (done) {
    return (
      <div className={`mt-6 pt-4 border-t text-center text-xs ${c.wrap} ${className}`}>
        <span>🙏 Thanks — this directly shapes what we build next.</span>
      </div>
    );
  }

  return (
    <div className={`mt-6 pt-4 border-t ${c.wrap} ${className}`}>
      {!choice ? (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="font-medium">Was this helpful?</span>
          <button onClick={() => pick(true)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[32px] ${c.btn}`}>👍 Yes</button>
          <button onClick={() => pick(false)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[32px] ${c.btn}`}>👎 No</button>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <p className="text-xs text-center mb-2 font-medium">
            {choice === 'yes' ? 'Glad it helped. Anything that would make it better?' : 'Sorry it missed. What were you hoping for?'}
            <span className={`font-normal ${c.muted}`}> (optional)</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitNote(); }}
              placeholder="One line is plenty…"
              autoFocus
              className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 ${c.input}`}
            />
            <button onClick={submitNote} className={`${c.send} px-4 py-2 rounded-lg text-xs font-bold min-h-[36px]`}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
