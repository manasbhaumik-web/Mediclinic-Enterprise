import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { Dialog, Field, Notice, errorMessage, inputClass, todayStr } from '../inventory/shared';
import { useEquipmentActions } from '../../hooks/useEquipment';
import {
  EQUIPMENT_CATEGORIES, EquipmentItem, KIND_LABEL, Outcome, RETIRE_METHODS, RetireMethod, ServiceKind,
} from '../../domain/equipment';

const area = `${inputClass} min-h-[72px]`;

/** Runs a mutation, shows the database's own refusal sentence on failure and closes on success. */
function useSubmit(onDone: () => void) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null); setBusy(true);
    try { await fn(); onDone(); } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };
  return { err, busy, run };
}

function Footer({ onClose, busy, label, danger = false, err }: { onClose: () => void; busy: boolean; label: string; danger?: boolean; err: string | null }) {
  return (
    <>
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant={danger ? 'danger' : 'primary'} size="sm" disabled={busy}>{busy ? 'Saving…' : label}</Button>
      </div>
    </>
  );
}

/** Add or edit an asset record. Status is not edited here; it changes through service records and status changes. */
export function EquipmentForm({ item, onClose }: { item?: EquipmentItem | null; onClose: () => void }) {
  const { save } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const [f, setF] = useState({
    name: item?.name ?? '', type: item?.type ?? 'Diagnostic', asset_tag: item?.assetTag ?? '', serial_number: item?.serialNumber ?? '', model: item?.model ?? '',
    manufacturer: item?.manufacturer ?? '', supplier: item?.supplier ?? '', purchase_date: item?.purchaseDate ?? '', cost_price: item?.costPrice?.toString() ?? '',
    salvage_value: item?.salvageValue?.toString() ?? '0', useful_life_years: item?.usefulLifeYears?.toString() ?? '', warranty_expiry: item?.warrantyExpiry ?? '',
    location: item?.location ?? '', custodian: item?.custodian ?? '', risk_class: item?.riskClass ?? '', service_interval_months: item?.serviceIntervalMonths?.toString() ?? '',
    last_service_date: '', next_service_due: item?.nextServiceDue ?? '', calibration_required: item?.calibrationRequired ?? false,
    calibration_interval_months: item?.calibrationIntervalMonths?.toString() ?? '', last_calibration_date: '', next_calibration_due: item?.nextCalibrationDue ?? '',
    safety_cert_ref: item?.safetyCertRef ?? '', safety_cert_expiry: item?.safetyCertExpiry ?? '', notes: item?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { ...f };
    // Location and custodian change through "Move" once the asset exists, so they are not sent on edit.
    if (item) { delete data.location; delete data.custodian; }
    run(() => save.mutateAsync({ id: item?.id, data }));
  };

  return (
    <Dialog title={item ? `Edit ${item.name}` : 'Register equipment'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Name *"><input className={inputClass} value={f.name} onChange={set('name')} required /></Field>
          <Field label="Category *">
            <select className={inputClass} value={f.type} onChange={set('type')}>{[...new Set([f.type, ...EQUIPMENT_CATEGORIES])].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Risk class">
            <select className={inputClass} value={f.risk_class} onChange={set('risk_class')}><option value="">Not set</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          </Field>
          <Field label="Asset tag (blank = automatic)"><input className={inputClass} value={f.asset_tag} onChange={set('asset_tag')} /></Field>
          <Field label="Serial number"><input className={inputClass} value={f.serial_number} onChange={set('serial_number')} /></Field>
          <Field label="Model"><input className={inputClass} value={f.model} onChange={set('model')} /></Field>
          <Field label="Manufacturer"><input className={inputClass} value={f.manufacturer} onChange={set('manufacturer')} /></Field>
          <Field label="Supplier"><input className={inputClass} value={f.supplier} onChange={set('supplier')} /></Field>
          {!item && <Field label="Location"><input className={inputClass} value={f.location} onChange={set('location')} /></Field>}
          {!item && <Field label="Custodian"><input className={inputClass} value={f.custodian} onChange={set('custodian')} /></Field>}
        </div>

        <p className="type-heading-caps text-ink pt-1">Purchase and depreciation</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Purchase date"><input type="date" max={todayStr()} className={inputClass} value={f.purchase_date} onChange={set('purchase_date')} /></Field>
          <Field label="Cost (RM)"><input type="number" min="0" step="0.01" className={inputClass} value={f.cost_price} onChange={set('cost_price')} /></Field>
          <Field label="Warranty ends"><input type="date" className={inputClass} value={f.warranty_expiry} onChange={set('warranty_expiry')} /></Field>
          <Field label="Useful life (years)"><input type="number" min="1" step="1" className={inputClass} value={f.useful_life_years} onChange={set('useful_life_years')} /></Field>
          <Field label="Salvage value (RM)"><input type="number" min="0" step="0.01" className={inputClass} value={f.salvage_value} onChange={set('salvage_value')} /></Field>
        </div>

        <p className="type-heading-caps text-ink pt-1">Maintenance schedule</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Service every (months)"><input type="number" min="1" step="1" className={inputClass} value={f.service_interval_months} onChange={set('service_interval_months')} /></Field>
          {!item && <Field label="Last serviced"><input type="date" max={todayStr()} className={inputClass} value={f.last_service_date} onChange={set('last_service_date')} /></Field>}
          <Field label={item ? 'Next service due' : 'Next service due (blank = last + interval)'}><input type="date" className={inputClass} value={f.next_service_due} onChange={set('next_service_due')} /></Field>
          <label className="flex items-center gap-2 text-xs font-bold text-ink sm:col-span-3">
            <input type="checkbox" checked={f.calibration_required} onChange={set('calibration_required')} /> Needs calibration
          </label>
          {f.calibration_required && (
            <>
              <Field label="Calibrate every (months) *"><input type="number" min="1" step="1" className={inputClass} value={f.calibration_interval_months} onChange={set('calibration_interval_months')} /></Field>
              {!item && <Field label="Last calibrated"><input type="date" max={todayStr()} className={inputClass} value={f.last_calibration_date} onChange={set('last_calibration_date')} /></Field>}
              <Field label="Next calibration due"><input type="date" className={inputClass} value={f.next_calibration_due} onChange={set('next_calibration_due')} /></Field>
            </>
          )}
          <Field label="Safety certificate no."><input className={inputClass} value={f.safety_cert_ref} onChange={set('safety_cert_ref')} /></Field>
          <Field label="Certificate expires"><input type="date" className={inputClass} value={f.safety_cert_expiry} onChange={set('safety_cert_expiry')} /></Field>
        </div>
        <Field label="Notes"><textarea className={area} value={f.notes} onChange={set('notes')} /></Field>
        <Footer onClose={onClose} busy={busy} label={item ? 'Save changes' : 'Register'} err={err} />
      </form>
    </Dialog>
  );
}

/** Record a service, calibration, inspection or repair. The next due dates move only through this. */
export function ServiceDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { recordService } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const kinds: ServiceKind[] = item.calibrationRequired ? ['service', 'calibration', 'inspection', 'repair'] : ['service', 'inspection', 'repair'];
  const [f, setF] = useState({ kind: 'service' as ServiceKind, performed_on: todayStr(), performed_by: '', outcome: 'pass' as Outcome, findings: '', cost: '', certificate_ref: '', next_due: '', safety_cert_expiry: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => recordService.mutateAsync({ id: item.id, data: { ...f, cost: f.cost === '' ? null : Number(f.cost), next_due: f.next_due || null, safety_cert_expiry: f.safety_cert_expiry || null } }));
  };
  return (
    <Dialog title={`Record work on ${item.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><select className={inputClass} value={f.kind} onChange={set('kind')}>{kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></Field>
          <Field label="Date done"><input type="date" max={todayStr()} className={inputClass} value={f.performed_on} onChange={set('performed_on')} required /></Field>
          <Field label="Done by (technician / vendor) *"><input className={inputClass} value={f.performed_by} onChange={set('performed_by')} required /></Field>
          <Field label="Outcome">
            <select className={inputClass} value={f.outcome} onChange={set('outcome')}><option value="pass">Pass</option><option value="conditional">Conditional</option><option value="fail">Fail (takes it out of service)</option></select>
          </Field>
          {f.kind === 'calibration' && <Field label="Calibration certificate no. *"><input className={inputClass} value={f.certificate_ref} onChange={set('certificate_ref')} /></Field>}
          {f.kind === 'inspection' && <Field label="Safety certificate no."><input className={inputClass} value={f.certificate_ref} onChange={set('certificate_ref')} /></Field>}
          {f.kind === 'inspection' && <Field label="Certificate expires"><input type="date" className={inputClass} value={f.safety_cert_expiry} onChange={set('safety_cert_expiry')} /></Field>}
          <Field label="Cost (RM)"><input type="number" min="0" step="0.01" className={inputClass} value={f.cost} onChange={set('cost')} /></Field>
          {(f.kind === 'service' || f.kind === 'repair' || f.kind === 'calibration') && (
            <Field label="Next due (blank = from interval)"><input type="date" className={inputClass} value={f.next_due} onChange={set('next_due')} /></Field>
          )}
        </div>
        <Field label={f.outcome === 'pass' ? 'Findings (optional)' : 'Findings *'}><textarea className={area} value={f.findings} onChange={set('findings')} /></Field>
        <Footer onClose={onClose} busy={busy} label="Save record" err={err} />
      </form>
    </Dialog>
  );
}

export function FaultDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { reportFault } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const [text, setText] = useState('');
  return (
    <Dialog title={`Report a fault: ${item.name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run(() => reportFault.mutateAsync({ id: item.id, description: text })); }} className="space-y-3">
        <p className="text-xs text-muted">This flags the equipment for maintenance. It stays in use until an administrator takes it out of service.</p>
        <Field label="What is wrong? *"><textarea className={area} value={text} onChange={(e) => setText(e.target.value)} required /></Field>
        <Footer onClose={onClose} busy={busy} label="Report fault" err={err} />
      </form>
    </Dialog>
  );
}

export function StatusDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { setStatus } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const options = (['Operational', 'Maintenance', 'Out of service'] as const).filter((s) => s !== item.status);
  const [status, setS] = useState<(typeof options)[number]>(options[0]);
  const [reason, setReason] = useState('');
  return (
    <Dialog title={`Change status: ${item.name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run(() => setStatus.mutateAsync({ id: item.id, status, reason })); }} className="space-y-3">
        <p className="text-xs text-muted">Now: <b>{item.status}</b>. A passing service or repair also returns equipment to Operational and records the work.</p>
        <Field label="New status"><select className={inputClass} value={status} onChange={(e) => setS(e.target.value as typeof status)}>{options.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Reason *"><textarea className={area} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        <Footer onClose={onClose} busy={busy} label="Change status" err={err} />
      </form>
    </Dialog>
  );
}

export function MoveDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { move } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const [location, setLocation] = useState(item.location ?? '');
  const [custodian, setCustodian] = useState(item.custodian ?? '');
  const [reason, setReason] = useState('');
  return (
    <Dialog title={`Move or reassign: ${item.name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run(() => move.mutateAsync({ id: item.id, location, custodian, reason })); }} className="space-y-3">
        <Field label="Location (room)"><input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        <Field label="Custodian (person responsible)"><input className={inputClass} value={custodian} onChange={(e) => setCustodian(e.target.value)} /></Field>
        <Field label="Reason"><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Footer onClose={onClose} busy={busy} label="Save" err={err} />
      </form>
    </Dialog>
  );
}

export function DecommissionDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { decommission } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const [method, setMethod] = useState<RetireMethod>('disposed');
  const [reason, setReason] = useState('');
  return (
    <Dialog title={`Decommission ${item.name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run(() => decommission.mutateAsync({ id: item.id, reason, method })); }} className="space-y-3">
        <p className="text-xs text-muted">The record and its history are kept. It leaves the active register and stops alerting. It can be restored later.</p>
        <Field label="How did it leave service?"><select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as RetireMethod)}>{RETIRE_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
        <Field label="Reason *"><textarea className={area} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        <Footer onClose={onClose} busy={busy} label="Decommission" danger err={err} />
      </form>
    </Dialog>
  );
}

export function RestoreDialog({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  const { restore } = useEquipmentActions();
  const { err, busy, run } = useSubmit(onClose);
  const [reason, setReason] = useState('');
  return (
    <Dialog title={`Restore ${item.name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); run(() => restore.mutateAsync({ id: item.id, reason })); }} className="space-y-3">
        <p className="text-xs text-muted">It comes back as <b>Out of service</b>. Record a passing service or repair before using it.</p>
        <Field label="Reason *"><textarea className={area} value={reason} onChange={(e) => setReason(e.target.value)} required /></Field>
        <Footer onClose={onClose} busy={busy} label="Restore" err={err} />
      </form>
    </Dialog>
  );
}
