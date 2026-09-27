// src/components/AutoGrowTextarea.js
//
// A <textarea> that grows to fit what's typed (2026-09-27, step-2 pilot).
// Fixed-height boxes hid long answers behind a scrollbar; a drag handle is one
// more control to notice. This one starts at its minimum height, grows with
// the text — typed, pasted, or filled in by "Try an example" — and stops at
// maxHeight, where it scrolls. Nothing to click, so nothing added to the page.
//
// Drop-in for <textarea>: same props. `minHeight` / `maxHeight` in px.

import React, { useLayoutEffect, useRef } from 'react';

export default function AutoGrowTextarea({ value, minHeight = 64, maxHeight = 320, style, ...rest }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight + 2, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight + 2 > maxHeight ? 'auto' : 'hidden';
  }, [value, minHeight, maxHeight]);

  return <textarea ref={ref} value={value} style={{ minHeight, ...style }} {...rest} />;
}
