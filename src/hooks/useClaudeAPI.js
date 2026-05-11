import { useState, useMemo } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// region (ISO 3166-1 alpha-2) → currency (ISO 4217)
const REGION_CURRENCY = {
  US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', GB: 'GBP',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', PT: 'EUR',
  BE: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'EUR',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', TW: 'TWD', HK: 'HKD',
  SG: 'SGD', MY: 'MYR', ID: 'IDR', TH: 'THB', VN: 'VND',
  PH: 'PHP', IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', EG: 'EGP',
  RU: 'RUB', UA: 'UAH', TR: 'TRY', IL: 'ILS',
  SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD',
};

// language-only code → most likely region (fallback when navigator.language has no region tag)
const LANGUAGE_REGION_FALLBACK = {
  ja: 'JP', ko: 'KR', zh: 'CN', ar: 'SA', hi: 'IN', id: 'ID',
  ms: 'MY', th: 'TH', vi: 'VN', tl: 'PH', fil: 'PH',
  tr: 'TR', pl: 'PL', ru: 'RU', uk: 'UA', he: 'IL',
  sv: 'SE', no: 'NO', da: 'DK', fi: 'FI', el: 'GR',
};

// Detect user's locale, region, and currency from browser
function detectLocaleContext() {
  try {
    const locale = navigator.language || navigator.userLanguage || 'en-US';
    const parts = locale.split('-');
    const langCode = parts[0].toLowerCase();
    const rawRegion = parts[1] ? parts[1].toUpperCase()
                                : (LANGUAGE_REGION_FALLBACK[langCode] || 'US');
    const userRegion   = rawRegion;
    const userCurrency = REGION_CURRENCY[userRegion] || 'USD';
    return {
      userLanguage: locale,   // full locale string — backward-compat with withLanguage on all 122 routes
      userLocale:   locale,   // same value; used by Intl.NumberFormat / Intl.DateTimeFormat
      userRegion,             // ISO 3166-1 alpha-2
      userCurrency,           // ISO 4217
    };
  } catch {
    return { userLanguage: 'en-US', userLocale: 'en-US', userRegion: 'US', userCurrency: 'USD' };
  }
}

export const useClaudeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detect once per mount — all four localization fields
  const { userLanguage, userLocale, userRegion, userCurrency } = useMemo(() => detectLocaleContext(), []);

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
          userLocale,
          userRegion,
          userCurrency,
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
        body: JSON.stringify({ ...data, userLanguage, userLocale, userRegion, userCurrency })
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

  // Streaming SSE tool endpoint call
  // callbacks: { onChunk(accumulatedText), onDone(finalText), onError(message) }
  const callToolEndpointStreaming = async (endpoint, data, callbacks = {}) => {
    const { onChunk, onDone, onError } = callbacks;
    setLoading(true);
    setError(null);

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
              if (onError) onError(parsed.error);
              setLoading(false);
              return;
            }
            if (parsed.chunk) {
              accumulated += parsed.chunk;
              if (onChunk) onChunk(accumulated);
            }
            if (parsed.done) {
              if (onDone) onDone(accumulated);
              setLoading(false);
              return;
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }

      // Stream ended without a done event — treat accumulated as final
      if (onDone) onDone(accumulated);

    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { callClaude, callToolEndpoint, callToolEndpointStreaming, loading, error, userLanguage, userLocale, userRegion, userCurrency };
};
