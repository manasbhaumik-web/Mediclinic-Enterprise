import React, { useState } from 'react';
import { useHrEvents, useStaffForLeave } from '../../hooks/useLeave';
import { inputClass } from '../payroll/shared';

const ENTITIES: [string, string][] = [
  ['', 'Everything'], ['leave_request', 'Leave requests'], ['attendance', 'Attendance'], ['leave_rules', 'Entitlement rules'],
  ['leave_types', 'Leave types'], ['public_holidays', 'Public holidays'], ['leave_settings', 'Settings'],
];

/** The append-only HR history: who did what, and when. Nothing here can be edited or deleted. */
export default function HistoryPanel() {
  const [entity, setEntity] = useState('');
  const events = useHrEvents(entity || undefined);
  const staff = useStaffForLeave();
  const name = new Map((staff.data ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600">Show
        <select className={`${inputClass} !w-52`} value={entity} onChange={(e) => setEntity(e.target.value)}>{ENTITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {(events.data ?? []).map((e) => (
          <div key={e.id} className="px-3 py-2 text-xs">
            <span className="font-mono text-slate-500">{new Date(e.createdAt).toLocaleString()}</span> · <b>{e.entity.replace(/_/g, ' ')}</b> · {e.action.replace(/_/g, ' ')}
            {e.staffId && name.get(e.staffId) && <> · {name.get(e.staffId)}</>}
            {e.detail && <div className="text-slate-500 break-words">{Object.entries(e.detail).filter(([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'before' && k !== 'after').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ')}</div>}
          </div>
        ))}
        {(events.data ?? []).length === 0 && <p className="p-4 text-xs text-slate-500">Nothing recorded yet.</p>}
      </div>
    </div>
  );
}
