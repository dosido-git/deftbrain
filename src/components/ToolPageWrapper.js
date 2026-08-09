import React, { useEffect, useState } from 'react';
import { ActionBarProvider, useActionBar } from './ActionBarContext';
import { ActionBar } from './ActionButtons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getToolById, tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';
import LocaleSelectors from './LocaleSelectors';
import FeedbackTap from './FeedbackTap';

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

  // Inject @media print into <head> — works for both system Cmd+P and the DeftBrain button
  useEffect(() => {
    const id = 'db-wrapper-print-css';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      [data-print-show-flex] { display: none; }
      @media print {
        /* Hide chrome */
        [data-print-hide] { display: none !important; }
        /* Show print-only branding */
        [data-print-show-flex] { display: flex !important; }
        /* Collapse sidebar grid to single column */
        [data-print-grid] { display: block !important; }
        [data-print-main] { grid-column: 1 / -1 !important; max-width: 100% !important; }
        /* White page background — works for both light and dark mode */
        html, body { background: white !important; background-color: white !important; }
        /* The outer wrapper (min-h-screen bg-zinc-900 in dark mode) */
        [data-print-wrapper] { background: white !important; background-color: white !important; }
        /* THE KEY FIX: the tool card section and its immediate child (the p-8 gradient div).
           In dark mode these are bg-zinc-800 / transparent-over-zinc-800.
           Setting them white removes the black gaps between content cards. */
        [data-print-section],
        [data-print-section] > div {
          background: white !important;
          background-color: white !important;
          overflow: visible !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        /* Firefox: prevent page break between header and tool card */
        [data-print-main] > header { break-after: avoid !important; page-break-after: avoid !important; }
        /* ── Dark mode must not survive onto paper ──────────────────────────
           The DeftBrain Print button builds its own light document, so it has
           always come out readable. Cmd+P prints the live DOM, and the rules
           above only whitened [data-print-section] and its immediate child —
           so every card INSIDE it kept bg-zinc-800 while its text stayed light,
           and any pale-tinted card (the hero, the anniversary box, "Make it
           even better") composited over white and turned light-on-light,
           i.e. invisible. Compare the two PDFs from 2026-08-08.

           This cannot be solved by flipping a theme token: dark mode here is
           chosen in JavaScript -- isDark ? 'bg-zinc-800' : 'bg-white' -- so the
           class names are already baked into the markup by the time CSS runs.
           The surface is small and enumerable, so map it directly. */
        [data-print-section] .bg-zinc-600,
        [data-print-section] .bg-zinc-700,
        [data-print-section] .bg-zinc-800,
        [data-print-section] .bg-zinc-900,
        [data-print-section] [class*="bg-zinc-700/"],
        [data-print-section] [class*="bg-zinc-800/"] {
          background-color: #ffffff !important;
          background-image: none !important;
        }
        /* Light-on-dark text, now on white. Zinc 100–400 all become ink; 500+
           is already mid-grey and stays legible as secondary text. */
        [data-print-section] .text-white,
        [data-print-section] .text-zinc-50,
        [data-print-section] .text-zinc-100,
        [data-print-section] .text-zinc-200,
        [data-print-section] .text-zinc-300 { color: #18181b !important; }
        [data-print-section] .text-zinc-400 { color: #52525b !important; }
        /* ...except where white text is still correct. A saturated button
           (bg-red-600, bg-emerald-600) keeps its colour on paper — the Print
           button's output keeps those too — so inking its label would put dark
           text on a dark fill. Only zinc backgrounds were whitened above, so
           anything carrying a non-zinc bg- class is exempt. Must follow the
           rule it overrides. */
        [data-print-section] [class*="bg-"]:not([class*="bg-zinc"]):not([class*="bg-white"]).text-white {
          color: #ffffff !important;
        }
        /* Accent text picked for a dark card. On white these land at 1.7–2.8:1
           (cyan-400 on white is 1.81). The Print button's document already uses
           the light-mode shades, so map each to its 700 counterpart to match. */
        [data-print-section] .text-amber-300,
        [data-print-section] .text-amber-400 { color: #b45309 !important; }
        [data-print-section] .text-cyan-300,
        [data-print-section] .text-cyan-400 { color: #0e7490 !important; }
        [data-print-section] .text-emerald-300,
        [data-print-section] .text-emerald-400 { color: #047857 !important; }
        [data-print-section] .text-fuchsia-300,
        [data-print-section] .text-fuchsia-400 { color: #a21caf !important; }
        [data-print-section] .text-green-300,
        [data-print-section] .text-green-400 { color: #15803d !important; }
        [data-print-section] .text-lime-300,
        [data-print-section] .text-lime-400 { color: #4d7c0f !important; }
        [data-print-section] .text-orange-300,
        [data-print-section] .text-orange-400 { color: #c2410c !important; }
        [data-print-section] .text-red-300,
        [data-print-section] .text-red-400 { color: #b91c1c !important; }
        [data-print-section] .text-sky-300,
        [data-print-section] .text-sky-400 { color: #0369a1 !important; }
        [data-print-section] .text-yellow-300,
        [data-print-section] .text-yellow-400 { color: #a16207 !important; }
        /* Borders drawn for a dark ground disappear on white. */
        [data-print-section] .border-zinc-600,
        [data-print-section] .border-zinc-700,
        [data-print-section] .border-zinc-800 { border-color: #d4d4d8 !important; }
        /* Tinted cards (hero, budget, callouts) keep their colour — the Print
           button's output keeps them too, and matching it is the goal. Their
           TEXT is the part that breaks, and the rules above already fix it. */

        /* Suppress transitions during print capture */
        * { transition: none !important; animation: none !important; }
      }
    `;
    document.head.appendChild(s);
  }, []);

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
  // FAQ lives top-level on the tool entry (focus-tools enrichment) — same
  // content the prerendered static page renders, so crawler and user match.
  const faq = Array.isArray(detectedTool?.faq) ? detectedTool.faq : [];

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
                    instead of wrapping to three lines. */}
                <p className={`text-xs leading-snug mt-1.5 max-w-[34ch] ${isDark ? 'text-[#a8a29a]' : 'text-[#6e6659]'}`}>
                  <span className="font-bold">deft</span> <span className="italic">(adj.)</span> — skillful, nimble, clever.
                </p>
              </div>
              <img src="/pBrain-l.png" alt="DeftBrain" className="h-14 sm:h-16 w-auto block object-contain flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      <div data-print-grid className="relative max-w-7xl mx-auto px-4 pb-8 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Locale controls — top-right of the working area, off the brand bar.
            Absolute on desktop so the tool content fills from the top; a normal
            right-aligned row on mobile. */}
        <div data-print-hide className="flex justify-end mb-2 lg:mb-0 lg:absolute lg:top-3 lg:end-4 lg:z-10">
          <LocaleSelectors dark={isDark} />
        </div>
        
        {/* Main Content Area */}
        <main data-print-main className="lg:col-span-8">

          {/* Print-only header */}
          <div data-print-show-flex style={{display:'none',flexDirection:'column',gap:'6px',paddingBottom:'14px',marginBottom:'16px',borderBottom:'2px solid #e5e7eb'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <img src="/pBrain-r.png" alt="DeftBrain" style={{height:'40px',width:'auto'}} />
              <div><div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'bold',color:'#1a1a1a'}}><span style={{color:'#c8872e'}}>D</span>eftBrain</div><div style={{fontSize:'11px',color:'#6b7280',fontStyle:'italic'}}>deft (adj.) — skillful, nimble, clever. · deftbrain.com</div></div>
            </div>
            {detectedTool && (
              <div style={{marginTop:'8px'}}>
                <div style={{fontSize:'22px',fontWeight:'700',color:'#1a1a1a'}}>{detectedTool.title}</div>
                <div style={{fontSize:'13px',color:'#4b5563',marginTop:'4px',lineHeight:'1.5'}}>{detectedTool.description}</div>
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
            <p className={`${colors.textSecondary} max-w-2xl leading-relaxed`}>
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

          <section data-print-section className={`border ${colors.border} rounded-2xl shadow-sm overflow-hidden transition-colors duration-200`} style={{
              ...(detectedTool?.headerColor ? {
                background: `linear-gradient(to bottom, ${detectedTool.headerColor} 0%, ${detectedTool.headerColor} 60px, transparent 220px)`
              } : { background: isDark ? '#27272a' : '#ffffff' }),
              breakBefore: 'avoid',
              pageBreakBefore: 'avoid',
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
            {/* "How to Use This Tool" was wrong about its own contents. Nothing
                below tells you how to operate anything — it answers when this is
                for you, what it needs, what you get back, and why it beats
                muddling through. "Good to Know" also implies optionality: you
                do not have to read it. */}
            <h3 className={`text-xs font-semibold ${colors.text} uppercase tracking-widest mb-6 flex items-center justify-center gap-2`}>
              <span className="text-base">💡</span>
              Good to Know
            </h3>
            
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

            {/* ── Helpful to Know ──────────────────────────────────────────
                Was "Pro Tips". Same content, but these answer "does it handle
                my situation?" rather than offering advice, so they stay visible
                while the documentation does not. */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'} uppercase mb-3 tracking-wide`}>
                  Helpful to Know
                </h4>
                <ul className="space-y-2">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-700'} mt-1 flex-shrink-0`}>•</span>
                      <span className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
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

            {/* ── How this tool works ──────────────────────────────────────
                The documentation, demoted. What This Does repeated the nutshell
                almost line for line in paragraph form — the nutshell made it
                redundant rather than the other way round. It is kept, with the
                pitfalls and the FAQ, behind one disclosure so the detail is
                there for whoever wants it and costs nothing to whoever does not.
                Rendered in the DOM either way, so it stays crawlable. */}
            {(guide.overview || (guide.pitfalls && guide.pitfalls.length > 0) || faq.length > 0) && (
              <details className="group">
                <summary className="cursor-pointer py-2 -my-2 list-none [&::-webkit-details-marker]:hidden">
                  <div className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wide flex items-center gap-2`}>
                    How {tool?.title || 'this tool'} works
                    <span className={`ms-auto text-[9px] rotate-0 group-open:rotate-180 transition-transform duration-200`} aria-hidden="true">▼</span>
                  </div>
                </summary>

                {guide.overview && (
                  <p className={`text-sm ${colors.textSecondary} leading-relaxed mt-4`}>
                    {guide.overview}
                  </p>
                )}

                {guide.pitfalls && guide.pitfalls.length > 0 && (
                  <div className="mt-5">
                    <h4 className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-700'} uppercase mb-3 tracking-wide`}>
                      ⚠️ Avoid These Mistakes
                    </h4>
                    <ul className="space-y-2">
                      {guide.pitfalls.map((pitfall, index) => (
                        <li key={index} className="flex gap-2">
                          <span className={`${isDark ? 'text-orange-400' : 'text-orange-700'} mt-1 flex-shrink-0`}>✗</span>
                          <span className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                            {pitfall}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {faq.length > 0 && (
                  <div className="mt-5">
                    <h4 className={`text-xs font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'} uppercase mb-3 tracking-wide flex items-center gap-2`}>
                      <span className="text-sm">❓</span>
                      Frequently Asked Questions
                    </h4>
                    <div className="space-y-3">
                      {faq.map((item, index) => (
                        <details key={index} className={`rounded-lg border ${isDark ? 'border-zinc-700' : 'border-gray-200'} px-3 py-2`}>
                          <summary className={`text-sm font-medium cursor-pointer ${colors.text} leading-snug`}>
                            {item.q}
                          </summary>
                          <p className={`text-sm ${colors.textSecondary} leading-relaxed mt-2`}>
                            {item.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </details>
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
