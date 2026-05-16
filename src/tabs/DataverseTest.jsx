import React, { useState, useEffect } from 'react';
import { useDataverse } from '../hooks/useDataverse';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const CANDIDATES = [
  'cr463_regionfields',
  'cr463_regionfield',
  'cr463_regions',
  'cr463_region'
];

export default function DataverseTest() {
  const { query } = useDataverse();
  const [results, setResults] = useState([]);
  const [working, setWorking] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function probe() {
      const tries = [];
      for (const endpoint of CANDIDATES) {
        try {
          const rows = await query(endpoint);
          tries.push({ endpoint, ok: true, count: rows.length });
          if (!working) {
            setWorking(endpoint);
            setData(rows);
          }
        } catch (e) {
          tries.push({ endpoint, ok: false, err: e.message });
        }
      }
      setResults(tries);
      if (!tries.some(t => t.ok)) setError('No candidate worked');
    }
    probe();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto text-neutral-100">
      <h1 className="text-2xl font-semibold mb-1">Dataverse Connection Test</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Probing candidate endpoints for the Region table.
      </p>

      <div className="space-y-2 mb-8">
        {CANDIDATES.map(c => {
          const r = results.find(x => x.endpoint === c);
          return (
            <div
              key={c}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              {!r && <Loader2 className="animate-spin text-neutral-500" size={18} />}
              {r?.ok && <CheckCircle2 className="text-green-500" size={18} />}
              {r && !r.ok && <XCircle className="text-red-500" size={18} />}
              <code className="font-mono text-sm">{c}</code>
              {r?.ok && (
                <span className="ml-auto text-xs text-green-400">
                  {r.count} rows
                </span>
              )}
              {r && !r.ok && (
                <span className="ml-auto text-xs text-red-400 truncate max-w-md">
                  {r.err}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {working && (
        <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-800">
          <div className="text-green-400 font-semibold text-sm mb-1">
            ✓ Live endpoint: {working}
          </div>
          <div className="text-xs text-neutral-400">
            Add this to src/auth/config.js: <code className="font-mono">TABLES.region = '{working}'</code>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
          {error} — open browser console for full error details.
        </div>
      )}

      {data && (
        <div>
          <h2 className="text-sm font-semibold text-neutral-300 mb-2">
            First 5 rows
          </h2>
          <pre className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-xs overflow-x-auto">
            {JSON.stringify(data.slice(0, 5), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
