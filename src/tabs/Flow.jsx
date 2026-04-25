import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function FlowTab({ flow }) {
  const [step, setStep] = useState(0);
  const steps = flow.steps;

  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <div className="mb-6">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">Scripted Flow · For Demo Presentation</div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-2">{flow.title}</h1>
        <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">{flow.desc}</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-[12px] disabled:opacity-40 hover:bg-neutral-700"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-black font-medium rounded text-[12px] disabled:opacity-40 hover:bg-orange-400"
        >
          Next <ChevronRight size={14} />
        </button>
        <button
          onClick={() => setStep(0)}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-[12px] hover:bg-neutral-700"
        >
          Reset
        </button>
        <div className="mono text-[11px] text-neutral-500 ml-auto">
          Step {step + 1} / {steps.length}
        </div>
      </div>

      <div className="h-1 bg-neutral-800 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="space-y-2">
        {steps.map((s, idx) => {
          const active = idx === step;
          const done = idx < step;
          return (
            <div
              key={idx}
              className={`flex gap-4 p-4 rounded-lg border transition-all ${
                active ? 'bg-neutral-900 border-orange-500' : done ? 'bg-neutral-900/40 border-neutral-800' : 'bg-neutral-900/20 border-neutral-800/50'
              }`}
              style={{ opacity: active ? 1 : done ? 0.75 : 0.4 }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 mt-0.5 ${
                active ? 'bg-orange-500 text-black' : done ? 'bg-green-600 text-white' : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
              }`}>
                {done ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <div className="flex-1">
                <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{s.actor}</div>
                <div className="text-[14px] font-semibold mb-1">{s.action}</div>
                <div className="text-[12px] text-neutral-400">{s.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
