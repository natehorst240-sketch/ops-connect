import React, { useState, useEffect } from 'react';
import { useDataverse } from '../hooks/useDataverse';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const TABLES = [
  { label: 'Region',                 endpoint: 'cr463_regionfields' },
  { label: 'Base',                   endpoint: 'cr463_bases' },
  { label: 'Aircraft Type',          endpoint: 'cr463_aircrafttypes' },
  { label: 'Aircraft',               endpoint: 'cr463_aircrafts' },
  { label: 'Personnel Maintenance',  endpoint: 'cr463_personnelmaintenances' },
  { label: 'MX Request',             endpoint: 'cr463_mxrequests' },
  { label: 'Audit Log',              endpoint: 'cr463_auditlogs' },
  { label: 'Schedule Event',         endpoint: 'cr463_scheduleevents' },
  { label: 'Fleet Position',         endpoint: 'cr463_fleetpositions' },
  { label: 'Conflict',               endpoint: 'cr463_conflicts' },
  { label: 'Personnel Crew',         endpoint: 'cr463_personnelcrews' }
];

export default function DataverseTest() {
  const { query } = useDataverse();
  const [results, setResults] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    TABLES.forEach(async (t) => {
      try {
        const rows = await query(t.endpoint);
        setResults((r) => ({ ...r, [t.endpoint]: { ok: true, count: rows.length, rows } }));
      } catch (e) {
        setResults((r) => ({ ...r, [t.endpoint]: { ok: false, err: e.message } }));
      }
    });
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto text-neutral-100">
      <h1 className="text-2xl font-semibold mb-1">Dataverse Connection</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Live queries against your personal Dataverse environment.
      </p>

      <div className="space-y-2 mb-8">
        {TABLES.map((t) => {
          const r = results[t.endpoint];
          return (
            <button
              key={t.endpoint}
              onClick={() => r?.ok && setPreview(t)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
            >
              {!r && <Loader2 className="animate-spin text-neutral-500" size={18} />}
              {r?.ok && <CheckCircle2 className="text-green-500" size={18} />}
              {r && !r.ok && <XCircle className="text-red-500" size={18} />}
              <span className="text-sm font-medium w-48">{t.label}</span>
              <code className="font-mono text-xs text-neutral-500">{t.endpoint}</code>
              {r?.ok && (
                <span className="ml-auto text-xs text-green-400">{r.count} rows</span>
              )}
              {r && !r.ok && (
                <span className="ml-auto text-xs text-red-400 truncate max-w-md">{r.err}</span>
              )}
            </button>
          );
        })}
      </div>

      {preview && results[preview.endpoint]?.rows && (
        <div>
          <h2 className="text-sm font-semibold text-neutral-300 mb-2">
            {preview.label} — first 3 rows
          </h2>
          <pre className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-xs overflow-x-auto">
            {JSON.stringify(results[preview.endpoint].rows.slice(0, 3), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
