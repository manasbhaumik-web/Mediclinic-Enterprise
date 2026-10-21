/** Equipment & assets: types, row mappers and the calculations the screens share (due dates, alerts, depreciation). */

export type EquipmentStatus = 'Operational' | 'Maintenance' | 'Out of service' | 'Decommissioned';
export type RiskClass = 'low' | 'medium' | 'high';
export type ServiceKind = 'service' | 'calibration' | 'inspection' | 'repair';
export type Outcome = 'pass' | 'conditional' | 'fail';
export type RetireMethod = 'disposed' | 'sold' | 'donated' | 'scrapped' | 'returned_to_vendor' | 'lost';

export const RETIRE_METHODS: { value: RetireMethod; label: string }[] = [
  { value: 'disposed', label: 'Disposed' }, { value: 'sold', label: 'Sold' }, { value: 'donated', label: 'Donated' },
  { value: 'scrapped', label: 'Scrapped' }, { value: 'returned_to_vendor', label: 'Returned to vendor' }, { value: 'lost', label: 'Lost' },
];
export const EQUIPMENT_CATEGORIES = ['Diagnostic', 'Imaging', 'Laboratory', 'Sterilization', 'Surgical', 'Monitoring', 'Furniture', 'IT / Office', 'Other'];
export const KIND_LABEL: Record<ServiceKind, string> = { service: 'Service', calibration: 'Calibration', inspection: 'Safety inspection', repair: 'Repair' };

export interface EquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  model: string | null;
  manufacturer: string | null;
  supplier: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  costPrice: number | null;
  warrantyExpiry: string | null;
  usefulLifeYears: number | null;
  salvageValue: number;
  location: string | null;
  custodian: string | null;
  riskClass: RiskClass | null;
  serviceIntervalMonths: number | null;
  calibrationRequired: boolean;
  calibrationIntervalMonths: number | null;
  lastServiceDate: string | null;
  nextServiceDue: string | null;
  lastCalibrationDate: string | null;
  nextCalibrationDue: string | null;
  safetyCertRef: string | null;
  safetyCertExpiry: string | null;
  notes: string | null;
  status: EquipmentStatus;
  retiredAt: string | null;
  retireReason: string | null;
  retireMethod: RetireMethod | null;
}

export interface EquipmentEvent {
  id: string;
  seq: number;
  equipmentId: string;
  kind: 'registered' | 'edited' | ServiceKind | 'fault_reported' | 'status_changed' | 'moved' | 'decommissioned' | 'restored';
  performedOn: string;
  performedBy: string | null;
  outcome: Outcome | null;
  findings: string | null;
  cost: number | null;
  certificateRef: string | null;
  nextDue: string | null;
  detail: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));

export function equipmentFromRow(r: Record<string, any>): EquipmentItem {
  return {
    id: r.id, assetTag: r.asset_tag, name: r.name, type: r.type ?? 'Other', model: r.model ?? null, manufacturer: r.manufacturer ?? null,
    supplier: r.supplier ?? null, serialNumber: r.serial_number ?? null, purchaseDate: r.purchase_date ?? null, costPrice: num(r.cost_price),
    warrantyExpiry: r.warranty_expiry ?? null, usefulLifeYears: num(r.useful_life_years), salvageValue: num(r.salvage_value) ?? 0,
    location: r.location ?? null, custodian: r.custodian ?? null, riskClass: r.risk_class ?? null, serviceIntervalMonths: num(r.service_interval_months),
    calibrationRequired: !!r.calibration_required, calibrationIntervalMonths: num(r.calibration_interval_months),
    lastServiceDate: r.last_service_date ?? null, nextServiceDue: r.next_maintenance ?? null,
    lastCalibrationDate: r.last_calibration_date ?? null, nextCalibrationDue: r.next_calibration_due ?? null,
    safetyCertRef: r.safety_cert_ref ?? null, safetyCertExpiry: r.safety_cert_expiry ?? null, notes: r.notes ?? null,
    status: r.status, retiredAt: r.retired_at ?? null, retireReason: r.retire_reason ?? null, retireMethod: r.retire_method ?? null,
  };
}

export function equipmentEventFromRow(r: Record<string, any>): EquipmentEvent {
  return {
    id: r.id, seq: Number(r.seq), equipmentId: r.equipment_id, kind: r.kind, performedOn: r.performed_on, performedBy: r.performed_by ?? null,
    outcome: r.outcome ?? null, findings: r.findings ?? null, cost: num(r.cost), certificateRef: r.certificate_ref ?? null, nextDue: r.next_due ?? null,
    detail: r.detail ?? null, actorName: r.actor_name ?? null, createdAt: r.created_at,
  };
}

