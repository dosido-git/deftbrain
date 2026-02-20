import React, { useState, useEffect } from 'react';
import { Skull, Ghost, Plus, Trash2, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';

const GradeGraveyard = ({ college }) => {
  const [deaths, setDeaths] = useState([]);
  const [course, setCourse] = useState("");
  const [cause, setCause] = useState("");

  // --- FETCH THE DEPARTED ---
  // --- THE FILTERED FETCH ---
  useEffect(() => {
    const fetchLocalGraveyard = async () => {
      if (!college) return; 
      
      const { data } = await supabase
        .from('grade_graveyard')
        .select('*')
        .eq('college', college.toLowerCase().trim()) 
        .order('created_at', { ascending: false });

      if (data) setDeaths(data);
    };
    fetchLocalGraveyard();
  }, [college]);

  // --- THE CALCULATION ENGINE ---
  const getHighMortalityCourse = () => {
    if (deaths.length === 0) return "None (Yet)";
    
    const counts = deaths.reduce((acc, d) => {
      acc[d.course_code] = (acc[d.course_code] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

const Headstone = ({ courseCode, professor, casualtyCount, causeOfDeath, difficulty }) => {
  return (
    <div className="group relative bg-white border-2 border-slate-200 rounded-t-[3rem] rounded-b-xl p-6 transition-all hover:border-black hover:-translate-y-2 shadow-sm hover:shadow-2xl overflow-hidden">
      {/* The "Inscription" Area */}
      <div className="text-center space-y-2 mb-6 border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">In Memoriam</span>
        <h3 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">{courseCode}</h3>
        <p className="text-xs font-bold text-blue-600 uppercase italic">{professor}</p>
      </div>

      {/* The Stats (The "Vital Signs") */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Casualties</p>
          <p className="text-lg font-black text-red-600">{casualtyCount}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Lethality</p>
          <p className="text-lg font-black text-slate-900">{difficulty}%</p>
        </div>
      </div>

      {/* The "Cause of Death" */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Final Words:</p>
        <p className="text-[11px] text-slate-600 italic leading-snug">
          "{causeOfDeath}"
        </p>
      </div>

      {/* Decorative Moss/Grit (Subtle UI touch) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
  const fatalityRate = deaths.length > 0 ? ((deaths.length / 50) * 100).toFixed(0) : 0;

  // --- BURY A NEW GRADE ---
  const buryGrade = async () => {
    if (!course || !cause || !college) return;

    const { error } = await supabase
      .from('grade_graveyard')
      .insert([{ 
        course_code: course.toUpperCase(), 
        cause_of_death: cause,
        college: college.toLowerCase().trim()
      }]);

    if (!error) {
      setDeaths([{ course_code: course.toUpperCase(), cause_of_death: cause }, ...deaths]);
      setCourse("");
      setCause("");
    }
  };

  return (
    <div className="bg-slate-950 text-slate-200 p-6 rounded-[2.5rem] shadow-2xl space-y-8 min-h-[500px]">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="inline-block p-4 bg-slate-900 rounded-full border border-slate-800 animate-pulse">
          <Skull size={40} className="text-slate-500" />
        </div>
        <h2 className="text-2xl font-black tracking-tighter uppercase italic">The Grade Graveyard</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Where GPA's go to rest</p>
      </div>

      {/* MORTALITY STATS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-2xl text-center">
          <p className="text-[10px] uppercase font-black text-red-500 tracking-widest">Deadliest Sector</p>
          <h4 className="text-xl font-black text-white">{getHighMortalityCourse()}</h4>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Cemetery Capacity</p>
          <h4 className="text-xl font-black text-white">{fatalityRate}% Full</h4>
        </div>
      </div>

      {/* INPUT: THE CEREMONY */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
        <input 
          placeholder="COURSE CODE (E.G. CS50)" 
          className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-red-900 outline-none transition-all font-mono"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        <textarea 
          placeholder="Cause of Death..." 
          className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-red-900 outline-none transition-all h-24"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
        />
        <button 
          onClick={buryGrade}
          className="w-full bg-red-950/30 border border-red-900/50 text-red-500 p-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-900 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Bury this Grade
        </button>
      </div>

      {/* THE CEMETERY LIST */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-80 pr-2">
        {deaths.map((death, i) => (
          <div key={i} className="group relative bg-slate-900 p-5 rounded-2xl border-l-4 border-red-900 hover:bg-slate-800 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-100">{death.course_code}</h3>
                <p className="text-sm text-slate-400 italic">"{death.cause_of_death}"</p>
              </div>
              <Ghost className="text-slate-700 group-hover:text-red-900 transition-colors" size={24} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeGraveyard;
