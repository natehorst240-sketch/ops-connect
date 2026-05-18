import React, { createContext, useContext, useState } from 'react';
import { DEMO_TODAY_ISO } from '../data/mxOncallSchedule';

const CalendarDateContext = createContext(null);

export function CalendarDateProvider({ children }) {
  const [anchorDate, setAnchorDate] = useState(DEMO_TODAY_ISO);
  return (
    <CalendarDateContext.Provider value={{ anchorDate, setAnchorDate }}>
      {children}
    </CalendarDateContext.Provider>
  );
}

export function useCalendarDate() {
  return useContext(CalendarDateContext);
}
