import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useDataverse } from '../hooks/useDataverse';
import { useFleet } from '../contexts/FleetDataContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDemoMode } from '../contexts/DemoModeContext';
import { TABLES } from '../auth/tables';
import { PREFIX } from '../auth/schema';

const f = n => `${PREFIX}${n}`;
import { AIRCRAFT as STATIC_AIRCRAFT } from '../data';

// Which fields each type needs
const TYPE_CONFIG = {
  'Phase Inspection': { needsAircraft: true,  needsWindow: true,  needsPriority: true,  label: 'Reason / scope' },
  'Repair':           { needsAircraft: true,  needsWindow: true,  needsPriority: true,  label: 'Describe the defect' },
  'AOG':              { needsAircraft: true,  needsWindow: false, needsPriority: false, label: 'Describe the grounding condition', autoAOG: true },
  'Open Shift':       { needsAircraft: false, needsWindow: true,  needsPriority: false, label: 'Coverage needed for what task?' },
  'Time Off':         { needsAircraft: false, needsWindow: true,  needsPriority: false, label: 'Reason (optional)' },
  'Safety Report':    { needsAircraft: false, needsWindow: false, needsPriority: false, label: 'Describe the safety concern in detail', routeTo: 'Director' },
  'Ask Leadership':   { needsAircraft: false, needsWindow: false, needsPriority: false, label: 'Your question or topic', routeTo: 'Director' },
  'Other':            { needsAircraft: true,  needsWindow: true,  needsPriority: true,  label: 'What needs to happen and why' },
};

const REQUEST_TYPES = Object.keys(TYPE_CONFIG);

const PRIORITY_CODES = { 'Normal': 0, 'High': 1, 'AOG': 2 };

const inputCls = 'w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-100 focus:outline-none focus:border-orange-500 placeholder:text-neutral-600';

