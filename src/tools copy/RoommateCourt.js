import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { Plus, Trash2, Gavel } from 'lucide-react';

const RoommateCourt = () => {
  const [roommates, setRoommates] = usePersistentState('court-members', []);
  const [newName, setNewName] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const addRoommate = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      setRoommates([...roommates, newName.trim()]);
      setNewName("");
    }
  };

  const removeRoommate = (index) => {
    setRoommates(roommates.filter((_, i) => i !== index));
  };

  const judgeCase = () => {
    if (roommates.length < 2) return;
    setIsSpinning(true);
    setVerdict(null);
    
    // Simulate the "Gavel of Justice" spinning
    setTimeout(() => {
      const winner = roommates[Math.floor(Math.random() * roommates.length)];
      setVerdict(winner);
      setIsSpinning(false);
    }, 800);
  };

  return (
    <div className="w-full space-y-4 mt-4 text-left">
      <form onSubmit={addRoommate} className="flex gap-2">
        <input 
          type="text"
          placeholder="Add roommate..." 
          className="flex-1 p-3 bg-gray-50 rounded-xl outline-none border border-gray-200 focus:border-black"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="p-3 bg-black text-white rounded-xl">
          <Plus size={20}/>
        </button>
      </form>

      {roommates.length > 0 && (
        <div className="space-y-2">
          {roommates.map((name, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="font-bold">{name}</span>
              <button onClick={() => removeRoommate(i)} className="p-1 hover:bg-gray-200 rounded">
                <Trash2 size={16} className="text-red-600"/>
              </button>
            </div>
          ))}
        </div>
      )}

      {roommates.length >= 2 && (
        <button 
          onClick={judgeCase}
          disabled={isSpinning}
          className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Gavel size={20} className={isSpinning ? "animate-spin" : ""} />
          {isSpinning ? "Deliberating..." : "JUDGE"}
        </button>
      )}

      {verdict && !isSpinning && (
        <div className="p-6 bg-red-50 border-2 border-red-100 rounded-2xl text-center animate-bounce">
          <p className="text-xs text-red-400 uppercase font-bold mb-1">The Court has Spoken</p>
          <div className="text-3xl font-black text-red-600">{verdict.toUpperCase()} IS GUILTY!</div>
          <p className="text-sm text-red-500 mt-2">Time for chores.</p>
        </div>
      )}
    </div>
  );
};
//End RoomMate Court
export default RoommateCourt;