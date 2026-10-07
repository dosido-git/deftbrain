import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { subscribeWait, currentWait, toolFromPath } from '../utils/waitSignal';
import { TOOL_WAIT_SECONDS } from '../data/toolWaitTimes';
import { getToolById } from '../data/tools';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';

// While a tool's answer is on its way, a small note at the foot of the screen
// says how long it usually takes, repeats back what the visitor typed ("What
// you told us"), and that they can switch tabs. If the answer lands while the
// tab is hidden, the title shows a ✓ until they come back. If they have moved
// to another DeftBrain page meanwhile, the note follows them and says the
// answer is ready, with a link back (the answer itself is saved by
// usePersistentState even though the tool is no longer on screen). Closing or
// reloading the tab mid-wait brings up the browser's "Leave site?" prompt.
//
// Mounted once, above the routes, so it survives navigation. Each tool still
// draws its own spinner; this only adds what the spinner can't say.
// Timings: src/data/toolWaitTimes.js.

const SHOW_AFTER_MS = 5000;     // a quick answer never sees the note
const QUICK_TOOL_S = 15;        // timed tools faster than this get no note
const SUGGEST_TABS_S = 30;      // "you can switch tabs" from this estimate up
const UNTIMED_TABS_AFTER_MS = 15000;
// Railway logs (2026-10-07): visitors on 55-80s tools reloaded at 36-53s and
// started over — each time the server was still working. From 20s on, the
// note says so: reloading is the one thing that loses the answer.
const NO_RELOAD_AFTER_MS = 20000;
const BAR_MAX = 0.95;            // the bar never claims to be finished

function estimateLine(t, secs) {
  if (secs >= 90) return t('wait_couple_minutes');
  if (secs >= 55) return t('wait_about_minute');
  return t('wait_about_seconds', { n: Math.max(15, Math.round(secs / 5) * 5) });
}

const toolTitle = id => (id && getToolById(id)?.title) || id || '';

export default function WaitNotice() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const location = useLocation();
  const here = toolFromPath(location.pathname);

  const [wait, setWait] = useState(() => currentWait());
  const [elapsed, setElapsed] = useState(0);
  const [readyElsewhere, setReadyElsewhere] = useState(null); // tool id
  const readyTitleRef = useRef(null);
  const hereRef = useRef(here);
  hereRef.current = here;

  // Follow the page-wide wait signal.
  useEffect(() => subscribeWait(ev => {
    setWait(ev);
    if (ev.inFlight === 0) setElapsed(0);
    if (ev.type !== 'end' || ev.inFlight !== 0 || ev.outcome !== 'ok') return;
    // Landed while they were on another page of the site: say so, link back.
    if (ev.endedTool && ev.endedTool !== hereRef.current) setReadyElsewhere(ev.endedTool);
    // Landed while the tab was hidden: mark the tab.
    if (typeof document !== 'undefined' && document.hidden) {
      const base = readyTitleRef.current || document.title;
      readyTitleRef.current = base;
      document.title = `${t('wait_ready_title')} · ${base}`;
    }
  }), [t]);

  // Put the title back when they return to the tab.
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

  // Back on the tool whose answer was ready: nothing left to announce.
  useEffect(() => {
    if (readyElsewhere && here === readyElsewhere) setReadyElsewhere(null);
  }, [here, readyElsewhere]);

  // Tick while waiting, so the note can appear after a delay and adjust.
  const waiting = wait.inFlight > 0;
  useEffect(() => {
    if (!waiting) return undefined;
    const tick = () => setElapsed(Date.now() - currentWait().startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [waiting]);

  // Closing or reloading the tab mid-wait would lose the answer (it lives only
  // in this browser; nothing is kept on the server), so ask first. Browsers
  // show their own generic "Leave site?" text; it can't be customized.
  useEffect(() => {
    if (!waiting) return undefined;
    const onBeforeUnload = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [waiting]);

  const box = `pointer-events-auto max-w-md rounded-xl border px-4 py-3 shadow-lg text-sm leading-snug ${
    isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-white border-[#d4dde8] text-[#142a43]'}`;
  const muted = isDark ? 'text-zinc-300' : 'text-gray-600';
  const shell = children => (
    <div data-print-hide role="status" aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className={box}>{children}</div>
    </div>
  );

  // 1. Ready, but they're somewhere else on the site.
  if (!waiting && readyElsewhere) {
    return shell(
      <div className="flex items-start gap-3">
        <p className="font-semibold flex-1">
          {t('wait_ready_elsewhere', { tool: toolTitle(readyElsewhere) })}{' '}
          <Link to={`/${readyElsewhere}`} className="underline underline-offset-2" onClick={() => setReadyElsewhere(null)}>
            {t('wait_show_it')}
          </Link>
        </p>
        <button type="button" onClick={() => setReadyElsewhere(null)} aria-label={t('wait_dismiss')}
          className={`shrink-0 leading-none px-1 ${muted}`}>✕</button>
      </div>
    );
  }

  if (!waiting || elapsed < SHOW_AFTER_MS) return null;

  // 2. Still waiting, but they've moved to another page.
  if (wait.tool && wait.tool !== here) {
    return shell(<p className="font-semibold">{t('wait_elsewhere', { tool: toolTitle(wait.tool) })}</p>);
  }

  // 3. Waiting on this page.
  const estimate = TOOL_WAIT_SECONDS[wait.tool || here];
  if (estimate !== undefined && estimate < QUICK_TOOL_S) return null;
  const timed = estimate !== undefined;
  const overdue = timed && elapsed > estimate * 1500; // half again the usual
  const first = !timed || overdue
    ? t(overdue ? 'wait_longer' : 'wait_still_working')
    : estimateLine(t, estimate);
  const showTabs = timed ? estimate >= SUGGEST_TABS_S : elapsed >= UNTIMED_TABS_AFTER_MS;
  const recap = (wait.summary || []).slice(0, 2);

  // How far along, against the usual time: a quiet sign that something is
  // happening. Timed tools only — an untimed bar would be a guess.
  const progress = timed ? Math.min(BAR_MAX, elapsed / (estimate * 1000)) : null;

  return shell(
    <>
      <p className="font-semibold">{first}</p>
      {progress !== null && (
        <div aria-hidden="true" className={`mt-2 h-1 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-[#e8edf3]'}`}>
          <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${isDark ? 'bg-zinc-300' : 'bg-[#142a43]'}`}
            style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {elapsed >= NO_RELOAD_AFTER_MS && <p className={`mt-1.5 text-[13px] ${muted}`}>{t('wait_no_reload')}</p>}
      {showTabs && <p className={`mt-0.5 text-[13px] ${muted}`}>{t('wait_switch_tabs')}</p>}
      {recap.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${isDark ? 'border-zinc-700' : 'border-[#e8edf3]'}`}>
          <p className={`text-[12px] font-semibold ${muted}`}>{t('wait_you_told_us')}</p>
          {recap.map((line, i) => <p key={i} className={`text-[13px] italic ${muted}`}>“{line}”</p>)}
        </div>
      )}
    </>
  );
}
