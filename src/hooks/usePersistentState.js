import { useState, useEffect } from 'react';

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(key);
    // Handle the case where the saved value might not be valid JSON
    try {
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}