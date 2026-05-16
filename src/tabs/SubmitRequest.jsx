import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useDataverse } from '../hooks/useDataverse';
import { useFleet } from '../contexts/FleetDataContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { TABLES } from '../auth/tables';

const REQUEST_TYPES = [
  'Phase Inspection',
  'Repair',
  'AOG',
  'Open Shift',
  'Time Off',
  'Other'
];

const PRIORITY_CODES = {
  'Normal': 0,
  'High':   1,
  'AOG':    2
};

export default function SubmitRequest() {
  const { create } = useDataverse();
  const { aircraft } = useFleet();
  const { persona, matched } = useCurrentUser();

  const [form, setForm] = useState({
    aircraftTail: '',
    requestType: 'Phase Inspection',
    priority: 'Normal',
    base: '',
    windowStart: '',
    windowEnd: '',
    reason: ''
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [error, setError] = useState(null);
  const [requestNumber, setRequestNumber] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const selectedAc = aircraft.find((a) => a.tail === form.aircraftTail);
    const reqNum = `MXR-${String(Date.now()).slice(-5)}`;

    const body = {
      cr463_requestnumber: reqNum,
      cr463_requesttitle:  reqNum,
      cr463_aircrafttailnumber: form.aircraftTail,
      cr463_aircraftmodel: selectedAc?.type ?? '',
      cr463_typeofrequest: form.requestType,
      cr463_baselocation:  form.base || selectedAc?.base || '',
      cr463_prioritylevel: PRIORITY_CODES[form.priority] ?? 0,
      cr463_requeststatus: 1, // Submitted
      cr463_requestedby:   persona?.name ?? 'Unknown',
      cr463_reasonforrequest: form.reason,
      cr463_routingcode:   form.priority === 'AOG' ? 'Director' : 'RMM',
      cr463_windowstarttime: form.windowStart ? new Date(form.windowStart).toISOString() : null,
      cr463_windowendtime:   form.windowEnd ? new Date(form.windowEnd).toISOString() : null,
      cr463_auditcorrelationid: crypto.randomUUID()
    };

    try {
      const created = await create(TABLES.mxRequest, body);
      setRequestNumber(reqNum);
      setStatus('success');
      // Write audit log
      try {
        await create(TABLES.audit, {
          cr463_audittitle: `${reqNum} submitted`,
          cr463_action:     'mx_request.submitted',
          cr463_actor:      persona?.name ?? 'Unknown',
          cr463_actorrole:  persona?.role ?? 'AMT',
          cr463_subjecttable: 'MX Requests',
          cr463_subjectid:    reqNum,
          cr463_eventat:    new Date().toISOString()
        });
      } catch (auditErr) {
        // Audit failure shouldn't fail the submission
        console.warn('Audit write failed:', auditErr);
      }
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  function reset() {
    setForm({
      aircraftTail: '',
      requestType: 'Phase Inspection',
      priority: 'Normal',
      base: '',
      windowStart: '',
      windowEnd: '',
      reason: ''
    });
    setStatus('idle');
    setError(null);
    setRequestNumber(null);
  }

  if (status === 'success') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center text-neutral-100">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Request submitted</h1>
        <p className="text-neutral-400 mb-1">Request number</p>
        <p className="text-3xl font-mono font-semibold text-orange-400 mb-6">{requestNumber}</p>
        <p className="text-sm text-neutral-400 mb-8">
          Routed to your {form.priority === 'AOG' ? 'Director' : 'RMM'}.
          They'll see it in the Approval Inbox.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg transition-colors"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-neutral-100">
      <h1 className="text-2xl font-semibold mb-1">Submit MX Request</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Signed in as <span className="text-neutral-200">{persona?.name ?? '…'}</span>
        {matched && (
          <span className="text-neutral-500"> · {persona.region} · {persona.roleTitle}</span>
        )}
        {!matched && persona && (
          <span className="text-yellow-500"> · email not matched in personnel table</span>
        )}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Aircraft">
          <select required value={form.aircraftTail} onChange={update('aircraftTail')} className={inputCls}>
            <option value="">Select aircraft…</option>
            {aircraft.map((a) => (
              <option key={a.tail} value={a.tail}>
                {a.tail} — {a.type} ({a.base})
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Request Type">
            <select required value={form.requestType} onChange={update('requestType')} className={inputCls}>
              {REQUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select required value={form.priority} onChange={update('priority')} className={inputCls}>
              {Object.keys(PRIORITY_CODES).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Base (override)" optional>
          <input type="text" value={form.base} onChange={update('base')} className={inputCls}
                 placeholder="Defaults to aircraft's home base" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Window Start">
            <input type="datetime-local" required value={form.windowStart} onChange={update('windowStart')} className={inputCls} />
          </Field>
          <Field label="Window End">
            <input type="datetime-local" required value={form.windowEnd} onChange={update('windowEnd')} className={inputCls} />
          </Field>
        </div>

        <Field label="Reason">
          <textarea required rows={3} value={form.reason} onChange={update('reason')} className={inputCls}
                    placeholder="What needs to happen and why" />
        </Field>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black font-semibold rounded-lg transition-colors"
        >
          {status === 'submitting' ? (
            <><Loader2 className="animate-spin" size={16} /> Submitting…</>
          ) : (
            <><Send size={16} /> Submit Request</>
          )}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-100 focus:outline-none focus:border-orange-500 placeholder:text-neutral-600';

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
