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

  return { callClaude, callToolEndpoint, loading, error, userLanguage };
};