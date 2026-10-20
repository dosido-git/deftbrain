import { useRef, useState } from 'react';
import { track } from '../utils/analytics';
import { useLocale } from './useLocale';
import { beginWait, summarizeRequest, toolFromPath } from '../utils/waitSignal';
import { signalBusy } from '../utils/busySignal';
import { t } from '../i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
// Canned-answer mode (scripts/canned-backend.js, $0 page testing): in a
// development build only, localStorage 'db-backend-url' points tool calls at
// another local backend. Production builds strip this branch.
const backendUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const v = window.localStorage.getItem('db-backend-url');
      if (v && /^http:\/\/localhost:\d+$/.test(v)) return v;
    } catch (_) { /* storage blocked */ }
  }
  return BACKEND_URL;
};

// Surge mode (2026-10-05): a run the server answers 503 { code: 'busy' } is
// waited out and tried again this many times before the visitor is told —
// a slower answer beats an error. The wait follows the server's Retry-After.
const BUSY_RETRIES = 2;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// The visitor's time zone, so the server's "today" is their today, not UTC's.
const userTimezone = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined; } catch (_) { return undefined; }
})();

export const useClaudeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // All four localization fields come from the global LocaleProvider, which
  // honors the header's language/currency overrides (and detects from the
  // browser when either is set to 'auto').
  const { userLanguage, userLocale, userRegion, userCurrency } = useLocale();

  // Generic Claude call
  // Tool-specific endpoint call
  const callToolEndpoint = async (endpoint, data) => {
    setLoading(true);
    setError(null);
    const _t0 = Date.now();
    track('tool_run', { tool: endpoint });
    // Page-wide wait signal (utils/waitSignal): drives the "usually takes…"
    // notice and the "answer ready" tab title in the page frame.
    let waitOutcome = 'error';
    const endWait = beginWait({ tool: toolFromPath(typeof window !== 'undefined' ? window.location.pathname : ''), summary: summarizeRequest(data) });

    try {
      let response;
      for (let attempt = 0; ; attempt++) {
        response = await fetch(`${backendUrl()}/api/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency, userTimezone })
        });
        if (response.status !== 503 || attempt >= BUSY_RETRIES) break;
        const peek = await response.clone().json().catch(() => ({}));
        if (peek.code !== 'busy') break;
        // Busy: say "you're in line", wait, try again.
        signalBusy('waiting');
        track('tool_busy_retry', { tool: endpoint, attempt: attempt + 1 });
        const retryAfter = Number(response.headers.get('Retry-After')) || 20;
        await sleep(Math.min(60, retryAfter) * 1000);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.error || `Server error: ${response.status}`);
        // A route can name WHY it failed (e.g. signal-vs-noise's
        // `research_unavailable` while a cold research fetch is still
        // running). Carry the status and that code so a tool can react —
        // retry, or show a specific state — instead of matching on message
        // text. Existing callers only read .message and are unaffected.
        err.status = response.status;
        if (typeof errorData.code === 'string') err.code = errorData.code;
        if (err.code === 'busy') signalBusy('failed');
        // Too vague to work with (lib/surge.js): say so in their language.
        if (err.code === 'unclear_input') err.message = t('err_unclear_input');
        throw err;
      }

      const json = await response.json();
      // A route that sends a keep-alive heartbeat before it knows the
      // outcome (party-architect — see its tool-notes) can no longer report
      // a failure via HTTP status once bytes are already flowing: the
      // status is committed to 200 the moment the first heartbeat byte goes
      // out. Such a route reports failure as a bare single-key {error}
      // body instead. No normal tool result is ever shaped like that, so
      // this only ever fires on a genuine error.
      if (json && typeof json === 'object' && Object.keys(json).length === 1 && typeof json.error === 'string') {
        throw new Error(json.error);
      }
      track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
      waitOutcome = 'ok';
      signalBusy('clear');
      return json;

    } catch (err) {
      track('tool_error', { tool: endpoint, message: String(err.message || '').slice(0, 80) });
      setError(err.message);
      throw err;
    } finally {
      endWait(waitOutcome);
      setLoading(false);
    }
  };

  // Streaming SSE tool endpoint call
  // callbacks: { onChunk(accumulatedText), onDone(finalText), onError(message) }
  const callToolEndpointStreaming = async (endpoint, data, callbacks = {}) => {
    const { onChunk, onDone, onError } = callbacks;
    setLoading(true);
    setError(null);
    // Streaming tools fired no beacons at all until 2026-08-08, so they were
    // absent from the funnel entirely — no runs, no completes, no errors, and
    // therefore no alert could ever fire for one. Same three events as
    // callToolEndpoint so they share the dashboard's columns.
    const _t0 = Date.now();
    track('tool_run', { tool: endpoint });
    // A streaming answer is visible from its first words, so the wait ends
    // there, not when the last word arrives.
    const endWait = beginWait({ tool: toolFromPath(typeof window !== 'undefined' ? window.location.pathname : ''), summary: summarizeRequest(data) });

    try {
      const response = await fetch(`${backendUrl()}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency, userTimezone }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'busy') signalBusy('failed');
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line for next chunk

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.error) {
              // An error delivered INSIDE the stream: the response was 200 and
              // the failure arrived as a frame, so nothing else would count it.
              track('tool_error', { tool: endpoint, message: String(parsed.error || '').slice(0, 80) });
              endWait('error');
              if (onError) onError(parsed.error);
              setLoading(false);
              return;
            }
            if (parsed.chunk) {
              endWait('ok');
              accumulated += parsed.chunk;
              if (onChunk) onChunk(accumulated);
            }
            if (parsed.done) {
              // Second arg: server-side validated/repaired object, when the
              // route provides one (e.g. one-percenter) — callers may prefer
              // it over parsing the accumulated text themselves.
              track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
              endWait('ok');
              if (onDone) onDone(accumulated, parsed.parsed);
              setLoading(false);
              return;
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }

      // Stream ended without a done event — treat accumulated as final
      track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
      endWait('ok');
      if (onDone) onDone(accumulated);

    } catch (err) {
      track('tool_error', { tool: endpoint, message: String(err.message || '').slice(0, 80) });
      endWait('error');
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      // endWait is one-shot; this only matters if nothing above ended it.
      endWait('error');
      setLoading(false);
    }
  };

  // Progressive call (2026-10-15, backend/lib/progressive.js): the answer
  // arrives in parts and is shown as it grows; the details are double-checked
  // after it is on screen. Sends `progressive: true`.
  //   onDraft(answerSoFar)        — each time a part lands
  //   onChecked(answer, changed)  — the checked answer; `changed` lists the
  //                                 corrected paths (empty when nothing changed)
  // Resolves with the final answer. `loading` ends with the first draft — the
  // visitor is reading by then. A newer progressive call cancels an older one,
  // so a late check can never overwrite a newer answer.
  const progressiveAbort = useRef(null);
  const callToolEndpointProgressive = async (endpoint, data, { onDraft, onChecked } = {}) => {
    progressiveAbort.current?.abort();
    const ctrl = new AbortController();
    progressiveAbort.current = ctrl;
    setLoading(true);
    setError(null);
    const _t0 = Date.now();
    track('tool_run', { tool: endpoint });
    const endWait = beginWait({ tool: toolFromPath(typeof window !== 'undefined' ? window.location.pathname : ''), summary: summarizeRequest(data) });
    let latest = null;
    try {
      let response;
      for (let attempt = 0; ; attempt++) {
        response = await fetch(`${backendUrl()}/api/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, progressive: true, userLanguage, userLocale, userRegion, userCurrency, userTimezone }),
          signal: ctrl.signal,
        });
        if (response.status !== 503 || attempt >= BUSY_RETRIES) break;
        const peek = await response.clone().json().catch(() => ({}));
        if (peek.code !== 'busy') break;
        signalBusy('waiting');
        track('tool_busy_retry', { tool: endpoint, attempt: attempt + 1 });
        await sleep(Math.min(60, Number(response.headers.get('Retry-After')) || 20) * 1000);
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.error || `Server error: ${response.status}`);
        err.status = response.status;
        if (typeof errorData.code === 'string') err.code = errorData.code;
        if (err.code === 'busy') signalBusy('failed');
        // Too vague to work with (lib/surge.js): say so in their language.
        if (err.code === 'unclear_input') err.message = t('err_unclear_input');
        throw err;
      }
      // A route that has not been made progressive answers with one JSON body
      // (Money Diplomat's endpoints share one page call, and only some stream).
      // Take it as the finished answer rather than finding no frames in it.
      if (!String(response.headers.get('Content-Type') || '').includes('text/event-stream')) {
        latest = await response.json();
        if (latest?.error) throw new Error(latest.error);
        onDraft?.(latest);
        signalBusy('clear');
        track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
        return latest; // finally ends the wait and the loading state
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop();
        for (const frame of frames) {
          if (!frame.startsWith('data: ')) continue;
          let f;
          try { f = JSON.parse(frame.slice(6)); } catch { continue; }
          if (f.error) throw new Error(f.error);
          if (f.draft) {
            if (!latest) { endWait('ok'); signalBusy('clear'); setLoading(false); }
            latest = f.draft;
            onDraft?.(f.draft);
          }
          if (f.checked) {
            latest = f.checked;
            onChecked?.(f.checked, Array.isArray(f.changed) ? f.changed : []);
          }
        }
      }
      if (!latest) throw new Error('No answer came back. Please try again.');
      track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
      return latest;
    } catch (err) {
      if (err.name === 'AbortError') return null; // replaced by a newer run
      track('tool_error', { tool: endpoint, message: String(err.message || '').slice(0, 80) });
      setError(err.message);
      // A failure after the answer showed (the check stream broke) keeps it.
      if (latest) return latest;
      throw err;
    } finally {
      endWait(latest ? 'ok' : 'error');
      if (progressiveAbort.current === ctrl) setLoading(false);
    }
  };

  // Stop a progressive answer that is still arriving or being checked (the
  // visitor reset the form or loaded an example), so it cannot reappear.
  const cancelProgressive = () => { progressiveAbort.current?.abort(); progressiveAbort.current = null; setLoading(false); };

  // Status poll — same request shape and locale plumbing as callToolEndpoint,
  // but it does NOT track tool_run / tool_complete and does not toggle
  // `loading`. A tool that polls a readiness endpoint every few seconds
  // (signal-vs-noise/research) would otherwise log twenty "runs" per visitor
  // and skew every per-tool number on the dashboard. Errors carry status and
  // code like the tracked call.
  const pollToolEndpoint = async (endpoint, data) => {
    const response = await fetch(`${backendUrl()}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency, userTimezone }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(json.error || `Server error: ${response.status}`);
      err.status = response.status;
      if (typeof json.code === 'string') err.code = json.code;
      throw err;
    }
    return json;
  };

  return { callToolEndpoint, callToolEndpointStreaming, callToolEndpointProgressive, cancelProgressive, pollToolEndpoint, loading, error, userLanguage, userLocale, userRegion, userCurrency };
};
