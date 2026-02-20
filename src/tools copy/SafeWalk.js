import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { Phone } from 'lucide-react';

//SafeWalk Tool
const SafeWalk = ({ college }) => {
  const [destination, setDestination] = useState("");
  const [isRouting, setIsRouting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isStrobeOpen, setIsStrobeOpen] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [walkDuration, setWalkDuration] = useState(10);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openNativeMap = () => {
    if (!destination) return alert("Please enter a destination!");
    setSeconds(walkDuration * 60);
    setIsActive(true);
    const encodedDest = encodeURIComponent(destination);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const mapUrl = isIOS 
      ? `maps://maps.apple.com/?daddr=${encodedDest}&dirflg=w`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=walking`;
    window.location.href = mapUrl;
  };

  if (isTriggered) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[2000] flex flex-col items-center justify-center p-12 text-white">
        <Phone size={64} className="text-emerald-500 animate-bounce mb-6" />
        <h2 className="text-3xl font-bold mb-2">Emergency Contact</h2>
        <button onClick={() => setIsTriggered(false)} className="w-full py-4 bg-red-600 rounded-2xl font-bold">End Call</button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 mt-4">
      <div className="w-full h-48 rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-100">
        <div className="absolute top-4 left-4 right-4 z-[10] flex gap-2">
          <input 
            type="text" placeholder="Enter destination..." 
            className="flex-1 p-3 bg-white border rounded-xl shadow-sm outline-none"
            value={destination} onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <button onClick={() => setIsRouting(true)} className="absolute inset-0 z-[5] bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 uppercase text-xs tracking-widest">Tap to View Map</button>
        {isRouting && (
          <button onClick={openNativeMap} className="absolute inset-0 z-[20] bg-blue-600 text-white font-bold flex items-center justify-center">START NAVIGATION</button>
        )}
      </div>
      <div className="bg-gray-900 p-6 rounded-2xl text-center">
        <div className="text-5xl font-black mb-4 text-white">{formatTime(seconds)}</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setIsActive(!isActive)} className="py-3 bg-white rounded-xl font-bold">{isActive ? "STOP" : "START WALK"}</button>
          <button onClick={() => setIsStrobeOpen(true)} className="py-3 bg-red-600 text-white rounded-xl font-bold">PANIC</button>
        </div>
      </div>
      {isStrobeOpen && (
        <div onClick={() => setIsStrobeOpen(false)} className="fixed inset-0 z-[5000] bg-white animate-pulse flex items-center justify-center">
          <div className="p-8 bg-black text-white font-black text-2xl rounded-full">STOP STROBE</div>
        </div>
      )}
    </div>
  );
};
export default SafeWalk;