import Pagination from '../../components/ui/Pagination';
import React, { useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import { useEquipmentEvents, useEquipmentList, useEquipmentSettings } from '../../hooks/useEquipment';
import { EquipmentItem, EquipmentStatus, bookValue, buildEquipmentAlerts, dueState, RETIRE_METHODS } from '../../domain/equipment';
import { fmtDate, inputClass, myr, todayStr, Dialog } from '../inventory/shared';
import { toneClass } from '../payroll/shared';
import { DecommissionDialog, EquipmentForm, FaultDialog, MoveDialog, RestoreDialog, ServiceDialog, StatusDialog } from './EquipmentDialogs';
import { EventList } from './EquipmentHistory';

type Mode = { kind: 'add' } | { kind: 'edit' | 'service' | 'fault' | 'status' | 'move' | 'decommission' | 'restore' | 'detail'; item: EquipmentItem } | null;

const STATUS_TONE: Record<EquipmentStatus, 'ok' | 'warn' | 'bad' | 'idle'> = { Operational: 'ok', Maintenance: 'warn', 'Out of service': 'bad', Decommissioned: 'idle' };
const DUE_CLASS = { overdue: 'text-rose-700 font-bold', soon: 'text-amber-700 font-bold', ok: 'text-muted', none: 'text-slate-400' } as const;

function DueCell({ date, today, soon }: { date: string | null; today: string; soon: number }) {
  const s = dueState(date, today, soon);
  return <span className={`font-mono ${DUE_CLASS[s]}`}>{date ?? 'Not set'}{s === 'overdue' ? ' (overdue)' : ''}</span>;
}

/** The asset register: one row per device with its status and when it is next due. */
export default function EquipmentRegister({ focusId, onFocused }: { focusId?: string | null; onFocused?: () => void }) {
  const list = useEquipmentList();
  const { settings } = useEquipmentSettings();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'active' | EquipmentStatus | 'all'>('active');
  const [mode, setMode] = useState<Mode>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const today = todayStr();
  const soon = settings.data?.dueSoonDays ?? 30;
  const items = list.data ?? [];

  React.useEffect(() => {
    if (focusId && items.length) {
      const it = items.find((i) => i.id === focusId);
      if (it) { setMode({ kind: 'detail', item: it }); onFocused?.(); }
    }
  }, [focusId, items, onFocused]);

  const alertIds = useMemo(() => new Set(buildEquipmentAlerts(items, soon, today).filter((a) => a.severity !== 'info').map((a) => a.equipmentId)), [items, soon, today]);
  const shown = items.filter((e) => {
    const text = `${e.name} ${e.assetTag} ${e.serialNumber ?? ''} ${e.location ?? ''} ${e.custodian ?? ''} ${e.manufacturer ?? ''}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (status === 'active') return e.status !== 'Decommissioned';
    return status === 'all' || e.status === status;
  });
  const paginatedShown = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const close = () => setMode(null);
  const open = (kind: Exclude<NonNullable<Mode>, { kind: 'add' }>['kind'], item: EquipmentItem) => setMode({ kind, item } as Mode);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input className={`${inputClass} !w-72`} placeholder="Search name, tag, serial, room or person" value={q} onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }} aria-label="Search equipment" />
        <select className={`${inputClass} !w-48`} value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setCurrentPage(1); }} aria-label="Status filter">
          <option value="active">All in service</option><option value="Operational">Operational</option><option value="Maintenance">Needs maintenance</option>
          <option value="Out of service">Out of service</option><option value="Decommissioned">Decommissioned</option><option value="all">Everything</option>
        </select>
        <Button size="sm" onClick={() => setMode({ kind: 'add' })}>Register equipment</Button>
        <span className="text-2xs text-subtle">{shown.length} of {items.length}. Equipment is never deleted; it is decommissioned and its history stays.</span>
      </div>

      {list.isError && <p role="alert" className="text-xs font-bold text-rose-700">Could not load equipment. {(list.error as Error)?.message}</p>}
      {!list.isLoading && items.length === 0 && (
        <p className="text-xs text-subtle bg-surface border border-line-subtle p-6 text-center">No equipment registered yet. Use “Register equipment” to add the first device.</p>
      )}

      {items.length > 0 && (
        <div className="bg-surface border border-line-subtle overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Equipment</th><th className="p-3">Location / custodian</th><th className="p-3">Status</th><th className="p-3">Next service</th><th className="p-3">Next calibration</th><th className="p-3 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {paginatedShown.map((e) => (
                <tr key={e.id} className="border-b border-line-subtle align-top">
                  <td className="p-3">
                    <button className="font-bold text-ink text-left hover:underline cursor-pointer" onClick={() => open('detail', e)}>{e.name}</button>
                    <div className="text-2xs text-subtle font-mono">{e.assetTag}{e.serialNumber ? ` · S/N ${e.serialNumber}` : ''}</div>
                    <div className="text-2xs text-subtle">{e.type}{e.riskClass ? ` · ${e.riskClass} risk` : ''}</div>
                  </td>
                  <td className="p-3">{e.location ?? <span className="text-slate-400">No location</span>}<div className="text-2xs text-subtle">{e.custodian ?? 'No custodian'}</div></td>
                  <td className="p-3">
                    <span className={`inline-block text-2xs font-bold uppercase px-2 py-0.5 border ${toneClass[STATUS_TONE[e.status]]}`}>{e.status}</span>
                    {alertIds.has(e.id) && e.status !== 'Out of service' && <div className="text-2xs text-amber-700 font-bold mt-1">Needs attention</div>}
                  </td>
                  <td className="p-3"><DueCell date={e.status === 'Decommissioned' ? null : e.nextServiceDue} today={today} soon={soon} /></td>
                  <td className="p-3">{e.calibrationRequired && e.status !== 'Decommissioned' ? <DueCell date={e.nextCalibrationDue} today={today} soon={soon} /> : <span className="text-slate-400">n/a</span>}</td>
                  <td className="p-3 text-right whitespace-nowrap space-x-1">
                    {e.status === 'Decommissioned' ? (
                      <Button variant="outline" size="sm" onClick={() => open('restore', e)}>Restore</Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => open('service', e)}>Record work</Button>
                        <Button variant="ghost" size="sm" onClick={() => open('fault', e)}>Fault</Button>
                        <Button variant="ghost" size="sm" onClick={() => open('status', e)}>Status</Button>
                        <Button variant="ghost" size="sm" onClick={() => open('move', e)}>Move</Button>
                        <Button variant="ghost" size="sm" onClick={() => open('edit', e)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => open('decommission', e)}>Decommission</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td className="p-6 text-center text-subtle" colSpan={6}>Nothing matches.</td></tr>}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={shown.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="devices"
          />
        </div>
      )}

      {mode?.kind === 'add' && <EquipmentForm onClose={close} />}
      {mode?.kind === 'edit' && <EquipmentForm item={mode.item} onClose={close} />}
      {mode?.kind === 'service' && <ServiceDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'fault' && <FaultDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'status' && <StatusDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'move' && <MoveDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'decommission' && <DecommissionDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'restore' && <RestoreDialog item={mode.item} onClose={close} />}
      {mode?.kind === 'detail' && <Detail item={mode.item} today={today} onClose={close} />}
    </div>
  );
}

function Detail({ item, today, onClose }: { item: EquipmentItem; today: string; onClose: () => void }) {
  const events = useEquipmentEvents(item.id, 100);
  const bv = bookValue(item, today);
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-4 border-b border-line-subtle py-1"><span className="text-subtle">{k}</span><span className="font-medium text-ink text-right">{v ?? '–'}</span></div>;
  return (
    <Dialog title={`${item.name} (${item.assetTag})`} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-x-6 text-xs">
        <div>
          {row('Status', item.status)}{row('Category', item.type)}{row('Model', item.model)}{row('Manufacturer', item.manufacturer)}{row('Supplier', item.supplier)}
          {row('Serial number', item.serialNumber)}{row('Location', item.location)}{row('Custodian', item.custodian)}{row('Risk class', item.riskClass)}
        </div>
        <div>
          {row('Purchased', item.purchaseDate)}{row('Cost', item.costPrice === null ? null : myr(item.costPrice))}{row('Warranty ends', item.warrantyExpiry)}
          {row('Book value today', bv ? `${myr(bv.bookValue)} (straight-line, ${myr(bv.annual)}/yr)` : 'Needs cost, purchase date and useful life')}
          {row('Last service', item.lastServiceDate)}{row('Next service', item.nextServiceDue)}
          {row('Calibration', item.calibrationRequired ? `${item.lastCalibrationDate ?? 'never'} → due ${item.nextCalibrationDue ?? 'not set'}` : 'Not required')}
          {row('Safety certificate', item.safetyCertRef ? `${item.safetyCertRef}${item.safetyCertExpiry ? `, expires ${item.safetyCertExpiry}` : ''}` : null)}
          {item.status === 'Decommissioned' && row('Decommissioned', `${RETIRE_METHODS.find((m) => m.value === item.retireMethod)?.label ?? ''}: ${item.retireReason ?? ''} (${fmtDate(item.retiredAt)})`)}
        </div>
      </div>
      {item.notes && <p className="text-xs text-muted whitespace-pre-line">{item.notes}</p>}
      <p className="type-heading-caps text-ink pt-2">History</p>
      <EventList events={events.data ?? []} loading={events.isLoading} />
      <div className="flex justify-end pt-1"><Button variant="outline" size="sm" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
}
