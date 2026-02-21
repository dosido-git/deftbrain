import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, Loader2, Globe } from 'lucide-react';
//import { supabase } from '../supabaseClient';
import { ICON_MAP } from '../constants/icons'; // Import the new icon map

export default function ProfVibe({ college, setCollege }) {
  const [profSearch, setProfSearch] = useState("");
  const [dept, setDept] = useState("");
  const [newVibe, setNewVibe] = useState("");
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(false);

  const deptRef = useRef(null);
  const profRef = useRef(null);

  const getProfSlug = () => {
    return `${profSearch}-${college}-${dept}`.toLowerCase().trim().replace(/\s+/g, '-');
  };

 {/* useEffect(() => {
    const fetchVibes = async () => {
      if (!college || !profSearch) return;      
      
      setLoading(true);
      const { data, error } = await supabase
        .from('prof_vibes')
        .select('*')
        .eq('prof_id', getProfSlug())
        .order('created_at', { ascending: false });

      if (!error && data) setVibes(data);
      setLoading(false);
    }; */}

    const debounce = setTimeout(fetchVibes, 500);
    return () => clearTimeout(debounce);
  }, [profSearch, college, dept]);

  const handleSearch = () => {
    if (!profSearch) return;
    const query = `"${profSearch}" ${college} ${dept} (reddit OR "rate my professor" OR syllabus)`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const addVibe = async () => {
    if (!newVibe.trim() || !profSearch) return;

    const text = newVibe.toLowerCase();
    const score = text.match(/(chill|easy|great|goat|clear)/) ? 1 : text.match(/(hard|tough|avoid|mean)/) ? -1 : 0;

{/*    const { error } = await supabase
      .from('prof_vibes')
      .insert([{ 
        prof_id: getProfSlug(), 
        vibe_text: newVibe, 
        sentiment: score 
      }]);

    if (!error) {
      setNewVibe("");
      setVibes([{ vibe_text: newVibe, sentiment: score }, ...vibes]);
    }
  }; */}

  // AI AURA LOGIC using Twemoji shortcodes
  const avgSentiment = vibes.length > 0 
    ? vibes.reduce((acc, v) => acc + (v.sentiment || 0), 0) / vibes.length 
    : 0;

  const aura = avgSentiment > 0.2 
    ? { color: 'bg-emerald-600', label: 'Green Flag', icon: ICON_MAP['GreenFlag'] } 
    : avgSentiment < -0.2 
      ? { color: 'bg-emerald-600', label: 'High Stress', icon: ICON_MAP['HighStress'] } 
      : { color: 'bg-emerald-600', label: 'Neutral Vibe', icon: ICON_MAP['Neutral'] };

  const displayIcon = (profSearch && vibes.length > 0) ? aura.icon : ICON_MAP['CrystalBall'];

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. INPUT GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">University</label>
          <input 
            placeholder="Search school..." 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all" 
            value={college} 
            onChange={(e) => setCollege(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && deptRef.current?.focus()}
          />
        </div>
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Department</label>
          <input 
            ref={deptRef} 
            placeholder="e.g. Computer Science" 
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all" 
            value={dept} 
            onChange={e => setDept(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && profRef.current?.focus()}
          />
        </div>
      </div>

      {/* 2. MAIN SEARCH */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[2rem] blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
        <div className="relative flex items-center bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm focus-within:border-blue-500 transition-all overflow-hidden">
          <Search className="ml-6 text-slate-400" size={24} strokeWidth={2.5}/>
          <input 
            ref={profRef} 
            placeholder="Who are we checking?" 
            className="w-full p-6 pl-4 text-2xl font-black outline-none placeholder:text-slate-300" 
            value={profSearch} 
            onChange={e => setProfSearch(e.target.value)} 
          />
          {profSearch && (
            <button 
              onClick={handleSearch} 
              className="mr-4 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
            >
              <Globe size={14} /> RESEARCH
            </button>
          )}
        </div>
      </div>

      {/* 3. AI AURA BOX - Resolved Syntax Error by nesting within parent div */}
      <div className={`${aura.color} rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex items-center justify-between`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Neural Sentiment Synthesis</span>
            {loading && <Loader2 size={16} className="animate-spin" />}
          </div>
          <h2 className="text-4xl font-black tracking-tight">{profSearch && vibes.length > 0 ? aura.label : "Enter Professor"}</h2>
          <p className="text-sm opacity-90 max-w-[300px]">
            {vibes.length > 0 ? `Aggregated from ${vibes.length} insights.` : "Awaiting student data to generate a sentiment aura."}
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">
          <img 
            src={displayIcon} 
            alt="Aura Icon" 
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
        </div>
      </div>

      {/* 4. VIBE FEED */}
      <div className="space-y-4">
        <div className="flex gap-3 bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100">
          <input 
            placeholder="Drop a vibe (e.g. 'Chill grader')..." 
            className="flex-1 px-5 py-3 rounded-xl bg-slate-50 outline-none focus:bg-white transition-all font-bold text-slate-700" 
            value={newVibe} 
            onChange={e => setNewVibe(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addVibe()}
          />
          <button 
            onClick={addVibe} 
            className="bg-blue-600 text-white px-6 rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 font-black text-xs tracking-widest"
          >
            <Zap size={16} fill="currentColor"/> PIN
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
          {vibes.map((v, i) => (
            <div 
              key={i} 
              className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center"
            >
              <span className="font-bold text-slate-800 tracking-tight">{v.vibe_text}</span>
              <div className={`w-3 h-3 rounded-full ${v.sentiment > 0 ? 'bg-emerald-400' : v.sentiment < 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}