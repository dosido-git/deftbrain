/**
 * HeroPitch — Homepage value-proposition copy with rotating sampler.
 * ──────────────────────────────────────────────────────────────────
 * Renders below the BrandMark on the dashboard. Picks one of N triplets
 * on mount and keeps it stable for the session (refresh = new pick).
 * Uses localStorage to avoid showing the same triplet twice in a row.
 *
 * The triplet sells breadth in a glance — three concrete, varied tasks
 * that show "look at the kind of stuff you can do here." The trailing
 * sentence anchors the offer (count, cost, friction).
 *
 * Props:
 *   isDark    — boolean, from useTheme() in the parent (default: false)
 *   className — optional additional classes on the wrapper
 */
import React, { useState } from 'react';

// Triplets sell breadth — each picks 3 tools across different modes
// (decide / decode / fix / write / plan / negotiate / etc). Edit freely;
// rotation is purely random, no ordering matters.
const TRIPLETS = [
  'Plan a date. Decode a vet bill. Salvage a recipe.',
  'Diagnose a wilting plant. Roast a friend. Map a layover.',
  "Negotiate a salary. Pick tonight's outfit. Practice a hard conversation.",
  'Read your lease. Settle an argument. Find a new hobby.',
  'Fix a bike trailside. Decode a doctor visit. Win a debate.',
  'Plan a party. Stress-test a baby name. Survive a meeting.',
  'Pre-mortem your plan. Spot a fake review. Find the right gift.',
  'Audit a price quote. Triage your inbox. Save your security deposit.',
  'Decode a cryptic email. Write a thank-you. Toast at a wedding.',
  "Audit your energy. Catch burnout early. Plan tomorrow's dinner.",
  'Pressure-test a belief. Read the room. Find the comeback you missed.',
  'Build a brag sheet. Map a career pivot. Rehearse a pitch.',
];

const STORAGE_KEY = 'deftbrain:last-triplet';

// Read last shown triplet (best-effort — SSR, private mode, etc. fall through safely).
const readLast = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
  } catch (e) { /* localStorage unavailable */ }
  return null;
};

const writeLast = (value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch (e) { /* localStorage unavailable */ }
};

const HeroPitch = ({ isDark = false, className = '' }) => {
  // Pick once on mount; stable for the session. Refresh = new pick.
  // Avoid back-to-back repeats by filtering out the last shown triplet.
  const [triplet] = useState(() => {
    const last = readLast();
    const pool = last ? TRIPLETS.filter((t) => t !== last) : TRIPLETS;
    // Fallback if the pool was edited down to just the last-shown one.
    const safePool = pool.length > 0 ? pool : TRIPLETS;
    const pick = safePool[Math.floor(Math.random() * safePool.length)];
    writeLast(pick);
    return pick;
  });

  const samplerColor = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const trailColor   = isDark ? 'text-zinc-300' : 'text-zinc-600';

  return (
    <div className={`max-w-3xl ${className}`}>
      <p className={`text-lg sm:text-xl font-semibold leading-snug ${samplerColor}`}>
        {triplet}
      </p>
      <p className={`text-base sm:text-lg leading-snug mt-2 ${trailColor}`}>
        120+ free AI tools for the things real life actually throws at you.
      </p>
    </div>
  );
};

export default HeroPitch;
