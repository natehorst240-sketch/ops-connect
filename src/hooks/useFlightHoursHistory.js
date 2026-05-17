import { useState, useEffect } from 'react';

const DEFAULT_HOURS_URL =
  'https://raw.githubusercontent.com/natehorst240-sketch/ihc-fleet-dashboard/main/data/flight_hours_history.json';

/**
 * Given two ISO date strings (YYYY-MM-DD), return the number of calendar days between them.
 */
function daysBetween(dateA, dateB) {
  return Math.round(
    (new Date(dateB) - new Date(dateA)) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Add N calendar days to an ISO date string, returning a new ISO date string.
 */
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Return the Monday of the ISO week for a given YYYY-MM-DD date string.
 */
function weekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function useFlightHoursHistory(url = DEFAULT_HOURS_URL) {
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (cancelled) return;

        // json: { [tail]: { [date]: { hours, date } } }
        // hours are cumulative; diff consecutive readings to get daily hours flown.
        // When there's a gap of N days, spread the delta evenly.

        // Collect all dates across all tails so we have a complete date axis
        const allDatesSet = new Set();

        // For each tail, build sorted list of [date, cumulativeHours]
        const tailReadings = {};
        for (const [tail, dateMap] of Object.entries(json)) {
          const sorted = Object.entries(dateMap)
            .map(([date, val]) => [date, typeof val === 'object' ? val.hours : val])
            .filter(([, h]) => typeof h === 'number' && !isNaN(h))
            .sort(([a], [b]) => a.localeCompare(b));
          tailReadings[tail] = sorted;
          sorted.forEach(([date]) => allDatesSet.add(date));
        }

        // Build per-date map of { [date]: { [tail]: hoursFlown } }
        // by spreading deltas across gaps
        const dateHoursMap = {}; // { [date]: { [tail]: hours } }

        for (const [tail, readings] of Object.entries(tailReadings)) {
          for (let i = 1; i < readings.length; i++) {
            const [prevDate, prevCum] = readings[i - 1];
            const [curDate, curCum] = readings[i];
            const delta = curCum - prevCum;
            if (delta <= 0) continue;

            const gap = daysBetween(prevDate, curDate);
            if (gap <= 0) continue;

            const perDay = delta / gap;

            // Spread evenly: days prevDate+1 through curDate
            for (let d = 1; d <= gap; d++) {
              const date = addDays(prevDate, d);
              allDatesSet.add(date);
              if (!dateHoursMap[date]) dateHoursMap[date] = {};
              dateHoursMap[date][tail] = (dateHoursMap[date][tail] ?? 0) + perDay;
            }
          }
        }

        // Build dailyData array
        const sortedDates = [...allDatesSet].sort();
        const daily = sortedDates.map(date => {
          const tailHours = dateHoursMap[date] ?? {};
          const values = Object.values(tailHours).filter(h => h > 0);
          const total = values.reduce((s, h) => s + h, 0);
          const activeTails = values.length;
          const avg = activeTails > 0 ? total / activeTails : 0;
          return { date, total: Math.round(total * 10) / 10, avg: Math.round(avg * 10) / 10, activeTails };
        });

        // Build weeklyData: group by Mon–Sun ISO week
        const weekMap = {};
        for (const d of daily) {
          const ws = weekStart(d.date);
          if (!weekMap[ws]) {
            weekMap[ws] = { weekStart: ws, totalSum: 0, tailSets: {} };
          }
          weekMap[ws].totalSum += d.total;
          // Track per-tail contribution for avg
          const tailHours = dateHoursMap[d.date] ?? {};
          for (const [tail, h] of Object.entries(tailHours)) {
            weekMap[ws].tailSets[tail] = (weekMap[ws].tailSets[tail] ?? 0) + h;
          }
        }

        const weekly = Object.values(weekMap)
          .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
          .map(w => {
            const tailValues = Object.values(w.tailSets).filter(h => h > 0);
            const avgVal = tailValues.length > 0
              ? tailValues.reduce((s, h) => s + h, 0) / tailValues.length
              : 0;
            return {
              weekStart: w.weekStart,
              total: Math.round(w.totalSum * 10) / 10,
              avg: Math.round(avgVal * 10) / 10,
            };
          });

        setDailyData(daily);
        setWeeklyData(weekly);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { dailyData, weeklyData, loading, error };
}
