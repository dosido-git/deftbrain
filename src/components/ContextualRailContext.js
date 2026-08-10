import React, { createContext, useContext, useEffect, useState } from 'react';

const ContextualRailContext = createContext(null);

export const ContextualRailProvider = ({ children }) => {
  const [rail, setRail] = useState(null);
  return (
    <ContextualRailContext.Provider value={{ rail, setRail }}>
      {children}
    </ContextualRailContext.Provider>
  );
};

export const useContextualRail = () => useContext(ContextualRailContext)?.rail || null;

export const useRegisterContextualRail = (content, updateKey = content) => {
  const context = useContext(ContextualRailContext);
  const setRail = context?.setRail;

  useEffect(() => {
    if (!setRail) return undefined;
    setRail(content ? { content } : null);
    return () => setRail(null);
  // `updateKey` lets callers register React content without causing an update
  // loop when the element is recreated as its parent renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRail, updateKey]);
};
