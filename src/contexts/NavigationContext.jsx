import React, { createContext, useContext } from 'react';

const NavigationContext = createContext(() => {});

export function NavigationProvider({ navigate, children }) {
  return (
    <NavigationContext.Provider value={navigate}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
