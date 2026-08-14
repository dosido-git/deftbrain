/**
 * src/components/Caret.js
 * ──────────────────────────────────────────────────────────────────────
 * The disclosure triangle, in one place.
 *
 * It used to be written inline at 210 sites across 89 files, at whatever
 * size the surrounding markup happened to give it: mostly `text-xs` (12px),
 * often no size class at all, and at its worst a hardcoded `fontSize: 9`.
 * Nine pixels is not a comfortable thing to aim at, and it could not be
 * fixed without touching every file — which is the actual problem this
 * component solves. The size below is the only place it is decided.
 *
 * Two forms, because there are two kinds of disclosure in the app:
 *
 *   <Caret open={isOpen} />        a React-controlled toggle
 *   <Caret groupOpen />            inside a native <details class="group">,
 *                                  where CSS knows the state and React does not
 *
 * The controlled form swaps the glyph; the native form rotates one. Both use
 * ▼ (U+25BC), so a page that mixes them does not look confused — note that
 * the tempting ▾ (U+25BE) is literally named SMALL triangle and renders about
 * half the ink at the same font-size, which quietly undoes the size below.
 *
 * Always aria-hidden: the state belongs to the control that owns it (a
 * <button aria-expanded> or a <summary>), and a screen reader announcing
 * "black down-pointing triangle" after "Show me exactly what to say" is
 * noise, not information.
 */

import React from 'react';

// One size for every disclosure triangle in the product. 16px against the
// 12–14px text they sit beside: clearly a control, not punctuation.
//
// `shrink-0` because most of these sit at the end of a flex heading row with
// `ms-auto`, next to a label that wraps on a narrow phone. Without it the
// caret is the thing that gets squeezed — which is exactly backwards, since
// the label can take another line and the caret cannot.
const SIZE = 'text-base leading-none shrink-0';

export default function Caret({ open = false, groupOpen = false, className = '' }) {
  if (groupOpen) {
    return (
      <span
        aria-hidden="true"
        className={`${SIZE} inline-block transition-transform group-open:rotate-180 ${className}`}
      >
        ▼
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`${SIZE} inline-block ${className}`}>
      {open ? '▲' : '▼'}
    </span>
  );
}
