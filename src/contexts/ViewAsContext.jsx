import React, { createContext, useContext, useState } from 'react';

const ViewAsContext = createContext({ viewAsId: null, setViewAsId: () => {} });

export function ViewAsProvider({ children }) {
  const [viewAsId, setViewAsId] = useState(null);
  return (
    <ViewAsContext.Provider value={{ viewAsId, setViewAsId }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  return useContext(ViewAsContext);
}
