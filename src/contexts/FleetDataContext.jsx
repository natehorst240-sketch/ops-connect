import React, { createContext, useContext } from 'react';
import { useFleetData } from '../hooks/useFleetData';

const FleetDataContext = createContext(null);

export function FleetDataProvider({ children }) {
  const data = useFleetData();
  return (
    <FleetDataContext.Provider value={data}>
      {children}
    </FleetDataContext.Provider>
  );
}

export function useFleet() {
  const ctx = useContext(FleetDataContext);
  if (!ctx) throw new Error('useFleet must be used inside FleetDataProvider');
  return ctx;
}
