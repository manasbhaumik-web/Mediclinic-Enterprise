import React from 'react';
import { useEquipmentEvents, useEquipmentList } from '../../hooks/useEquipment';
import { EquipmentEvent, KIND_LABEL } from '../../domain/equipment';
import { fmtDate } from '../inventory/shared';

const LABEL: Record<EquipmentEvent['kind'], string> = {
  ...KIND_LABEL, registered: 'Registered', edited: 'Edited', fault_reported: 'Fault reported', status_changed: 'Status changed', moved: 'Moved',
  decommissioned: 'Decommissioned', restored: 'Restored',
};
const OUTCOME_CLASS = { pass: 'text-emerald-700', conditional: 'text-amber-700', fail: 'text-rose-700' } as const;

function summary(e: EquipmentEvent): string {
  const d = (e.detail ?? {}) as Record<string, any>;
  if (e.kind === 'status_changed') return `${d.from} → ${d.to}`;
  if (e.kind === 'moved') return `${d.from_location ?? '–'} → ${d.to_location ?? '–'}; ${d.from_custodian ?? '–'} → ${d.to_custodian ?? '–'}`;
  if (e.kind === 'decommissioned') return `Method: ${String(d.method ?? '').replace(/_/g, ' ')}`;
  return '';
}

/** Events in time order, newest first. Nothing here can be edited or deleted. */
export function EventList({ events, loading, names }: { events: EquipmentEvent[]; loading?: boolean; names?: Map<string, string> }) {
  if (!loading && events.length === 0) return <p className="p-4 text-center text-xs text-slate-500">No history yet.</p>;
  return (
    <div className="divide-y divide-line-subtle border border-line-subtle bg-surface">
      {events.map((e) => (
        <div key={e.id} className="px-3 py-2 text-xs">
          <span className="font-mono text-slate-500">{e.performedOn}</span> · <b>{LABEL[e.kind]}</b>
          {names && <> · {names.get(e.equipmentId) ?? '?'}</>}
          {e.outcome && <> · <span className={`font-bold uppercase ${OUTCOME_CLASS[e.outcome]}`}>{e.outcome}</span></>}
          {e.performedBy && <> · by {e.performedBy}</>}
          {e.certificateRef && <> · cert {e.certificateRef}</>}
          {e.cost !== null && <> · RM{e.cost.toFixed(2)}</>}
          {e.nextDue && <> · next due {e.nextDue}</>}
          {summary(e) && <div className="text-slate-600">{summary(e)}</div>}
          {e.findings && <div className="text-slate-600 whitespace-pre-line">{e.findings}</div>}
          <div className="text-2xs text-slate-400">Recorded {fmtDate(e.createdAt)}{e.actorName ? ` by ${e.actorName}` : ''}</div>
        </div>
      ))}
    </div>
  );
}

export default function EquipmentHistory() {
  const events = useEquipmentEvents(null, 300);
  const list = useEquipmentList();
  const names = new Map((list.data ?? []).map((e) => [e.id, `${e.name} (${e.assetTag})`]));
  return (
    <div className="space-y-2">
      <p className="text-2xs text-slate-500">Every registration, service, calibration, fault, move and decommissioning. Nothing here can be edited or deleted.</p>
      <EventList events={events.data ?? []} loading={events.isLoading} names={names} />
    </div>
  );
}
