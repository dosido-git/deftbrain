import React, { useEffect, useRef, useState } from 'react';
import { subscribeWait, currentWait } from '../utils/waitSignal';
import { TOOL_WAIT_SECONDS } from '../data/toolWaitTimes';
import { useTranslation } from '../i18n/useTranslation';

// While a tool's answer is on its way, a small note at the foot of the screen
// says how long it usually takes, and that the visitor can switch tabs. If
// the answer lands while they are on another tab, the tab title shows a ✓
// until they come back. Each tool still draws its own spinner; this only adds
// what the spinner can't say. Timings: src/data/toolWaitTimes.js.
//
// Quiet by design: nothing shows for the first few seconds, and nothing at all
// for a tool that usually answers in under 15 seconds.

const SHOW_AFTER_MS = 5000;     // a quick answer never sees the note
const QUICK_TOOL_S = 15;        // timed tools faster than this get no note
const SUGGEST_TABS_S = 30;      // "you can switch tabs" from this estimate up
const UNTIMED_TABS_AFTER_MS = 15000;

function estimateLine(t, secs) {
  if (secs >= 90) return t('wait_couple_minutes');
  if (secs >= 55) return t('wait_about_minute');
  return t('wait_about_seconds', { n: Math.max(15, Math.round(secs / 5) * 5) });
}

export default function WaitNotice({ toolId, isDark }) {
  const { t } = useTranslation();
  const [waiting, setWaiting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const readyTitleRef = useRef(null);
  const estimate = TOOL_WAIT_SECONDS[toolId];

  // Follow the page-wide wait signal.
  useEffect(() => {
    const now = currentWait();
    setWaiting(now.inFlight > 0);
    return subscribeWait(ev => {
      setWaiting(ev.inFlight > 0);
      if (ev.inFlight === 0) setElapsed(0);
      // Answer landed while the visitor was on another tab: mark this tab.
      if (ev.type === 'end' && ev.inFlight === 0 && ev.outcome === 'ok' && typeof document !== 'undefined' && document.hidden) {
        const base = readyTitleRef.current || document.title;
        readyTitleRef.current = base;
        document.title = `${t('wait_ready_title')} · ${base}`;
      }
    });
  }, [t]);

  // Put the title back when they return.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && readyTitleRef.current) {
        document.title = readyTitleRef.current;
        readyTitleRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Tick while waiting, so the note can appear after a delay and adjust.
  useEffect(() => {
    if (!waiting) return undefined;
    const tick = () => setElapsed(Date.now() - currentWait().startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [waiting]);

  if (!waiting || elapsed < SHOW_AFTER_MS) return null;
  if (estimate !== undefined && estimate < QUICK_TOOL_S) return null;

  const timed = estimate !== undefined;
  const overdue = timed && elapsed > estimate * 1500; // half again the usual
  const first = !timed || overdue
    ? t(overdue ? 'wait_longer' : 'wait_still_working')
    : estimateLine(t, estimate);
  const showTabs = timed ? estimate >= SUGGEST_TABS_S : elapsed >= UNTIMED_TABS_AFTER_MS;

  return (
    <div data-print-hide role="status" aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 shadow-lg text-sm leading-snug ${
        isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-white border-[#d4dde8] text-[#142a43]'}`}>
        <p className="font-semibold">{first}</p>
        {showTabs && <p className={`mt-0.5 text-[13px] ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{t('wait_switch_tabs')}</p>}
      </div>
    </div>
  );
}
