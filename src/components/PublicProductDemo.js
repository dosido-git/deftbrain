import React from 'react';
import { useTheme } from '../hooks/useTheme';

// Public, reviewed demonstration shared with the static/prerendered tool page
// through tools.js. Only tools with exampleOutput render anything here.
const PublicProductDemo = ({ tool }) => {
  const { isDark } = useTheme();
  const x = tool?.exampleOutput;
  if (!x) return null;

  const text = isDark ? 'text-zinc-50' : 'text-gray-900';
  const secondary = isDark ? 'text-zinc-300' : 'text-gray-600';
  const muted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const toneClass = {
    red: isDark ? 'border-red-800/60 bg-red-900/15' : 'border-red-200 bg-red-50',
    yellow: isDark ? 'border-amber-800/60 bg-amber-900/15' : 'border-amber-200 bg-amber-50',
    green: isDark ? 'border-emerald-800/60 bg-emerald-900/15' : 'border-emerald-200 bg-emerald-50',
    neutral: isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-50',
  };

  return (
    <details className={`${isDark ? 'bg-amber-950/20 border-amber-800/50' : 'bg-amber-50/60 border-amber-200'} border-2 border-dashed rounded-2xl overflow-hidden mt-6`}>
      <summary className={`cursor-pointer list-none p-5 flex items-center justify-between gap-4 ${isDark ? 'hover:bg-amber-900/20' : 'hover:bg-amber-100/40'}`}>
        <div><p className={`text-base font-black ${text}`}>{x.title}</p><p className={`text-sm mt-1 ${secondary}`}>{x.intro}</p></div>
        <span className={`text-sm font-bold whitespace-nowrap ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{x.expandLabel}</span>
      </summary>
      <div className={`border-t border-dashed ${isDark ? 'border-amber-800/50' : 'border-amber-200'} p-5 space-y-4`}>
        <div><p className={`text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>{x.sampleLabel}</p><blockquote className={`p-4 rounded-xl border-s-4 ${isDark ? 'bg-zinc-900/60 border-zinc-500 text-zinc-200' : 'bg-zinc-50 border-zinc-400 text-gray-800'} text-sm leading-relaxed`}>{x.sampleText}</blockquote>{x.context && <p className={`text-xs mt-2 ${muted}`}>{x.context}</p>}</div>
        {x.sections?.map((section, i) => <div key={i} className={`p-4 rounded-xl border ${toneClass[section.tone] || toneClass.neutral}`}><p className={`text-sm font-black mb-1 ${text}`}>{section.label}</p>{section.text && <p className={`text-sm leading-relaxed ${secondary}`}>{section.text}</p>}{section.items?.length > 0 && <ul className={`list-disc ps-5 space-y-1.5 text-sm ${secondary}`}>{section.items.map((item, j) => <li key={j}>{item}</li>)}</ul>}</div>)}
        {x.nextStep && <div><p className={`text-sm font-black mb-1 ${text}`}>{x.nextStepLabel}</p><p className={`text-sm leading-relaxed ${secondary}`}>{x.nextStep}</p></div>}
        {x.disclaimer && <p className={`text-xs leading-relaxed ${muted}`}>{x.disclaimer}</p>}
      </div>
    </details>
  );
};
export default PublicProductDemo;
