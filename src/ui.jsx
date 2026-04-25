import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BULLETINS } from './data';

export function PageHeader({ persona, subtitle }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="mb-6">
      <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">{persona.roleTitle}</div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-[28px] font-semibold tracking-tight m-0">Good afternoon, {persona.name.split(' ')[0]}</h1>
        <div className="mono text-[12px] text-neutral-500">{today}</div>
      </div>
      {subtitle && <div className="text-[14px] text-neutral-400 mt-2">{subtitle}</div>}
    </div>
  );
}

export function Card({ title, action, accent, children, noPad }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
         style={accent ? { borderTop: `2px solid ${accent}` } : undefined}>
      {(title || action) && (
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-neutral-800">
          <div className="text-[13px] font-semibold tracking-tight">{title}</div>
          {action && <div className="text-[12px] text-neutral-400">{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : title ? 'px-[18px] py-3.5' : 'p-[18px]'}>{children}</div>
    </div>
  );
}

export function Metric({ label, value, sub, accent, pulse }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-[32px] font-semibold tracking-tight leading-none ${pulse ? 'pulse-red' : ''}`}
             style={{ color: accent }}>{value}</div>
        {sub && <div className="mono text-[11px] text-neutral-500">{sub}</div>}
      </div>
    </div>
  );
}

export function StatusDot({ status }) {
  const map = { IN_SERVICE: 'bg-green-500', AOG: 'bg-red-500 pulse-red', MAINTENANCE: 'bg-amber-500' };
  return <div className={`w-2 h-2 rounded-full ${map[status]}`} />;
}

export function BulletinBanner() {
  const [i, setI] = useState(0);
  const b = BULLETINS[i];
  const styles = {
    ALERT: { border: '#ef4444', bg: 'rgba(239,68,68,0.08)', dot: 'bg-red-500', text: 'text-red-400' },
    ADVISORY: { border: '#eab308', bg: 'rgba(234,179,8,0.08)', dot: 'bg-amber-500', text: 'text-amber-400' },
    INFO: { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', dot: 'bg-blue-500', text: 'text-blue-400' },
  }[b.level];

  return (
    <div className="mb-5 flex items-center gap-4 px-4 py-3 rounded-md"
         style={{ background: styles.bg, borderLeft: `3px solid ${styles.border}` }}>
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-2 h-2 rounded-full ${styles.dot} ${b.level === 'ALERT' ? 'pulse-red' : ''}`} />
        <span className={`mono text-[10px] font-semibold tracking-widest ${styles.text}`}>{b.level}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{b.title}</div>
        <div className="text-[12px] text-neutral-400 mt-0.5">{b.message}</div>
      </div>
      <div className="mono text-[11px] text-neutral-500 shrink-0">{i + 1} / {BULLETINS.length}</div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setI((i - 1 + BULLETINS.length) % BULLETINS.length)}
                className="w-6 h-6 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => setI((i + 1) % BULLETINS.length)}
                className="w-6 h-6 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
