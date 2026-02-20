import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { Zap, ArrowUpRight, Target, Brain } from 'lucide-react';

const LeverageLogic = () => {
  const [effort, setEffort] = useState(50);
  const [multiplier, setMultiplier] = useState(2);

  // The Force Multiplier math
  const result = effort * multiplier;

  return (
    <div className="p-8 text-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Input Section */}
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-4 block">
              Unit of Input (Time/Energy)
            </label>
            <input 
              type="range" 
              min="1" max="100" 
              value={effort} 
              onChange={(e) => setEffort(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-2 font-mono text-xs text-slate-500">
              <span>MIN EFFORT</span>
              <span className="text-white">{effort} UNITS</span>
              <span>MAX EFFORT</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4 block">
              Leverage Multiplier (The Edge)
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[2, 5, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setMultiplier(num)}
                  className={`py-4 rounded-xl border-2 transition-all font-black ${
                    multiplier === num 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                    : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {num}X
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Section (The Result) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain size={120} />
          </div>
          
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Total Output Value</span>
          <div className="text-7xl font-black text-white italic tracking-tighter mb-4">
            {result}
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
            <ArrowUpRight size={16} />
            {(multiplier * 100) - 100}% Advantage Gained
          </div>
        </div>
      </div>

      {/* Strategic Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
          <Zap className="text-cyan-500 mb-3" size={20} />
          <h4 className="text-sm font-black uppercase mb-1">Low Friction</h4>
          <p className="text-xs text-slate-500">Focus on tasks where 1 unit of effort yields 5x results.</p>
        </div>
        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
          <Target className="text-emerald-500 mb-3" size={20} />
          <h4 className="text-sm font-black uppercase mb-1">High Impact</h4>
          <p className="text-xs text-slate-500">The "Fulcrum Point" for this week is your Finance module.</p>
        </div>
        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800">
          <Brain className="text-purple-500 mb-3" size={20} />
          <h4 className="text-sm font-black uppercase mb-1">System Logic</h4>
          <p className="text-xs text-slate-500">Automate the remedial to focus on the high-leverage.</p>
        </div>
      </div>
    </div>
  );
};

export default LeverageLogic;