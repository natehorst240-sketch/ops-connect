import { useState, useEffect } from 'react';

const DEFAULT_URL =
  'https://raw.githubusercontent.com/natehorst240-sketch/ihc-fleet-dashboard/main/data/Due-List_BIG_WEEKLY_aw109sp.csv';

/**
 * Parse CSV with quoted-field support (handles commas inside quoted fields).
 * Returns an array of objects keyed by the header row.
 */
function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  function parseRow(line) {
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        let val = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            val += line[i++];
          }
        }
        fields.push(val);
        if (line[i] === ',') i++; // skip comma
      } else {
        // Unquoted field
        const end = line.indexOf(',', i);
        if (end === -1) {
          fields.push(line.slice(i));
          break;
        } else {
          fields.push(line.slice(i, end));
          i = end + 1;
        }
      }
    }
    return fields;
  }

  const headers = parseRow(lines[0]);
  const rows = [];

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r].trim();
    if (!line) continue;
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });
    rows.push(obj);
  }

  return rows;
}

function mapRow(raw) {
  return {
    registrationNumber: raw['Registration Number']?.trim() ?? '',
    description: raw['Description']?.trim() ?? '',
    ataAndCode: raw['ATA and Code']?.trim() ?? '',
    nextDueDate: raw['Next Due Date']?.trim() ?? '',
    maxNextDueDate: raw['Max Next Due Date']?.trim() ?? '',
    remainingDays: parseFloat(raw['Remaining Days']) || 0,
    maxRemainingDays: parseFloat(raw['Max Remaining Days']) || 0,
    remainingHours: parseFloat(raw['Remaining Hours']) || 0,
    maxRemainingHours: parseFloat(raw['Max Remaining Hours ']) || 0,
    intervalHours: parseFloat(raw['Interval Hours']) || 0,
    intervalMonths: parseFloat(raw['Interval Months']) || 0,
    trackedByEquipment: raw['Tracked By Equipment']?.trim() ?? '',
    nextDueHours: parseFloat(raw['Next Due Hours']) || 0,
    nextDueStatus: raw['Next Due Status']?.trim() ?? '',
    airframeHours: parseFloat(raw['Airframe Hours']) || 0,
    complianceDate: raw['Compliance Date']?.trim() ?? '',
    isOptional: raw['Is Optional']?.trim() ?? '',
  };
}

export function useDueList(url = DEFAULT_URL) {
  const [items, setItems] = useState([]);
  const [nextDueByAircraft, setNextDueByAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        if (cancelled) return;
        const raw = parseCsv(text);

        // Filter out optional rows
        const mapped = raw
          .filter(r => r['Is Optional']?.trim() !== 'Yes')
          .map(mapRow);

        // Build nextDueByAircraft: one entry per tail (soonest remaining days)
        const byTail = {};
        for (const item of mapped) {
          const tail = item.registrationNumber;
          if (!tail) continue;
          if (
            !byTail[tail] ||
            item.remainingDays < byTail[tail].remainingDays
          ) {
            byTail[tail] = item;
          }
        }

        const next = Object.values(byTail).sort(
          (a, b) => a.remainingDays - b.remainingDays
        );

        setItems(mapped);
        setNextDueByAircraft(next);
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

  return { items, nextDueByAircraft, loading, error };
}
