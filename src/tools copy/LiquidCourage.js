import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import * as Icons from 'lucide-react';

const LiquidCourage = () => {
  const [draft, setDraft] = useState("");
  const rewrite = () => setDraft(draft.replace(/I want/gi, "I would appreciate"));
  return (
    <div className="w-full space-y-4 mt-4">
      <textarea className="w-full h-24 p-4 bg-gray-50 rounded-2xl outline-none" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type nervous email here..." />
      <button onClick={rewrite} className="w-full bg-black text-white py-3 rounded-xl font-bold">Professionalize</button>
    </div>
  );
};
export default LiquidCourage;