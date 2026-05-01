import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6 bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-sm w-full">
        <h1 className="text-6xl font-black text-slate-900 italic tracking-tighter">404</h1>
        <div>
          <p className="text-blue-600 font-mono text-xs tracking-[.4em] uppercase font-bold">Page Not Found</p>
          <p className="text-slate-400 text-sm mt-2">We couldn&apos;t find that page. Try the dashboard or browse the guides.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200"
          >
            DashBoard
          </button>
          {/* Anchor (not navigate) — /guides is server-rendered, not a React route */}
          <a
            href="/guides"
            className="block w-full py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-colors text-center"
          >
            Guides
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
