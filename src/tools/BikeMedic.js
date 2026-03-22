import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { ActionBar, CopyBtn, PrintBtn, ShareBtn } from '../components/ActionButtons';
import { compressImage } from '../utils/imageCompression';


// ════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ════════════════════════════════════════════════════════════
const Toast = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-fade-in">
      <span>✅</span> {message}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// ANIMATED REPAIR DEMOS
// ════════════════════════════════════════════════════════════
const RepairAnimation = ({ type, paused = false }) => {
  const ps = { animationPlayState: paused ? 'paused' : 'running' };
  const anims = {
    'patch-tube': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes ptSlide { 0%,20% { transform: translateY(-30px); opacity: 0; } 50%,100% { transform: translateY(0); opacity: 1; } }
          @keyframes ptBubble { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-15px); opacity: 0; } }
          @keyframes ptPress { 0%,40% { transform: scaleY(1); } 60%,80% { transform: scaleY(0.85); } 100% { transform: scaleY(1); } }
        `}</style></defs>
        <ellipse cx="100" cy="110" rx="70" ry="50" fill="none" stroke="rgb(55,65,81)" strokeWidth="12" />
        <circle cx="140" cy="85" r="3" fill="rgb(239,68,68)" />
        <circle cx="142" cy="78" r="2" fill="rgb(147,197,253)" style={{ animation: 'ptBubble 1.5s infinite', ...ps }} />
        <circle cx="138" cy="75" r="1.5" fill="rgb(147,197,253)" style={{ animation: 'ptBubble 1.5s 0.3s infinite', ...ps }} />
        <rect x="128" y="76" width="24" height="16" rx="3" fill="rgb(245,158,11)" stroke="rgb(217,119,6)" strokeWidth="1.5" style={{ animation: 'ptSlide 3s ease-in-out infinite', transformOrigin: '140px 84px', ...ps }} />
        <g style={{ animation: 'ptPress 3s 1.5s ease-in-out infinite', transformOrigin: '140px 84px', ...ps }}>
          <path d="M135 65 L140 72 L145 65" fill="none" stroke="rgb(156,163,175)" strokeWidth="1.5" strokeDasharray="2,2" />
        </g>
        <line x1="140" y1="85" x2="170" y2="70" stroke="#6b728080" strokeWidth="0.5" />
        <text x="172" y="72" fill="rgb(156,163,175)" fontSize="7" fontFamily="monospace">Puncture</text>
        <line x1="140" y1="84" x2="170" y2="95" stroke="#6b728080" strokeWidth="0.5" />
        <text x="172" y="97" fill="rgb(217,119,6)" fontSize="7" fontFamily="monospace">Patch</text>
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Locate → Patch → Press</text>
      </svg>
    ),
    'replace-tube': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes rtOut { 0%,30% { transform: translateX(0); opacity: 1; } 50% { transform: translateX(40px); opacity: 0; } 51%,100% { opacity: 0; } }
          @keyframes rtIn { 0%,50% { transform: translateX(-40px); opacity: 0; } 70%,100% { transform: translateX(0); opacity: 1; } }
          @keyframes rtLever { 0%,15% { transform: rotate(0deg); } 30%,50% { transform: rotate(-35deg); } 65%,100% { transform: rotate(0deg); } }
        `}</style></defs>
        <circle cx="100" cy="95" r="65" fill="none" stroke="rgb(107,114,128)" strokeWidth="6" />
        <circle cx="100" cy="95" r="55" fill="none" stroke="rgb(156,163,175)" strokeWidth="2" strokeDasharray="4,8" />
        <circle cx="100" cy="95" r="12" fill="rgb(75,85,99)" />
        <ellipse cx="100" cy="95" rx="60" ry="60" fill="none" stroke="rgb(239,68,68)" strokeWidth="5" opacity="0.6" style={{ animation: 'rtOut 5s infinite', ...ps }} />
        <ellipse cx="100" cy="95" rx="60" ry="60" fill="none" stroke="rgb(34,197,94)" strokeWidth="5" opacity="0.8" style={{ animation: 'rtIn 5s infinite', ...ps }} />
        <g style={{ animation: 'rtLever 5s ease-in-out infinite', transformOrigin: '155px 60px', ...ps }}>
          <rect x="152" y="45" width="6" height="35" rx="2" fill="rgb(245,158,11)" /><path d="M152 45 Q155 38 158 45" fill="rgb(217,119,6)" />
        </g>
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Lever → Remove → Replace</text>
      </svg>
    ),
    'reseat-chain': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes rcLift { 0%,20% { transform: translateY(15px) rotate(5deg); } 50%,70% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(15px) rotate(5deg); } }
          @keyframes rcSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style></defs>
        <g style={{ animation: 'rcSpin 3s linear infinite', transformOrigin: '135px 95px', ...ps }}>
          <circle cx="135" cy="95" r="18" fill="none" stroke="rgb(75,85,99)" strokeWidth="3" />
          {[0,45,90,135,180,225,270,315].map(d => <line key={d} x1="135" y1="95" x2={135+15*Math.cos(d*Math.PI/180)} y2={95+15*Math.sin(d*Math.PI/180)} stroke="rgb(107,114,128)" strokeWidth="2" />)}
        </g>
        <g style={{ animation: 'rcSpin 5s linear infinite', transformOrigin: '65px 95px', ...ps }}>
          <circle cx="65" cy="95" r="28" fill="none" stroke="rgb(75,85,99)" strokeWidth="3" />
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(d => <line key={d} x1="65" y1="95" x2={65+24*Math.cos(d*Math.PI/180)} y2={95+24*Math.sin(d*Math.PI/180)} stroke="rgb(107,114,128)" strokeWidth="2" />)}
        </g>
        <g style={{ animation: 'rcLift 4s ease-in-out infinite', transformOrigin: '100px 80px', ...ps }}>
          <line x1="93" y1="83" x2="117" y2="83" stroke="rgb(245,158,11)" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="67" x2="93" y2="83" stroke="rgb(245,158,11)" strokeWidth="4" strokeLinecap="round" />
          <line x1="117" y1="83" x2="135" y2="77" stroke="rgb(245,158,11)" strokeWidth="4" strokeLinecap="round" />
        </g>
        <line x1="65" y1="123" x2="135" y2="113" stroke="rgb(217,119,6)" strokeWidth="4" strokeLinecap="round" />
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Lift → Seat on teeth → Pedal</text>
      </svg>
    ),
    'adjust-derailleur': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes adShift { 0%,30% { transform: translateX(0); } 50%,70% { transform: translateX(-8px); } 100% { transform: translateX(0); } }
          @keyframes adTurn { 0%,25% { transform: rotate(0deg); } 50%,75% { transform: rotate(180deg); } 100% { transform: rotate(360deg); } }
        `}</style></defs>
        {[0,8,16].map((o,i) => <circle key={i} cx={130+o} cy="95" r={22-i*4} fill="none" stroke="rgb(75,85,99)" strokeWidth="2" />)}
        <g style={{ animation: 'adShift 4s ease-in-out infinite', transformOrigin: '130px 130px', ...ps }}>
          <rect x="120" y="120" width="25" height="35" rx="4" fill="rgb(55,65,81)" stroke="rgb(107,114,128)" strokeWidth="1.5" />
          <circle cx="127" cy="130" r="6" fill="none" stroke="rgb(156,163,175)" strokeWidth="2" />
          <circle cx="138" cy="145" r="6" fill="none" stroke="rgb(156,163,175)" strokeWidth="2" />
        </g>
        <path d="M60 50 Q80 50 100 70 Q120 90 125 120" fill="none" stroke="rgb(245,158,11)" strokeWidth="2" />
        <g style={{ animation: 'adTurn 4s ease-in-out infinite', transformOrigin: '60px 50px', ...ps }}>
          <circle cx="60" cy="50" r="8" fill="rgb(31,41,55)" stroke="rgb(245,158,11)" strokeWidth="2" />
          <line x1="60" y1="43" x2="60" y2="50" stroke="rgb(245,158,11)" strokeWidth="2" />
        </g>
        <text x="60" y="35" textAnchor="middle" fill="rgb(245,158,11)" fontSize="8" fontFamily="monospace">Barrel Adj.</text>
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Turn adjuster → Test shift</text>
      </svg>
    ),
    'brake-align': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes baSqL { 0%,20% { transform: translateX(0); } 40%,60% { transform: translateX(5px); } 80%,100% { transform: translateX(0); } }
          @keyframes baSqR { 0%,20% { transform: translateX(0); } 40%,60% { transform: translateX(-5px); } 80%,100% { transform: translateX(0); } }
          @keyframes baSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style></defs>
        <g style={{ animation: 'baSpin 4s linear infinite', transformOrigin: '100px 90px', ...ps }}>
          <circle cx="100" cy="90" r="30" fill="none" stroke="rgb(156,163,175)" strokeWidth="3" />
          <circle cx="100" cy="90" r="22" fill="none" stroke="rgb(156,163,175)" strokeWidth="1" strokeDasharray="3,5" />
        </g>
        <circle cx="100" cy="90" r="8" fill="rgb(75,85,99)" />
        <rect x="68" y="78" width="10" height="24" rx="2" fill="rgb(239,68,68)" stroke="rgb(185,28,28)" strokeWidth="1" style={{ animation: 'baSqL 3s ease-in-out infinite', transformOrigin: '73px 90px', ...ps }} />
        <rect x="122" y="78" width="10" height="24" rx="2" fill="rgb(239,68,68)" stroke="rgb(185,28,28)" strokeWidth="1" style={{ animation: 'baSqR 3s ease-in-out infinite', transformOrigin: '127px 90px', ...ps }} />
        <rect x="62" y="75" width="76" height="30" rx="5" fill="none" stroke="rgb(107,114,128)" strokeWidth="1.5" strokeDasharray="4,4" />
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Center caliper → Even gap</text>
      </svg>
    ),
    'rim-brake': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes rbL { 0%,30% { transform: translateX(0); } 50%,70% { transform: translateX(8px); } 100% { transform: translateX(0); } }
          @keyframes rbR { 0%,30% { transform: translateX(0); } 50%,70% { transform: translateX(-8px); } 100% { transform: translateX(0); } }
        `}</style></defs>
        <rect x="95" y="35" width="10" height="130" rx="2" fill="rgb(156,163,175)" stroke="rgb(107,114,128)" strokeWidth="1.5" />
        <rect x="75" y="60" width="16" height="40" rx="3" fill="rgb(245,158,11)" stroke="rgb(217,119,6)" strokeWidth="1.5" style={{ animation: 'rbL 3s ease-in-out infinite', ...ps }} />
        <rect x="109" y="60" width="16" height="40" rx="3" fill="rgb(245,158,11)" stroke="rgb(217,119,6)" strokeWidth="1.5" style={{ animation: 'rbR 3s ease-in-out infinite', ...ps }} />
        <line x1="83" y1="55" x2="83" y2="30" stroke="rgb(55,65,81)" strokeWidth="3" />
        <line x1="117" y1="55" x2="117" y2="30" stroke="rgb(55,65,81)" strokeWidth="3" />
        <path d="M83 30 Q100 15 117 30" fill="none" stroke="rgb(55,65,81)" strokeWidth="2" />
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Toe-in pads → Check cable</text>
      </svg>
    ),
    'tighten-headset': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes thBolt { 0%,20% { transform: rotate(0deg); } 60%,80% { transform: rotate(90deg); } 100% { transform: rotate(90deg); } }
          @keyframes thWobble { 0%,30% { transform: translateX(-3px); } 35%,65% { transform: translateX(3px); } 70%,100% { transform: translateX(0); } }
        `}</style></defs>
        <rect x="90" y="20" width="20" height="120" rx="3" fill="rgb(75,85,99)" />
        <rect x="70" y="55" width="60" height="22" rx="4" fill="rgb(55,65,81)" stroke="rgb(107,114,128)" strokeWidth="1.5" />
        <g style={{ animation: 'thBolt 3s ease-in-out infinite', transformOrigin: '100px 30px', ...ps }}>
          <circle cx="100" cy="30" r="7" fill="rgb(245,158,11)" stroke="rgb(217,119,6)" strokeWidth="1.5" />
          <line x1="96" y1="30" x2="104" y2="30" stroke="rgb(217,119,6)" strokeWidth="2" />
          <line x1="100" y1="26" x2="100" y2="34" stroke="rgb(217,119,6)" strokeWidth="2" />
        </g>
        <ellipse cx="100" cy="48" rx="18" ry="4" fill="rgb(107,114,128)" />
        <g style={{ animation: 'thWobble 3s ease-in-out infinite', ...ps }}>
          <path d="M93 140 Q93 165 85 180" fill="none" stroke="rgb(75,85,99)" strokeWidth="5" strokeLinecap="round" />
          <path d="M107 140 Q107 165 115 180" fill="none" stroke="rgb(75,85,99)" strokeWidth="5" strokeLinecap="round" />
        </g>
        <text x="100" y="198" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Top cap → Stem bolts</text>
      </svg>
    ),
    'lube-chain': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes lcDrip { 0% { transform: translateY(-8px); opacity: 1; } 100% { transform: translateY(12px); opacity: 0; } }
          @keyframes lcChain { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -24; } }
        `}</style></defs>
        <path d="M40 100 L160 100" fill="none" stroke="rgb(120,113,108)" strokeWidth="8" strokeLinecap="round" strokeDasharray="6,6" style={{ animation: 'lcChain 1s linear infinite', ...ps }} />
        {[50,70,90,110,130,150].map((x,i) => <circle key={i} cx={x} cy="100" r="4" fill="rgb(87,83,78)" stroke="rgb(68,64,60)" strokeWidth="1" />)}
        <rect x="88" y="55" width="24" height="30" rx="3" fill="rgb(59,130,246)" />
        <rect x="96" y="45" width="8" height="12" rx="2" fill="rgb(37,99,235)" />
        <polygon points="98,85 100,92 102,85" fill="rgb(37,99,235)" />
        {[0,0.4,0.8].map((del,i) => <circle key={i} cx={99+i*2} cy="92" r="1.5" fill="rgb(96,165,250)" style={{ animation: `lcDrip 1.2s ${del}s ease-in infinite`, ...ps }} />)}
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Clean → Lube → Wipe</text>
      </svg>
    ),
    'true-wheel': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`@keyframes twWobble { 0%,100% { transform: translateX(-4px); } 25% { transform: translateX(4px); } 50% { transform: translateX(-2px); } 75% { transform: translateX(3px); } }`}</style></defs>
        <g style={{ animation: 'twWobble 2s ease-in-out infinite', transformOrigin: '100px 90px', ...ps }}>
          <circle cx="100" cy="90" r="60" fill="none" stroke="rgb(107,114,128)" strokeWidth="5" />
        </g>
        <circle cx="100" cy="90" r="10" fill="rgb(75,85,99)" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => <line key={i} x1={100+12*Math.cos(deg*Math.PI/180)} y1={90+12*Math.sin(deg*Math.PI/180)} x2={100+56*Math.cos(deg*Math.PI/180)} y2={90+56*Math.sin(deg*Math.PI/180)} stroke={deg===90?'rgb(245,158,11)':'rgb(156,163,175)'} strokeWidth={deg===90?2.5:1.5} />)}
        <g style={{ animation: 'twWobble 3s ease-in-out infinite reverse', transformOrigin: '100px 155px', ...ps }}>
          <rect x="94" y="148" width="12" height="20" rx="2" fill="rgb(245,158,11)" />
        </g>
        <text x="100" y="192" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Find wobble → Adjust spoke</text>
      </svg>
    ),
    'bottom-bracket': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes bbRot { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes bbCreak { 0%,45% { fill: rgb(75,85,99); } 50%,55% { fill: rgb(245,158,11); } 60%,100% { fill: rgb(75,85,99); } }
        `}</style></defs>
        <rect x="75" y="80" width="50" height="40" rx="20" fill="rgb(55,65,81)" stroke="rgb(107,114,128)" strokeWidth="2" />
        <circle cx="100" cy="100" r="15" style={{ animation: 'bbCreak 2s infinite', ...ps }} />
        <circle cx="100" cy="100" r="8" fill="rgb(31,41,55)" />
        <g style={{ animation: 'bbRot 3s linear infinite', transformOrigin: '100px 100px', ...ps }}>
          <rect x="96" y="40" width="8" height="60" rx="3" fill="rgb(107,114,128)" />
          <rect x="96" y="100" width="8" height="60" rx="3" fill="rgb(107,114,128)" />
          <rect x="80" y="35" width="40" height="10" rx="3" fill="rgb(75,85,99)" />
          <rect x="80" y="155" width="40" height="10" rx="3" fill="rgb(75,85,99)" />
        </g>
        <text x="100" y="190" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Crank → BB bearings</text>
      </svg>
    ),
    'tubeless-seat': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes tsPop { 0%,60% { transform: scaleX(0.95); } 65% { transform: scaleX(1.02); } 70%,100% { transform: scaleX(1); } }
          @keyframes tsSwirl { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes tsPump { 0%,50% { opacity: 0.3; } 60%,80% { opacity: 1; } 100% { opacity: 0.3; } }
        `}</style></defs>
        <g style={{ animation: 'tsPop 4s ease-in-out infinite', transformOrigin: '100px 90px', ...ps }}>
          <circle cx="100" cy="90" r="65" fill="none" stroke="rgb(107,114,128)" strokeWidth="8" />
        </g>
        <circle cx="100" cy="90" r="10" fill="rgb(75,85,99)" />
        <g style={{ animation: 'tsSwirl 6s linear infinite', transformOrigin: '100px 90px', ...ps }}>
          <circle cx="85" cy="85" r="3" fill="rgb(34,197,94)" opacity="0.6" />
          <circle cx="115" cy="95" r="2.5" fill="rgb(34,197,94)" opacity="0.5" />
          <circle cx="100" cy="110" r="2" fill="rgb(34,197,94)" opacity="0.7" />
        </g>
        <text x="100" y="50" textAnchor="middle" fill="rgb(59,130,246)" fontSize="10" fontFamily="monospace" style={{ animation: 'tsPump 2s infinite', ...ps }}>PSI</text>
        <text x="100" y="185" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Sealant → Inflate → Seat</text>
      </svg>
    ),
    'spoke-replace': (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs><style>{`
          @keyframes srFlash { 0%,40% { stroke: rgb(239,68,68); } 50%,60% { stroke: rgb(34,197,94); } 70%,100% { stroke: rgb(156,163,175); } }
          @keyframes srWrench { 0%,40% { transform: rotate(0deg); } 60%,80% { transform: rotate(45deg); } 100% { transform: rotate(0deg); } }
        `}</style></defs>
        <circle cx="100" cy="90" r="60" fill="none" stroke="rgb(107,114,128)" strokeWidth="5" />
        <circle cx="100" cy="90" r="10" fill="rgb(75,85,99)" />
        {[0,30,60,120,150,180,210,240,270,300,330].map(deg => <line key={deg} x1={100+12*Math.cos(deg*Math.PI/180)} y1={90+12*Math.sin(deg*Math.PI/180)} x2={100+56*Math.cos(deg*Math.PI/180)} y2={90+56*Math.sin(deg*Math.PI/180)} stroke="rgb(156,163,175)" strokeWidth="1.5" />)}
        <line x1="100" y1="102" x2="100" y2="146" style={{ animation: 'srFlash 4s infinite', ...ps }} strokeWidth="2.5" stroke="rgb(239,68,68)" />
        <g style={{ animation: 'srWrench 4s ease-in-out infinite', transformOrigin: '100px 148px', ...ps }}>
          <rect x="94" y="145" width="12" height="18" rx="2" fill="rgb(245,158,11)" />
        </g>
        <text x="100" y="192" textAnchor="middle" fill="rgb(156,163,175)" fontSize="10" fontFamily="monospace">Remove → Thread → Tension</text>
      </svg>
    ),
  };
  return (
    <div className="bg-slate-800 rounded-xl p-4 aspect-square flex items-center justify-center border border-slate-700 relative">
      {anims[type] || (<div className="text-slate-500 text-center text-sm"><span className="text-2xl block mb-2 opacity-40">🔧</span><span className="font-mono text-xs">Visual demo</span></div>)}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// PROBLEM CATEGORIES
// ════════════════════════════════════════════════════════════
const PROBLEMS = [
  { id: 'flat', label: 'Flat Tire', icon: '🛞', color: 'rgb(239,68,68)' },
  { id: 'chain', label: 'Chain Problems', icon: '⛓️', color: 'rgb(245,158,11)' },
  { id: 'brakes', label: 'Brake Problems', icon: '✋', color: 'rgb(59,130,246)' },
  { id: 'shifting', label: 'Shifting Issues', icon: '⚙️', color: 'rgb(139,92,246)' },
  { id: 'headset', label: 'Wobbly Bars', icon: '🔩', color: 'rgb(6,182,212)' },
  { id: 'noise', label: 'Strange Noise', icon: '👂', color: 'rgb(236,72,153)' },
  { id: 'pedal_crank', label: 'Pedal / Crank', icon: '🦶', color: 'rgb(249,115,22)' },
  { id: 'wheel', label: 'Wheel Problems', icon: '☸️', color: 'rgb(20,184,166)' },
  { id: 'tire_seat', label: "Tire Won't Seat", icon: '💨', color: 'rgb(168,85,247)' },
  { id: 'custom', label: 'Something Else', icon: '🔧', color: 'rgb(107,114,128)' },
];

// ════════════════════════════════════════════════════════════
// TROUBLESHOOTING TREE
// ════════════════════════════════════════════════════════════
const TREE = {
  flat_start: { question: 'What kind of tire setup?', options: [
    { label: 'Tubes (inner tube inside tire)', next: 'flat_tube' },
    { label: 'Tubeless (sealed, no inner tube)', next: 'flat_tubeless' },
    { label: 'Not sure', next: 'flat_tube' },
  ]},
  flat_tube: { question: 'Can you see what caused the flat?', options: [
    { label: 'Yes — thorn, glass, nail visible', next: 'flat_visible' },
    { label: 'No — tire looks fine', next: 'flat_invisible' },
    { label: 'Flat every morning (slow leak)', next: 'flat_slow' },
    { label: 'Keeps going flat after I patch it', next: 'flat_recurring' },
  ]},
  flat_visible: { question: 'How big is the hole?', options: [
    { label: 'Tiny pinhole (thorn/wire)', fix: 'fix_patch' },
    { label: 'Larger slash or tear', fix: 'fix_replace_tube' },
  ]},
  flat_invisible: { question: 'Water test: inflate tube, submerge, find bubbles. Where?', options: [
    { label: 'One spot — single puncture', fix: 'fix_patch' },
    { label: 'Two holes side by side (snake bite)', fix: 'fix_snakebite' },
    { label: 'At the valve stem', fix: 'fix_valve' },
  ]},
  flat_slow: { question: 'Where does air escape?', options: [
    { label: 'Through the valve', fix: 'fix_valve' },
    { label: 'Through a tiny tube puncture', fix: 'fix_patch' },
    { label: 'Rim tape — air from spoke holes', fix: 'fix_rimtape' },
  ]},
  flat_recurring: { question: 'What happens when you re-patch/replace?', options: [
    { label: 'New hole in same spot — debris in tire', fix: 'fix_tire_debris' },
    { label: 'New hole in different spot each time', fix: 'fix_rimtape' },
    { label: 'Pinch flat every time (two holes)', fix: 'fix_snakebite' },
  ]},
  flat_tubeless: { question: "What's happening?", options: [
    { label: "Sealant won't seal a puncture", fix: 'fix_tubeless_plug' },
    { label: 'Tire burped (lost air on corner)', fix: 'fix_tubeless_burp' },
    { label: 'Sealant dried out (flat after sitting)', fix: 'fix_tubeless_refresh' },
    { label: 'Sidewall slash (big gash)', fix: 'fix_tubeless_boot' },
  ]},
  chain_start: { question: "What's the chain doing?", options: [
    { label: 'Fell off completely (dropped)', next: 'chain_dropped' },
    { label: 'Skips or jumps under power', next: 'chain_skip' },
    { label: 'Has a stiff / tight link', fix: 'fix_stiff_link' },
    { label: 'Chain broke (snapped apart)', fix: 'fix_chain_break' },
  ]},
  chain_dropped: { question: 'When did it drop?', options: [
    { label: 'While shifting gears', next: 'chain_shifting' },
    { label: 'While pedaling hard', fix: 'fix_reseat_worn' },
    { label: 'Just fell off randomly', fix: 'fix_reseat_basic' },
  ]},
  chain_shifting: { question: 'Which side did it fall to?', options: [
    { label: 'Inside (toward frame)', fix: 'fix_chain_inside' },
    { label: 'Outside (away from frame)', fix: 'fix_chain_outside' },
  ]},
  chain_skip: { question: 'When does it skip?', options: [
    { label: 'Only in certain gears', fix: 'fix_shift_skip' },
    { label: 'Under hard pedaling in any gear', fix: 'fix_chain_worn' },
    { label: 'After installing a new chain', fix: 'fix_chain_new_skip' },
  ]},
  brakes_start: { question: 'What type of brakes?', options: [
    { label: 'Disc brakes (rotor near hub)', next: 'brakes_disc' },
    { label: 'Rim brakes (pads squeeze the rim)', next: 'brakes_rim' },
    { label: 'Not sure', next: 'brakes_disc' },
  ]},
  brakes_disc: { question: "What's the symptom?", options: [
    { label: 'Squealing/squeaking', fix: 'fix_disc_squeal' },
    { label: 'Rubbing (constant scraping)', fix: 'fix_disc_rub' },
    { label: 'Lever pulls to bar (weak)', next: 'brakes_disc_weak' },
    { label: "Lever doesn't spring back", fix: 'fix_disc_lever_stuck' },
  ]},
  brakes_disc_weak: { question: 'What does the lever feel like?', options: [
    { label: 'Spongy/mushy (hydraulic)', fix: 'fix_disc_bleed' },
    { label: 'Firm but weak stopping', fix: 'fix_disc_weak' },
    { label: 'Reaches the bar (too much travel)', fix: 'fix_disc_pad_worn' },
  ]},
  brakes_rim: { question: "What's the symptom?", options: [
    { label: 'Squealing', fix: 'fix_rim_squeal' },
    { label: 'Weak stopping power', fix: 'fix_rim_weak' },
    { label: 'Rubs on one side', fix: 'fix_rim_rub' },
  ]},
  shifting_start: { question: 'What type of shifting?', options: [
    { label: 'Cable (mechanical) — most common', next: 'shifting_cable' },
    { label: 'Electronic (Di2 / AXS)', next: 'shifting_electronic' },
    { label: 'Internal hub (Nexus/Alfine)', fix: 'fix_internal_hub' },
    { label: 'Not sure', next: 'shifting_cable' },
  ]},
  shifting_cable: { question: 'What happens when you shift?', options: [
    { label: "Won't shift to harder gears", fix: 'fix_shift_up' },
    { label: "Won't shift to easier gears", fix: 'fix_shift_down' },
    { label: 'Skips gears / chain jumps', fix: 'fix_shift_skip' },
    { label: 'Clicking in one gear', fix: 'fix_shift_click' },
    { label: 'Shifts on its own (ghost shifting)', fix: 'fix_ghost_shift' },
  ]},
  shifting_electronic: { question: "What's happening?", options: [
    { label: "Won't shift — no response", fix: 'fix_electronic_dead' },
    { label: 'Shifts but not precisely', fix: 'fix_electronic_adjust' },
    { label: 'Shifts on its own / erratic', fix: 'fix_electronic_erratic' },
    { label: 'Battery or charging issue', fix: 'fix_electronic_battery' },
  ]},
  headset_start: { question: 'Grab front brake, rock bike forward/back. What do you feel?', options: [
    { label: 'Clunking/knocking', fix: 'fix_headset_loose' },
    { label: 'Stiff/notchy when turning', fix: 'fix_headset_tight' },
    { label: 'Gritty feeling when turning', fix: 'fix_headset_gritty' },
  ]},
  noise_start: { question: 'When do you hear it?', options: [
    { label: 'Only when pedaling', next: 'noise_pedaling' },
    { label: 'Only when braking', next: 'brakes_start' },
    { label: 'Going over bumps', fix: 'fix_noise_rattle' },
    { label: 'All the time (wheel spinning)', fix: 'fix_noise_wheel' },
  ]},
  noise_pedaling: { question: 'What does it sound like?', options: [
    { label: 'Click every pedal rotation', fix: 'fix_noise_click' },
    { label: 'Creaking under pressure', fix: 'fix_noise_creak' },
    { label: 'Chain grinding/rough', fix: 'fix_noise_chainlube' },
    { label: 'Ticking from bottom bracket', fix: 'fix_bb_creak' },
  ]},
  pedal_crank_start: { question: 'Where is the problem?', options: [
    { label: 'Pedal is loose or wobbly', fix: 'fix_pedal_loose' },
    { label: 'Crank arm wobbles on spindle', fix: 'fix_crank_loose' },
    { label: 'Bottom bracket creaks', fix: 'fix_bb_creak' },
    { label: "Clipless pedal won't clip/release", fix: 'fix_clipless' },
  ]},
  wheel_start: { question: "What's wrong with the wheel?", options: [
    { label: 'Wobbles side to side', fix: 'fix_true_wheel' },
    { label: 'Broken spoke', fix: 'fix_broken_spoke' },
    { label: 'Hub feels loose', fix: 'fix_hub_play' },
    { label: 'Quick-release / thru-axle issue', fix: 'fix_axle' },
  ]},
  tire_seat_start: { question: 'What setup?', options: [
    { label: "Tubeless tire won't pop onto rim", fix: 'fix_tubeless_seat' },
    { label: "Tube tire bead won't seat evenly", fix: 'fix_bead_seat' },
    { label: 'Tire keeps blowing off rim', fix: 'fix_tire_blowoff' },
  ]},
};

// ════════════════════════════════════════════════════════════
// FIX DEFINITIONS
// ════════════════════════════════════════════════════════════
const FIXES = {
  fix_patch: { title: 'Patch the Inner Tube', animation: 'patch-tube', difficulty: 'Easy', time: '10–15 min',
    tools: ['Tire levers', 'Patch kit', 'Pump'],
    steps: ['Remove the wheel from the bike (quick-release or thru-axle)', 'Use tire levers to unseat one side of the tire bead', 'Pull the inner tube out carefully', 'Inflate and listen/feel for the leak (or submerge in water)', 'Mark the hole, rough up with sandpaper from patch kit', 'Apply vulcanizing glue — wait 60s until tacky', 'Press patch firmly — hold 30s with thumb pressure', 'Check inside of tire for the puncture cause — remove it', 'Slightly inflate tube, tuck back in starting at valve', 'Reseat tire bead by hand — avoid pinching tube', 'Inflate to pressure on tire sidewall'],
    pro_tip: 'Run your fingers along inside of the tire to find the culprit. Skip this and you\'ll flat again in 5 minutes.',
    parts: [{ name: 'Vulcanizing patch kit', example: 'Park Tool VP-1', price: '$4–8' }] },
  fix_replace_tube: { title: 'Replace the Inner Tube', animation: 'replace-tube', difficulty: 'Easy', time: '10–15 min',
    tools: ['Tire levers', 'New tube (correct size)', 'Pump'],
    steps: ['Remove wheel → lever one bead off → pull old tube out', 'Check tire interior for embedded debris', 'Slightly inflate new tube (just barely round)', 'Insert valve through rim hole first, tuck tube all around', 'Push tire bead back on starting opposite the valve', 'Last tight section: push seated bead into center channel for slack', 'Inflate slowly, check tube isn\'t pinched', 'Full pressure per tire sidewall'],
    pro_tip: 'Always carry a spare tube. Patching is fine at home, swap is 3x faster roadside.',
    parts: [{ name: 'Inner tube', example: 'Continental Race 28 700x25-32', price: '$6–10' }] },
  fix_snakebite: { title: 'Fix a Pinch Flat (Snake Bite)', animation: 'replace-tube', difficulty: 'Easy', time: '15 min',
    tools: ['Tire levers', 'New tube or 2 patches', 'Pump'],
    steps: ['Two parallel holes = pinch flat. Tube pinched between rim and tire.', 'Can patch both holes, or better: replace tube entirely', 'Root cause: tire pressure too low. Inflate to proper PSI!', 'Check tire sidewall for recommended pressure', 'If recurring: run higher pressure or switch to wider tires'],
    pro_tip: 'Pinch flats are a pressure problem. Check pressure before every ride — tires lose 5-10 PSI/week.',
    parts: [{ name: 'Inner tube', example: 'Match tire size', price: '$6–10' }] },
  fix_valve: { title: 'Fix a Leaking Valve', animation: 'replace-tube', difficulty: 'Easy', time: '5 min',
    tools: ['Valve core tool', 'Pump'],
    steps: ['Presta: tighten locknut at top (clockwise)', 'Try tightening valve core with valve core tool, clockwise gently', 'Damaged core: remove and install new one ($1 part)', 'Schrader: press pin briefly to clear debris, check seal', 'Torn valve stem: replace entire tube'],
    pro_tip: 'Carry a spare valve core and tool — they weigh nothing and save rides.',
    parts: [{ name: 'Valve core + tool', example: 'Lezyne valve core kit', price: '$3–5' }] },
  fix_rimtape: { title: 'Replace Rim Tape', animation: 'replace-tube', difficulty: 'Moderate', time: '20 min',
    tools: ['Tire levers', 'New rim tape (correct width)', 'Pump'],
    steps: ['Remove wheel, tire, and tube completely', 'Peel off old rim tape', 'Clean rim channel with dry cloth', 'Apply new tape: start at valve hole, press firmly', 'Every spoke hole must be fully covered', 'Poke through valve hole, reinstall tube and tire'],
    pro_tip: 'Use tape 2mm wider than internal rim width.',
    parts: [{ name: 'Rim tape', example: "Stan's tubeless tape", price: '$5–12' }] },
  fix_tire_debris: { title: 'Remove Hidden Tire Debris', animation: 'patch-tube', difficulty: 'Easy', time: '15 min',
    tools: ['Tire levers', 'Flashlight', 'Tweezers'],
    steps: ['Remove wheel and tire completely', 'Turn tire inside out, flex section by section', 'Use flashlight to inspect inside', 'Run cotton ball along inside — snags on sharp objects', 'Remove debris with tweezers', 'Check outside tread too', 'Reinstall with fresh tube'],
    pro_tip: 'Tiny wire from car tires is the sneakiest cause of recurring flats. The cotton ball trick catches them.',
    parts: [] },
  fix_tubeless_plug: { title: 'Plug a Tubeless Puncture', animation: 'tubeless-seat', difficulty: 'Easy', time: '5 min',
    tools: ['Tubeless plug kit (bacon strip)', 'Pump or CO2'],
    steps: ['Find the puncture — spin wheel, look for escaping sealant', 'Don\'t remove the object yet! Prep the plug tool first', 'Thread plug strip through insertion tool needle', 'Remove object, immediately push plug tool in', 'Pull tool out — plug stays seated', 'Trim excess, reinflate to normal pressure', 'Spin wheel — plug + sealant should seal completely'],
    pro_tip: 'Carry a plug kit on every tubeless ride. 2-minute repair.',
    parts: [{ name: 'Tubeless plug kit', example: 'Dynaplug Racer', price: '$20–35' }] },
  fix_tubeless_burp: { title: 'Fix a Tubeless Burp', animation: 'tubeless-seat', difficulty: 'Easy', time: '5 min',
    tools: ['Pump or CO2', 'Sealant (if low)'],
    steps: ['Burp = tire momentarily unseated, lost air', 'Reinflate — most tires reseat with floor pump', 'If won\'t seal: shake wheel to redistribute sealant, inflate quickly', 'Floor pump fails: use CO2 cartridge', 'Check sealant level — remove valve core, shake, look inside', 'Prevent: run slightly higher pressure for aggressive riding'],
    pro_tip: 'Frequent burping = loose tire-rim fit. Wider rim strip can fix this.',
    parts: [{ name: 'Tubeless sealant', example: "Stan's 2oz", price: '$7–10' }] },
  fix_tubeless_refresh: { title: 'Refresh Dried-Out Sealant', animation: 'tubeless-seat', difficulty: 'Easy', time: '15 min',
    tools: ['Valve core tool', 'Sealant', 'Pump'],
    steps: ['Remove valve core', 'Break one tire bead off the rim', 'Pour out old sealant, remove dried latex', 'Add fresh: 2oz road, 3-4oz MTB', 'Reseat bead, inflate', 'Shake/rotate wheel to coat inside'],
    pro_tip: 'Sealant dries every 2-4 months. Set a calendar reminder. Hot/dry = faster.',
    parts: [{ name: 'Tubeless sealant', example: "Stan's, Orange Seal, Muc-Off", price: '$7–15' }] },
  fix_tubeless_boot: { title: 'Emergency Sidewall Boot', animation: 'replace-tube', difficulty: 'Moderate', time: '15 min',
    tools: ['Tire boot (or dollar bill)', 'Spare tube', 'Tire levers', 'Pump'],
    steps: ['Sidewall slash = too big for sealant/plugs. Need boot + tube to get home.', 'Remove tire from rim', 'Place boot inside tire over slash — extend 1"+ past in all directions', 'Install inner tube (converting to tube setup temporarily)', 'Reseat tire, inflate to ~80% pressure', 'Ride home carefully — replace the tire'],
    pro_tip: 'Park Tool TB-2 tire boots weigh nothing. Carry one always.',
    parts: [{ name: 'Tire boot', example: 'Park Tool TB-2', price: '$4–6' }] },
  fix_reseat_basic: { title: 'Reseat a Dropped Chain', animation: 'reseat-chain', difficulty: 'Easy', time: '1–2 min',
    tools: ['None (hands only)'],
    steps: ['Stop pedaling immediately', 'Chain fell outside: shift front derailleur to smallest ring', 'Chain fell inside: shift to largest ring', 'Lift chain onto smallest front chainring teeth', 'Hold rear wheel off ground, turn pedals forward slowly', 'Chain should engage and track normally', 'Shift through gears to confirm'],
    pro_tip: 'Grab chain from the bottom run — cleaner and more slack.',
    parts: [] },
  fix_reseat_worn: { title: 'Reseat Chain + Check Wear', animation: 'reseat-chain', difficulty: 'Easy → Moderate', time: '2–5 min',
    tools: ['Chain checker (optional)'],
    steps: ['Reseat chain onto smallest chainring', 'Chain dropping under load = wear. Check:', 'Chain stretch: 12 links should be 12". 12⅛"+ = worn.', 'Chainring teeth: shark fins (hooked)? Time to replace.', 'If both worn: replace chain AND cassette together', 'Temp fix: avoid cross-chaining (big-big or small-small)'],
    pro_tip: '$10 chain checker pays for itself — catching wear early saves your $80 cassette.',
    parts: [{ name: 'Chain checker', example: 'Park Tool CC-2', price: '$10–15' }] },
  fix_chain_inside: { title: 'Chain Dropped Inside (Low Limit)', animation: 'reseat-chain', difficulty: 'Easy', time: '5 min',
    tools: ['Phillips or flat screwdriver'],
    steps: ['Reseat chain onto smallest chainring', 'Low-limit screw needs adjustment', 'Find L and H screws on front derailleur', 'Turn L screw clockwise ¼ turn', 'Shift to smallest ring — chain should NOT go further inward', 'If it can, turn another ¼ turn'],
    pro_tip: 'Only ¼ turn at a time. Overtightening prevents shifting to easiest gear.',
    parts: [] },
  fix_chain_outside: { title: 'Chain Dropped Outside (High Limit)', animation: 'reseat-chain', difficulty: 'Easy', time: '5 min',
    tools: ['Phillips or flat screwdriver'],
    steps: ['Reseat chain onto largest chainring', 'H-limit screw needs adjustment', 'Turn H screw clockwise ¼ turn', 'Shift to largest ring — chain should NOT go further outward', 'Push derailleur cage by hand to verify it stops'],
    pro_tip: 'Chain dropping outside can damage crank arm. Fix promptly.',
    parts: [] },
  fix_stiff_link: { title: 'Fix a Stiff Chain Link', animation: 'lube-chain', difficulty: 'Easy', time: '5 min',
    tools: ['Chain lube', 'Hands or pliers'],
    steps: ['Backpedal slowly, watch chain at rear derailleur — stiff link "kicks"', 'Find the stiff link — won\'t flex side-to-side', 'Grip chain on either side, flex laterally to free pins', 'Apply lube directly to stiff link pins', 'Flex again — should move freely', 'If won\'t free: remove and replace with quick link'],
    pro_tip: 'Stiff links often from off-center chain pin. Quick links avoid this.',
    parts: [{ name: 'Quick link', example: 'KMC Missing Link (match speed)', price: '$3–7' }] },
  fix_chain_break: { title: 'Fix a Broken Chain', animation: 'reseat-chain', difficulty: 'Moderate', time: '10–15 min',
    tools: ['Chain tool (breaker)', 'Quick link'],
    steps: ['Remove broken/damaged links — need two clean ends', 'Use chain tool to push out pin on adjacent link', 'Remove damaged section (2 links min)', 'Connect clean ends with quick link', 'Thread each end through one half of quick link', 'Pull cranks forward to snap quick link closed', 'Chain is shorter — avoid big-big gear combo', 'Get a new chain soon'],
    pro_tip: 'Carry a quick link + compact chain tool. Difference between riding home and calling for a pickup.',
    parts: [{ name: 'Chain tool', example: 'Park Tool CT-5', price: '$15–25' }, { name: 'Quick link', example: 'Match chain speed', price: '$3–7' }] },
  fix_chain_worn: { title: 'Replace Worn Chain + Cassette', animation: 'reseat-chain', difficulty: 'Moderate', time: '30–45 min',
    tools: ['Chain tool', 'Chain whip', 'Cassette lockring tool', 'New chain', 'New cassette'],
    steps: ['Check wear: 12 links = 12". If 12⅛"+, chain is done.', 'Remove old chain', 'Check cassette teeth — hooked/shark-fin = replace', 'Install new cassette: tighten lockring ~40 Nm', 'Size new chain: largest ring + largest cog + 2 links', 'Install and connect with quick link', 'Shift through all gears to settle'],
    pro_tip: 'Replace chains every 2-3K miles and get 2-3 cassette lives.',
    parts: [{ name: 'Chain', example: 'Shimano CN-HG601 (11-speed)', price: '$20–35' }, { name: 'Cassette', example: 'Shimano CS-HG700', price: '$40–80' }] },
  fix_chain_new_skip: { title: 'New Chain Skipping on Old Cassette', animation: 'adjust-derailleur', difficulty: 'Moderate', time: '15 min',
    tools: ['Chain checker'],
    steps: ['Most common compatibility issue in bike repair.', 'Worn chain and cassette "match" each other\'s wear.', 'New chain on worn cassette skips — tooth profiles don\'t match.', 'Fix: replace the cassette too.', 'Check chainrings as well.', 'In future: replace chains more often (every 2-3K miles)'],
    pro_tip: 'Before buying a chain, check old chain wear. Past 0.75% = budget for new cassette.',
    parts: [{ name: 'Cassette', example: 'Match drivetrain', price: '$30–100' }] },
  fix_disc_squeal: { title: 'Fix Squealing Disc Brakes', animation: 'brake-align', difficulty: 'Easy → Moderate', time: '10–20 min',
    tools: ['Isopropyl alcohol', 'Clean rag', 'Allen keys'],
    steps: ['Most common cause: contamination (oil, lube, fingerprints)', 'Remove wheel, inspect pads — glazed/shiny?', 'Clean rotor with isopropyl + lint-free rag', 'Glazed pads: sand with 120-grit sandpaper', 'Contaminated pads (oil): replace — oil soaks in permanently', 'Bed in brakes: 10 moderate stops from jogging speed', 'Persists? Check caliper centering'],
    pro_tip: 'Never touch rotors with bare fingers. Skin oil = future squeal.',
    parts: [{ name: 'Disc brake pads', example: 'Shimano B01S (resin)', price: '$10–20/pair' }] },
  fix_disc_rub: { title: 'Fix Disc Brake Rubbing', animation: 'brake-align', difficulty: 'Easy', time: '5–10 min',
    tools: ['Allen keys (5mm)', 'Flashlight'],
    steps: ['Loosen two caliper mounting bolts (just enough to slide)', 'Squeeze brake lever firmly — centers caliper', 'While holding lever, retighten both bolts', 'Release, spin wheel, listen', 'Still rubbing? Flashlight through caliper slot', 'Should see even daylight both sides of rotor', 'Micro-adjust: tap caliper toward side with less gap'],
    pro_tip: '#1 most common disc brake issue. Takes 60 seconds once you\'ve done it twice.',
    parts: [] },
  fix_disc_weak: { title: 'Fix Weak Disc Brakes', animation: 'brake-align', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Allen keys', 'Bleed kit (if hydraulic)'],
    steps: ['Mechanical: adjust barrel adjuster (CCW to tighten)', 'Check pad wear: <1mm material = replace', 'Hydraulic spongy lever: need to bleed system', 'Remove wheel, squeeze lever — pads close evenly?', 'One stuck piston: push back with tire lever, re-squeeze', 'After pad change: bed in 20 moderate stops'],
    pro_tip: 'Hydraulic lever slowly pulls to bar overnight = seal leak. Shop visit.',
    parts: [{ name: 'Disc brake pads', example: 'Match caliper model', price: '$10–20' }] },
  fix_disc_pad_worn: { title: 'Replace Worn Brake Pads', animation: 'brake-align', difficulty: 'Easy', time: '10 min/wheel',
    tools: ['Allen keys', 'Pad spreader'],
    steps: ['Remove wheel', 'Remove pad retention bolt/pin', 'Pull old pads out — save spring clip', 'Push pistons back with tire lever', 'Insert new pads with spring clip', 'Reinstall retention bolt', 'Replace wheel, squeeze lever to set position', 'Bed in: 20 moderate stops'],
    pro_tip: 'Replace pads in pairs. Mix = uneven braking.',
    parts: [{ name: 'Disc brake pads', example: 'Shimano B01S or metallic', price: '$10–25/pair' }] },
  fix_disc_lever_stuck: { title: 'Fix Stuck Brake Lever', animation: 'brake-align', difficulty: 'Moderate', time: '10–20 min',
    tools: ['Allen keys', 'Tire lever'],
    steps: ['Pistons likely over-extended', 'Remove wheel first', 'Check caliper — pads touching? Pistons sticking out?', 'Push each piston back with flat tire lever — evenly', 'Won\'t budge: wiggle slightly while pushing', 'Reinstall wheel', 'Pump lever — should feel firm and spring back', 'Still sticks: master cylinder needs service (shop)'],
    pro_tip: 'This happens when you squeeze lever without wheel installed. Always use pad spacer.',
    parts: [{ name: 'Bleed block', example: 'Included with new pads', price: '$2–5' }] },
  fix_disc_bleed: { title: 'Bleed Hydraulic Disc Brakes', animation: 'brake-align', difficulty: 'Advanced', time: '30–45 min',
    tools: ['Bleed kit (brand-specific)', 'Brake fluid', 'Allen keys'],
    steps: ['Shimano = mineral oil. SRAM = DOT 5.1. NEVER MIX!', 'Attach syringe to caliper bleed port', 'Open bleed port, push fluid up', 'At lever: attach second syringe', 'Push fluid back and forth, watch for bubbles', 'Continue until no bubbles visible', 'Close ports, pump lever — should feel firm', 'Spongy still? Repeat bleed.'],
    pro_tip: 'First time? Watch a brand-specific video. Shop bleed costs $30-50 if you\'d rather not DIY.',
    parts: [{ name: 'Bleed kit', example: 'Shimano TL-BR002', price: '$25–40' }, { name: 'Fluid', example: 'Shimano mineral oil', price: '$8–15' }] },
  fix_rim_squeal: { title: 'Fix Rim Brake Squeal', animation: 'rim-brake', difficulty: 'Easy', time: '5–10 min',
    tools: ['Allen key (5mm)', 'Sandpaper'],
    steps: ['Check pads for debris — pick out with needle', 'Sand pad surface with 120-grit', 'Clean rim with isopropyl', 'Toe-in pads: front touches rim before rear (~1mm)', 'Loosen pad bolt, angle pad, retighten'],
    pro_tip: 'Business card behind rear of pad while tightening = perfect toe-in.',
    parts: [{ name: 'Rim brake pads', example: 'Kool-Stop Salmon', price: '$10–18/pair' }] },
  fix_rim_weak: { title: 'Fix Weak Rim Brakes', animation: 'rim-brake', difficulty: 'Easy', time: '5–10 min',
    tools: ['Allen key', 'Pliers'],
    steps: ['Check pad wear — grooves gone = replace', 'Pads hitting rim (not tire/below rim)?', 'Barrel adjuster on brake lever: CCW = tighter', 'Maxed out: loosen cable anchor, pull tighter, re-clamp', 'Clean rim surface', 'Concave groove where pads contact? Rim needs replacing.'],
    pro_tip: 'Most weak braking = cable stretch. Barrel adjuster: 10 seconds.',
    parts: [] },
  fix_rim_rub: { title: 'Fix One-Sided Rim Brake Rub', animation: 'rim-brake', difficulty: 'Easy', time: '2 min',
    tools: ['Allen key (optional)'],
    steps: ['One pad closer to rim than other', 'Find spring tension adjuster screw on brake arm', 'Turn screw on rubbing side to push arm away', 'Alt: loosen mounting bolt, squeeze brake, retighten', 'Spin wheel — verify even gap'],
    pro_tip: 'If the wheel wobbles (not brake), it\'s a truing issue.',
    parts: [] },
  fix_shift_up: { title: "Won't Shift to Harder Gears", animation: 'adjust-derailleur', difficulty: 'Easy', time: '5 min',
    tools: ['Barrel adjuster'],
    steps: ['Cable tension too high', 'Find barrel adjuster on rear derailleur or shifter', 'Turn clockwise ½ turn', 'Pedal and shift. Repeat ¼ turn until crisp.', 'Bottomed out: reanchor cable slightly looser'],
    pro_tip: 'Righty-tighty = shifts toward smaller cogs.', parts: [] },
  fix_shift_down: { title: "Won't Shift to Easier Gears", animation: 'adjust-derailleur', difficulty: 'Easy', time: '5 min',
    tools: ['Barrel adjuster'],
    steps: ['Cable tension too low', 'Turn barrel adjuster CCW ½ turn', 'Pedal and shift. Repeat ¼ turn.', 'Still won\'t reach largest cog: check L-limit screw', 'L screw = safety. Don\'t remove! Back out ¼ turn max.'],
    pro_tip: 'Shifting suddenly worse = check for frayed/kinked cable.', parts: [] },
  fix_shift_skip: { title: 'Fix Gear Skipping', animation: 'adjust-derailleur', difficulty: 'Moderate', time: '10–20 min',
    tools: ['Barrel adjuster', 'Chain checker', 'Allen keys'],
    steps: ['Check derailleur hanger from behind — perfectly vertical?', 'If bent: alignment tool or replace hanger (~$15)', 'If straight: barrel adjuster fine-tune', 'Specific gear skipping = cable tension', 'Hard pedaling skipping = worn chain/cassette', 'New chain on old cassette = skip (replace both)'],
    pro_tip: 'Bent hanger = #1 mystery shifting cause. Even a small bump bends it.',
    parts: [{ name: 'Derailleur hanger', example: 'Frame-specific', price: '$15–30' }] },
  fix_shift_click: { title: 'Fix Clicking in One Gear', animation: 'adjust-derailleur', difficulty: 'Easy', time: '3 min',
    tools: ['Barrel adjuster'],
    steps: ['Rhythmic click = derailleur halfway between gears', 'Shift to noisy gear', 'Barrel adjuster ¼ turn CCW. Gone? Done.', 'If worse: ¼ turn CW instead', 'Pedal to verify silent running'],
    pro_tip: '30-second fix that shops charge $30 for.', parts: [] },
  fix_ghost_shift: { title: 'Fix Ghost Shifting', animation: 'adjust-derailleur', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Allen keys', 'Cable cutters'],
    steps: ['Usually frayed or sticky cable', 'Check housing for kinks/cracks', 'Inspect cable at derailleur anchor — fraying?', 'Pull housing at each stop — does cable slide freely?', 'Damaged: replace cable + housing as set', 'Also check hanger alignment', 'After replacing: fine-tune barrel adjuster'],
    pro_tip: 'Frayed cables are a safety issue — snap under load. Replace immediately.',
    parts: [{ name: 'Shift cable set', example: 'Shimano SP41', price: '$10–20' }] },
  fix_electronic_dead: { title: 'Unresponsive Electronic Shifting', animation: 'adjust-derailleur', difficulty: 'Easy → Mod', time: '5–15 min',
    tools: ['Charger (brand-specific)'],
    steps: ['Check battery — Di2: hold junction box button. Green=good, red=charge.', 'SRAM AXS: press derailleur button. Green=good.', 'Charged but dead: reset. Di2: reconnect junction. AXS: hold pairing 10s.', 'Di2: check/reseat wired connections', 'AXS: re-pair derailleur to shifter', 'Update firmware via app (E-Tube / AXS app)'],
    pro_tip: 'Di2 ~1000 miles/charge. AXS ~60hrs ride time.',
    parts: [{ name: 'SRAM AXS battery', example: 'SRAM eTap battery', price: '$45–55' }] },
  fix_electronic_adjust: { title: 'Micro-Adjust Electronic Shifting', animation: 'adjust-derailleur', difficulty: 'Easy', time: '2 min',
    tools: ['Shift buttons (built-in)'],
    steps: ['No barrel adjuster needed — built-in micro-adjust.', 'Di2: hold BOTH shift buttons 1s = adjustment mode. Tap to nudge.', 'SRAM AXS: use AXS app or hold B-button + tap shifter.', 'Shift through all gears to verify.', 'Adjustments carry across all gears.'],
    pro_tip: 'One click is enough to fix most noise.', parts: [] },
  fix_electronic_erratic: { title: 'Fix Erratic Electronic Shifting', animation: 'adjust-derailleur', difficulty: 'Moderate', time: '15 min',
    tools: ['Phone with brand app'],
    steps: ['Usually connection or firmware issue', 'AXS: verify paired to YOUR bike', 'Re-pair: hold pairing buttons within 30s', 'Di2: reseat wire connections at junction', 'Update firmware', 'Check physical: bent hanger, loose mount, damaged wire'],
    pro_tip: 'AXS is wireless — make sure you didn\'t pair to someone else\'s bike at a group ride.',
    parts: [] },
  fix_electronic_battery: { title: 'Electronic Shifting Battery', animation: 'adjust-derailleur', difficulty: 'Easy', time: '5 min + charge',
    tools: ['Brand charger'],
    steps: ['Check battery via indicator or app', 'Di2: plug charger into junction box (~1.5hr)', 'AXS: pop battery off derailleur, USB-C charge (~1hr)', 'Won\'t hold charge: battery replacement (2-3yr lifespan)', 'AXS batteries swap between front/rear'],
    pro_tip: 'Spare AXS battery in jersey pocket = ride saver.',
    parts: [{ name: 'SRAM battery', example: 'SRAM eTap', price: '$45–55' }] },
  fix_internal_hub: { title: 'Fix Internal Hub Shifting', animation: 'adjust-derailleur', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Allen keys', 'Cable tools'],
    steps: ['Hub has cable indexing like derailleurs', 'Find alignment indicator window on hub', 'Shift to middle gear (4 of 8, or 2 of 3)', 'Lines in window should align exactly', 'Misaligned: barrel adjuster at shifter', 'Frayed cable: replace cable + housing', 'Grinding inside: shop service needed'],
    pro_tip: 'Check alignment monthly — 30 seconds.',
    parts: [{ name: 'Shift cable', example: 'Shimano Nexus cable', price: '$8–15' }] },
  fix_headset_loose: { title: 'Tighten a Loose Headset', animation: 'tighten-headset', difficulty: 'Easy', time: '5 min',
    tools: ['Allen keys (4mm, 5mm, 6mm)'],
    steps: ['Loosen stem bolts — DO NOT REMOVE', 'Tighten top cap bolt gently (~¼ turn)', 'Not gorilla-tight — just bearing preload', 'Grab front brake, rock bike. No clunk? Good.', 'Turn bars — smooth? Good.', 'Align stem, tighten stem bolts firmly', 'Re-check after tightening stems'],
    pro_tip: 'ORDER MATTERS: top cap first, then stem bolts. Reverse = damage.',
    parts: [] },
  fix_headset_tight: { title: 'Fix Tight/Notchy Headset', animation: 'tighten-headset', difficulty: 'Moderate', time: '10 min',
    tools: ['Allen keys'],
    steps: ['Loosen stem bolts', 'Loosen top cap ¼ turn', 'Lift front wheel, turn bars — should be free', 'Still notchy: bearings may be pitted (brinelling)', 'Pitted = replacement (shop for press-in)', 'Once smooth: retighten top cap, then stem bolts'],
    pro_tip: 'Notchy at straight-ahead = brinelling. Safe but annoying.',
    parts: [{ name: 'Headset bearings', example: 'Match frame standard', price: '$15–40' }] },
  fix_headset_gritty: { title: 'Service Gritty Headset', animation: 'tighten-headset', difficulty: 'Moderate', time: '30 min',
    tools: ['Allen keys', 'Grease', 'Clean rag'],
    steps: ['Remove stem and fork (mark stem position)', 'Remove bearings — note orientation', 'Clean races with rag', 'Sealed bearings: check spin, replace if gritty', 'Loose balls: clean, inspect, regrease', 'Reassemble with fresh grease', 'Set preload, tighten stem bolts'],
    pro_tip: 'After servicing, grease around dust covers to prevent future contamination.',
    parts: [{ name: 'Grease', example: 'Park Tool PolyLube', price: '$8–12' }] },
  fix_noise_rattle: { title: 'Fix Rattle Over Bumps', animation: 'tighten-headset', difficulty: 'Easy', time: '10 min',
    tools: ['Allen keys', 'Adjustable wrench'],
    steps: ['Systematic check — squeeze each part while bouncing:', 'Fenders/rack: tighten mounting bolts', 'Bottle cage: tighten, add tape if buzzing', 'QR/thru-axle: tighten', 'Headset: front brake rock test', 'Seatpost: remove, grease, retighten', 'Can\'t find it? Ride with friend behind you'],
    pro_tip: 'Rubber band around suspect contact points to isolate.',
    parts: [] },
  fix_noise_wheel: { title: 'Fix Wheel Spinning Noise', animation: 'true-wheel', difficulty: 'Easy → Mod', time: '5–15 min',
    tools: ['Allen keys', 'Spoke wrench'],
    steps: ['Lift and spin. Listen/watch:', 'Rhythmic scraping = out of true', 'Constant scraping = brake rub', 'Hub clicking = loose cone or broken pawl', 'Quick true: tighten opposite spoke ¼ turn', 'More than 3mm wobble: shop job'],
    pro_tip: 'Tiny wobble is normal. Worry only if you feel it riding or brakes rub.',
    parts: [{ name: 'Spoke wrench', example: 'Park Tool SW-2', price: '$5–8' }] },
  fix_noise_click: { title: 'Fix Pedal Click', animation: 'lube-chain', difficulty: 'Easy', time: '10 min',
    tools: ['Pedal wrench (15mm)', 'Grease'],
    steps: ['Check in order:', '1. Pedals: remove, grease threads, reinstall. (Left = reverse thread!)', '2. Crank bolts: tighten firmly', '3. Cleats (clipless): tighten, check wear', '4. Chainring bolts: tighten all evenly', 'Stand and pedal: gone? It\'s seat/seatpost. Stays? Drivetrain.'],
    pro_tip: '#1 cause = loose pedals. Always start there.',
    parts: [] },
  fix_noise_creak: { title: 'Fix Creaking Under Load', animation: 'lube-chain', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Allen keys', 'Torque wrench', 'Grease/carbon paste'],
    steps: ['Elimination process:', '1. Seatpost: remove, clean, grease, reinstall', '2. Seat rail clamp: grease contacts', '3. Bottom bracket: remove, clean threads, regrease', '4. Stem/headset: disassemble, grease, reassemble', '5. Thru-axle: clean, thin grease, retighten', 'Test after EACH step.'],
    pro_tip: 'Creak = dry metal-on-metal. Grease is your friend. 70% is seatpost.',
    parts: [{ name: 'Carbon paste', example: 'Finish Line Fiber Grip', price: '$8–12' }] },
  fix_noise_chainlube: { title: 'Clean and Lube Chain', animation: 'lube-chain', difficulty: 'Easy', time: '10 min',
    tools: ['Chain lube', 'Clean rag', 'Degreaser (optional)'],
    steps: ['Backpedal with rag around chain — remove grime', 'Deep clean: degreaser + scrub + wipe + dry', 'One drop per roller while backpedaling', 'Full revolution (50-55 links)', 'Wait 5 min to penetrate', 'Wipe ALL excess — lube inside rollers only', 'Over-lubed chain = dirt magnet, faster wear'],
    pro_tip: 'Wet lube for rain, dry for dry. Wax = cleanest but reapply every 200mi.',
    parts: [{ name: 'Chain lube', example: 'Finish Line Dry/Wet', price: '$8–12' }] },
  fix_bb_creak: { title: 'Fix Bottom Bracket Creak', animation: 'bottom-bracket', difficulty: 'Mod → Adv', time: '30–60 min',
    tools: ['BB tool (match type)', 'Torque wrench', 'Grease'],
    steps: ['Verify first: stand and pedal hard. Creaks? Likely BB.', 'Coast over bumps — creaks? NOT BB (check headset/seat).', 'Threaded BB: remove cranks, unscrew BB, clean, grease, reinstall', 'Press-fit: remove, clean frame shell, retaining compound, press in', 'Returns quickly: frame BB shell may be out of spec (shop can face/chase)'],
    pro_tip: 'Press-fit BBs notorious for creak. Loctite 609 between cups and frame usually fixes permanently.',
    parts: [{ name: 'Bottom bracket', example: 'Match crank system', price: '$20–60' }] },
  fix_pedal_loose: { title: 'Fix a Loose Pedal', animation: 'bottom-bracket', difficulty: 'Easy', time: '5 min',
    tools: ['15mm pedal wrench or 6/8mm Allen', 'Grease'],
    steps: ['Left pedal = REVERSE thread (tighten CCW)', 'Right = normal (tighten CW)', 'Remove both pedals', 'Clean threads on pedals and cranks', 'Grease threads', 'Hand-thread first to avoid cross-threading', 'Tighten firmly with pedal wrench'],
    pro_tip: 'Ridden loose = damaged crank threads. Shop can rethread, or you need new crank.',
    parts: [] },
  fix_crank_loose: { title: 'Fix Loose Crank Arm', animation: 'bottom-bracket', difficulty: 'Easy → Mod', time: '10 min',
    tools: ['Allen key (8mm) or crank tool', 'Torque wrench'],
    steps: ['Identify type:', 'Hollowtech II: tighten two pinch bolts (5mm, alternating)', 'Check preload cap — snug not tight', 'SRAM DUB: 8mm Allen to ~50 Nm', 'Square taper: 14mm socket firmly', 'Wiggle crank — any play = not tight', 'If loosens again within a ride: interface damaged, replace crank arm'],
    pro_tip: 'Crank ridden loose rounds out the interface. Tighten immediately if wobbly.',
    parts: [] },
  fix_clipless: { title: 'Fix Clipless Pedal Issues', animation: 'bottom-bracket', difficulty: 'Easy', time: '10 min',
    tools: ['3mm Allen or Phillips', 'Grease'],
    steps: ['Can\'t clip in: check cleat wear — rounded edges = replace', 'Clean mud/debris from pedal mechanism', 'Can\'t release: tension set too high', 'Find tension screw on pedal (back/bottom)', 'Turn CCW to reduce release tension', 'Start at minimum, increase gradually', 'Grease cleat contact surfaces'],
    pro_tip: 'New riders: minimum tension, practice against a wall. Skip the stoplight faceplant.',
    parts: [{ name: 'Cleats', example: 'Shimano SM-SH51 or Look Keo', price: '$15–30' }] },
  fix_true_wheel: { title: 'True a Wobbly Wheel', animation: 'true-wheel', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Spoke wrench', 'Truing stand or zip ties'],
    steps: ['No stand? Zip-tie a pen to fork as reference.', 'Spin slowly, note wobble direction', 'At wobble: tighten OPPOSITE side ¼ turn', 'Loosen SAME side ¼ turn', 'Work gradually — overtightening = new wobbles', 'Check lateral AND radial true', '>3mm wobble or broken spoke: shop'],
    pro_tip: 'Never more than ¼ turn at a time.',
    parts: [{ name: 'Spoke wrench', example: 'Park Tool SW-2', price: '$5–8' }] },
  fix_broken_spoke: { title: 'Fix a Broken Spoke', animation: 'spoke-replace', difficulty: 'Mod → Adv', time: '20–40 min',
    tools: ['Spoke wrench', 'Replacement spoke', 'Spoke ruler'],
    steps: ['Remove broken spoke (drive side rear may need cassette off)', 'Measure broken spoke for correct length', 'Thread new spoke through hub, weave through existing pattern', 'Thread nipple at rim', 'Tension to match neighbors (pluck like strings)', 'Re-true the wheel', 'Keep breaking spokes = wheel end of life or bad build'],
    pro_tip: 'Temp fix: wrap broken spoke around a neighbor. Ride home, fix later.',
    parts: [{ name: 'Spoke', example: 'DT Swiss Champion', price: '$1–3' }] },
  fix_hub_play: { title: 'Fix Hub Bearing Play', animation: 'true-wheel', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Cone wrenches (13-17mm)', 'Allen keys'],
    steps: ['Check: grab wheel top, rock side-to-side. Click = play.', 'Cup-and-cone (Shimano): two thin cone wrenches', 'Hold cone, loosen locknut', 'Tighten cone until zero play but free spin', 'Hold cone, retighten locknut', 'Cartridge bearing hubs: bearings need replacement (press)', 'Play + gritty = service/replace bearings'],
    pro_tip: 'Hub adjustment is feel. Zero play, free spin. First time is hardest.',
    parts: [{ name: 'Cone wrenches', example: 'Park Tool SCW set', price: '$8–12 each' }] },
  fix_axle: { title: 'Fix QR / Thru-Axle Issues', animation: 'true-wheel', difficulty: 'Easy', time: '5 min',
    tools: ['Allen key (for thru-axle)'],
    steps: ['QR lever should need firm effort (palm imprint)', 'Loose: open, tighten nut ½ turn, close again', 'QR keeps loosening: springs worn, replace skewer', 'Thru-axle: 12-15 Nm torque', 'Clean threads, retighten', 'Must be fully threaded and seated — partial = safety hazard'],
    pro_tip: 'After any wheel removal, bounce bike and spin wheel before riding.',
    parts: [{ name: 'QR skewer', example: 'Shimano skewer', price: '$15–25' }] },
  fix_tubeless_seat: { title: 'Seat a Stubborn Tubeless Tire', animation: 'tubeless-seat', difficulty: 'Moderate', time: '15–30 min',
    tools: ['Floor pump', 'Soapy water', 'Sealant', 'Valve core tool'],
    steps: ['Verify: proper tubeless tape, no gaps', 'Remove valve core for max airflow', 'Spray soapy water on both beads', 'Pump FAST — need volume burst, not just pressure', 'Floor pump fails: use tubeless inflator or compressor', 'Listen for "pop pop" of beads seating', 'Seated: add sealant, reinstall core, inflate to max 10min', 'Reduce to riding pressure, shake to coat'],
    pro_tip: 'Soapy water is the secret weapon. Lubricates + shows escaping air as bubbles.',
    parts: [{ name: 'Tubeless tape', example: "Stan's 25mm", price: '$8–15' }] },
  fix_bead_seat: { title: 'Fix Uneven Tire Bead', animation: 'replace-tube', difficulty: 'Easy', time: '10 min',
    tools: ['Pump', 'Soapy water'],
    steps: ['Deflate completely', 'Work bead into center channel all around', 'Check no tube pinched under bead', 'Inflate slowly, watch bead reference line', 'Line should be evenly spaced from rim', 'One section won\'t seat: soapy water + reinflate', 'Max pressure briefly to pop bead, then reduce'],
    pro_tip: 'Uneven beads = pinched tube usually. Check valve area.',
    parts: [] },
  fix_tire_blowoff: { title: 'Tire Blowing Off Rim', animation: 'tubeless-seat', difficulty: 'Mod → Adv', time: '15 min',
    tools: ['Calipers or tape measure'],
    steps: ['WARNING: dangerous. Investigate before re-inflating.', 'Check tire-rim compatibility — width in range?', 'Wire bead or folding? Wire = more secure.', 'Inspect rim: bead hook intact? Hookless = specific tire list.', 'Check rim tape: too thick prevents full seating', 'Never exceed max pressure on sidewall', 'Incompatible? Need different tire or rim.'],
    pro_tip: 'Hookless rims have strict tire lists from manufacturer. Wrong tire = safety hazard.',
    parts: [] },
};

// ════════════════════════════════════════════════════════════
// QUICK CHECKS
// ════════════════════════════════════════════════════════════
const QUICK_CHECKS = {
  pre_ride: { title: 'Pre-Ride Check (2 min)', icon: '✅', items: [
    { text: 'Tires: squeeze — firm pressure, no cuts', problem: 'flat' },
    { text: 'Brakes: squeeze each lever — firm, pads engage', problem: 'brakes' },
    { text: 'Chain: no rust, no stiff links, not dry', problem: 'chain' },
    { text: 'QR / thru-axle: both wheels secure', problem: 'wheel' },
    { text: 'Handlebars: front brake rock test — no play', problem: 'headset' },
  ]},
  after_crash: { title: 'After a Crash', icon: '💥', items: [
    { text: 'Bars aligned with front wheel?', problem: 'headset' },
    { text: 'Wheels spin true? Any wobble?', problem: 'wheel' },
    { text: 'Run through all gears — any skipping?', problem: 'shifting' },
    { text: 'Both brakes still stopping?', problem: 'brakes' },
    { text: 'Frame: check for cracks/dents near welds', problem: null },
    { text: 'Derailleur hanger vertical from behind?', problem: 'shifting' },
  ]},
  after_rain: { title: 'After Riding in Rain', icon: '🌧️', items: [
    { text: 'Chain: wipe down and re-lube', problem: 'chain' },
    { text: 'Brakes: check pads for grit', problem: 'brakes' },
    { text: 'Dry frame, especially headset and BB', problem: null },
    { text: 'Cables: shift through gears to push water out', problem: 'shifting' },
    { text: 'Seatpost: pull, wipe, regrease', problem: 'noise' },
  ]},
  long_storage: { title: 'Stored for Months', icon: '📦', items: [
    { text: 'Tires: check pressure (will be low)', problem: 'flat' },
    { text: 'Chain rusty? Clean/lube or replace', problem: 'chain' },
    { text: 'Brakes: squeeze — cables may have seized', problem: 'brakes' },
    { text: 'Shifting: all gears before riding', problem: 'shifting' },
    { text: 'Tubeless sealant: almost certainly dried', problem: 'tire_seat' },
    { text: 'Tires: check sidewalls for dry rot', problem: 'flat' },
  ]},
  before_tour: { title: 'Before a Long Ride', icon: '🗺️', items: [
    { text: 'Chain wear: check with tool — replace if worn', problem: 'chain' },
    { text: 'Brake pads: enough for the distance?', problem: 'brakes' },
    { text: 'Tire condition: cuts, bulges, thin tread?', problem: 'flat' },
    { text: 'All bolts: stem, seat, rack, accessories', problem: 'noise' },
    { text: 'Spare tube/plug kit packed?', problem: null },
    { text: 'Wheels: true, spoke tension even', problem: 'wheel' },
  ]},
};

// ════════════════════════════════════════════════════════════
// MAINTENANCE SCHEDULE TEMPLATES
// ════════════════════════════════════════════════════════════
const MAINT_SCHEDULE = {
  chain_lube: { label: 'Lube Chain', icon: '🔗', intervalDays: 7, intervalMiles: 100, fixRef: 'fix_noise_chainlube' },
  tire_pressure: { label: 'Check Tire Pressure', icon: '🛞', intervalDays: 7, intervalMiles: null, fixRef: null },
  brake_check: { label: 'Check Brake Pads', icon: '✋', intervalDays: 30, intervalMiles: 500, fixRef: 'fix_disc_pad_worn' },
  chain_wear: { label: 'Check Chain Wear', icon: '📏', intervalDays: 90, intervalMiles: 2500, fixRef: 'fix_chain_worn' },
  sealant_refresh: { label: 'Refresh Tubeless Sealant', icon: '💧', intervalDays: 90, intervalMiles: null, fixRef: 'fix_tubeless_refresh' },
  cable_check: { label: 'Inspect Cables & Housing', icon: '🔌', intervalDays: 180, intervalMiles: 3000, fixRef: 'fix_ghost_shift' },
  full_service: { label: 'Full Bike Service', icon: '🏪', intervalDays: 365, intervalMiles: 5000, fixRef: null },
};

// ════════════════════════════════════════════════════════════
// SHOP COST ESTIMATES (labor only, used for savings tracker)
// ════════════════════════════════════════════════════════════
const SHOP_COSTS = {
  fix_patch: 15, fix_replace_tube: 20, fix_snakebite: 20, fix_valve: 15, fix_rimtape: 25,
  fix_tire_debris: 20, fix_tubeless_plug: 20, fix_tubeless_burp: 15, fix_tubeless_refresh: 25,
  fix_tubeless_boot: 30, fix_reseat_basic: 10, fix_reseat_worn: 15, fix_chain_inside: 20,
  fix_chain_outside: 20, fix_stiff_link: 15, fix_chain_break: 25, fix_chain_worn: 40,
  fix_chain_new_skip: 40, fix_disc_squeal: 25, fix_disc_rub: 20, fix_disc_weak: 35,
  fix_disc_pad_worn: 30, fix_disc_lever_stuck: 30, fix_disc_bleed: 50, fix_rim_squeal: 20,
  fix_rim_weak: 20, fix_rim_rub: 15, fix_shift_up: 20, fix_shift_down: 20, fix_shift_skip: 35,
  fix_shift_click: 15, fix_ghost_shift: 35, fix_electronic_dead: 25, fix_electronic_adjust: 15,
  fix_electronic_erratic: 35, fix_electronic_battery: 20, fix_internal_hub: 35,
  fix_headset_loose: 20, fix_headset_tight: 30, fix_headset_gritty: 50, fix_noise_rattle: 25,
  fix_noise_wheel: 25, fix_noise_click: 25, fix_noise_creak: 40, fix_noise_chainlube: 20,
  fix_bb_creak: 60, fix_pedal_loose: 15, fix_crank_loose: 25, fix_clipless: 20,
  fix_true_wheel: 35, fix_broken_spoke: 40, fix_hub_play: 40, fix_axle: 15,
  fix_tubeless_seat: 30, fix_bead_seat: 20, fix_tire_blowoff: 25,
};

// ════════════════════════════════════════════════════════════
// COMMON BIKE TOOLS (canonical list for toolbox inventory)
// ════════════════════════════════════════════════════════════
const ALL_TOOLS = [
  'Tire levers', 'Patch kit', 'Pump', 'Allen keys', 'Pedal wrench (15mm)', 'Chain tool',
  'Spoke wrench', 'Chain lube', 'Clean rag', 'Degreaser', 'Grease', 'Torque wrench',
  'Cable cutters', 'Valve core tool', 'Isopropyl alcohol', 'Sandpaper', 'Cone wrenches (13-17mm)',
  'Bleed kit (brand-specific)', 'Brake fluid', 'BB tool (match type)', 'Chain checker',
  'Chain whip', 'Cassette lockring tool', 'Truing stand or zip ties', 'Tubeless plug kit',
  'Carbon paste', 'Flashlight', 'Tweezers', 'Soapy water', 'Sealant', 'Phillips or flat screwdriver',
  'Adjustable wrench', 'Pliers', 'Pad spreader', 'Calipers or tape measure',
];

const MECHANIC_THINKING = [
  'Checking torque specs...', 'Consulting the parts catalog...', 'Ruling out the obvious...',
  'Listening to the symptoms...', 'Cross-referencing failure modes...', 'Inspecting the drivetrain...',
  'Checking common causes first...', 'Measuring tolerances...',
];

const LS_KEY_GARAGE = 'bike-medic-garage';
const LS_KEY_ACTIVE_BIKE = 'bike-medic-active-bike';
const LS_KEY_HISTORY = 'bike-medic-repair-history';
const LS_KEY_FAVORITES = 'bike-medic-favorites';
const LS_KEY_SCHEDULE = 'bike-medic-schedule';
const LS_KEY_RIDES = 'bike-medic-rides';
const LS_KEY_TOOLBOX = 'bike-medic-toolbox';

const loadLS = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const saveLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const BikeMedic = ({ tool }) => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { isDark } = useTheme();

  const c = {
    // ── Standard keys ──
    card:          isDark ? 'bg-zinc-800'     : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50'  : 'bg-zinc-100',
    text:          isDark ? 'text-zinc-50'    : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-300'   : 'text-zinc-600',
    textMuted:     isDark ? 'text-zinc-500'   : 'text-zinc-400',
    border:        isDark ? 'border-zinc-700' : 'border-zinc-200',
    input:         isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400'
                          : 'bg-white border-zinc-200 text-zinc-900 placeholder-stone-400 focus:border-zinc-500',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success:       isDark ? 'bg-green-900/30 border-green-700 text-green-200'
                          : 'bg-green-50 border-green-200 text-green-800',
    warning:       isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200'
                          : 'bg-amber-50 border-amber-200 text-amber-900',
    danger:        isDark ? 'bg-red-900/30 border-red-700 text-red-300'
                          : 'bg-red-50 border-red-200 text-red-800',
    // ── Tool-specific extras (all dark-mode aware) ──
    borderHover:   isDark ? 'hover:border-zinc-500'  : 'hover:border-zinc-400',
    btnSuccess:    'bg-green-500 hover:bg-green-600 text-white',
    tag:           isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-600',
    tagAmber:      isDark ? 'bg-amber-900/40 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-800 border-amber-200',
    // Amber semantic states
    amberText:     isDark ? 'text-amber-400' : 'text-amber-600',
    amberLabel:    isDark ? 'text-amber-300' : 'text-amber-800',
    amberBadge:    isDark ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-200 text-amber-800',
    amberBanner:   isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50',
    amberLink:     isDark ? 'text-amber-400 hover:underline' : 'text-amber-700 hover:underline',
    // Active/selected bike profile
    activeBikeBorder: isDark ? 'border-amber-400 bg-amber-400/10' : 'border-amber-400 bg-amber-50',
    profileSelected:  isDark ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-amber-500 bg-amber-50 text-amber-700',
    // Green semantic states
    greenBanner:   isDark ? 'border-green-700 bg-green-900/20' : 'border-green-200 bg-green-50',
    greenText:     isDark ? 'text-green-300' : 'text-green-700',
    greenPill:     isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700',
    greenInline:   isDark ? 'text-green-400' : 'text-green-600',
    // Red semantic state
    redPill:       isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700',
    // Checkbox/step checked state (green, mode-independent)
    checkboxChecked: 'bg-green-500 border-green-500 text-white',
    // Shop visit callout (replaces banned blue c.cardAlt)
    shopVisit:     isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    // Step list
    stepDivide:    isDark ? 'divide-zinc-700' : 'divide-stone-100',
    stepActive:    isDark ? 'bg-zinc-700/50' : 'bg-amber-50/60',
    // Nav icon badges (mode-independent)
    navBadgeAmber: 'bg-amber-500 text-white',
    navBadgeZinc:  'bg-zinc-500 text-white',
    // Priority/severity functions
    priorityPill: (p) => p === 'high'
      ? (isDark ? 'bg-red-900/40 text-red-300'    : 'bg-red-100 text-red-700')
      : p === 'medium'
      ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
      : (isDark ? 'bg-zinc-700 text-zinc-300'      : 'bg-zinc-100 text-zinc-600'),
    severityBg: (sev) => sev === 'critical'
      ? (isDark ? 'bg-red-900/40 text-red-300'    : 'bg-red-100 text-red-700')
      : sev === 'moderate'
      ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700')
      : (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'),
    safe: (s) => s
      ? (isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700')
      : (isDark ? 'bg-red-900/40 text-red-300'    : 'bg-red-100 text-red-700'),
    deleteHover: isDark ? '${c.deleteHover}' : '${c.deleteHover}',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';

  // Core state
  const [_auditHistory, _setAuditHistory] = usePersistentState('bikemedic-historylog', []); // history marker
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [treePath, setTreePath] = useState([]);
  const [currentFix, setCurrentFix] = useState(null);

  // Step tracking
  const [completedSteps, setCompletedSteps] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [fixResolved, setFixResolved] = useState(null);

  // AI state
  const [customProblem, setCustomProblem] = usePersistentState('bikemedic-custom-problem', '');
  const [aiDiagnosis, setAiDiagnosis] = usePersistentState('bikemedic-last-diagnosis', null);
  const [aiError, setAiError] = useState('');
  const [showAskMechanic, setShowAskMechanic] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [photoData, setPhotoData] = useState(null);

  // Symptom interpreter
  const [symptomText, setSymptomText] = useState('');
  const [aiRoute, setAiRoute] = useState(null);
  const [showInterpreter, setShowInterpreter] = useState(false);

  // UI state
  const [animPaused, setAnimPaused] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeQuickCheck, setActiveQuickCheck] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [viewMode, setViewMode] = useState('problems');
  const [showParts, setShowParts] = useState(false);
  const [tempProfile, setTempProfile] = useState({});
  const [thinkingMsg, setThinkingMsg] = useState(0);
  const [toast, setToast] = useState(null);
  const thinkingRef = useRef(null);
  const photoRef = useRef(null);

  // ── Feature 1: Multi-Bike Garage ──
  const [garage, setGarage] = useState(() => loadLS(LS_KEY_GARAGE, []));
  const [activeBikeId, setActiveBikeId] = useState(() => loadLS(LS_KEY_ACTIVE_BIKE, null));
  const [editingBikeId, setEditingBikeId] = useState(null);

  // ── Feature 2: Ride Logger ──
  const [rides, setRides] = useState(() => loadLS(LS_KEY_RIDES, []));
  const [showRideLogger, setShowRideLogger] = useState(false);
  const [rideDistance, setRideDistance] = useState('');
  const [rideConditions, setRideConditions] = useState('dry');

  // ── Feature 3: Toolbox Inventory ──
  const [myTools, setMyTools] = useState(() => loadLS(LS_KEY_TOOLBOX, []));
  const [showToolbox, setShowToolbox] = useState(false);

  // ── Feature 6: Seasonal Wizard ──
  const [seasonalResult, setSeasonalResult] = useState(null);
  const [showSeasonalWizard, setShowSeasonalWizard] = useState(false);

  // Repair history + favorites + maintenance schedule
  const [repairHistory, setRepairHistory] = useState(() => loadLS(LS_KEY_HISTORY, []));
  const [favorites, setFavorites] = useState(() => loadLS(LS_KEY_FAVORITES, []));
  const [maintSchedule, setMaintSchedule] = useState(() => loadLS(LS_KEY_SCHEDULE, {}));
  const [showHistory, setShowHistory] = useState(false);

  const showToast = (msg) => setToast(msg);

  // Derived: active bike profile from garage
  const bikeProfile = garage.find(b => b.id === activeBikeId) || null;

  // Persist all data
  useEffect(() => { saveLS(LS_KEY_GARAGE, garage); }, [garage]);
  useEffect(() => { saveLS(LS_KEY_ACTIVE_BIKE, activeBikeId); }, [activeBikeId]);
  useEffect(() => { saveLS(LS_KEY_HISTORY, repairHistory); }, [repairHistory]);
  useEffect(() => { saveLS(LS_KEY_FAVORITES, favorites); }, [favorites]);
  useEffect(() => { saveLS(LS_KEY_SCHEDULE, maintSchedule); }, [maintSchedule]);
  useEffect(() => { saveLS(LS_KEY_RIDES, rides); }, [rides]);
  useEffect(() => { saveLS(LS_KEY_TOOLBOX, myTools); }, [myTools]);

  useEffect(() => { if (showProfileSetup) setTempProfile(editingBikeId ? (garage.find(b => b.id === editingBikeId) || {}) : {}); }, [showProfileSetup, editingBikeId, garage]);
  useEffect(() => {
    if (loading) { setThinkingMsg(0); thinkingRef.current = setInterval(() => setThinkingMsg(p => (p + 1) % MECHANIC_THINKING.length), 2000); }
    else { clearInterval(thinkingRef.current); }
    return () => clearInterval(thinkingRef.current);
  }, [loading]);

  // Derived
  const currentNodeId = treePath.length > 0 ? treePath[treePath.length - 1] : null;
  const currentNode = currentNodeId ? TREE[currentNodeId] : null;
  const fix = currentFix ? FIXES[currentFix] : null;
  const activeProblem = PROBLEMS.find(p => p.id === selectedProblem);
  const accent = activeProblem?.color || 'rgb(107,114,128)';

  // ── Feature 1: Garage CRUD ──
  const saveBike = useCallback((profile) => {
    if (editingBikeId) {
      setGarage(prev => prev.map(b => b.id === editingBikeId ? { ...b, ...profile } : b));
      showToast('Bike updated');
    } else {
      const newBike = { id: Date.now().toString(), name: profile.name || `My ${profile.bikeType || 'Bike'}`, totalMiles: 0, ...profile };
      setGarage(prev => [...prev, newBike]);
      setActiveBikeId(newBike.id);
      showToast('Bike added');
    }
    setShowProfileSetup(false); setEditingBikeId(null);
  }, [editingBikeId]);

  const removeBike = useCallback((bikeId) => {
    setGarage(prev => prev.filter(b => b.id !== bikeId));
    if (activeBikeId === bikeId) setActiveBikeId(garage.find(b => b.id !== bikeId)?.id || null);
    setMaintSchedule(prev => { const n = { ...prev }; delete n[bikeId]; return n; });
    setRides(prev => prev.filter(r => r.bikeId !== bikeId));
    showToast('Bike removed');
  }, [activeBikeId, garage]);

  // ── Feature 2: Ride Logger ──
  const logRide = useCallback(() => {
    const dist = parseFloat(rideDistance);
    if (!dist || dist <= 0 || !activeBikeId) return;
    const ride = { id: Date.now(), bikeId: activeBikeId, date: new Date().toISOString(), distance: dist, conditions: rideConditions };
    setRides(prev => [ride, ...prev].slice(0, 6));
    // Update bike total miles
    setGarage(prev => prev.map(b => b.id === activeBikeId ? { ...b, totalMiles: (b.totalMiles || 0) + dist } : b));
    setRideDistance(''); setShowRideLogger(false);
    showToast(`${dist} mi logged`);
  }, [rideDistance, rideConditions, activeBikeId]);

  const getBikeMiles = useCallback((bikeId) => {
    return garage.find(b => b.id === bikeId)?.totalMiles || 0;
  }, [garage]);

  const getMilesSinceMaint = useCallback((bikeId, taskId) => {
    const lastDone = maintSchedule[bikeId]?.[taskId];
    if (!lastDone) return null;
    const lastDoneDate = new Date(lastDone);
    return rides.filter(r => r.bikeId === bikeId && new Date(r.date) > lastDoneDate).reduce((sum, r) => sum + r.distance, 0);
  }, [maintSchedule, rides]);

  // ── Feature: Photo upload for AI ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, maxSizeKB: 500 });
      setPhotoData(dataUrl);
      showToast('Photo attached');
    } catch { showToast('Photo too large — try a smaller image'); }
  };

  // ── Feature: Toggle favorite fix ──
  const toggleFavorite = useCallback((fixId) => {
    setFavorites(prev => prev.includes(fixId) ? prev.filter(f => f !== fixId) : [...prev, fixId]);
  }, []);

  // ── Feature 5: Log repair + savings tracking ──
  const logRepair = useCallback((fixId, fixTitle) => {
    const shopCost = SHOP_COSTS[fixId] || 0;
    const entry = { id: Date.now(), fixId, title: fixTitle, date: new Date().toISOString(), bikeId: activeBikeId, shopCost, preview: (fixTitle||'').slice(0,40) };
    setRepairHistory(prev => [entry, ...prev].slice(0, 6));
    showToast(shopCost > 0 ? `Repair logged — you saved ~$${shopCost}!` : 'Repair logged');
  }, [activeBikeId]);

  const getTotalSavings = useCallback(() => {
    return repairHistory.reduce((sum, entry) => sum + (entry.shopCost || 0), 0);
  }, [repairHistory]);

  // ── Feature: Mark maintenance task done (per bike) ──
  const markMaintDone = useCallback((taskId) => {
    if (!activeBikeId) return;
    setMaintSchedule(prev => ({ ...prev, [activeBikeId]: { ...(prev[activeBikeId] || {}), [taskId]: new Date().toISOString() } }));
    showToast('Maintenance logged');
  }, [activeBikeId]);

  // ── Feature: Get maintenance alerts (time + mileage aware) ──
  const getMaintenanceAlerts = useCallback(() => {
    if (!activeBikeId) return [];
    const now = Date.now();
    const alerts = [];
    const bikeSched = maintSchedule[activeBikeId] || {};
    const tasks = bikeProfile?.tireSetup === 'tubeless'
      ? Object.keys(MAINT_SCHEDULE)
      : Object.keys(MAINT_SCHEDULE).filter(k => k !== 'sealant_refresh');

    tasks.forEach(taskId => {
      const task = MAINT_SCHEDULE[taskId];
      const lastDone = bikeSched[taskId];
      const daysSince = lastDone ? Math.floor((now - new Date(lastDone).getTime()) / 86400000) : 999;
      const milesSince = task.intervalMiles ? getMilesSinceMaint(activeBikeId, taskId) : null;
      const timeOverdue = daysSince >= task.intervalDays;
      const milesOverdue = milesSince !== null && task.intervalMiles && milesSince >= task.intervalMiles;
      if (timeOverdue || milesOverdue) {
        alerts.push({ ...task, taskId, daysSince, milesSince, overdue: daysSince >= task.intervalDays * 1.5 || (milesOverdue && milesSince >= task.intervalMiles * 1.2) });
      }
    });
    return alerts;
  }, [activeBikeId, bikeProfile, maintSchedule, getMilesSinceMaint]);

  // ── Feature 3: Toolbox readiness check ──
  const getToolReadiness = useCallback((fixTools) => {
    if (!fixTools || myTools.length === 0) return null;
    const have = fixTools.filter(t => myTools.some(mt => t.toLowerCase().includes(mt.toLowerCase()) || mt.toLowerCase().includes(t.toLowerCase())));
    const missing = fixTools.filter(t => !have.includes(t));
    return { have, missing, ready: missing.length === 0 };
  }, [myTools]);

  // ── Feature 4: Shop handoff generator ──
  const buildShopHandoff = useCallback(() => {
    const lines = ['BIKE SHOP DIAGNOSTIC SUMMARY', '═'.repeat(35)];
    if (bikeProfile) {
      lines.push(`\nBike: ${bikeProfile.name || 'Unknown'}`);
      lines.push(`Type: ${bikeProfile.bikeType || '?'} | Brakes: ${bikeProfile.brakeType?.replace('_', ' ') || '?'} | Shifting: ${bikeProfile.shiftType || '?'} | Tires: ${bikeProfile.tireSetup || '?'}`);
      if (bikeProfile.totalMiles) lines.push(`Total miles: ~${bikeProfile.totalMiles}`);
    }
    if (fix) {
      lines.push(`\nProblem Category: ${activeProblem?.label || 'Custom'}`);
      lines.push(`Fix Attempted: ${fix.title}`);
      lines.push(`Steps Completed: ${Object.keys(completedSteps).length}/${fix.steps.length}`);
      const doneStepsList = fix.steps.filter((_, i) => completedSteps[i]);
      if (doneStepsList.length > 0) { lines.push('What was done:'); doneStepsList.forEach((s, i) => lines.push(`  ${i+1}. ${s}`)); }
    }
    if (followUpText.trim()) lines.push(`\nRider's Description: "${followUpText.trim()}"`);
    if (customProblem.trim()) lines.push(`\nOriginal Symptom: "${customProblem.trim()}"`);
    lines.push(`\nDate: ${new Date().toLocaleDateString()}`);
    lines.push('\n— Generated by DeftBrain Bike Medic · deftbrain.com');
    return lines.join('\n');
  }, [bikeProfile, fix, activeProblem, completedSteps, followUpText, customProblem]);

  const buildShopHandoffHtml = useCallback(() => {
    let html = `<div style="font-family:system-ui;max-width:600px;margin:auto;padding:20px">`;
    html += `<h1 style="font-size:20px;border-bottom:2px solid #333;padding-bottom:8px">🔧 Bike Shop Diagnostic Summary</h1>`;
    if (bikeProfile) {
      html += `<h3>Bike Details</h3><table style="width:100%;border-collapse:collapse;font-size:14px">`;
      html += `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:4px 8px;border:1px solid #ddd">${bikeProfile.name || 'Unknown'}</td></tr>`;
      html += `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold">Type</td><td style="padding:4px 8px;border:1px solid #ddd">${bikeProfile.bikeType || '?'}</td></tr>`;
      html += `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold">Brakes</td><td style="padding:4px 8px;border:1px solid #ddd">${bikeProfile.brakeType?.replace('_', ' ') || '?'}</td></tr>`;
      html += `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold">Shifting</td><td style="padding:4px 8px;border:1px solid #ddd">${bikeProfile.shiftType || '?'}</td></tr>`;
      html += `<tr><td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold">Mileage</td><td style="padding:4px 8px;border:1px solid #ddd">~${bikeProfile.totalMiles || 0} mi</td></tr>`;
      html += `</table>`;
    }
    if (fix) {
      html += `<h3>What Was Tried</h3><p style="font-size:14px"><strong>${fix.title}</strong> — completed ${Object.keys(completedSteps).length}/${fix.steps.length} steps</p>`;
      const doneStepsList = fix.steps.filter((_, i) => completedSteps[i]);
      if (doneStepsList.length > 0) { html += `<ol style="font-size:13px">`; doneStepsList.forEach(s => { html += `<li>${s}</li>`; }); html += `</ol>`; }
    }
    if (followUpText.trim()) html += `<h3>Current Symptom</h3><p style="font-size:14px;background:rgb(245,245,245);padding:12px;border-radius:8px">"${followUpText.trim()}"</p>`;
    html += `<p style="font-size:12px;color:#999;margin-top:20px;border-top:1px solid #ddd;padding-top:8px">Generated ${new Date().toLocaleDateString()} by DeftBrain Bike Medic · deftbrain.com</p></div>`;
    return html;
  }, [bikeProfile, fix, completedSteps, followUpText]);

  // ── Feature 6: Seasonal maintenance wizard ──
  const runSeasonalWizard = async () => {
    if (!bikeProfile) { showToast('Add a bike first'); return; }
    setAiError(''); setSeasonalResult(null);
    try {
      const month = new Date().getMonth();
      const season = month < 2 || month > 10 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'fall';
      const data = await callToolEndpoint('bike-medic', {
        symptom: `Seasonal maintenance check`,
        mode: 'seasonal',
        bikeProfile: { ...bikeProfile, totalMiles: bikeProfile.totalMiles || 0 },
        context: { season, recentRides: rides.filter(r => r.bikeId === activeBikeId).slice(0, 6) }
      });
      setSeasonalResult(data);
    } catch (err) { setAiError(err.message || 'Seasonal check failed'); }
  };

  // Build copyable fix text
  const buildFixText = useCallback(() => {
    if (!fix) return '';
    let text = `${fix.title}\nDifficulty: ${fix.difficulty} | Time: ${fix.time}\n\nTools: ${fix.tools.join(', ')}\n\nSteps:\n`;
    fix.steps.forEach((s, i) => { text += `${i + 1}. ${s}\n`; });
    if (fix.pro_tip) text += `\nMechanic's Tip: ${fix.pro_tip}`;
    if (fix.parts?.length > 0) { text += '\n\nParts:'; fix.parts.forEach(p => { text += `\n- ${p.name} (${p.example}) ${p.price}`; }); }
    text += '\n\n— Generated by DeftBrain · deftbrain.com';
    return text;
  }, [fix]);

  // Build printable fix HTML
  const buildFixPrintHtml = useCallback(() => {
    if (!fix) return '';
    let html = `<div style="font-family:system-ui;max-width:600px;margin:auto;padding:20px">`;
    html += `<h1 style="font-size:22px;margin-bottom:4px">${fix.title}</h1>`;
    html += `<p style="color:#666;font-size:14px">${fix.difficulty} · ${fix.time}</p>`;
    html += `<h3 style="margin-top:16px">Tools</h3><p>${fix.tools.join(', ')}</p>`;
    html += `<h3>Steps</h3><ol>`;
    fix.steps.forEach(s => { html += `<li style="margin-bottom:8px">${s}</li>`; });
    html += `</ol>`;
    if (fix.pro_tip) html += `<div style="background:rgb(254,243,199);padding:12px;border-radius:8px;margin:16px 0"><strong>🔧 Mechanic's Tip:</strong> ${fix.pro_tip}</div>`;
    if (fix.parts?.length > 0) { html += `<h3>Parts</h3><ul>`; fix.parts.forEach(p => { html += `<li><strong>${p.name}</strong> — ${p.example} (${p.price})</li>`; }); html += `</ul>`; }
    html += `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:12px;color:#999;text-align:center">Generated by DeftBrain · deftbrain.com</div></div>`;
    return html;
  }, [fix]);

  // Profile-aware routing
  const getProfileRoute = useCallback((pid) => {
    if (!bikeProfile) return `${pid}_start`;
    if (pid === 'brakes') {
      if (bikeProfile.brakeType?.startsWith('disc')) return 'brakes_disc';
      if (bikeProfile.brakeType?.startsWith('rim')) return 'brakes_rim';
    }
    if (pid === 'shifting') {
      if (bikeProfile.shiftType === 'electronic') return 'shifting_electronic';
      if (bikeProfile.shiftType === 'internal') return 'fix_internal_hub';
      if (bikeProfile.shiftType === 'cable') return 'shifting_cable';
    }
    if (pid === 'flat') {
      if (bikeProfile.tireSetup === 'tubeless') return 'flat_tubeless';
      if (bikeProfile.tireSetup === 'tubes') return 'flat_tube';
    }
    return `${pid}_start`;
  }, [bikeProfile]);

  // Navigation
  const startProblem = useCallback((pid) => {
    if (pid === 'custom') { setSelectedProblem('custom'); setShowAskMechanic(true); setTreePath([]); setCurrentFix(null); return; }
    const route = getProfileRoute(pid);
    setSelectedProblem(pid); setShowAskMechanic(false); setAiDiagnosis(null);
    setCompletedSteps({}); setActiveStep(0); setFixResolved(null); setShowFollowUp(false); setShowParts(false);
    if (route.startsWith('fix_')) { setTreePath([`${pid}_start`]); setCurrentFix(route); }
    else { setTreePath([route]); setCurrentFix(null); }
  }, [getProfileRoute]);

  // Start a fix directly (from favorites / history / maintenance)
  const startFixDirect = useCallback((fixId) => {
    const fixData = FIXES[fixId];
    if (!fixData) return;
    setSelectedProblem('custom'); setTreePath(['direct']);
    setCurrentFix(fixId); setCompletedSteps({}); setActiveStep(0);
    setFixResolved(null); setShowFollowUp(false); setShowParts(false);
    setShowAskMechanic(false); setAiDiagnosis(null); setShowHistory(false);
  }, []);

  const selectOption = useCallback((opt) => {
    if (opt.fix) { setCurrentFix(opt.fix); setCompletedSteps({}); setActiveStep(0); setFixResolved(null); setShowFollowUp(false); setShowParts(false); }
    else if (opt.next) { setTreePath(prev => [...prev, opt.next]); }
  }, []);

  const goBack = useCallback(() => {
    if (showProfileSetup) { setShowProfileSetup(false); setEditingBikeId(null); return; }
    if (showHistory) { setShowHistory(false); return; }
    if (showToolbox) { setShowToolbox(false); return; }
    if (showSeasonalWizard) { setShowSeasonalWizard(false); setSeasonalResult(null); return; }
    if (activeQuickCheck) { setActiveQuickCheck(null); setCheckedItems({}); return; }
    if (showFollowUp) { setShowFollowUp(false); return; }
    if (currentFix) { setCurrentFix(null); setCompletedSteps({}); setFixResolved(null); }
    else if (treePath.length > 1) { setTreePath(prev => prev.slice(0, -1)); }
    else { setSelectedProblem(null); setTreePath([]); setCurrentFix(null); setAiDiagnosis(null); setShowAskMechanic(false); }
  }, [currentFix, treePath, showFollowUp, showProfileSetup, activeQuickCheck, showHistory, showToolbox, showSeasonalWizard]);

  const reset = useCallback(() => {
    setSelectedProblem(null); setTreePath([]); setCurrentFix(null); setAiDiagnosis(null);
    setAiError(''); setCustomProblem(''); setShowAskMechanic(false); setCompletedSteps({});
    setActiveStep(0); setFixResolved(null); setShowFollowUp(false); setFollowUpText('');
    setAiRoute(null); setShowInterpreter(false); setSymptomText(''); setActiveQuickCheck(null);
    setCheckedItems({}); setViewMode('problems'); setShowParts(false); setAnimPaused(false);
    setShowHistory(false); setPhotoData(null); setShowToolbox(false); setShowSeasonalWizard(false);
    setSeasonalResult(null); setShowRideLogger(false); setEditingBikeId(null);
  }, []);

  const toggleStep = useCallback((idx) => {
    setCompletedSteps(prev => { const n = { ...prev }; if (n[idx]) delete n[idx]; else n[idx] = true; return n; });
    setActiveStep(idx + 1);
  }, []);

  // AI calls
  const askMechanic = async () => {
    if (!customProblem.trim()) { setAiError('Describe the problem first'); return; }
    setAiError(''); setAiDiagnosis(null);
    try {
      const payload = {
        symptom: customProblem.trim(),
        bikeProfile: bikeProfile || undefined,
        context: bikeProfile ? { bike_profile: bikeProfile } : undefined,
      };
      if (photoData) payload.photo = photoData;
      const data = await callToolEndpoint('bike-medic', payload);
      setAiDiagnosis(data);
    } catch (err) { setAiError(err.message || 'Failed. Try the static tree instead.'); }
  };

  const askFollowUp = async () => {
    if (!followUpText.trim()) return;
    setAiError(''); setAiDiagnosis(null); setShowAskMechanic(true);
    try {
      const data = await callToolEndpoint('bike-medic', {
        symptom: followUpText.trim(),
        context: { fix_attempted: fix?.title, steps_completed: fix?.steps?.filter((_, i) => completedSteps[i]), still_broken: followUpText.trim(), bike_profile: bikeProfile || undefined },
      });
      setAiDiagnosis(data); setCustomProblem(followUpText.trim());
    } catch (err) { setAiError(err.message || 'Failed to get follow-up.'); }
  };

  const routeSymptom = async () => {
    if (!symptomText.trim()) return;
    setAiError(''); setAiRoute(null);
    try {
      const data = await callToolEndpoint('bike-medic', { symptom: symptomText.trim(), mode: 'route' });
      setAiRoute(data);
    } catch { setAiError('Couldn\'t analyze. Browse categories manually.'); }
  };

  // Progress
  const totalSteps = fix?.steps?.length || 0;
  const doneSteps = Object.keys(completedSteps).length;
  const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const maintAlerts = getMaintenanceAlerts();

  // ══════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════
  const renderNavBar = (showBack = true) => (
    <div className="flex items-center justify-between mb-6">
      {showBack ? (
        <button onClick={goBack} className={`flex items-center gap-2 ${c.btnSecondary} text-sm font-semibold transition-colors`}>
          <span>←</span> Back
        </button>
      ) : <div />}
      <button onClick={reset} className={`flex items-center gap-2 ${c.textMuteded} text-sm font-semibold transition-colors hover:opacity-80`}>
        <span>🔄</span> Start Over
      </button>
    </div>
  );

  const renderBikeProfileBar = () => {
    if (!bikeProfile) return null;
    const labels = [bikeProfile.bikeType, bikeProfile.brakeType?.replace('_', ' '), bikeProfile.shiftType, bikeProfile.tireSetup].filter(Boolean);
    return (
      <div className={`flex items-center gap-2 mb-4 p-2 rounded-lg ${c.cardAlt} text-xs ${c.textSecondaryondary} overflow-x-auto`}>
        <span className="font-semibold flex-shrink-0">🚲 {bikeProfile.name || 'My Bike'}:</span>
        {labels.map((l, i) => <span key={i} className={`${c.tag} px-2 py-0.5 rounded-md capitalize whitespace-nowrap`}>{l}</span>)}
        {bikeProfile.totalMiles > 0 && <span className={`${c.tag} px-2 py-0.5 rounded-md whitespace-nowrap`}>{Math.round(bikeProfile.totalMiles)} mi</span>}
        {garage.length > 1 && (
          <select value={activeBikeId || ''} onChange={e => setActiveBikeId(e.target.value)}
            className={`ml-auto px-2 py-0.5 rounded-md text-xs font-semibold ${c.input} border`}>
            {garage.map(b => <option key={b.id} value={b.id}>{b.name || b.bikeType}</option>)}
          </select>
        )}
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <span className="text-4xl animate-spin inline-block" style={{ animationDuration: '3s' }}>{tool?.icon ?? '🚲'}</span>
      <p className={`text-sm font-semibold ${c.textSecondaryondary} animate-pulse`}>{MECHANIC_THINKING[thinkingMsg]}</p>
    </div>
  );

  const renderAIDiagnosis = (data) => (
    <div className="space-y-4 mt-6">
      <div className={`${c.card} rounded-xl border-2 ${c.border} p-6`}>
        <h3 className={`text-xl font-bold ${c.text} mb-1`}>{data.diagnosis}</h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${c.severityBg(data.severity)}`}>{data.severity}</span>
          {data.ride_safe !== undefined && <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${c.safe(data.ride_safe)}`}>{data.ride_safe ? '✓ Rideable' : '✗ Don\'t ride'}</span>}
          {data.difficulty && <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.tag}`}>{data.difficulty}</span>}
          {data.time_estimate && <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.tag}`}>{data.time_estimate}</span>}
        </div>
        <p className={`${c.textSecondaryondary} text-sm mb-4`}>{data.explanation}</p>
        {data.likely_causes && (<div className="mb-4"><h4 className={`font-bold ${c.text} text-sm mb-2`}>Likely causes:</h4><ol className="space-y-2">
          {data.likely_causes.map((cause, i) => <li key={i} className="flex gap-3 text-sm"><span className={`flex-shrink-0 w-6 h-6 rounded-full ${c.tag} flex items-center justify-center text-xs font-bold`}>{i+1}</span><span className={c.textSecondaryondary}>{cause}</span></li>)}
        </ol></div>)}
        {data.fix_steps && (<div className="mb-4"><h4 className={`font-bold ${c.text} text-sm mb-2`}>How to fix:</h4><ol className="space-y-2">
          {data.fix_steps.map((step, i) => <li key={i} className="flex gap-3 text-sm"><span className={`flex-shrink-0 w-6 h-6 rounded-full ${c.tagAmber} border flex items-center justify-center text-xs font-bold`}>{i+1}</span><span className={c.textSecondaryondary}>{step}</span></li>)}
        </ol></div>)}
        {data.tools_needed?.length > 0 && (<div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-bold ${c.textMuteded} uppercase mr-1 self-center`}>Tools:</span>
          {data.tools_needed.map((t, i) => <span key={i} className={`text-xs ${c.tag} px-2 py-1 rounded-lg font-medium`}>{t}</span>)}
        </div>)}
        {data.pro_tip && (<div className={`${c.warning} border-2 rounded-xl p-4 mb-4`}><p className="text-sm"><span className="font-black text-xs uppercase block mb-1">🔧 Pro Tip</span>{data.pro_tip}</p></div>)}
        {data.next_steps?.length > 0 && (<div className="mb-4"><h4 className={`font-bold ${c.text} text-sm mb-2`}>Next steps:</h4><ol className="space-y-1">
          {data.next_steps.map((ns, i) => <li key={i} className={`text-sm ${c.textSecondaryondary} flex gap-2`}><span style={{ color: accent }}>→</span><span>{ns}</span></li>)}
        </ol></div>)}
        {data.prevention && (<div className={`text-xs ${c.textMuteded} mt-3 p-3 rounded-lg ${c.cardAlt}`}><strong>Prevention:</strong> {data.prevention}</div>)}
        {data.shop_visit && (<div className={`mt-4 ${c.shopVisit} border border-l-4 rounded-r-xl p-4`}><p className="text-sm"><strong>When to go to a shop:</strong> {data.shop_visit}</p></div>)}
        {/* Action buttons */}
        <div className="mt-4">
          <ActionBar
            content={`${data.diagnosis}\n\n${data.explanation}\n\nSteps:\n${(data.fix_steps||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n${data.pro_tip ? `Pro Tip: ${data.pro_tip}` : ''}\n\n— Generated by DeftBrain · deftbrain.com`}
            printContent={`<div style="font-family:system-ui;max-width:600px;margin:auto;padding:20px"><h1>🔧 ${data.diagnosis}</h1><p>${data.explanation}</p><ol>${(data.fix_steps||[]).map(s=>`<li style="margin-bottom:8px">${s}</li>`).join('')}</ol>${data.pro_tip?`<p><strong>Pro Tip:</strong> ${data.pro_tip}</p>`:''}<p style="font-size:12px;color:#999;margin-top:20px;border-top:1px solid #ddd;padding-top:8px">Generated by DeftBrain Bike Medic · deftbrain.com</p></div>`}
            title="Bike Mechanic Diagnosis"
          />
        </div>
        {/* Cross-refs */}
        <div className={`mt-4 pt-3 border-t ${c.border} text-xs ${c.textMuteded}`}>
          {data.shop_visit && <>Need help deciding DIY vs shop? Try <a href="/DecisionCoach" target="_blank" rel="noopener noreferrer" className={linkStyle}>Decision Coach</a>. </>}
          {data.parts_cost && <>Checking part value? <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={linkStyle}>BuyWise</a> can help.</>}
        </div>
        <p className={`mt-3 text-xs ${c.textMuteded} border-t ${c.border} pt-2`}>⚠️ AI-generated diagnosis — always verify safety-critical repairs with a qualified mechanic before riding.</p>
      </div>
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuted}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'plant-rescue',label:'🌱 Plant Rescue'},{slug:'crash-predictor',label:'💥 Crash Predictor'},{slug:'procedure-probe',label:'🏥 Procedure Probe'}].map(({slug,label})=>(
              <a key={slug} href={`${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );

  // ══════════════════════════════════════════
  // SCREEN: GARAGE (Multi-Bike Manager)
  // ══════════════════════════════════════════
  if (showProfileSetup) {
    const opts = {
      bikeType: [{ v: 'road', l: 'Road' }, { v: 'mountain', l: 'Mountain' }, { v: 'gravel', l: 'Gravel' }, { v: 'commuter', l: 'Commuter' }, { v: 'ebike', l: 'E-Bike' }],
      brakeType: [{ v: 'disc_hydro', l: 'Disc (Hydraulic)' }, { v: 'disc_mech', l: 'Disc (Cable)' }, { v: 'rim_caliper', l: 'Rim (Caliper)' }, { v: 'rim_vbrake', l: 'V-Brake' }],
      shiftType: [{ v: 'cable', l: 'Cable Derailleur' }, { v: 'electronic', l: 'Electronic (Di2/AXS)' }, { v: 'internal', l: 'Internal Hub' }, { v: 'single', l: 'Single Speed' }],
      tireSetup: [{ v: 'tubes', l: 'Inner Tubes' }, { v: 'tubeless', l: 'Tubeless' }],
    };
    const labels = { bikeType: 'Bike Type', brakeType: 'Brakes', shiftType: 'Shifting', tireSetup: 'Tires' };
    const isEditing = !!editingBikeId || garage.length === 0;
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        <h3 className={`text-lg font-bold ${c.text} mb-5`}>🏠 My Garage</h3>

        {/* Existing bikes list */}
        {garage.length > 0 && !editingBikeId && (
          <div className="space-y-3 mb-6">
            {garage.map(bike => (
              <div key={bike.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 ${bike.id === activeBikeId ? c.activeBikeBorder : c.border} ${c.card}`}>
                <span className="text-2xl">🚲</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${c.text}`}>{bike.name || bike.bikeType}</div>
                  <div className={`text-xs ${c.textMuteded} flex flex-wrap gap-1 mt-0.5`}>
                    {[bike.bikeType, bike.brakeType?.replace('_', ' '), bike.shiftType].filter(Boolean).map((l, i) => (
                      <span key={i} className="capitalize">{l}{i < 2 ? ' ·' : ''}</span>
                    ))}
                    {bike.totalMiles > 0 && <span> · {Math.round(bike.totalMiles)} mi</span>}
                  </div>
                </div>
                {bike.id !== activeBikeId && (
                  <button onClick={() => setActiveBikeId(bike.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.tag} ${c.cardAltHover}`}>Set Active</button>
                )}
                {bike.id === activeBikeId && <span className={`text-xs font-bold ${c.amberText}`}>ACTIVE</span>}
                <button onClick={() => { setEditingBikeId(bike.id); setTempProfile(bike); }} className={`text-xs ${c.textMuteded} hover:underline`}>Edit</button>
                <button onClick={() => { if (window.confirm(`Remove ${bike.name || 'this bike'}?`)) removeBike(bike.id); }} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>🗑️</button>
              </div>
            ))}
            <button onClick={() => { setEditingBikeId(null); setTempProfile({}); }}
              className={`w-full p-3 rounded-xl border-2 border-dashed ${c.border} ${c.textSecondaryondary} text-sm font-semibold ${c.cardAltHover} transition-colors`}>
              ➕ Add Another Bike
            </button>
          </div>
        )}

        {/* Bike editor form */}
        {(isEditing || editingBikeId) && (
          <div className={`${c.card} rounded-xl border-2 ${c.border} p-6`}>
            <h4 className={`text-sm font-bold ${c.text} mb-4`}>{editingBikeId ? 'Edit Bike' : 'Add New Bike'}</h4>
            <div className="mb-5">
              <label className={`text-xs font-bold ${c.textSecondaryondary} uppercase tracking-wide mb-2 block`}>Bike Name</label>
              <input value={tempProfile.name || ''} onChange={e => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Trek Domane, Daily Commuter..."
                className={`w-full px-3 py-2 border-2 rounded-lg text-sm outline-none ${c.input}`} />
            </div>
            {Object.entries(opts).map(([key, options]) => (
              <div key={key} className="mb-5">
                <label className={`text-xs font-bold ${c.textSecondaryondary} uppercase tracking-wide mb-2 block`}>{labels[key]}</label>
                <div className="flex flex-wrap gap-2">
                  {options.map(o => (
                    <button key={o.v} onClick={() => setTempProfile(prev => ({ ...prev, [key]: prev[key] === o.v ? undefined : o.v }))}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${tempProfile[key] === o.v ? c.profileSelected : `${c.border} ${c.textSecondaryondary} ${c.cardAltHover}`}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={() => saveBike(tempProfile)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${c.btnPrimary}`}>{editingBikeId ? 'Update Bike' : 'Add Bike'}</button>
              <button onClick={() => { setShowProfileSetup(garage.length > 0 ? true : false); setEditingBikeId(null); if (garage.length === 0) setShowProfileSetup(false); }}
                className={`px-6 py-3 rounded-xl font-bold text-sm ${c.btnSecondary} border-2 ${c.border}`}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: TOOLBOX INVENTORY
  // ══════════════════════════════════════════
  if (showToolbox) {
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        <h3 className={`text-lg font-bold ${c.text} mb-2`}>🧰 My Toolbox</h3>
        <p className={`text-sm ${c.textMuteded} mb-5`}>Mark the tools you own. We'll tell you if you're ready for each fix.</p>
        <div className="space-y-2 mb-6">
          {ALL_TOOLS.map(tool => {
            const owned = myTools.includes(tool);
            return (
              <button key={tool} onClick={() => setMyTools(prev => owned ? prev.filter(t => t !== tool) : [...prev, tool])}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all ${owned ? c.greenBanner : `${c.border} ${c.card}`}`}>
                <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${owned ? c.checkboxChecked : c.border}`}>
                  {owned && <span className="text-xs">✓</span>}
                </span>
                <span className={owned ? c.text : c.textSecondaryondary}>{tool}</span>
              </button>
            );
          })}
        </div>
        <div className={`text-center text-xs ${c.textMuteded}`}>{myTools.length} of {ALL_TOOLS.length} tools owned</div>
        {myTools.length > 0 && (
          <button onClick={() => { setMyTools([]); showToast('Toolbox cleared'); }} className={`mt-3 text-xs ${c.textMuteded} ${c.deleteHover} block mx-auto`}>Clear all</button>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: SEASONAL MAINTENANCE WIZARD
  // ══════════════════════════════════════════
  if (showSeasonalWizard) {
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        {renderBikeProfileBar()}
        <div className={`${c.card} rounded-xl border-2 ${c.border} p-6 mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🌦️</span>
            <h3 className={`text-lg font-bold ${c.text}`}>Seasonal Maintenance Wizard</h3>
          </div>
          <p className={`${c.textSecondaryondary} text-sm mb-4`}>AI-powered checklist based on your bike, season, and riding conditions.</p>
          {!bikeProfile && <p className={`text-sm ${c.textMuteded} p-4 text-center`}>Add a bike in your garage first to get personalized advice.</p>}
          {bikeProfile && !seasonalResult && !loading && (
            <button onClick={runSeasonalWizard} className={`w-full py-3 rounded-xl font-bold text-sm ${c.btnPrimary}`}>🌦️ Generate Seasonal Checklist</button>
          )}
          {loading && renderLoadingState()}
          {aiError && !loading && <div className={`p-4 ${c.danger} border rounded-xl text-sm`}>{aiError}</div>}
        </div>
        {seasonalResult && !loading && (
          <div className={`${c.card} rounded-xl border-2 ${c.border} p-6`}>
            <h4 className={`text-sm font-bold ${c.text} mb-1`}>{seasonalResult.title || 'Seasonal Checklist'}</h4>
            <p className={`text-xs ${c.textMuteded} mb-4`}>{seasonalResult.summary}</p>
            {seasonalResult.tasks?.map((task, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 mb-2 rounded-xl border ${c.border}`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.priorityPill(task.priority)}`}>{task.priority}</span>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${c.text}`}>{task.task}</div>
                  <div className={`text-xs ${c.textMuteded} mt-0.5`}>{task.reason}</div>
                  {task.fix_ref && FIXES[task.fix_ref] && (
                    <button onClick={() => { setShowSeasonalWizard(false); startFixDirect(task.fix_ref); }} className={`text-xs ${c.amberLink} mt-1`}>View guide →</button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <CopyBtn content={`Seasonal Bike Maintenance\n${seasonalResult.summary}\n\n${(seasonalResult.tasks || []).map((t,i) => `${i+1}. [${t.priority}] ${t.task} — ${t.reason}`).join('\n')}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy Checklist" />
              <ActionBar printContent={`<div style="font-family:system-ui;max-width:600px;margin:auto;padding:20px"><h1>🌦️ Seasonal Bike Maintenance</h1><p>${seasonalResult.summary}</p><ol>${(seasonalResult.tasks || []).map(t => `<li style="margin-bottom:12px"><strong>[${t.priority}]</strong> ${t.task}<br><em style="color:#666">${t.reason}</em></li>`).join('')}</ol><div style="margin-top:20px;border-top:1px solid #ddd;padding-top:8px;font-size:12px;color:#999;text-align:center">Generated by DeftBrain · deftbrain.com</div></div>`} printTitle="Seasonal Maintenance" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: REPAIR HISTORY + FAVORITES + MAINTENANCE
  // ══════════════════════════════════════════
  if (showHistory) {
    const totalSaved = getTotalSavings();
    const bikeRides = activeBikeId ? rides.filter(r => r.bikeId === activeBikeId) : [];
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        <h3 className={`text-lg font-bold ${c.text} mb-5`}>🔧 My Bike Hub</h3>

        {/* DIY Savings Tracker */}
        {repairHistory.length > 0 && (
          <div className={`mb-6 p-5 rounded-xl border-2 ${c.greenBanner} text-center`}>
            <span className="text-3xl block mb-1">💰</span>
            <div className={`text-2xl font-black ${c.greenText}`}>${totalSaved}</div>
            <div className={`text-xs ${c.textMuteded} mt-1`}>saved by DIY across {repairHistory.length} repair{repairHistory.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Ride Logger inline */}
        {activeBikeId && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${c.border} ${c.card}`}>
            <div className="flex items-center gap-2 mb-3">
              <span>🚴</span>
              <span className={`text-sm font-bold ${c.text}`}>Log a Ride</span>
              <span className={`text-xs ${c.textMuteded} ml-auto`}>{bikeRides.length} rides · {Math.round(getBikeMiles(activeBikeId))} mi total</span>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input type="number" value={rideDistance} onChange={e => setRideDistance(e.target.value)} placeholder="Distance (mi)"
                  className={`w-full px-3 py-2 border-2 rounded-lg text-sm outline-none ${c.input}`} />
              </div>
              <select value={rideConditions} onChange={e => setRideConditions(e.target.value)}
                className={`px-3 py-2 border-2 rounded-lg text-sm ${c.input}`}>
                <option value="dry">☀️ Dry</option>
                <option value="wet">🌧️ Wet</option>
                <option value="muddy">🟫 Muddy</option>
                <option value="snow">❄️ Snow</option>
              </select>
              <button onClick={logRide} disabled={!rideDistance || parseFloat(rideDistance) <= 0}
                className={`px-4 py-2 rounded-lg font-bold text-sm ${!rideDistance || parseFloat(rideDistance) <= 0 ? `${c.btnSecondary} opacity-50` : c.btnPrimary}`}>Log</button>
            </div>
            {bikeRides.length > 0 && (
              <div className={`mt-3 max-h-24 overflow-y-auto text-xs ${c.textMuteded} space-y-1`}>
                {bikeRides.slice(0, 5).map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                    <span>{r.distance} mi · {r.conditions}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <h4 className={`text-sm font-bold ${c.textSecondaryondary} uppercase tracking-wide mb-3`}>⭐ Saved Fixes</h4>
            <div className="space-y-2">
              {favorites.map(fId => {
                const f = FIXES[fId];
                if (!f) return null;
                return (
                  <div key={fId} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${c.border} ${c.card}`}>
                    <button onClick={() => startFixDirect(fId)} className={`flex-1 text-left text-sm font-semibold ${c.text} hover:underline`}>{f.title}</button>
                    <span className={`text-xs ${c.tag} px-2 py-0.5 rounded`}>{f.difficulty}</span>
                    <button onClick={() => toggleFavorite(fId)} className={c.amberText}>⭐</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Maintenance Schedule (mileage-aware) */}
        <div className="mb-6">
          <h4 className={`text-sm font-bold ${c.textSecondaryondary} uppercase tracking-wide mb-3`}>🗓️ Maintenance Schedule</h4>
          {!activeBikeId ? (
            <p className={`text-sm ${c.textMuteded} p-4 text-center`}>Add a bike to track maintenance.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(MAINT_SCHEDULE).filter(([id]) => {
                if (id === 'sealant_refresh' && bikeProfile?.tireSetup !== 'tubeless') return false;
                return true;
              }).map(([taskId, task]) => {
                const bikeSched = maintSchedule[activeBikeId] || {};
                const lastDone = bikeSched[taskId];
                const daysSince = lastDone ? Math.floor((Date.now() - new Date(lastDone).getTime()) / 86400000) : null;
                const milesSince = task.intervalMiles ? getMilesSinceMaint(activeBikeId, taskId) : null;
                const timeOverdue = daysSince === null || daysSince >= task.intervalDays;
                const milesOverdue = milesSince !== null && task.intervalMiles && milesSince >= task.intervalMiles;
                const overdue = timeOverdue || milesOverdue;
                return (
                  <div key={taskId} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${overdue ? c.amberBanner : c.border} ${c.card}`}>
                    <span className="text-lg">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${c.text}`}>{task.label}</div>
                      <div className={`text-xs ${c.textMuteded}`}>
                        {lastDone ? `${daysSince}d ago` : 'Never done'}
                        {milesSince !== null && <> · {Math.round(milesSince)} mi</>}
                        {' · every '}{task.intervalDays}d{task.intervalMiles ? ` / ${task.intervalMiles} mi` : ''}
                      </div>
                    </div>
                    {overdue && <span className={`text-xs font-bold ${c.amberText}`}>DUE</span>}
                    <button onClick={() => markMaintDone(taskId)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${c.btnPrimary}`}>✅ Done</button>
                    {task.fixRef && <button onClick={() => startFixDirect(task.fixRef)} className={`text-xs ${c.textMuteded} hover:underline`}>Guide →</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Repair History */}
        <div>
          <h4 className={`text-sm font-bold ${c.textSecondaryondary} uppercase tracking-wide mb-3`}>📋 Repair History</h4>
          {repairHistory.length === 0 ? (
            <p className={`text-sm ${c.textMuteded} p-4 text-center`}>No repairs logged yet. Complete a fix and tap "Log Repair" to start tracking.</p>
          ) : (
            <div className="space-y-2">
              {repairHistory.slice(0, 6).map(entry => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl border ${c.border} ${c.card}`}>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => startFixDirect(entry.fixId)} className={`text-sm font-semibold ${c.text} hover:underline truncate block`}>{entry.title}</button>
                    <div className={`text-xs ${c.textMuteded}`}>
                      {new Date(entry.date).toLocaleDateString()}
                      {entry.shopCost > 0 && <span className={c.greenInline}> · saved ~${entry.shopCost}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {repairHistory.length > 20 && <p className={`text-xs ${c.textMuteded} text-center`}>Showing 20 of {repairHistory.length}</p>}
            </div>
          )}
          {repairHistory.length > 0 && (
            <button onClick={() => { setRepairHistory([]); showToast('History cleared'); }} className={`mt-3 text-xs ${c.textMuteded} ${c.deleteHover}`}>Clear history</button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: QUICK CHECK
  // ══════════════════════════════════════════
  if (activeQuickCheck) {
    const check = QUICK_CHECKS[activeQuickCheck];
    const numChecked = Object.keys(checkedItems).filter(k => checkedItems[k]).length;
    return (
      <div className={c.text}>
        {renderNavBar()}
        {renderBikeProfileBar()}
        <div className={`${c.card} rounded-xl border-2 ${c.border} p-6`}>
          <h3 className={`text-lg font-bold ${c.text} mb-1`}>{check.icon} {check.title}</h3>
          <p className={`text-sm ${c.textSecondaryondary} mb-5`}>Tap to check off. Hit the ⚠️ to troubleshoot any issue.</p>
          <div className="space-y-3">
            {check.items.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${checkedItems[i] ? c.greenBanner : c.border}`}>
                <button onClick={() => setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }))}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${checkedItems[i] ? c.checkboxChecked : c.border}`}>
                  {checkedItems[i] && <span className="text-xs">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${checkedItems[i] ? c.textMuteded + ' line-through' : c.text}`}>{item.text}</span>
                {item.problem && (
                  <button onClick={() => { setActiveQuickCheck(null); setCheckedItems({}); startProblem(item.problem); }}
                    className={`flex-shrink-0 p-1.5 rounded-lg ${c.cardAltHover} transition-colors`} title="Troubleshoot">
                    <span className="text-amber-500">⚠️</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={`mt-4 text-center text-xs ${c.textMuteded}`}>{numChecked} / {check.items.length} checked</div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: HOME (PROBLEM SELECTOR)
  // ══════════════════════════════════════════
  if (!selectedProblem) {
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Tool Header */}
        <div className={`mb-6 pb-4 border-b ${c.border}`}>
          <h2 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
            <span>{tool?.icon ?? '🚲'}</span> Bike Medic
          </h2>
          <p className={`text-sm ${c.textSecondaryondary}`}>Your trailside mechanic in your pocket</p>
        </div>

        {/* Cross-refs pre-result */}
        <div className={`mb-4 text-xs ${c.textMuteded}`}>
          Need parts for a fix? <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={linkStyle}>BuyWise</a> checks if it's worth the money.
        </div>

        {renderBikeProfileBar()}

        {/* Maintenance alerts */}
        {maintAlerts.length > 0 && (
          <div className={`mb-5 p-4 rounded-xl border-2 ${c.amberBanner}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>🗓️</span>
              <span className={`text-sm font-bold ${c.amberLabel}`}>Maintenance Due</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.amberBadge}`}>{maintAlerts.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {maintAlerts.slice(0, 3).map(a => (
                <button key={a.taskId} onClick={() => { if (a.fixRef) startFixDirect(a.fixRef); else markMaintDone(a.taskId); }}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg ${a.overdue ? c.redPill : c.tag} hover:opacity-80`}>
                  {a.icon} {a.label}
                </button>
              ))}
              {maintAlerts.length > 3 && <button onClick={() => setShowHistory(true)} className={`text-xs ${c.textMuteded} hover:underline`}>+{maintAlerts.length - 3} more</button>}
            </div>
          </div>
        )}

        {/* Mode tabs + feature buttons */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={() => setViewMode('problems')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'problems' ? c.btnPrimary : `${c.border} border ${c.textSecondaryondary} ${c.cardAltHover}`}`}>
            🔧 Diagnose
          </button>
          <button onClick={() => setViewMode('quickcheck')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'quickcheck' ? c.btnPrimary : `${c.border} border ${c.textSecondaryondary} ${c.cardAltHover}`}`}>
            ✅ Quick Checks
          </button>
          <div className="flex-1" />
          <button onClick={() => setShowSeasonalWizard(true)} className={`p-2 rounded-lg ${c.cardAltHover} ${c.textSecondaryondary} transition-colors`} title="Seasonal maintenance">
            <span>🌦️</span>
          </button>
          <button onClick={() => setShowToolbox(true)} className={`p-2 rounded-lg ${c.cardAltHover} ${c.textSecondaryondary} transition-colors relative`} title="My toolbox">
            <span>🧰</span>
            {myTools.length > 0 && <span className={`absolute -top-1 -right-1 w-4 h-4 ${c.navBadgeZinc} text-[10px] font-bold rounded-full flex items-center justify-center`}>{myTools.length}</span>}
          </button>
          <button onClick={() => setShowHistory(true)} className={`p-2 rounded-lg ${c.cardAltHover} ${c.textSecondaryondary} transition-colors relative`} title="Hub: history, rides, maintenance">
            <span>📋</span>
            {maintAlerts.length > 0 && <span className={`absolute -top-1 -right-1 w-4 h-4 ${c.navBadgeAmber} text-[10px] font-bold rounded-full flex items-center justify-center`}>{maintAlerts.length}</span>}
          </button>
          <button onClick={() => setShowProfileSetup(true)} className={`p-2 rounded-lg ${c.cardAltHover} ${c.textSecondaryondary} transition-colors relative`} title="Garage">
            <span>🏠</span>
            {garage.length > 0 && <span className={`absolute -top-1 -right-1 w-4 h-4 ${c.navBadgeZinc} text-[10px] font-bold rounded-full flex items-center justify-center`}>{garage.length}</span>}
          </button>
        </div>

        {/* Savings banner */}
        {getTotalSavings() > 0 && (
          <div className={`mb-4 flex items-center gap-3 p-3 rounded-xl border ${c.greenBanner}`}>
            <span>💰</span>
            <span className={`text-sm font-bold ${c.greenText}`}>${getTotalSavings()} saved by DIY</span>
            <button onClick={() => setShowHistory(true)} className={`ml-auto text-xs ${c.textMuteded} hover:underline`}>Details →</button>
          </div>
        )}

        {viewMode === 'quickcheck' ? (
          <div>
            <p className={`${c.textSecondaryondary} mb-4 text-sm`}>Run a targeted checklist for your situation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(QUICK_CHECKS).map(([key, check]) => (
                <button key={key} onClick={() => { setActiveQuickCheck(key); setCheckedItems({}); }}
                  className={`group flex items-center gap-3 p-4 rounded-xl border-2 ${c.border} ${c.borderHover} ${c.card} ${c.cardAltHover} transition-all text-left`}>
                  <span className="text-2xl">{check.icon}</span>
                  <div><span className={`text-sm font-bold ${c.text}`}>{check.title}</span><span className={`block text-xs ${c.textMuteded}`}>{check.items.length} items</span></div>
                  <span className={`ml-auto ${c.textMuteded} group-hover:translate-x-1 transition-transform`}>→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Favorites quick access */}
            {favorites.length > 0 && (
              <div className="mb-5">
                <div className={`text-xs font-bold ${c.textMuteded} uppercase tracking-wide mb-2`}>⭐ Quick Access</div>
                <div className="flex flex-wrap gap-2">
                  {favorites.slice(0, 5).map(fId => {
                    const f = FIXES[fId]; if (!f) return null;
                    return <button key={fId} onClick={() => startFixDirect(fId)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${c.tagAmber} border hover:opacity-80`}>{f.title}</button>;
                  })}
                </div>
              </div>
            )}

            {/* AI Symptom interpreter */}
            <div className={`mb-5 p-4 rounded-xl border-2 ${c.border} ${c.card}`}>
              <button onClick={() => setShowInterpreter(!showInterpreter)} className="w-full flex items-center gap-3 text-left">
                <span className={`text-lg flex-shrink-0`}>🔍</span>
                <div className="flex-1"><span className={`text-sm font-bold ${c.text}`}>Describe what's happening</span><span className={`block text-xs ${c.textMuteded}`}>AI suggests the right category</span></div>
                <span className={`${c.textMuteded} transition-transform ${showInterpreter ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showInterpreter && (
                <div className="mt-4">
                  <textarea value={symptomText} onChange={e => setSymptomText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && symptomText.trim().length >= 10 && !loading) routeSymptom(); }}
                    placeholder="e.g., 'Ticking from the front when I go over bumps, handlebars feel loose...'"
                    className={`w-full h-24 p-3 border-2 rounded-xl text-sm resize-none outline-none ${c.input}`} />
                  <button onClick={routeSymptom} disabled={loading || symptomText.trim().length < 10}
                    className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${loading || symptomText.trim().length < 10 ? `${c.btnSecondary} opacity-50` : c.btnPrimary}`}>
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block">{tool?.icon ?? '🚲'}</span> Analyzing...</span> : 'Analyze Symptom'}
                  </button>
                  {aiRoute && (
                    <div className={`mt-4 p-4 rounded-xl ${c.cardAlt}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>✨</span>
                        <span className={`text-sm font-bold ${c.text}`}>AI Recommendation</span>
                        <span className={`text-xs ${c.textMuteded} ml-auto`}>{Math.round((aiRoute.confidence || 0) * 100)}%</span>
                      </div>
                      <p className={`text-sm ${c.textSecondaryondary} mb-3`}>{aiRoute.reasoning}</p>
                      <button onClick={() => { const p = PROBLEMS.find(x => x.id === aiRoute.recommended_category); if (p) { setShowInterpreter(false); setAiRoute(null); startProblem(aiRoute.recommended_category); } }}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm ${c.btnPrimary}`}>
                        Start: {PROBLEMS.find(p => p.id === aiRoute.recommended_category)?.label || aiRoute.recommended_category}
                      </button>
                      {aiRoute.alternative_categories?.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className={`text-xs ${c.textMuteded}`}>Also:</span>
                          {aiRoute.alternative_categories.map(alt => { const p = PROBLEMS.find(x => x.id === alt); return p ? (
                            <button key={alt} onClick={() => { setShowInterpreter(false); setAiRoute(null); startProblem(alt); }}
                              className={`text-xs ${c.tag} px-2 py-1 rounded-md hover:opacity-80`}>{p.icon} {p.label}</button>
                          ) : null; })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className={`${c.textSecondaryondary} mb-4 text-sm`}>Or select the problem:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PROBLEMS.map(p => (
                <button key={p.id} onClick={() => startProblem(p.id)}
                  className={`group relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 ${c.border} ${c.borderHover} ${c.card} ${c.cardAltHover} transition-all text-center min-h-[88px]`}>
                  <span className="text-3xl">{p.icon}</span>
                  <span className={`text-sm font-bold ${c.text} leading-tight`}>{p.label}</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 h-[3px] rounded-full transition-all duration-200" style={{ backgroundColor: p.color }} />
                </button>
              ))}
            </div>

            {/* Direct free-text input */}
            <div className={`mt-5 p-4 rounded-xl border-2 ${c.border} ${c.card}`}>
              <p className={`text-xs font-bold ${c.textMuteded} uppercase tracking-wide mb-2`}>🔧 Something different? Describe it directly</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customProblem}
                  onChange={e => setCustomProblem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && customProblem.trim()) { setShowAskMechanic(true); askMechanic(); } }}
                  placeholder="e.g., 'Creaking from bottom bracket when climbing...'"
                  className={`flex-1 px-3 py-2 border-2 rounded-lg text-sm outline-none ${c.input}`}
                />
                <button
                  onClick={() => { setShowAskMechanic(true); if (customProblem.trim()) askMechanic(); }}
                  disabled={!customProblem.trim()}
                  className={`px-4 py-2 rounded-lg font-bold text-sm flex-shrink-0 ${!customProblem.trim() ? `${c.btnSecondary} opacity-50` : c.btnPrimary}`}>
                  Ask
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: ASK THE MECHANIC (AI)
  // ══════════════════════════════════════════
  if (showAskMechanic) {
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        {renderBikeProfileBar()}
        <div className={`${c.card} rounded-xl border-2 ${c.border} p-6 mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">💬</span>
            <h3 className={`text-lg font-bold ${c.text}`}>Ask the Mechanic</h3>
          </div>
          <p className={`${c.textSecondaryondary} text-sm mb-4`}>Describe the problem — what you see, hear, or feel. Attach a photo for visual diagnosis.</p>
          <textarea value={customProblem} onChange={(e) => setCustomProblem(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && customProblem.trim() && !loading) askMechanic(); }}
            placeholder="e.g., 'Rear wheel grinds when going uphill and shifting to easier gear. Started after heavy rain.'"
            className={`w-full h-32 p-4 border-2 rounded-xl outline-none resize-none text-sm ${c.input}`} />

          {/* Photo upload */}
          <div className="flex items-center gap-3 mt-3">
            <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            <button onClick={() => photoRef.current?.click()} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 ${c.border} ${c.textSecondaryondary} ${c.cardAltHover} transition-colors`}>
              <span>📸</span> {photoData ? 'Change Photo' : 'Attach Photo'}
            </button>
            {photoData && (
              <div className="flex items-center gap-2">
                <img src={photoData} alt="Attached" className="w-10 h-10 rounded-lg object-cover border" />
                <button onClick={() => setPhotoData(null)} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>✕ Remove</button>
              </div>
            )}
          </div>

          <button onClick={askMechanic} disabled={loading || !customProblem.trim()}
            className={`mt-4 w-full font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${loading || !customProblem.trim() ? `${c.btnSecondary} opacity-50` : c.btnPrimary}`}>
            {loading ? null : <><span>🔧</span> Diagnose My Bike</>}
          </button>
          {loading && renderLoadingState()}
          {aiError && !loading && (
            <div className={`mt-4 p-4 ${c.danger} border rounded-xl flex items-start gap-3`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <div><p className="text-sm">{aiError}</p>
                <button onClick={reset} className={`text-sm font-semibold ${linkStyle} mt-2`}>← Try static tree instead</button>
              </div>
            </div>
          )}
        </div>
        {aiDiagnosis && !loading && renderAIDiagnosis(aiDiagnosis)}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: FIX DISPLAY (interactive steps)
  // ══════════════════════════════════════════
  if (fix) {
    const isFav = favorites.includes(currentFix);
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        {renderBikeProfileBar()}

        {/* Resolved celebration */}
        {fixResolved === 'yes' && (
          <div className={`mb-6 p-6 rounded-xl ${c.success} border-2 text-center`}>
            <span className="text-4xl block mb-2">🎉</span>
            <p className={`text-lg font-bold ${c.greenText}`}>Fixed!</p>
            <p className={`text-sm ${c.textSecondaryondary} mt-1`}>Nice work — you just saved a trip to the shop.</p>
            {SHOP_COSTS[currentFix] > 0 && (
              <div className={`mt-3 inline-block px-4 py-2 rounded-xl ${c.greenPill}`}>
                <span className={`text-lg font-black ${c.greenText}`}>💰 ~${SHOP_COSTS[currentFix]} saved</span>
                {getTotalSavings() > 0 && <div className={`text-xs ${c.textMuteded} mt-0.5`}>Lifetime total: ${getTotalSavings() + SHOP_COSTS[currentFix]}</div>}
              </div>
            )}
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={() => { logRepair(currentFix, fix.title); }} className={`px-5 py-2 rounded-xl font-bold text-sm ${c.btnPrimary}`}>📋 Log Repair</button>
              <button onClick={reset} className={`px-5 py-2 rounded-xl font-bold text-sm ${c.btnSecondary} border-2 ${c.border}`}>Back to Home</button>
            </div>
          </div>
        )}

        {fixResolved !== 'yes' && (
          <>
            {/* Header row: animation + fix info */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="md:col-span-2 relative">
                <RepairAnimation type={fix.animation} paused={animPaused} />
                <button onClick={() => setAnimPaused(!animPaused)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white/80 hover:text-white transition-colors text-sm">
                  {animPaused ? '▶️' : '⏸️'}
                </button>
              </div>
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="flex items-start gap-2">
                  <h3 className={`text-2xl font-bold ${c.text} mb-3 flex-1`}>{fix.title}</h3>
                  <button onClick={() => { toggleFavorite(currentFix); showToast(isFav ? 'Removed from favorites' : 'Saved to favorites'); }}
                    className={`text-xl flex-shrink-0 mt-1 hover:scale-110 transition-transform`} title={isFav ? 'Remove from favorites' : 'Save to favorites'}>
                    {isFav ? '⭐' : '☆'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${c.tag} px-3 py-1.5 rounded-lg`}><span>📊</span> {fix.difficulty}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${c.tag} px-3 py-1.5 rounded-lg`}><span>⏱️</span> {fix.time}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-xs font-bold ${c.textMuteded} uppercase self-center mr-1`}>Tools:</span>
                  {fix.tools.map((t, i) => <span key={i} className={`text-xs ${c.tagAmber} border px-2 py-1 rounded-lg font-medium`}>{t}</span>)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mb-4">
              <ActionBar
                content={buildFixText()}
                printContent={buildFixPrintHtml()}
                title={fix.title}
              />
            </div>

            {/* Toolbox readiness check */}
            {myTools.length > 0 && fix.tools.length > 0 && (() => {
              const readiness = getToolReadiness(fix.tools);
              if (!readiness) return null;
              return (
                <div className={`mb-4 p-3 rounded-xl border-2 ${readiness.ready ? c.greenBanner : c.amberBanner}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{readiness.ready ? '✅' : '⚠️'}</span>
                    <span className={`text-xs font-bold ${readiness.ready ? c.greenText : c.amberLabel}`}>
                      {readiness.ready ? 'You have all the tools!' : `Missing ${readiness.missing.length} tool${readiness.missing.length > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {readiness.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {readiness.missing.map((t, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded ${c.redPill}`}>❌ {t}</span>)}
                    </div>
                  )}
                  {readiness.have.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {readiness.have.map((t, i) => <span key={i} className={`text-xs px-2 py-0.5 rounded ${c.greenPill}`}>✅ {t}</span>)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${c.textMuteded} uppercase`}>Progress</span>
                <span className={`text-xs font-bold ${c.textSecondaryondary}`}>{doneSteps} / {totalSteps}</span>
              </div>
              <div className={`h-2 rounded-full ${c.cardAlt} overflow-hidden`}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: accent }} />
              </div>
            </div>

            {/* Steps with checkboxes */}
            <div className={`${c.card} rounded-xl border-2 ${c.border} overflow-hidden mb-6`}>
              <div className={`p-4 border-b ${c.border} ${c.cardAlt}`}>
                <h4 className={`text-sm font-bold ${c.textSecondaryondary} uppercase tracking-wide`}>Step-by-Step</h4>
              </div>
              <ol className={`divide-y ${c.stepDivide}`}>
                {fix.steps.map((step, idx) => {
                  const done = !!completedSteps[idx];
                  const isActive = idx === activeStep && !done;
                  return (
                    <li key={idx} className={`flex gap-4 p-4 transition-all cursor-pointer ${isActive ? c.stepActive : ''} ${c.cardAltHover} ${done ? 'opacity-60' : ''}`}
                      onClick={() => toggleStep(idx)}>
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? c.checkboxChecked : 'text-white border-transparent'}`}
                        style={!done ? { backgroundColor: accent } : {}}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <span className={`text-sm leading-relaxed pt-0.5 flex-1 ${done ? 'line-through' : ''} ${isActive ? `font-semibold ${c.text}` : c.textSecondaryondary}`}>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Pro tip */}
            {fix.pro_tip && (
              <div className={`${c.warning} border-2 rounded-xl p-5 mb-6`}>
                <p className="text-sm"><span className="font-black text-xs uppercase block mb-1">🔧 Mechanic's Tip</span>{fix.pro_tip}</p>
              </div>
            )}

            {/* Parts reference */}
            {fix.parts?.length > 0 && (
              <div className="mb-6">
                <button onClick={() => setShowParts(!showParts)} className={`w-full flex items-center gap-2 p-3 rounded-xl ${c.cardAlt} ${c.textSecondaryondary} text-sm font-semibold transition-colors`}>
                  <span>🛒</span> Parts & Shopping List
                  <span className="ml-auto">{showParts ? '▲' : '▼'}</span>
                </button>
                {showParts && (
                  <div className={`mt-2 border-2 ${c.border} rounded-xl overflow-hidden`}>
                    {fix.parts.map((part, i) => (
                      <div key={i} className={`p-4 ${i > 0 ? `border-t ${c.border}` : ''}`}>
                        <div className={`font-semibold text-sm ${c.text}`}>{part.name}</div>
                        {part.example && <div className={`text-xs ${c.textMuteded} mt-0.5`}>e.g., {part.example}</div>}
                        {part.price && <div className="text-xs font-bold mt-1" style={{ color: accent }}>{part.price}</div>}
                      </div>
                    ))}
                    {/* Cross-ref */}
                    <div className={`p-3 border-t ${c.border} text-xs ${c.textMuteded}`}>
                      Worth buying? <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={linkStyle}>BuyWise</a> breaks it down.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Did this fix it? */}
            {progress >= 50 && fixResolved === null && (
              <div className={`p-5 rounded-xl border-2 ${c.border} ${c.card} text-center mb-6`}>
                <p className={`font-bold text-sm ${c.text} mb-3`}>Did this fix the problem?</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setFixResolved('yes')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl ${c.btnPrimarySuccess} font-bold text-sm transition-colors`}>
                    <span>👍</span> Fixed!
                  </button>
                  <button onClick={() => { setFixResolved('no'); setShowFollowUp(true); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 ${c.border} ${c.textSecondaryondary} font-bold text-sm ${c.cardAltHover} transition-colors`}>
                    <span>👎</span> Still broken
                  </button>
                </div>
              </div>
            )}

            {/* Follow-up AI form */}
            {showFollowUp && (
              <div className={`p-5 rounded-xl border-2 ${c.border} ${c.card} mb-6`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={c.amberText}>✨</span>
                  <h4 className={`font-bold text-sm ${c.text}`}>Still stuck? Tell us what's happening now</h4>
                </div>
                <p className={`text-xs ${c.textMuteded} mb-3`}>You tried "{fix.title}". We'll dig deeper into less common causes.</p>
                <textarea value={followUpText} onChange={e => setFollowUpText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && followUpText.trim() && !loading) askFollowUp(); }}
                  placeholder="e.g., 'Re-centered caliper 3 times but disc still rubs on inboard side...'"
                  className={`w-full h-24 p-3 border-2 rounded-xl text-sm outline-none resize-none ${c.input}`} />
                <button onClick={askFollowUp} disabled={loading || !followUpText.trim()}
                  className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${loading || !followUpText.trim() ? `${c.btnSecondary} opacity-50` : c.btnPrimary}`}>
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block">{tool?.icon ?? '🚲'}</span> Analyzing...</span> : 'Get Deeper Diagnosis'}
                </button>
                {/* Shop handoff */}
                <div className={`mt-3 pt-3 border-t ${c.border} flex gap-2`}>
                  <CopyBtn content={buildShopHandoff()} label="📤 Copy Shop Summary" />
                  <ActionBar printContent={buildShopHandoffHtml()} label="🖨️ Print for Shop" />
                </div>
                <p className={`text-xs ${c.textMuteded} mt-2`}>Taking it to a shop? Copy or print a diagnostic summary so they know what you've already tried.</p>
              </div>
            )}

            {/* Cross-refs + disclaimer */}
            <div className={`mt-6 pt-4 border-t ${c.border} space-y-2 text-xs ${c.textMuteded}`}>
              {fix.difficulty === 'shop-only' && (
                <p>Not sure whether to DIY this one? <a href="/DecisionCoach" target="_blank" rel="noopener noreferrer" className={linkStyle}>Decision Coach</a> helps you think it through.</p>
              )}
              {fix.parts?.length > 0 && (
                <p>Checking whether parts are worth the cost? <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={linkStyle}>BuyWise</a> can help you decide.</p>
              )}
              <p className={`pt-2 border-t ${c.border}`}>⚠️ Safety-critical repairs (brakes, wheels, headset) should be verified by a professional mechanic before riding.</p>
            </div>
          </>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: TROUBLESHOOTING TREE
  // ══════════════════════════════════════════
  if (currentNode) {
    return (
      <div className={c.text}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {renderNavBar()}
        {renderBikeProfileBar()}
        <div className={`flex items-center gap-2 mb-6 text-xs ${c.textMuteded} font-medium`}>
          <span style={{ color: accent }} className="font-bold">{activeProblem?.icon} {activeProblem?.label}</span>
          <span>→</span>
          <span>Step {treePath.length}</span>
        </div>
        <div className={`${c.card} rounded-xl border-2 ${c.border} p-6`}>
          <h3 className={`text-lg font-bold ${c.text} mb-5`}>{currentNode.question}</h3>
          <div className="space-y-3">
            {currentNode.options.map((opt, idx) => (
              <button key={idx} onClick={() => selectOption(opt)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${c.border} ${c.borderHover} ${c.card} ${c.cardAltHover} transition-all text-left group`}>
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors"
                  style={{ borderColor: accent, color: accent }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className={`flex-1 text-sm font-medium ${c.text}`}>{opt.label}</span>
                <span className={`${c.textMuteded} group-hover:translate-x-1 transition-transform`}>→</span>
              </button>
            ))}
          </div>
        </div>
        {/* Quick AI escape hatch */}
        <div className="mt-4 text-center">
          <button onClick={() => { setShowAskMechanic(true); setCustomProblem(`I have a ${activeProblem?.label?.toLowerCase() || 'bike'} problem: `); }}
            className={`text-xs ${c.btnSecondary} transition-colors underline underline-offset-2`}>
            None of these match? Ask the AI mechanic →
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return <div className={c.textSecondaryondary}>Loading...</div>;
};

BikeMedic.displayName = 'BikeMedic';
export default BikeMedic;
