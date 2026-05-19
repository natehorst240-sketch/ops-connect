#!/usr/bin/env node
/**
 * One-time seed export: merges src/data/bases.js and mxOncallSchedule.js
 * into a CSV ready for import into the cr463_basemetadata Dataverse entity.
 *
 * Usage:
 *   node scripts/export-base-meta.js > bases-seed.csv
 *
 * Then import bases-seed.csv via:
 *   Power Platform maker portal → Solutions → OpsConnect →
 *   Tables → Base Metadata → Data → Import data
 *
 * See docs/migration-base-aircraft.md for full instructions.
 */

import { BASES } from '../src/data/bases.js';
import { BASE_META } from '../src/data/mxOncallSchedule.js';

const STATUS_INT  = { AVAILABLE: 1, AWAY_FROM_BASE: 2, OUT_OF_SERVICE: 3, UNAVAILABLE: 4 };
const WEATHER_INT = { green: 1, yellow: 2, red: 3 };

const rows = BASES.map(b => {
  // Find the CF_SCHEDULE base name whose display label most closely matches this base.
  // The match is best-effort — review the CSV and correct any mis-matches manually.
  const cfEntry = Object.entries(BASE_META).find(([, v]) =>
    v.label.toLowerCase().includes(b.name.toLowerCase())
  );

  return {
    cr463_baseid:             b.id,
    cr463_name:               b.name,
    cr463_ihcodes:            b.codes.join(';'),
    cr463_regioncode:         b.region,
    cr463_longitude:          b.coords[0],
    cr463_latitude:           b.coords[1],
    cr463_operationalstatus:  STATUS_INT[b.status]  ?? 1,
    cr463_weathercondition:   WEATHER_INT[b.weather] ?? 1,
    cr463_weatherdetail:      b.weatherDetail ?? '',
    cr463_cfbasename:         cfEntry?.[0] ?? '',
    cr463_cfdisplaylabel:     cfEntry?.[1]?.label ?? b.name,
    cr463_isactive:           'true',
  };
});

const headers = Object.keys(rows[0]);
const csvRow  = obj => headers.map(h => `"${String(obj[h]).replace(/"/g, '""')}"`).join(',');

process.stdout.write([headers.join(','), ...rows.map(csvRow)].join('\n') + '\n');
process.stderr.write(`Exported ${rows.length} bases.\n`);
process.stderr.write(`Review cf_basename matches — some may need manual correction.\n`);
