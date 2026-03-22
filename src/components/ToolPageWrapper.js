import React, { useEffect, useState } from 'react';
import { ActionBarProvider, useActionBar } from './ActionBarContext';
import { ActionBar } from './ActionButtons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getToolById, tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';
import BrandMark from './BrandMark';

// Inner component — has access to ActionBarContext
const ToolPageWrapperInner = ({ children, tool, toolId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
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
    textMuted: isDark ? 'text-zinc-500' : 'text-stone-500',
    
    // Borders
    border: isDark ? 'border-zinc-700' : 'border-stone-200',
    
    // Accents
    accent: isDark ? 'text-[#D4AF37]' : 'text-amber-600',
    accentBg: isDark ? 'bg-[#D4AF37]' : 'bg-amber-600',
    accentBorder: isDark ? 'border-[#D4AF37]' : 'border-amber-600',
    
    // Hover states
    hoverBg: isDark ? 'hover:bg-zinc-700' : 'hover:bg-stone-200',
    hoverAccent: isDark ? 'hover:text-[#D4AF37]' : 'hover:text-amber-600',
    
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
            {/* Mobile: compact with tagline at tighter tracking */}
            <div className="block sm:hidden">
              <BrandMark direction="right" size="sm" isDark={isDark} showTagline={true} />
            </div>
            {/* Desktop: full size with tagline */}
            <div className="hidden sm:block">
              <BrandMark direction="right" size="md" isDark={isDark} showTagline={true} />
            </div>
          </Link>
        </div>
      </div>

      <div data-print-grid className="max-w-7xl mx-auto px-4 pb-8 pt-0 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Area */}
        <main data-print-main className="lg:col-span-8">

          {/* Print-only header */}
          <div data-print-show-flex style={{display:'none',flexDirection:'column',gap:'6px',paddingBottom:'14px',marginBottom:'16px',borderBottom:'2px solid #e5e7eb'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <img src="/pBrain-r.png" alt="DeftBrain" style={{height:'40px',width:'auto'}} />
              <div><div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'bold',color:'#1a1a1a'}}><span style={{color:'#c8872e'}}>D</span>eftBrain</div><div style={{fontSize:'11px',color:'#6b7280'}}>Intelligence on Demand · deftbrain.com</div></div>
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
          </header>

          {/* Bookmark hint + Theme Toggle (above card, right-aligned) */}
          <div data-print-hide className="flex items-center justify-between mt-4 mb-2 gap-2 relative">
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
              <div className={`absolute left-0 top-full mt-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium whitespace-nowrap z-50 ${
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
              <ActionBar content={actions.content} title={actions.title} />
            )}
          </div>

          <section data-print-section className={`border ${colors.border} rounded-2xl shadow-sm overflow-hidden transition-colors duration-200`} style={{
              ...(detectedTool?.headerColor ? {
                background: `linear-gradient(to bottom, ${detectedTool.headerColor} 0%, ${detectedTool.headerColor} 60px, transparent 220px)`
              } : { background: isDark ? '#27272a' : '#ffffff' }),
              breakBefore: 'avoid',
              pageBreakBefore: 'avoid',
            }}>
            <div className={`${colors.surface} m-8 rounded-xl p-6`}>
              {children}
            </div>
          </section>
          {/* Print-only footer */}
          <div data-print-show-flex style={{display:'none',justifyContent:'center',alignItems:'center',gap:'8px',paddingTop:'10px',marginTop:'20px',borderTop:'1px solid #e5e7eb'}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:'12px',color:'#9ca3af'}}><span style={{color:'#c8872e',fontWeight:'bold'}}>D</span>eftBrain · deftbrain.com</span>
            <img src="/pBrain-l.png" alt="DeftBrain" style={{height:'28px',width:'auto'}} />
          </div>
        </main>

        {/* Right Column: Ad Panel + Guide Sidebar */}
        <aside data-print-hide className="lg:col-span-4 space-y-6 relative z-0">
          {/* ── Ad Panel Placeholder ── */}
          <div className={`${colors.surfaceAlt} border ${colors.border} rounded-2xl overflow-hidden transition-colors duration-200`}>
            <div className="h-[200px] flex items-center justify-center">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${colors.textMuted}`}>
                reserved
              </span>
            </div>
          </div>

          {/* ── Guide Sidebar ── */}
          <div className={`${colors.surfaceAlt} border ${colors.border} rounded-2xl p-6 sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto transition-colors duration-200`}>
            
            {/* Header */}
            <h3 className={`text-xs font-semibold ${colors.text} uppercase tracking-widest mb-6 flex items-center gap-2`}>
              <span className={`text-base ${colors.accent}`}>📖</span>
              How to Use This Tool
            </h3>
            
            {/* Extended Description */}
            <div className="mb-6">
              <h4 className={`text-xs font-bold ${colors.accent} uppercase mb-3 tracking-wide`}>
                What This Does
              </h4>
              <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                {guide.overview}
              </p>
            </div>

            {/* Step-by-step Instructions */}
            {guide.howToUse && guide.howToUse.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${colors.accent} uppercase mb-3 tracking-wide flex items-center gap-2`}>
                  <span className="text-sm">▶️</span>
                  Step-by-Step
                </h4>
                <ol className="space-y-3">
                  {guide.howToUse.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className={`
                        flex-shrink-0 w-6 h-6 rounded-full 
                        ${isDark ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30' : 'bg-amber-100 text-amber-700 border-amber-200'}
                        flex items-center justify-center text-xs font-bold border
                      `}>
                        {index + 1}
                      </span>
                      <span className={`text-sm ${colors.textSecondary} leading-relaxed pt-0.5`}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Example */}
            {guide.example && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'} uppercase mb-3 tracking-wide`}>
                  Example
                </h4>
                <div className={`${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-stone-100 border-stone-200'} border rounded-lg p-4 transition-colors duration-200`}>
                  {typeof guide.example === 'string' ? (
                    <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                      {guide.example}
                    </p>
                  ) : (
                    <>
                      {guide.example.scenario && (
                        <div className="mb-3">
                          <p className={`text-xs font-semibold ${colors.textMuted} uppercase mb-1`}>
                            Scenario:
                          </p>
                          <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                            {guide.example.scenario}
                          </p>
                        </div>
                      )}
                      {guide.example.action && (
                        <div className="mb-3">
                          <p className={`text-xs font-semibold ${colors.textMuted} uppercase mb-1`}>
                            What to do:
                          </p>
                          <p className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                            {guide.example.action}
                          </p>
                        </div>
                      )}
                      {guide.example.result && (
                        <div>
                          <p className={`text-xs font-semibold ${colors.textMuted} uppercase mb-1`}>
                            Result:
                          </p>
                          <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'} leading-relaxed`}>
                            {guide.example.result}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Pro Tips */}
            {guide.tips && guide.tips.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'} uppercase mb-3 tracking-wide flex items-center gap-2`}>
                  <span className="text-sm">💡</span>
                  Pro Tips
                </h4>
                <ul className="space-y-2">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} mt-1 flex-shrink-0`}>•</span>
                      <span className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Pitfalls */}
            {guide.pitfalls && guide.pitfalls.length > 0 && (
              <div className="mb-6">
                <h4 className={`text-xs font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'} uppercase mb-3 tracking-wide`}>
                  ⚠️ Avoid These Mistakes
                </h4>
                <ul className="space-y-2">
                  {guide.pitfalls.map((pitfall, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'} mt-1 flex-shrink-0`}>✗</span>
                      <span className={`text-sm ${colors.textSecondary} leading-relaxed`}>
                        {pitfall}
                      </span>
                    </li>
                  ))}
                </ul>
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
