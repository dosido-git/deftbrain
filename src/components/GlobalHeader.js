import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const GlobalHeader = ({ searchTerm, setSearchTerm, toolCount }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  // Scroll detection for compact mode
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setSearchTerm('');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchTerm]);

  return (
    <header 
      className={`w-full bg-white border-b border-slate-100 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      style={{ 
        padding: scrolled ? '6px 32px' : '12px 32px',
      }}
    >
      <div className={`max-w-[1440px] mx-auto flex items-center justify-between transition-all duration-300 ${
        scrolled ? '' : 'items-end'
      }`}>
        
        {/* LOGO */}
        <div className="flex items-end flex-shrink-0">
          <img 
            src="/logo-nobg.png" 
            alt="DeftBrain.com" 
            onLoad={() => setLogoLoaded(true)}
            className={`w-auto block object-contain transition-all duration-300 ${
              scrolled ? 'h-12' : 'h-40'
            }`}
          />
        </div>

        {/* TAGLINE + SEARCH */}
        <div className={`flex items-end gap-2 pb-1 transition-all duration-300 ${
          scrolled ? 'flex-row items-center gap-4 pb-0' : 'flex-col items-end'
        }`}>
          <p className={`font-black text-slate-400 uppercase leading-none text-right transition-all duration-300 ${
            scrolled ? 'text-[9px] tracking-[0.3em] hidden sm:block' : 'text-[11px] tracking-[0.5em]'
          }`}>
            Intelligence on Demand
          </p>
          <div className={`relative transition-all duration-300 ${scrolled ? 'w-52' : 'w-64'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${toolCount || ''} tools...`}
              className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-3 focus:ring-blue-50 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-0.5 rounded hover:bg-slate-200 transition-colors">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
