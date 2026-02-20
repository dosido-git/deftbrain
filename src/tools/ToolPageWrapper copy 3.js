import React from 'react';
import { ChevronLeft, BookOpen, Lightbulb, PlayCircle, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getToolById, tools } from '../data/tools';
import { useTheme } from '../hooks/useTheme';

const ToolPageWrapper = ({ children, tool, toolId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
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
    <div className={`min-h-screen ${colors.bg} ${colors.text} font-sans transition-colors duration-200`}>
      
      {/* ── Compact Logo Bar ── */}
      <div className={`w-full px-6 py-3 ${colors.bg}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center flex-shrink-0" title="Back to Dashboard">
            <img 
              src="/logo-nobg.png" 
              alt="DeftBrain.com" 
              className="h-14 w-auto block object-contain"
            />
          </Link>
          <p className={`text-[10px] font-black uppercase tracking-[0.45em] leading-none ${isDark ? 'text-zinc-500' : 'text-stone-400'}`}>
            Intelligence on Demand
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content Area */}
        <main className="lg:col-span-8 space-y-6">
          <header className="space-y-2">
            <div className={`flex items-center gap-3 ${colors.accent} mb-2`}>
              <span className={`text-[10px] font-medium uppercase tracking-widest border ${colors.accentBorder} px-3 py-1 rounded-full`}>
                {detectedTool?.category || "General"}
              </span>
            </div>
            
            <h1 className={`text-5xl font-light ${colors.text} tracking-tight`}>
              {detectedTool?.title || "Tool"}
            </h1>
            
            <p className={`${colors.textSecondary} max-w-2xl leading-relaxed`}>
              {detectedTool?.description || "Strategic intelligence tool"}
            </p>
          </header>

          <section className={`${colors.surface} border ${colors.border} rounded-2xl shadow-sm overflow-hidden transition-colors duration-200`}>
            <div className="p-8">
              {children}
            </div>
          </section>

          {/* ── Bottom Navigation ── */}
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${colors.toggleBg} ${colors.toggleText}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </main>

        {/* Educational Guide Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className={`${colors.surfaceAlt} border ${colors.border} rounded-2xl p-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto transition-colors duration-200`}>
            
            {/* System Active + Theme Toggle */}
            <div className={`flex items-center justify-between mb-6 pb-4 border-b ${colors.border}`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${colors.statusPulse} animate-pulse`} />
                <span className={`text-[10px] font-mono ${colors.accent} uppercase tracking-[0.3em]`}>
                  System Active
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${colors.toggleBg} ${colors.toggleText}`}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            {/* Header */}
            <h3 className={`text-xs font-semibold ${colors.text} uppercase tracking-widest mb-6 flex items-center gap-2`}>
              <BookOpen className={`h-4 w-4 ${colors.accent}`} />
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
                  <PlayCircle className="h-3.5 w-3.5" />
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
                  <Lightbulb className="h-3.5 w-3.5" />
                  Pro Tips
                </h4>
                <ul className="space-y-2">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'} mt-1 flex-shrink-0`}>â€¢</span>
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
                  âš ï¸ Avoid These Mistakes
                </h4>
                <ul className="space-y-2">
                  {guide.pitfalls.map((pitfall, index) => (
                    <li key={index} className="flex gap-2">
                      <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'} mt-1 flex-shrink-0`}>âœ—</span>
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

export default ToolPageWrapper;
