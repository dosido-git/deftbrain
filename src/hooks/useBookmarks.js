// src/hooks/useBookmarks.js
// Reusable bookmark system for saving favorite tools
//
// Usage in any tool:
//   import { useBookmarks, BookmarkButton } from '../hooks/useBookmarks';
//
//   // Inside component:
//   <BookmarkButton toolId="NameAudit" isDark={isDark} />
//
// Usage on dashboard (list all bookmarks):
//   const { bookmarks, isBookmarked, toggle } = useBookmarks();

import React, { useState, useEffect, useCallback } from 'react';


const STORAGE_KEY = 'deftbrain-bookmarks';

function getBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Hook: manage bookmarked tools
 *
 * Returns:
 *   bookmarks: string[]          — array of bookmarked tool IDs
 *   isBookmarked(id): boolean    — check if a tool is bookmarked
 *   toggle(id): void             — add or remove a bookmark
 *   count: number                — total bookmarks
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => getBookmarks());

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY) {
        setBookmarks(getBookmarks());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const isBookmarked = useCallback((toolId) => {
    return bookmarks.includes(toolId);
  }, [bookmarks]);

  const toggle = useCallback((toolId) => {
    setBookmarks(prev => {
      const next = prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId];
      saveBookmarks(next);
      return next;
    });
  }, []);

  return { bookmarks, isBookmarked, toggle, count: bookmarks.length };
}

/**
 * Component: Bookmark button for any tool page
 *
 * Props:
 *   toolId: string   — the tool's ID (e.g., 'NameAudit')
 *   isDark: boolean   — theme mode
 *   size: 'sm' | 'md' — button size (default 'md')
 *   className: string — additional classes
 */
export function BookmarkButton({ toolId, isDark, size = 'md', className = '' }) {
  const { isBookmarked, toggle } = useBookmarks();
  const saved = isBookmarked(toolId);
  const [showToast, setShowToast] = useState(false);

  const handleClick = () => {
    toggle(toolId);
    if (!saved) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const isSm = size === 'sm';

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        onClick={handleClick}
        title={saved ? 'Remove bookmark' : 'Bookmark this tool'}
        className={`flex items-center gap-1.5 rounded-lg font-medium transition-all ${
          isSm ? 'px-2 py-1.5 text-xs' : 'px-3 py-1.5 text-sm'
        } ${
          saved
            ? (isDark ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')
            : (isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
        }`}
      >
        <span className={`${isSm ? 'text-xs' : 'text-sm'} ${saved ? '' : 'opacity-60'}`}>🔖</span>
        {!isSm && (saved ? 'Bookmarked' : 'Bookmark')}
      </button>
      {/* Toast */}
      {showToast && (
        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-50 ${
          isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-gray-800 text-white'
        }`}>
          ✓ Bookmarked!
        </div>
      )}
    </div>
  );
}