function Field({ label, optional, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wide">
        {label} {optional && <span className="text-neutral-600 normal-case">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

export default function SubmitRequest() {
  const { create } = useDataverse();
  const { aircraft: liveAircraft } = useFleet();
  const { persona, matched } = useCurrentUser();
  const { demoMode } = useDemoMode();
  const aircraft = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;

  const [form, setForm] = useState({
    aircraftTail: '',
    requestType: 'Phase Inspection',
    priority: 'Normal',
    base: '',
    windowStart: '',
    windowEnd: '',
    reason: ''
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [requestNumber, setRequestNumber] = useState(null);
  const [auditFailed, setAuditFailed] = useState(false);

  const cfg = TYPE_CONFIG[form.requestType] ?? TYPE_CONFIG['Other'];
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Determine routing
  function getRouting() {
    if (cfg.routeTo) return cfg.routeTo;
    if (form.priority === 'AOG' || form.requestType === 'AOG') return 'Director';
    return 'RMM';
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (demoMode) {
      // In demo mode simulate success without writing to Dataverse
      setRequestNumber(`MXR-DEMO${String(Date.now()).slice(-4)}`);
      setStatus('success');
      return;
    }
    setStatus('submitting');
    setError(null);

    const selectedAc = aircraft.find((a) => a.tail === form.aircraftTail);
    const reqNum = `MXR-${String(Date.now()).slice(-5)}`;
    const routing = getRouting();

    const body = {
      [f('requestnumber')]:      reqNum,
      [f('requesttitle')]:       reqNum,
      [f('aircrafttailnumber')]: form.aircraftTail,
      [f('aircraftmodel')]:      selectedAc?.type ?? '',
      [f('typeofrequest')]:      form.requestType,
      [f('baselocation')]:       form.base || selectedAc?.base || '',
      [f('prioritylevel')]:      cfg.autoAOG ? PRIORITY_CODES['AOG'] : (PRIORITY_CODES[form.priority] ?? 0),
      [f('requeststatus')]:      1,
      [f('requestedby')]:        persona?.name ?? 'Unknown',
      [f('reasonforrequest')]:   form.reason,
      [f('routingcode')]:        routing,
      [f('windowstarttime')]:    form.windowStart ? new Date(form.windowStart).toISOString() : null,
      [f('windowendtime')]:      form.windowEnd ? new Date(form.windowEnd).toISOString() : null,
      [f('auditcorrelationid')]: crypto.randomUUID()
    };

    try {
      await create(TABLES.mxRequest, body);
      setRequestNumber(reqNum);
      setStatus('success');
      try {
        await create(TABLES.audit, {
          [f('audittitle')]:   `${reqNum} submitted`,
          [f('action')]:       'mx_request.submitted',
          [f('actor')]:        persona?.name ?? 'Unknown',
          [f('actorrole')]:    persona?.role ?? 'AMT',
          [f('subjecttable')]: 'MX Requests',
          [f('subjectid')]:    reqNum,
          [f('eventat')]:      new Date().toISOString()
        });
      } catch (auditErr) {
        console.warn('Audit write failed:', auditErr);
        setAuditFailed(true);
      }
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  function reset() {
    setForm({ aircraftTail: '', requestType: 'Phase Inspection', priority: 'Normal', base: '', windowStart: '', windowEnd: '', reason: '' });
    setStatus('idle');
    setError(null);
    setRequestNumber(null);
    setAuditFailed(false);
  }

  const routing = getRouting();

  if (status === 'success') {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto text-center text-neutral-100">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">
          {form.requestType === 'Ask Leadership' ? 'Question sent' : 'Request submitted'}
        </h1>
        <p className="text-neutral-400 mb-1">Reference number</p>
        <p className="text-3xl font-mono font-semibold text-orange-400 mb-6">{requestNumber}</p>
        <p className="text-sm text-neutral-400 mb-8">
          Routed to <strong className="text-neutral-200">{routing}</strong>.
          {demoMode && <span className="text-orange-400"> (Demo — not written to Dataverse)</span>}
        </p>
        {auditFailed && (
          <div className="flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-amber-900/20 border border-amber-700/40 text-amber-400 text-sm text-left">
            <AlertCircle size={14} className="shrink-0" />
            <span>Compliance audit log failed to write. Your request was saved, but this gap must be reported to your administrator.</span>
          </div>
        )}
        <button onClick={reset} className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg transition-colors">
          Submit Another
        </button>
      </div>
    );
  }

  const isAskLeadership = form.requestType === 'Ask Leadership';
  const isSafetyReport  = form.requestType === 'Safety Report';

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto text-neutral-100">
      <h1 className="text-2xl font-semibold mb-1">
        {isAskLeadership ? (
          <span className="flex items-center gap-2"><MessageSquare size={22} className="text-orange-400" /> Ask Leadership</span>
        ) : 'Submit MX Request'}
      </h1>
      <p className="text-sm text-neutral-400 mb-6">
        Signed in as <span className="text-neutral-200">{persona?.name ?? '…'}</span>
        {matched && <span className="text-neutral-500"> · {persona.region} · {persona.roleTitle}</span>}
        {!matched && persona && !demoMode && <span className="text-yellow-500"> · email not matched in personnel table</span>}
        {demoMode && <span className="text-orange-400"> · Demo mode</span>}
      </p>

      {/* Type selector — prominent pills on mobile */}
      <div className="mb-5">
        <span className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">Request Type</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REQUEST_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, requestType: t }))}
              className={`px-3 py-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                form.requestType === t
                  ? t === 'Ask Leadership' || t === 'Safety Report'
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(isAskLeadership || isSafetyReport) && (
          <div className="mt-2 px-3 py-2 rounded-md bg-orange-900/20 border border-orange-800/40 text-xs text-orange-300">
            Routes directly to Director
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {cfg.needsAircraft && (
          <Field label="Aircraft">
            <select required value={form.aircraftTail} onChange={update('aircraftTail')} className={inputCls}>
              <option value="">Select aircraft…</option>
              {aircraft.map((a) => (
                <option key={a.tail} value={a.tail}>{a.tail} — {a.type} ({a.base})</option>
              ))}
            </select>
          </Field>
        )}

        {cfg.needsPriority && (
          <Field label="Priority">
            <select required value={form.priority} onChange={update('priority')} className={inputCls}>
              {Object.keys(PRIORITY_CODES).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        )}

        {cfg.needsAircraft && (
          <Field label="Base (override)" optional>
            <input type="text" value={form.base} onChange={update('base')} className={inputCls}
                   placeholder="Defaults to aircraft's home base" />
          </Field>
        )}

        {cfg.needsWindow && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Window Start">
              <input type="datetime-local" required value={form.windowStart} onChange={update('windowStart')} className={inputCls} />
            </Field>
            <Field label="Window End">
              <input type="datetime-local" required value={form.windowEnd} onChange={update('windowEnd')} className={inputCls} />
            </Field>
          </div>
        )}

        <Field label={cfg.label}>
          <textarea required rows={isAskLeadership || isSafetyReport ? 5 : 3}
            value={form.reason} onChange={update('reason')} className={inputCls}
            placeholder={isAskLeadership ? 'What do you need guidance on?' : isSafetyReport ? 'What did you observe? Where? Who was involved?' : 'What needs to happen and why'}
          />
        </Field>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button type="submit" disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-semibold rounded-lg transition-colors">
          {status === 'submitting' ? (
            <><Loader2 className="animate-spin" size={16} /> Submitting…</>
          ) : isAskLeadership ? (
            <><MessageSquare size={16} /> Send to Director</>
          ) : (
            <><Send size={16} /> Submit Request</>
          )}
        </button>
      </form>
    </div>
  );
}
