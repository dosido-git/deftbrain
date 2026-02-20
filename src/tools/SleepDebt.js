import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import * as Icons from 'lucide-react';

const SleepDebt = () => {
  const [target, setTarget] = usePersistentState('sleep-target', 8);
  const [hoursLog, setHoursLog] = usePersistentState('sleep-log', [7, 6, 8, 5, 7, 6, 7]);
  
  const totalDebt = hoursLog.reduce((acc, hrs) => acc + (target - hrs), 0);
  const statusColor = totalDebt > 5 ? 'text-red-600' : 'text-emerald-600';
  const [hoursSlept, setHoursSlept] = usePersistentState('sleep-hours', []);
  const [todayHours, setTodayHours] = useState(7);
  
  const logSleep = () => {
    const today = new Date().toDateString();
    const updated = hoursSlept.filter(entry => entry.date !== today);
    setHoursSlept([...updated, { date: today, hours: todayHours }]);
  };

  const updateSleep = (index, value) => {
    const newLog = [...hoursLog];
    newLog[index] = Math.max(0, Math.min(24, Number(value)));
    setHoursLog(newLog);
  };

  const weeklyAvg = hoursSlept.length > 0 
    ? (hoursSlept.reduce((sum, e) => sum + e.hours, 0) / hoursSlept.length).toFixed(1)
    : 0;
  
  const debt = Math.max(0, (8 * 7) - (weeklyAvg * 7));

  return (
    <div className="w-full space-y-6 mt-4">
      <div className="text-center">
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hours Slept Today</label>
        <input 
          type="range" 
          min="0" 
          max="12" 
          step="0.5"
          value={todayHours} 
          onChange={(e) => setTodayHours(Number(e.target.value))} 
          className="w-full h-2 accent-black mb-2" 
        />
        <div className="text-5xl font-black">{todayHours}h</div>
      </div>

      <button onClick={logSleep} className="w-full bg-black text-white py-4 rounded-xl font-bold">
        Log Sleep
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl text-center">
          <p className="text-xs text-blue-600 uppercase font-bold">Weekly Avg</p>
          <p className="text-2xl font-black text-blue-900">{weeklyAvg}h</p>
        </div>
        <div className="p-4 bg-red-50 rounded-xl text-center">
          <p className="text-xs text-red-600 uppercase font-bold">Sleep Debt</p>
          <p className="text-2xl font-black text-red-900">{debt.toFixed(1)}h</p>
        </div>
      </div>
    </div>
  );
};
export default SleepDebt;