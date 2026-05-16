import React, { useState } from 'react';
import { Check, X, ChevronsUp, Undo2, AlertCircle, Loader2, Inbox, Plane } from 'lucide-react';
import { useDataverse } from '../hooks/useDataverse';
import { useFleet } from '../contexts/FleetDataContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { TABLES } from '../auth/tables';

// Status code mapping (from Dataverse choice column)
const STATUS_CODE = {
  Approved:  0,
  Submitted: 1,
  Denied:    2,
  Escalated: 3,
  Returned:  4
};

export default function ApprovalInbox() {
  const { patch, create } = useDataverse();
  const { mxRequests, loading } = useFleet();
  const { persona } = useCurrentUser();
  const [comment, setComment] = useState({});       // per-request comment text
  const [busy, setBusy] = useState(null);           // request id currently patching
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState({});       // optimistic status overrides

  // Filter to pending requests routed to this user's role
  const visible = mxRequests
    .filter((r) => {
      const liveStatus = updated[r.id]?.status ?? r.status;
      return liveStatus === 'Submitted' || liveStatus === 'Escalated';
    })
    .filter((r) => {
      if (!persona) return true;
      // RMMs see requests routed to RMM, Directors see Director-routed (incl. escalations)
      if (persona.role === 'DIRECTOR') return r.routing === 'Director' || r.routing === 'RMM';
      if (persona.role === 'RMM') return r.routing === 'RMM';
      return true;
    });

  async function decide(req, decision) {
    setBusy(req.id);
    setError(null);
    const newStatusCode = STATUS_CODE[decision] ?? 1;
    const commentText = comment[req.id] ?? '';

    try {
      // 1. Patch the MX Request row
      const patchBody = {
        cr463_requeststatus: newStatusCode,
        cr463_decisioncomments: commentText,
        cr463_approvername: persona?.name ?? 'Unknown',
        cr463_decisiontimestamp: new Date().toISOString()
      };
      // Escalate doesn't decide — keeps status Escalated and reroutes to Director
      if (decision === 'Escalated') {
        patchBody.cr463_routingcode = 'Director';
      }
      await patch(TABLES.mxRequest, req.id, patchBody);

      // 2. Write audit log
      try {
        await create(TABLES.audit, {
          cr463_audittitle: `${req.requestNumber} ${decision.toLowerCase()}`,
          cr463_action:     `mx_request.${decision.toLowerCase()}`,
          cr463_actor:      persona?.name ?? 'Unknown',
          cr463_actorrole:  persona?.role ?? '',
          cr463_subjecttable: 'MX Requests',
          cr463_subjectid:    req.requestNumber,
          cr463_eventat:    new Date().toISOString(),
          cr463_notes:      commentText
        });
      } catch (auditErr) {
        console.warn('Audit write failed:', auditErr);
      }

      // 3. Optimistic local update
      setUpdated((u) => ({ ...u, [req.id]: { status: decision } }));
      setComment((c) => ({ ...c, [req.id]: '' }));
    } catch (e) {
      setError(`${decision} failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Loading approval inbox…</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-neutral-100">
      <div className="flex items-center gap-3 mb-1">
        <Inbox size={22} className="text-orange-400" />
        <h1 className="text-2xl font-semibold">Approval Inbox</h1>
      </div>
      <p className="text-sm text-neutral-400 mb-6">
        Pending requests routed to <span className="text-neutral-200">{persona?.roleTitle ?? '…'}</span>
        {persona?.region && persona.region !== 'ALL' && (
          <span className="text-neutral-500"> · {persona.region}</span>
        )}
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {visible.length === 0 && (
        <div className="p-12 text-center text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-900/30">
          <Inbox size={32} className="mx-auto mb-3 opacity-50" />
          No pending requests
        </div>
      )}

      <div className="space-y-3">
        {visible.map((req) => (
          <RequestCard
            key={req.id}
            req={req}
            comment={comment[req.id] ?? ''}
            setComment={(v) => setComment((c) => ({ ...c, [req.id]: v }))}
            onDecide={(d) => decide(req, d)}
            busy={busy === req.id}
          />
        ))}
      </div>

      {Object.keys(updated).length > 0 && (
        <p className="mt-6 text-xs text-neutral-500">
          Decisions made this session: {Object.keys(updated).length}. Refresh to re-fetch from Dataverse.
        </p>
      )}
    </div>
  );
}

function RequestCard({ req, comment, setComment, onDecide, busy }) {
  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Plane size={14} className="text-neutral-400" />
              <span className="font-mono text-xs text-neutral-400">{req.requestNumber}</span>
              {req.priority && req.priority !== 'Normal' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  req.priority === 'AOG' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'
                }`}>
                  {req.priority}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold">
              {req.aircraftTail} — {req.type}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              {req.aircraftType} · {req.base}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <div>by {req.requestedBy}</div>
            {req.routing && <div className="mt-1">→ {req.routing}</div>}
          </div>
        </div>
        {req.reason && (
          <p className="mt-3 text-sm text-neutral-300 border-l-2 border-neutral-800 pl-3">
            {req.reason}
          </p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Decision comment (required for Deny / Return)"
          rows={2}
          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm focus:outline-none focus:border-orange-500 placeholder:text-neutral-600"
        />
        <div className="grid grid-cols-4 gap-2">
          <Btn icon={Check}      label="Approve"  color="green"  onClick={() => onDecide('Approved')} disabled={busy} />
          <Btn icon={X}          label="Deny"     color="red"    onClick={() => onDecide('Denied')}   disabled={busy || !comment} />
          <Btn icon={ChevronsUp} label="Escalate" color="orange" onClick={() => onDecide('Escalated')} disabled={busy} />
          <Btn icon={Undo2}      label="Return"   color="yellow" onClick={() => onDecide('Returned')} disabled={busy || !comment} />
        </div>
      </div>
    </div>
  );
}

function Btn({ icon: Icon, label, color, onClick, disabled }) {
  const colors = {
    green:  'bg-green-600/20 hover:bg-green-600/40 border-green-700 text-green-400',
    red:    'bg-red-600/20 hover:bg-red-600/40 border-red-700 text-red-400',
    orange: 'bg-orange-600/20 hover:bg-orange-600/40 border-orange-700 text-orange-400',
    yellow: 'bg-yellow-600/20 hover:bg-yellow-600/40 border-yellow-700 text-yellow-400'
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border font-medium text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${colors[color]}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
