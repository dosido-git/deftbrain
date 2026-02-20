import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import * as Icons from 'lucide-react';

const HabitChain = () => {
  const [streak, setStreak] = usePersistentState('habit-streak', 0);
  const [lastCheck, setLastCheck] = usePersistentState('habit-last-date', null);
  const handleCheck = () => {
    const today = new Date().toDateString();
    if (lastCheck === today) return;
    setStreak(s => s + 1); setLastCheck(today);
  };
  return (
    <div className="w-full text-center space-y-6 mt-4">
      <div className="text-6xl font-black">{streak}</div>
      <p className="text-gray-400 uppercase text-xs font-bold">Day Streak</p>
      <button onClick={handleCheck} className="w-full py-4 bg-black text-white rounded-xl font-bold">
        {lastCheck === new Date().toDateString() ? "Checked in!" : "Log Progress"}
      </button>
    </div>
  );
};
export default HabitChain;