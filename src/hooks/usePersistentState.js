import { useState, useEffect, useRef } from 'react';

export function usePersistentState(key, initialValue) {
  // If the stored value fails to parse (truncated write, browser crash
  // mid-save, a stray manual edit), the old version of this hook silently
  // fell back to initialValue AND immediately wrote that fallback back to
  // storage in the effect below — on the very next render, before the user
  // did anything. That permanently destroyed the original value with no
  // warning and no recovery path. Confirmed as the cause of a real user's
  // "all my check-ins disappeared" report (BeforeTheCrash's
  // crashpredictor-v2-logs held weeks of data, found reset to `[]`).
  // corruptRef marks that this mount hit that failure, so the effect below
  // can skip the first automatic write-back — a corrupted value just sits
  // there unread until the user actually changes something, instead of
  // being silently overwritten by merely loading the page.
  const corruptRef = useRef(false);

  const [state, setState] = useState(() => {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      corruptRef.current = true;
      // Preserve the unreadable raw value under a recovery key rather than
      // letting it vanish — a corrupted blob is still better evidence than
      // nothing if someone needs to investigate or hand-recover it later.
      try {
        if (raw != null) localStorage.setItem(`${key}__corrupted-backup`, raw);
      } catch {
        // Best-effort backup; storage may already be unavailable/full.
      }
      return initialValue;
    }
  });

  useEffect(() => {
    if (corruptRef.current) {
      corruptRef.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage unavailable or quota exceeded — fail silently
    }
  }, [key, state]);

  return [state, setState];
}
