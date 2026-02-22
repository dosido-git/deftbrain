// src/hooks/usePremium.js
// Feature flag system for premium gating
//
// THREE MODES:
//   'dev'     → Everything unlocked, no badges, no gates (local development)
//   'preview' → Everything unlocked + "Premium · Coming Soon" badges (deployed pre-monetization)
//   'live'    → Actual gating enforced, free users hit upgrade prompts (Stripe wired up)
//
// HOW TO ADD A NEW PREMIUM FEATURE:
// 1. Add it to FEATURE_FLAGS under the tool name
// 2. Wrap the UI in <PremiumGate feature="toolName.featureName">
// 3. Add <PremiumBadge feature="..."> next to buttons/headers
// 4. Done — it works in dev/preview, gates in live

import React, { createContext, useContext } from 'react';

// ═══════════════════════════════════════════════════
// MASTER SWITCH — the only thing you change
// ═══════════════════════════════════════════════════
const GATE_MODE = 'preview'; // 'dev' | 'preview' | 'live'

// ═══════════════════════════════════════════════════
// FEATURE FLAGS — define what's free vs premium per tool
// ═══════════════════════════════════════════════════
// 'free'    = always available in all modes
// 'premium' = unlocked in dev/preview, gated in live

export const FEATURE_FLAGS = {

  // ─── NameAudit ───
  'nameAudit.analyze':            'free',
  'nameAudit.overallScore':       'free',
  'nameAudit.sectionScores':      'free',
  'nameAudit.compare2':           'free',
  'nameAudit.copyPrint':          'free',
  'nameAudit.compare3plus':       'premium',
  'nameAudit.history':            'premium',
  'nameAudit.fixThisName':        'premium',
  'nameAudit.extendedDomains':    'premium',
  'nameAudit.shareCard':          'premium',
  'nameAudit.pdfExport':          'premium',

  // ─── NameStorm ───
  'nameStorm.generate':           'free',
  'nameStorm.blendMode':          'free',
  'nameStorm.favorites':          'free',
  'nameStorm.domainStorm':        'premium',
  'nameStorm.moreLikeThis':       'premium',
  'nameStorm.bulkCheck':          'premium',

  // ─── Template: copy for each new tool ───
  // 'toolName.basicFeature':     'free',
  // 'toolName.advancedFeature':  'premium',
};

// ═══════════════════════════════════════════════════
// FREE TIER LIMITS — usage caps (enforced only in 'live' mode)
// ═══════════════════════════════════════════════════
export const FREE_LIMITS = {
  'nameAudit.dailyAnalyses':    5,
  'nameAudit.dailyCompares':    3,
  'nameStorm.dailyGenerations': 5,
};

// ═══════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════
const PremiumContext = createContext({
  tier: 'free',
  gateMode: 'dev',
  isUnlocked: () => true,
  isPremiumFeature: () => false,
});

// ═══════════════════════════════════════════════════
// PROVIDER — wrap App with this
// ═══════════════════════════════════════════════════
export function PremiumProvider({ children }) {
  // TODO: When auth is ready, get real tier from user session
  // const { user } = useAuth();
  // const tier = user?.subscription === 'premium' ? 'premium' : 'free';
  const tier = 'free';

  const isPremiumFeature = (featureKey) => {
    return FEATURE_FLAGS[featureKey] === 'premium';
  };

  const isUnlocked = (featureKey) => {
    // dev & preview = everything unlocked
    if (GATE_MODE === 'dev' || GATE_MODE === 'preview') return true;

    // live mode: check tier
    const flag = FEATURE_FLAGS[featureKey];
    if (!flag || flag === 'free') return true;
    return tier === 'premium';
  };

  return (
    <PremiumContext.Provider value={{ tier, gateMode: GATE_MODE, isUnlocked, isPremiumFeature }}>
      {children}
    </PremiumContext.Provider>
  );
}

// ═══════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════
//
// Usage:
//   const { isUnlocked, isPremiumFeature } = usePremium();
//   if (isUnlocked('nameAudit.history')) { /* render it */ }
//
export function usePremium() {
  return useContext(PremiumContext);
}

// ═══════════════════════════════════════════════════
// GATE COMPONENT — wrap any premium UI block
// ═══════════════════════════════════════════════════
//
// In dev:     renders children, nothing else
// In preview: renders children + subtle "Premium · Coming Soon" indicator
// In live:    if free user → blurred preview + upgrade prompt
//             if premium user → renders children
//
// Usage:
//   <PremiumGate feature="nameAudit.fixThisName">
//     <FixThisNameButton />
//   </PremiumGate>
//
//   // inline mode: hide entirely instead of showing upgrade prompt
//   <PremiumGate feature="nameAudit.history" inline>
//     <HistorySidebar />
//   </PremiumGate>
//
export function PremiumGate({ feature, label, inline = false, children }) {
  const { isUnlocked, isPremiumFeature, gateMode } = usePremium();

  // dev mode: render children, no decoration
  if (gateMode === 'dev') return children;

  // preview mode: render children, but add a subtle "coming soon" border if it's a premium feature
  if (gateMode === 'preview') {
    if (!isPremiumFeature(feature)) return children;
    return (
      <div className="relative">
        {children}
        <div className="absolute -top-2 -right-2 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md whitespace-nowrap">
            ✨ Premium · Coming Soon
          </span>
        </div>
      </div>
    );
  }

  // live mode: actual gating
  if (isUnlocked(feature)) return children;

  if (inline) return null;

  const featureLabel = label || feature.split('.').pop().replace(/([A-Z])/g, ' $1').trim();

  return (
    <div className="relative group">
      <div className="opacity-40 pointer-events-none blur-[1px] select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 px-5 py-4 text-center max-w-xs">
          <div className="text-2xl mb-2">✨</div>
          <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm mb-1">
            {featureLabel}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
            Upgrade to DeftBrain Premium to unlock this feature.
          </p>
          <button
            onClick={() => {
              // TODO: Navigate to pricing or open Stripe checkout
              // window.location.href = '/pricing';
              alert('Premium coming soon!');
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-xs font-semibold rounded-lg transition-all shadow-md"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BADGE — small indicator next to buttons/headers
// ═══════════════════════════════════════════════════
//
// In dev:     invisible
// In preview: shows "Premium · Coming Soon" pill
// In live:    shows "PRO" pill for free users, invisible for premium users
//
// Usage:
//   <button>Export PDF <PremiumBadge feature="nameAudit.pdfExport" /></button>
//   <h3>Audit History <PremiumBadge feature="nameAudit.history" /></h3>
//
export function PremiumBadge({ feature }) {
  const { isUnlocked, isPremiumFeature, gateMode } = usePremium();

  // Not a premium feature = no badge ever
  if (!isPremiumFeature(feature)) return null;

  // dev mode: invisible
  if (gateMode === 'dev') return null;

  // preview mode: always show "coming soon" indicator
  if (gateMode === 'preview') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white ml-1.5 whitespace-nowrap">
        ✨ Premium · Coming Soon
      </span>
    );
  }

  // live mode: show PRO badge only for free users
  if (isUnlocked(feature)) return null;

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white ml-1.5">
      PRO
    </span>
  );
}
