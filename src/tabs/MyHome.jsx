import React from 'react';
import { User, AlertCircle, MapPin, Briefcase } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import DirectorHome from '../homes/Director';
import RMMHome from '../homes/RMM';
import AMTHome from '../homes/AMT';
import QAHome from '../homes/QA';
import MXSchedulerHome from '../homes/MXScheduler';

const HOMES = {
  DIRECTOR:     DirectorHome,
  RMM:          RMMHome,
  AMT:          AMTHome,
  QA:           QAHome,
  MX_SCHEDULER: MXSchedulerHome
};

export default function MyHome() {
  const { account, persona, matched, loading } = useCurrentUser();

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Resolving your profile…</div>;
  }

  if (!account) {
    return <div className="p-8 text-neutral-400 text-sm">Not signed in.</div>;
  }

  const Home = HOMES[persona?.role] ?? AMTHome;

  return (
    <div className="grid-bg min-h-full">
      {/* Personalized greeting banner */}
      <div className="px-7 pt-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between p-4 mb-5 rounded-lg bg-gradient-to-r from-orange-500/10 to-neutral-900 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-semibold shrink-0">
              {persona.initials}
            </div>
            <div>
              <div className="text-base font-semibold">
                Welcome, {persona.name?.split(' ')[0] ?? 'there'}
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><Briefcase size={11} /> {persona.roleTitle}</span>
                {persona.region && persona.region !== 'ALL' && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {persona.region}</span>
                )}
                {persona.base && persona.base !== '—' && (
                  <span className="text-neutral-500">· {persona.base}</span>
                )}
              </div>
            </div>
          </div>
          {!matched && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-900/30 border border-yellow-700/40">
              <AlertCircle size={12} className="text-yellow-400" />
              <span className="text-xs text-yellow-400">
                Not in personnel directory — using default AMT view
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="fade-slide px-7 pb-7 max-w-[1400px] mx-auto" key={persona.id}>
        <Home persona={persona} />
      </div>
    </div>
  );
}
