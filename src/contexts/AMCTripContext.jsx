import React, { createContext, useContext, useState } from 'react';

const AMCTripContext = createContext({ trips: [], addTrip: () => {} });

export function AMCTripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  return (
    <AMCTripContext.Provider value={{ trips, addTrip: t => setTrips(p => [...p, t]) }}>
      {children}
    </AMCTripContext.Provider>
  );
}

export function useAMCTrips() {
  return useContext(AMCTripContext);
}
