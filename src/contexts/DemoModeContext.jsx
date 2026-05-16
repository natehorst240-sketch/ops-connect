import React, { createContext, useContext, useState } from 'react';

const DemoModeContext = createContext({ demoMode: false, setDemoMode: () => {} });

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
