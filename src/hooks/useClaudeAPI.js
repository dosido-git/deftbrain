import { useState, useMemo } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

console.log('Backend URL:', BACKEND_URL); // Add this temporarily to debug

// Detect user's preferred language from browser
function detectLanguage() {
  try {
    const lang = navigator.language || navigator.userLanguage || 'en-US';
    return lang; // e.g., 'ja-JP', 'pt-BR', 'fr-FR', 'en-US'
  } catch {
    return 'en-US';
  }
}

export const useClaudeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detect once per mount
  const userLanguage = useMemo(() => detectLanguage(), []);

  // Generic Claude call
  const callClaude = async (prompt, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: options.model || 'claude-sonnet-4-20250514',
          maxTokens: options.maxTokens || 2000,
          systemPrompt: options.systemPrompt || null,
          userLanguage,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Tool-specific endpoint call
  const callToolEndpoint = async (endpoint, data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, userLanguage })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      return await response.json();

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Streaming tool endpoint call — SSE-based
  // onChunk(accumulatedText)  — called on each token, receives full accumulated text so far
  // onDone(parsedResult)      — called when stream completes with the final parsed JSON
  // onError(message)          — called on stream or parse error
  const callToolEndpointStreaming = (endpoint, data, { onChunk, onDone, onError } = {}) => {
    setLoading(true);
    setError(null);

    let accumulated = '';

    fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userLanguage }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().catch(() => ({})).then((errData) => {
            throw new Error(errData.error || `Server error: ${response.status}`);
          });
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processChunks = ({ done, value }) => {
          // Always decode value first — final read can carry data AND done:true simultaneously
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
          }

          if (done) {
            // Process any remaining SSE events in the buffer
            const parts = buffer.split('\n\n');
            for (const part of parts) {
              const line = part.trim();
              if (!line.startsWith('data: ')) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.chunk) accumulated += event.chunk;
              } catch { /* ignore */ }
            }

            // Parse the full accumulated text
            setLoading(false);
            if (accumulated) {
              try {
                let cleaned = accumulated.trim()
                  .replace(/```json\n?/g, '').replace(/```\n?/g, '');
                const first = cleaned.indexOf('{');
                if (first > 0) cleaned = cleaned.substring(first);
                const last = cleaned.lastIndexOf('}');
                if (last !== -1) cleaned = cleaned.substring(0, last + 1);
                onDone?.(JSON.parse(cleaned));
              } catch {
                const msg = 'Failed to parse response. Please try again.';
                setError(msg);
                onError?.(msg);
              }
            }
            return;
          }

          // SSE lines are separated by double newline
          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // keep incomplete trailing part

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;

            try {
              const event = JSON.parse(line.slice(6));

              if (event.error) {
                const msg = event.error;
                setError(msg);
                setLoading(false);
                onError?.(msg);
                return;
              }

              if (event.chunk) {
                accumulated += event.chunk;
                onChunk?.(accumulated);
              }
            } catch {
              // malformed SSE line — skip
            }
          }

          reader.read().then(processChunks).catch((err) => {
            setError(err.message);
            setLoading(false);
            onError?.(err.message);
          });
        };

        reader.read().then(processChunks).catch((err) => {
          setError(err.message);
          setLoading(false);
          onError?.(err.message);
        });
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        onError?.(err.message);
      });
  };

  return { callClaude, callToolEndpoint, callToolEndpointStreaming, loading, error, userLanguage };
};
