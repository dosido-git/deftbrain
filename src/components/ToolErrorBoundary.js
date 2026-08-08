// Catches a crash while RENDERING a tool's results.
//
// Why this exists: the funnel measured the wrong thing. `tool_complete` fires
// in useClaudeAPI the moment response.json() resolves — before React has
// rendered anything. So a 200 whose payload puts an object where the JSX
// expects a string throws during render, the user gets a white screen, and the
// dashboard records a success. That is not a hypothetical: it has shipped
// twice (complaint-escalation-writer's `timeline`, difficult-talk-coach's
// `body_language_guidance`, both now coerced server-side), and until this
// boundary existed nothing anywhere would have told us about a third.
//
// The app had no error boundary at all, so React's default applied: unmount
// the whole tree and show nothing.
//
// `tool_render_error` is the signal. completes − render_errors is the number
// that actually means "the user saw their answer".

import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';
import { track } from '../utils/analytics';

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    // Beacon first, console second — send() is fire-and-forget and swallows
    // its own failures, so this can never make a bad render worse.
    track('tool_render_error', {
      tool: this.props.toolId,
      message: String((error && error.message) || error || 'unknown').slice(0, 200),
      // The first component frame is what localises the bad field in practice.
      where: String((info && info.componentStack) || '').trim().split('\n')[0].slice(0, 80),
    });
    console.error(`[${this.props.toolId}] render crashed:`, error);
  }

  render() {
    if (this.state.crashed) return this.props.renderFallback(() => this.setState({ crashed: false }));
    return this.props.children;
  }
}

// The boundary has to be a class (getDerivedStateFromError/componentDidCatch
// have no hook equivalent), and a class cannot call useTheme/useTranslation —
// hence this wrapper. It also keeps the call site to a single element.
export default function ToolErrorBoundary({ toolId, children }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const c = {
    card: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    muted: isDark ? 'text-slate-400' : 'text-slate-500',
    button: isDark
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const renderFallback = (retry) => (
    <div className="p-6 sm:p-10 flex justify-center">
      <div className={`${c.card} border rounded-xl shadow-sm p-8 max-w-md w-full text-center`}>
        <span className="text-3xl" role="img" aria-label="">⚠️</span>
        <p className={`mt-3 font-semibold ${c.text}`}>{t('something_wrong')}</p>
        {/* Remounting the subtree is the honest retry: the crash came from the
            data this render was handed, so the user has to run it again. */}
        <button
          type="button"
          onClick={retry}
          className={`mt-5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${c.button}`}
        >
          {t('try_again')}
        </button>
      </div>
    </div>
  );

  // Keyed on the tool so navigating between tools clears a previous crash
  // instead of showing the fallback on a page that never failed.
  return (
    <Boundary key={toolId} toolId={toolId} renderFallback={renderFallback}>
      {children}
    </Boundary>
  );
}
