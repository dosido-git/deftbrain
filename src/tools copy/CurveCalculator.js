import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import * as Icons from 'lucide-react';

const CurveCalculator = () => {
  const [currentGrade, setCurrentGrade] = usePersistentState('curve-current', 85);
  const [finalWeight, setFinalWeight] = usePersistentState('curve-weight', 30);
  const [targetGrade, setTargetGrade] = usePersistentState('curve-target', 90);
  const requiredScore = Math.ceil((targetGrade - (currentGrade * (1 - (finalWeight / 100)))) / (finalWeight / 100));
  return (
    <div className="w-full bg-gray-50 rounded-xl p-6 mt-4 border border-gray-200 text-left space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase">Current Grade: {currentGrade}%</label>
        <input type="range" min="0" max="100" value={currentGrade} onChange={(e) => setCurrentGrade(Number(e.target.value))} className="w-full h-2 accent-black" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase">Final Weight: {finalWeight}%</label>
        <input type="range" min="0" max="100" value={finalWeight} onChange={(e) => setFinalWeight(Number(e.target.value))} className="w-full h-2 accent-black" />
      </div>
      <div className="mt-4 p-4 bg-white rounded-xl shadow-sm text-center">
        <p className="text-xs text-gray-400 uppercase">Required on Final</p>
        <div className="text-4xl font-black">{requiredScore}%</div>
      </div>
    </div>
  );
};
export default CurveCalculator;