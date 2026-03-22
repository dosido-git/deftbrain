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
 */

const ActionBarContext = createContext(null);

export const ActionBarProvider = ({ children }) => {
  const [actions, setActions] = useState({ content: '', title: 'DeftBrain' });

  const registerActions = useCallback((content, title) => {
    setActions({ content: content || '', title: title || 'DeftBrain' });
  }, []);

  const clearActions = useCallback(() => {
    setActions({ content: '', title: 'DeftBrain' });
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
 */
export const useRegisterActions = (content, title) => {
  const { registerActions, clearActions } = useActionBar();
  useEffect(() => {
    registerActions(content, title);
  }, [content, title]); // eslint-disable-line react-hooks/exhaustive-deps
};
