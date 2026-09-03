import React, { useEffect, useState } from 'react';
import Caret from './Caret';
import { ActionBarProvider, useActionBar } from './ActionBarContext';
import { ActionBar } from './ActionButtons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getToolById, tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';
import LocaleSelectors from './LocaleSelectors';
import FeedbackTap from './FeedbackTap';
import { ensurePrintStyles } from './printStyles';

// Inner component — has access to ActionBarContext
const ToolPageWrapperInner = ({ children, tool, toolId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { actions } = useActionBar();

  // Scroll to top when a new tool page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Cmd+P and the DeftBrain Print button share one stylesheet — see printStyles.js
  useEffect(() => { ensurePrintStyles(); }, []);

  // Auto-detect tool in priority order:
  let detectedTool = tool;
  
  if (!detectedTool && toolId) {
    detectedTool = getToolById(toolId);
  }
  
  if (!detectedTool && location.pathname) {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    detectedTool = getToolById(lastSegment);
    
    if (!detectedTool) {
      const pascalCase = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      detectedTool = getToolById(pascalCase);
    }
    
    if (!detectedTool) {
      const normalized = lastSegment.toLowerCase().replace(/-/g, '');
      detectedTool = tools.find(t => 
        t.title.toLowerCase().replace(/\s/g, '') === normalized ||
        t.id.toLowerCase() === normalized
      );
    }
  }
  
  if (!detectedTool && children) {
    const childType = children?.type;
    
    if (childType?.displayName) {
      detectedTool = getToolById(childType.displayName);
    }
    
    if (!detectedTool && childType?.name) {
      detectedTool = getToolById(childType.name);
    }
  }
  
  // Get guide content with fallback
  const guide = detectedTool?.guide || {
    overview: "This tool helps you accomplish your goals efficiently.",
    howToUse: [
      "Step 1: Enter your information",
      "Step 2: Review the results",
      "Step 3: Take action based on insights"
    ],
    example: null,
    tips: []
  };
  // Theme-aware classes
  const isDark = theme === 'dark';

  // Bookmark toast
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

  const handleBookmarkHint = () => {
    setShowBookmarkToast(true);
    setTimeout(() => setShowBookmarkToast(false), 3500);
  };
  
  const colors = {
    // Backgrounds
    bg: isDark ? 'bg-zinc-900' : 'bg-stone-50',
    surface: isDark ? 'bg-zinc-800' : 'bg-white',
    surfaceAlt: isDark ? 'bg-zinc-800' : 'bg-stone-100',
    
    // Text
    text: isDark ? 'text-zinc-50' : 'text-stone-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-stone-600',
    // zinc-400 (not 500): zinc-500 on zinc-900 is 3.67:1 — fails WCAG AA for
    // the ← Dashboard back-link and other small muted text in dark mode.
    textMuted: isDark ? 'text-zinc-400' : 'text-stone-500',
    
    // Borders
    border: isDark ? 'border-zinc-700' : 'border-stone-200',
    
    // Accents — amber-700 (not 600) in light mode: the 10-12px accent
    // headings/pill sit at ~2.9:1 with amber-600; amber-700 reaches 4.6:1.
    accent: isDark ? 'text-[#D4AF37]' : 'text-amber-700',
    accentBg: isDark ? 'bg-[#D4AF37]' : 'bg-amber-600',
    accentBorder: isDark ? 'border-[#D4AF37]' : 'border-amber-600',
    
    // Hover states
    hoverBg: isDark ? 'hover:bg-zinc-700' : 'hover:bg-stone-200',
    hoverAccent: isDark ? 'hover:text-[#D4AF37]' : 'hover:text-amber-700',
    
    // Status indicators
    statusPulse: isDark ? 'bg-[#D4AF37]' : 'bg-amber-600',
    
    // Toggle button
    toggleBg: isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-stone-200 hover:bg-stone-300',
    toggleText: isDark ? 'text-zinc-100' : 'text-stone-900',
  };

  return (
    <div data-print-wrapper className={`min-h-screen ${colors.bg} ${colors.text} font-sans transition-colors duration-200`}>
      
      {/* ── Compact Logo Bar ── */}
      <div data-print-hide className={`w-full px-3 sm:px-6 py-4 ${colors.bg} sticky top-0 z-20 border-b ${colors.border}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <button 
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 ${colors.textMuted} ${colors.hoverAccent} transition-colors group flex-shrink-0`}
          >
            <span className="inline-block text-sm group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-xs font-semibold uppercase tracking-wide">Dashboard</span>
          </button>
          <Link to="/" title="Back to Dashboard" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col justify-center">
                <span className="text-xl sm:text-2xl font-extrabold leading-none tracking-tight" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  <span className={isDark ? 'text-[#d9a04e]' : 'text-[#c8872e]'}>D</span>
                  <span className={isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]'}>eftBrain</span>
                </span>
                {/* 10px was too small to read comfortably (reported 2026-07-30).
                    Now 12px, and the inks match the dashboard's corrected pair:
                    #78716c/#8a8275 only cleared AA by a hair (4.53/4.67:1),
                    while #6e6659 and #a8a29a give 5.3:1 and 7:1. max-w widened
                    so the larger text still breaks after "deft (adj.) —"
                    instead of wrapping to three lines.

                    Hidden below sm: at 375px the gloss made this block 294px
                    wide inside a 351px bar that also holds the Dashboard
                    button, and the wrapper is flex-shrink-0, so the header
                    overflowed by 37px and every tool page scrolled sideways.
                    The word "deft" is a nice thing to explain once on a wide
                    screen; it is not worth a horizontal scrollbar on a
                    phone. */}
                <p className={`hidden sm:block text-xs leading-snug mt-1.5 max-w-[34ch] ${isDark ? 'text-[#a8a29a]' : 'text-[#6e6659]'}`}>
                  <span className="font-bold">deft</span> <span className="italic">(adj.)</span> — skillful, nimble, clever.
                </p>
              </div>
              <img src="/pBrain-l.png" alt="DeftBrain" className="h-14 sm:h-16 w-auto block object-contain flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* lg:gap-y-0 — the header is its own grid item now, so the 32px row gap
          landed between the action bar and the tool card, where there used to
          be only the action row's own mb-2. Column gap is untouched (main to
          sidebar), and below lg the single column keeps the full gap-8 so the
          stacked sections still breathe. */}
      <div data-print-grid className="relative max-w-7xl mx-auto px-4 pb-8 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-y-0">
        {/* Locale controls — the trailing columns of row 1, beside the page
            header. They used to be absolutely positioned here, which meant row
            1 sized itself as if they did not exist: nothing stopped them
            overlapping the title if the pills ever grew or the heading wrapped.
            Placing them explicitly costs the same pixels and removes that.

            They stay FIRST in the DOM on purpose. Below lg the grid is one
            column and children stack in source order, so language and currency
            remain at the very top of the page — measured at 413px, y=89 here
            versus y=2241 if they moved into the sidebar, on a 3853px page. On
            a tool page these two pills are the only language control there is
            (GlobalHeader does not render here), so burying them below the form
            would strand anyone who landed in the wrong language. */}
        <div data-print-hide className="flex justify-end pt-4 mb-2 lg:mb-0 lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:items-start">
          <LocaleSelectors dark={isDark} />
        </div>

        {/* Page header + action bar — their own grid item, not part of <main>.
            Row 1 is now fully occupied (8 + 4), so <main> wraps to row 2 and
            the sidebar starts beside it: the sidebar's top edge lines up with
            the tool card's gradient rather than with the page title. Width is
            unchanged (still 8 of 12), so nothing inside this block moves or
            resizes. Below `lg` the grid is one column and the DOM order is
            what it always was. */}
        <div className="lg:col-start-1 lg:col-span-8 lg:row-start-1">

          {/* Print-only header */}
          {/* Height matters here, not style. Measured 2026-08-31: this block was
              172px, the tool card is 794px, and the gap between them 16px —
              982px against the 960px a Letter page gives you at half-inch
              margins. It missed fitting by 22px, and an engine that will not
              fragment the card answers a 22px overflow by moving all 794px to
              page two, which is the almost-blank first page. Chrome's default
              margins are narrower, so Chrome fragments and never showed it.
              Every number below is trimmed to buy back that page. */}
          <div data-print-show-flex style={{display:'none',flexDirection:'column',gap:'2px',paddingBottom:'8px',marginBottom:'10px',borderBottom:'2px solid #e5e7eb'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <img src="/pBrain-r.png" alt="DeftBrain" style={{height:'32px',width:'auto'}} />
              <div><div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'bold',color:'#1a1a1a'}}><span style={{color:'#c8872e'}}>D</span>eftBrain</div><div style={{fontSize:'11px',color:'#6b7280',fontStyle:'italic'}}>deft (adj.) — skillful, nimble, clever. · deftbrain.com</div></div>
            </div>
            {detectedTool && (
              <div style={{marginTop:'4px'}}>
                <div style={{fontSize:'20px',fontWeight:'700',color:'#1a1a1a'}}>{detectedTool.title}</div>
                <div style={{fontSize:'11px',color:'#4b5563',marginTop:'3px',lineHeight:'1.35',whiteSpace:'pre-line'}}>{detectedTool.description}</div>
              </div>
            )}
          </div>
          {/* ── Header ── */}
          <header data-print-hide className={`${colors.bg} pb-6 space-y-2`}>
            <div className={`flex items-center gap-3 ${colors.accent} mb-2 pt-4`}>
              <span className={`text-[10px] font-medium uppercase tracking-widest border ${colors.accentBorder} px-3 py-1 rounded-full`}>
                {detectedTool?.categories?.[0] || 'General'}
              </span>
            </div>
            <h1 className={`text-5xl font-light ${colors.text} tracking-tight`}>
              {detectedTool?.title || 'Tool'}
            </h1>
            <p className={`${colors.textSecondary} max-w-2xl leading-relaxed whitespace-pre-line`}>
              {detectedTool?.description || 'Strategic intelligence tool'}
            </p>
            {/* ── Localized "Any language works" signal — only renders for non-English browsers ── */}
            {i18n.language !== 'en' && (
              <p
                data-print-hide
                lang={i18n.language}
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                className={`text-xs ${colors.textMuted} italic flex items-center gap-1.5 pt-2`}
              >
                <span aria-hidden="true">🌐</span>
                <span>{t('any_language')}</span>
              </p>
            )}
          </header>

          {/* Bookmark hint + Theme Toggle (above card, right-aligned) */}
          <div data-print-hide className="flex items-center justify-between flex-wrap mt-4 mb-2 gap-2 relative">
            <div className="flex gap-2">
            <button
              onClick={handleBookmarkHint}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${colors.toggleBg} ${colors.toggleText}`}
              aria-label="Bookmark this tool"
              title="Bookmark this tool"
            >
              <span className="text-base leading-none">🔖</span>
              <span className="text-xs font-medium">Bookmark</span>
            </button>
            {showBookmarkToast && (
              <div className={`absolute start-0 top-full mt-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium whitespace-nowrap z-50 ${
                isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-white border-stone-200 text-stone-800'
              }`}>
                Press <kbd className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                  isDark ? 'bg-zinc-700 border-zinc-500' : 'bg-stone-100 border-stone-300'
                }`}>{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                  isDark ? 'bg-zinc-700 border-zinc-500' : 'bg-stone-100 border-stone-300'
                }`}>D</kbd> to bookmark this tool
              </div>
            )}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${colors.toggleBg} ${colors.toggleText}`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark
                ? <><span className="text-base leading-none">☀️</span><span className="text-xs font-medium">Light Mode</span></>
                : <><span className="text-base leading-none">🌙</span><span className="text-xs font-medium">Dark Mode</span></>
              }
            </button>
            </div>
            {actions.content && (
              <ActionBar content={actions.content} title={actions.title} shareUrl={actions.shareUrl} />
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <main data-print-main className="lg:col-span-8">
          <section data-print-section className={`scroll-mt-24 border ${colors.border} rounded-2xl shadow-sm overflow-hidden transition-colors duration-200`} style={{
              ...(detectedTool?.headerColor ? {
                background: `linear-gradient(to bottom, ${detectedTool.headerColor} 0%, ${detectedTool.headerColor} 60px, transparent 220px)`
              } : { background: isDark ? '#27272a' : '#ffffff' }),
            }}>
            <div className={`${colors.surface} m-3 sm:m-8 rounded-xl p-4 sm:p-6`}>
              {children}
            </div>
          </section>
          {/* "Was this helpful?" — highest-signal validation instrument, on every
              tool page (not printed). Central here so all tools inherit it. */}
          <div data-print-hide className="max-w-2xl mx-auto px-4">
            <FeedbackTap tool={detectedTool?.id || tool || toolId || 'unknown'} />
          </div>
          {/* Print-only footer */}
          <div data-print-show-flex style={{display:'none',justifyContent:'center',alignItems:'center',gap:'8px',paddingTop:'10px',marginTop:'20px',borderTop:'1px solid #e5e7eb'}}>
            {/* Wordmark + URL only. The brain mark is already at the top of
                every print-out (the print-only header above), so a second copy
                28px from the bottom of the page was the same logo twice. The
                URL line stays — a printed page should say where it came from. */}
            <span style={{fontFamily:'Georgia,serif',fontSize:'12px',color:'#9ca3af'}}><span style={{color:'#c8872e',fontWeight:'bold'}}>D</span>eftBrain · deftbrain.com</span>
          </div>
        </main>

        {/* Right Column: Ad Panel + Guide Sidebar */}
        {/* Below `lg` the whole aside stacks AFTER the form, as it always has. */}
        <aside data-print-hide className="lg:col-span-4 space-y-6 relative z-0">

          {/* ── Ad Panel Placeholder — commented out until ready to activate ── */}
          {/* <div className={`${colors.surfaceAlt} border ${colors.border} rounded-2xl overflow-hidden transition-colors duration-200`}>
            <div className="h-[200px] flex items-center justify-center">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${colors.textMuted}`}>
                reserved
              </span>
            </div>
          </div> */}

          {/* ── Guide Sidebar ── */}
          <div className={`${colors.surfaceAlt} border ${colors.border} rounded-2xl p-6 sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto transition-colors duration-200`}>
            
            {/* Header */}
            {/* ── In a Nutshell ────────────────────────────────────────────
                Now the sidebar's main content, not a disclosure. It used to be
                collapsed while ~380 words of documentation sat open beneath it,
                which is backwards: these four lines are the orientation, and the
                documentation is the optional part. So the nutshell is always
                open and everything else moved into "How <tool> works" at the
                bottom.

                Optional: tools with no primer skip this entirely. */}
            {tool?.primer && (
              <div className={`-mt-2 mb-6 border-s-2 ${colors.accentBorder} ps-4`}>
                <div className={`text-xs font-bold ${colors.accent} uppercase tracking-wide`}>
                  In a Nutshell
                </div>
                <dl className="space-y-2.5 mt-3">
                  {[['When', tool.primer.when], ['You give', tool.primer.give],
                    ['You get', tool.primer.get], ['The edge', tool.primer.edge]]
                    .filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <dt className={`text-[10px] font-bold ${colors.accent} uppercase tracking-wide`}>{label}</dt>
                      <dd className={`text-sm ${colors.textSecondary} leading-relaxed`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* ── Good to Know ──────────────────────────────────────────
                Collapsed. These answer "does it handle my situation?", which is
                a question you only have once you have one — so it waits to be
                asked rather than sitting open above the form. */}
            {guide.tips && guide.tips.length > 0 && (
              <details className="group mb-6">
                <summary className="cursor-pointer py-2 -my-2 list-none [&::-webkit-details-marker]:hidden">
                  <div className={`text-xs font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'} uppercase tracking-wide flex items-center gap-2`}>
                    Good to Know
                    <Caret groupOpen className="ms-auto" />
                  </div>
                </summary>
                <ul className="space-y-2 mt-3">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-700'} mt-1 flex-shrink-0`}>•</span>
                      <span className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* ── Before you go ────────────────────────────────────────────
                Optional, and deliberately so. The one caveat a person needs
                BEFORE acting on the output — for tools where acting means
                turning up somewhere or spending money. Most tools have nothing
                that belongs here and correctly render nothing; this is not a
                field to fill in for the sake of it. */}
            {guide.beforeYouGo && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} uppercase mb-3 tracking-wide flex items-center gap-2`}>
                  <span className="text-sm">✓</span>
                  Before You Go
                </h4>
                <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                  {guide.beforeYouGo}
                </p>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
};

const ToolPageWrapper = ({ children, tool, toolId }) => (
  <ActionBarProvider>
    <ToolPageWrapperInner tool={tool} toolId={toolId}>
      {children}
    </ToolPageWrapperInner>
  </ActionBarProvider>
);

export default ToolPageWrapper;