const MS_DAY = 86_400_000;
/** Whole days from `from` to `to` (both YYYY-MM-DD); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_DAY);
}

export type DueState = 'none' | 'ok' | 'soon' | 'overdue';
export function dueState(due: string | null | undefined, today: string, soonDays: number): DueState {
  if (!due) return 'none';
  const d = daysBetween(today, due);
  if (d < 0) return 'overdue';
  return d <= soonDays ? 'soon' : 'ok';
}

/** Straight-line depreciation. Book value never falls below the salvage value; null when cost, purchase date or useful life is missing. */
export function bookValue(item: Pick<EquipmentItem, 'costPrice' | 'purchaseDate' | 'usefulLifeYears' | 'salvageValue'>, today: string): { bookValue: number; accumulated: number; annual: number } | null {
  if (item.costPrice === null || !item.purchaseDate || !item.usefulLifeYears) return null;
  const depreciable = Math.max(item.costPrice - item.salvageValue, 0);
  const annual = depreciable / item.usefulLifeYears;
  const years = Math.max(daysBetween(item.purchaseDate, today), 0) / 365.25;
  const accumulated = Math.min(annual * years, depreciable);
  const round = (n: number) => Math.round(n * 100) / 100;
  return { bookValue: round(item.costPrice - accumulated), accumulated: round(accumulated), annual: round(annual) };
}

export type AlertKind =
  | 'out_of_service' | 'needs_attention' | 'service_overdue' | 'service_soon' | 'calibration_overdue' | 'calibration_soon'
  | 'cert_expired' | 'cert_soon' | 'warranty_soon' | 'no_schedule';
export interface EquipmentAlert { kind: AlertKind; severity: 'critical' | 'warn' | 'info'; equipmentId: string; detail: string }

/** Everything that needs attention today. Decommissioned equipment never alerts. */
export function buildEquipmentAlerts(items: EquipmentItem[], soonDays: number, today: string): EquipmentAlert[] {
  const out: EquipmentAlert[] = [];
  for (const e of items) {
    if (e.status === 'Decommissioned') continue;
    const add = (kind: AlertKind, severity: EquipmentAlert['severity'], detail: string) => out.push({ kind, severity, equipmentId: e.id, detail });
    const when = (d: string) => { const n = daysBetween(today, d); return n < 0 ? `${-n} day${n === -1 ? '' : 's'} overdue` : n === 0 ? 'due today' : `due in ${n} day${n === 1 ? '' : 's'}`; };

    if (e.status === 'Out of service') add('out_of_service', 'critical', 'Out of service');
    if (e.status === 'Maintenance') add('needs_attention', 'warn', 'Flagged for maintenance');

    const svc = dueState(e.nextServiceDue, today, soonDays);
    if (svc === 'overdue') add('service_overdue', e.riskClass === 'high' ? 'critical' : 'warn', `Service ${when(e.nextServiceDue!)}`);
    else if (svc === 'soon') add('service_soon', 'info', `Service ${when(e.nextServiceDue!)}`);
    else if (svc === 'none') add('no_schedule', 'info', 'No service date set');

    if (e.calibrationRequired) {
      const cal = dueState(e.nextCalibrationDue, today, soonDays);
      if (cal === 'overdue') add('calibration_overdue', 'critical', `Calibration ${when(e.nextCalibrationDue!)}`);
      else if (cal === 'soon') add('calibration_soon', 'info', `Calibration ${when(e.nextCalibrationDue!)}`);
      else if (cal === 'none') add('calibration_overdue', 'warn', 'Calibration required but never recorded');
    }
    const cert = dueState(e.safetyCertExpiry, today, soonDays);
    if (cert === 'overdue') add('cert_expired', 'critical', `Safety certificate expired ${-daysBetween(today, e.safetyCertExpiry!)} days ago`);
    else if (cert === 'soon') add('cert_soon', 'info', `Safety certificate expires in ${daysBetween(today, e.safetyCertExpiry!)} days`);
    if (dueState(e.warrantyExpiry, today, soonDays) === 'soon') add('warranty_soon', 'info', `Warranty ends in ${daysBetween(today, e.warrantyExpiry!)} days`);
  }
  const rank = { critical: 0, warn: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Equipment can be used only while Operational (or flagged but still running). */
export const isUsable = (e: Pick<EquipmentItem, 'status'>) => e.status === 'Operational' || e.status === 'Maintenance';
