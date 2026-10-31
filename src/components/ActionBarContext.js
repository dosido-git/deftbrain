import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * ActionBarContext — lets any tool register its export content so
 * ToolPageWrapper can render the ActionBar in the persistent header row.
 *
 * Usage in a tool:
 *   const { registerActions } = useActionBar();
 *   // Call whenever results change (in the same render or a useEffect):
 *   registerActions(buildFullExport(), tool?.title);
 *
 * Or use the convenience hook:
 *   useRegisterActions(content, title);
 *
 * shareUrl: ShareBtn has always accepted a `url`, and ActionBar has always
 * threaded it — but nothing ever supplied one, so 126 of 126 tools shared
 * their results as bare text. A native share with no `url` arrives in
 * WhatsApp/iMessage/Slack with no link and no preview card: the one moment a
 * real person voluntarily passes DeftBrain along, and it was a dead end
 * (found 2026-08-01). It now defaults to the current page URL, so every tool
 * is fixed centrally; a tool can still pass its own to override.
 */

const ActionBarContext = createContext(null);

export const ActionBarProvider = ({ children }) => {
  const [actions, setActions] = useState({ content: '', title: 'DeftBrain', shareUrl: '', shareParts: null });

  // Strip query/hash: the shared link should be the tool, not the sharer's
  // session state (?operator=1, ?lang=, a scroll anchor).
  const currentUrl = () => {
    if (typeof window === 'undefined') return '';
    try { return window.location.origin + window.location.pathname; } catch (_) { return ''; }
  };

  const registerActions = useCallback((content, title, shareUrl, shareParts) => {
    setActions({
      content: content || '',
      title: title || 'DeftBrain',
      shareUrl: shareUrl || currentUrl(),
      shareParts: shareParts?.length ? shareParts : null,
    });
  }, []);

  const clearActions = useCallback(() => {
    setActions({ content: '', title: 'DeftBrain', shareUrl: '', shareParts: null });
  }, []);

  return (
    <ActionBarContext.Provider value={{ actions, registerActions, clearActions }}>
      {children}
    </ActionBarContext.Provider>
  );
};

export const useActionBar = () => {
  const ctx = useContext(ActionBarContext);
  if (!ctx) throw new Error('useActionBar must be used inside ActionBarProvider');
  return ctx;
};

/**
 * Convenience hook — call at the top of any tool component.
 * Registers content on every render so it stays current as results change.
 *
 * @param {string} content  — the text to copy/share/print
 * @param {string} title    — used by Share and Print dialogs
 * @param {string} [shareUrl] — optional; defaults to the current page URL
 * @param {Array<{label: string, text: string, private?: boolean}>} [shareParts]
 *   optional; lets Share make a link to the result itself (/r/:id). The
 *   visitor picks which parts go in; `private` parts (names, amounts, their
 *   own situation) start unticked.
 */
export const useRegisterActions = (content, title, shareUrl, shareParts) => {
  const { registerActions } = useActionBar();
  // Parts arrive as a fresh array every render; compare by value.
  const partsKey = shareParts ? JSON.stringify(shareParts) : '';
  useEffect(() => {
    registerActions(content, title, shareUrl, shareParts);
  }, [content, title, shareUrl, partsKey]); // eslint-disable-line react-hooks/exhaustive-deps
};
