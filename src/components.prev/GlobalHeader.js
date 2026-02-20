import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const GlobalHeader = ({ searchTerm, setSearchTerm, toolCount }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const searchRef = useRef(null);

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
    <header className="w-full bg-white border-b border-slate-100 px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex items-end justify-between">
        
        {/* LOGO: Far Left */}
        <div className="flex items-end flex-shrink-0">
          <img 
            src="/logo-nobg.png" 
            alt="DeftBrain.com" 
            onLoad={() => setLogoLoaded(true)}
            className="h-40 w-auto block object-contain" 
          />
        </div>

        {/* TAGLINE + SEARCH: Far Right, bottom-aligned with logo */}
        <div className="flex flex-col items-end gap-2 pb-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none text-right">
            Intelligence on Demand
          </p>
          <div className="relative w-64">
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
