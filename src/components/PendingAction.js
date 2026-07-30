import React, { useState, useCallback } from 'react';

/**
 * PendingAction — per-button "this one is working" feedback.
 *
 * The bug this exists to prevent: a row of buttons rendered from a .map(),
 * all disabled by ONE shared loading flag. Press one and every sibling dims
 * identically, so the button you actually clicked is indistinguishable from
 * the ones you didn't — the click reads as "nothing happened". Reported on
 * BuyWise's "Want to Know More?" pills (2026-07-30); the same shape existed
 * in six other tools.
 *
 * The fix is always the same three parts, so they live here once:
 *   1. remember WHICH item is in flight, not just THAT something is
 *   2. spin the icon on that one button
 *   3. keep it at full opacity + ring it, while its siblings dim
 *
 * Usage — batteries included:
 *
 *   const [pending, runPending] = usePendingKey();
 *   ...
 *   {items.map(item => (
 *     <PendingBtn
 *       key={item.id}
 *       itemKey={item.id}
 *       pending={pending}
 *       onClick={() => runPending(item.id, () => handleThing(item))}
 *       disabled={loading}
 *       icon="🔍"
 *       className={`text-xs font-bold ${c.textSecondary}`}
 *     >
 *       {t('deep_dive')}
 *     </PendingBtn>
 *   ))}
 *
 * Usage — primitives, when the button needs custom markup:
 *
 *   <button
 *     disabled={loading}
 *     aria-busy={pending === item.id}
 *     className={`${c.btnSecondary} ${pendingClass(pending === item.id)}`}
 *   >
 *     <Spin on={pending === item.id} icon="🔍" /> {label}
 *   </button>
 *
 * Note on `icon`: per audit/CONVENTIONS.md the loading state should spin the
 * TOOL's icon (`tool?.icon`) so users read "same tool, still working". Pass a
 * topical emoji only when the idle state already shows one and swapping it
 * would be more confusing than keeping it.
 */

// ── Spinning icon ────────────────────────────────────────────
// Keeps the icon in place and spins it, rather than swapping the whole label
// for a clock — the button stays readable while it works.
export const Spin = ({ on, icon, children }) => (
  <>
    <span className={on ? 'animate-spin inline-block' : 'inline-block'}>{icon}</span>
    {children && <> {children}</>}
  </>
);

// ── Class fragment ───────────────────────────────────────────
// Emits exactly ONE disabled:opacity-* class. Shipping both `opacity-100` and
// `opacity-40` and expecting the former to win loses — same specificity, and
// Tailwind's emitted order decides it the other way (verified in the DOM).
//
// `ring-current` takes the button's own text colour, so each tool's accent
// carries through without this helper knowing anything about the palette.
export const pendingClass = (isPending) =>
  isPending ? 'ring-2 ring-current' : 'disabled:opacity-40';

// ── Hook ─────────────────────────────────────────────────────
// Tracks which key is in flight. Wrap the existing handler — this deliberately
// does NOT replace the tool's own loading flag (that still drives the disabled
// state for the whole group); it only answers "which one did they press?".
export function usePendingKey() {
  const [pendingKey, setPendingKey] = useState(null);

  const runPending = useCallback(async (key, fn) => {
    setPendingKey(key);
    try {
      return await fn();
    } finally {
      setPendingKey(null);
    }
  }, []);

  return [pendingKey, runPending];
}

// ── Button ───────────────────────────────────────────────────
export const PendingBtn = ({
  itemKey,
  pending,
  icon,
  className = '',
  children,
  ...rest
}) => {
  const isPending = pending != null && pending === itemKey;
  return (
    <button
      {...rest}
      aria-busy={isPending}
      className={`${className} ${pendingClass(isPending)}`}
    >
      {icon ? <Spin on={isPending} icon={icon}>{children}</Spin> : children}
    </button>
  );
};

export default PendingBtn;
