import { useState } from 'react';
import { track } from '../utils/analytics';
import { useLocale } from './useLocale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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

    try {
      const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
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
      return json;

    } catch (err) {
      track('tool_error', { tool: endpoint, message: String(err.message || '').slice(0, 80) });
      setError(err.message);
      throw err;
    } finally {
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

    try {
      const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
              if (onError) onError(parsed.error);
              setLoading(false);
              return;
            }
            if (parsed.chunk) {
              accumulated += parsed.chunk;
              if (onChunk) onChunk(accumulated);
            }
            if (parsed.done) {
              // Second arg: server-side validated/repaired object, when the
              // route provides one (e.g. one-percenter) — callers may prefer
              // it over parsing the accumulated text themselves.
              track('tool_complete', { tool: endpoint, ms: Date.now() - _t0 });
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
      if (onDone) onDone(accumulated);

    } catch (err) {
      track('tool_error', { tool: endpoint, message: String(err.message || '').slice(0, 80) });
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { callToolEndpoint, callToolEndpointStreaming, loading, error, userLanguage, userLocale, userRegion, userCurrency };
};
