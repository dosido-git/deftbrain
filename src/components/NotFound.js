import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import IdeaPrompt from './IdeaPrompt';

const NotFound = ({
  headline = "This page doesn't exist.",
  message = `Unusual, for a site with ${TOOL_COUNT_LABEL} tools — but here we are. Whatever you were actually looking for, one of them probably handles it.`,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const c = {
    bg:        isDark ? 'bg-zinc-950' : 'bg-[#faf8f5]',
    card:      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-[#e8e1d5]',
    heading:   isDark ? 'text-zinc-100' : 'text-[#1a2e44]',
    accent:    isDark ? 'text-orange-400' : 'text-[#c8872e]',
    body:      isDark ? 'text-zinc-400' : 'text-[#5a544a]',
    primary:   isDark
      ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400'
      : 'bg-[#1a2e44] text-white hover:bg-[#2c4a6e]',
    secondary: isDark
      ? 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-orange-400 hover:text-orange-400'
      : 'bg-white text-[#1a2e44] border-[#e8e1d5] hover:border-[#c8872e] hover:text-[#c8872e]',
  };

  return (
    <div className={`min-h-screen ${c.bg} flex items-center justify-center p-6`}>
      <div className={`text-center space-y-5 ${c.card} border p-10 sm:p-12 rounded-2xl shadow-sm max-w-md w-full`}>
        <div className="text-5xl" role="img" aria-label="thinking brain">
          <span>🧠</span>
        </div>
        <div>
          <h1 className={`text-6xl font-bold tracking-tight ${c.heading}`}>
            4<span className={c.accent}>0</span>4
          </h1>
          <p className={`text-sm font-medium mt-3 ${c.heading}`}>
            {headline}
          </p>
          <p className={`text-sm mt-2 leading-relaxed ${c.body}`}>
            {message}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <button
            onClick={() => navigate('/')}
            className={`w-full py-3.5 ${c.primary} rounded-xl font-semibold transition-colors`}
          >
            Browse all tools
          </button>
          <button
            onClick={() => navigate('/ToolFinder')}
            className={`w-full py-3 ${c.secondary} border rounded-xl font-semibold transition-colors`}
          >
            🔎 Describe your problem, we&apos;ll find the tool
          </button>
          {/* Anchor (not navigate) — /guides is server-rendered, not a React route */}
          <a
            href="/guides"
            className={`block w-full py-3 ${c.secondary} border rounded-xl font-semibold transition-colors text-center`}
          >
            Read the guides
          </a>
          {/* Demand capture — they expected something at this URL */}
          <IdeaPrompt source="404" compact className="pt-1" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
