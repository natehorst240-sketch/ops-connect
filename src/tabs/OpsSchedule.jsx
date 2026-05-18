import React from 'react';
import OpsScheduleBoard from '../shared/OpsScheduleBoard';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { PageHeader } from '../ui';

export default function OpsSchedule() {
  const { persona } = useCurrentUser();

  return (
    <div className="p-4 max-w-full">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Operations Schedule</h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          MX on-call and pilot schedules from CompleteFlight · Clinical, OCC, and dispatch from Protean
        </p>
      </div>
      <OpsScheduleBoard persona={persona} />
    </div>
  );
}
