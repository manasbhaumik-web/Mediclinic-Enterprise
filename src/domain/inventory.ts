/** Types, mappers and rules for Inventory & Pharmacy. The database functions are authoritative; these mirror them for display. */

export type ControlClass = 'poison_group_b' | 'poison_group_c' | 'dangerous_drug' | 'psychotropic' | 'other_controlled';

export const CONTROL_CLASSES: { value: ControlClass; label: string }[] = [
  { value: 'poison_group_b', label: 'Poison, Group B' },
  { value: 'poison_group_c', label: 'Poison, Group C' },
  { value: 'dangerous_drug', label: 'Dangerous drug' },
  { value: 'psychotropic', label: 'Psychotropic substance' },
  { value: 'other_controlled', label: 'Other controlled' },
];
export const controlClassLabel = (c: ControlClass | null | undefined) => CONTROL_CLASSES.find((x) => x.value === c)?.label ?? '';

export interface DrugBatch {
  id: string;
  batchId: string;               // the batch number on the pack
  stock: number;
  expiryDate: string | null;
  receivedAt?: string;
  supplierId?: string | null;
  unitCost?: number | null;
}

export interface DrugItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  price: number;
  costPrice?: number | null;
  reorderQuantity?: number | null;
  unit: string;
  status: 'active' | 'retired';
  retireReason?: string | null;
  registerRequired: boolean;
  controlClass: ControlClass | null;
  /** Same as registerRequired; kept for the screens that read it. */
  isControlledDrug?: boolean;
  expiryDate?: string;
  batches?: DrugBatch[];
  consumptionVelocity?: number;
  drugType?: string;
  manufacturer?: string;
  genericName?: string;
  indications?: string;
  sideEffects?: string;
  suggestedDosage?: { adults?: string; children?: string };
}

export interface StockMovement {
  id: string;
  seq: number;
  inventoryId: string;
  batchId: string | null;
  type: 'opening' | 'receive' | 'dispense' | 'dispose' | 'internal_use' | 'decrease' | 'increase';
  quantity: number;               // signed
  balanceAfter: number;
  reason: string | null;
  visitId: string | null;
  poId: string | null;
  actorName: string | null;
  createdAt: string;
}

/** Shape other screens already use: amount is positive, type is one of three labels. */
export interface InventoryLog {
  id: string;
  date: string;
  drugId: string;
  drugName: string;
  type: 'Disposal' | 'Internal Use' | 'Dispensed';
  amount: number;
  reason: string;
}

export interface Supplier { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; notes: string | null; active: boolean }

export type PoStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface PoLine { id: string; poId: string; inventoryId: string; quantityOrdered: number; quantityReceived: number; unitCost: number | null }

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: PoStatus;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
  orderedAt: string | null;
  cancelReason: string | null;
  lines: PoLine[];
}

export interface RegisterEntry {
  id: string;
  seq: number;
  inventoryId: string;
  entryType: 'opening' | 'receipt' | 'dispense' | 'disposal' | 'internal_use' | 'adjustment';
  quantity: number;
  balanceAfter: number;
  patientName: string | null;
  patientIc: string | null;
  prescriberName: string | null;
  reference: string | null;
  reason: string | null;
  performedBy: string;
  performedByName: string | null;
  visitId: string | null;
  createdAt: string;
  signedBy: string | null;
  signedByName: string | null;
  signedAt: string | null;
}

export interface InventoryEvent { id: string; entity: string; entityId: string | null; action: string; actor: string | null; detail: Record<string, unknown> | null; createdAt: string }

export const PO_STYLE: Record<PoStatus, { label: string; tone: 'idle' | 'info' | 'warn' | 'ok' | 'bad' }> = {
  draft: { label: 'Draft', tone: 'idle' },
  ordered: { label: 'Ordered', tone: 'info' },
  partially_received: { label: 'Part received', tone: 'warn' },
  received: { label: 'Received', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

export const MOVEMENT_LABEL: Record<StockMovement['type'], string> = {
  opening: 'Opening balance', receive: 'Received', dispense: 'Dispensed', dispose: 'Disposed', internal_use: 'Used in clinic', decrease: 'Count correction (down)', increase: 'Count correction (up)',
};

// ---- stock arithmetic ---------------------------------------------------------------------------------------

export const isExpired = (b: Pick<DrugBatch, 'expiryDate'>, today: string) => !!b.expiryDate && b.expiryDate < today;

/** Stock that can be dispensed today: batches that are in date. */
export const usableStock = (d: Pick<DrugItem, 'batches'>, today: string): number =>
  (d.batches ?? []).filter((b) => b.stock > 0 && !isExpired(b, today)).reduce((s, b) => s + b.stock, 0);

export interface FefoAllocation { batchId: string; batchNumber: string; quantity: number; expiryDate: string | null }

/** Which batches a dispense would draw from: soonest expiry first, unknown expiry last. Mirrors inv_take_stock. */
export function allocateFefo(batches: DrugBatch[], quantity: number, today: string): { allocations: FefoAllocation[]; shortfall: number } {
  const usable = batches
    .filter((b) => b.stock > 0 && !isExpired(b, today))
    .sort((a, b) => {
      if (a.expiryDate !== b.expiryDate) {
        if (a.expiryDate === null) return 1;
        if (b.expiryDate === null) return -1;
        return a.expiryDate < b.expiryDate ? -1 : 1;
      }
      return (a.receivedAt ?? '') < (b.receivedAt ?? '') ? -1 : (a.receivedAt ?? '') > (b.receivedAt ?? '') ? 1 : a.id < b.id ? -1 : 1;
    });
  const allocations: FefoAllocation[] = [];
  let left = quantity;
  for (const b of usable) {
    if (left <= 0) break;
    const take = Math.min(b.stock, left);
    allocations.push({ batchId: b.id, batchNumber: b.batchId, quantity: take, expiryDate: b.expiryDate });
    left -= take;
  }
  return { allocations, shortfall: Math.max(0, left) };
}

// ---- alerts -------------------------------------------------------------------------------------------------

export type AlertKind = 'out_of_stock' | 'low_stock' | 'expired_stock' | 'near_expiry' | 'no_expiry';

export interface StockAlert {
  kind: AlertKind;
  severity: 'critical' | 'warn' | 'info';
  drugId: string;
  drugName: string;
  batchId?: string;
  detail: string;
  /** For stock alerts: a suggested order quantity. */
  suggestedOrder?: number;
}

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);

/** How many to order: the drug's own reorder quantity, else enough to reach twice the reorder level. */
export const suggestOrderQuantity = (d: Pick<DrugItem, 'reorderQuantity' | 'minThreshold'>, usable: number): number =>
  d.reorderQuantity && d.reorderQuantity > 0 ? d.reorderQuantity : Math.max(1, d.minThreshold * 2 - usable);

/** Alerts for active drugs, driven by each drug's reorder level and the near-expiry window. Most severe first. */
export function buildAlerts(items: DrugItem[], nearExpiryDays: number, today: string): StockAlert[] {
  const out: StockAlert[] = [];
  for (const d of items) {
    if (d.status !== 'active') continue;
    const usable = usableStock(d, today);
    if (usable === 0) {
      out.push({ kind: 'out_of_stock', severity: 'critical', drugId: d.id, drugName: d.name, detail: 'No in-date stock.', suggestedOrder: suggestOrderQuantity(d, 0) });
    } else if (usable <= d.minThreshold) {
      out.push({ kind: 'low_stock', severity: 'warn', drugId: d.id, drugName: d.name, detail: `${usable} in date, reorder level ${d.minThreshold}.`, suggestedOrder: suggestOrderQuantity(d, usable) });
    }
    for (const b of d.batches ?? []) {
      if (b.stock <= 0) continue;
      if (!b.expiryDate) {
        out.push({ kind: 'no_expiry', severity: 'info', drugId: d.id, drugName: d.name, batchId: b.id, detail: `Batch ${b.batchId} (${b.stock}) has no expiry date. Check the pack and correct it.` });
      } else if (b.expiryDate < today) {
        out.push({ kind: 'expired_stock', severity: 'critical', drugId: d.id, drugName: d.name, batchId: b.id, detail: `Batch ${b.batchId} (${b.stock}) expired on ${b.expiryDate}. Dispose of it.` });
      } else {
        const left = daysBetween(today, b.expiryDate);
        if (left <= nearExpiryDays) out.push({ kind: 'near_expiry', severity: 'warn', drugId: d.id, drugName: d.name, batchId: b.id, detail: `Batch ${b.batchId} (${b.stock}) expires in ${left} day${left === 1 ? '' : 's'} (${b.expiryDate}).` });
      }
    }
  }
  const rank = { critical: 0, warn: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.drugName.localeCompare(b.drugName));
}

// ---- purchase orders ----------------------------------------------------------------------------------------

export function poProgress(lines: PoLine[]): { ordered: number; received: number; percent: number } {
  const ordered = lines.reduce((s, l) => s + l.quantityOrdered, 0);
  const received = lines.reduce((s, l) => s + l.quantityReceived, 0);
  return { ordered, received, percent: ordered === 0 ? 0 : Math.round((received / ordered) * 100) };
}

export const isOverdue = (po: Pick<PurchaseOrder, 'status' | 'expectedDate'>, today: string) =>
  (po.status === 'ordered' || po.status === 'partially_received') && !!po.expectedDate && po.expectedDate < today;

export const poTotal = (lines: PoLine[]): number => Math.round(lines.reduce((s, l) => s + l.quantityOrdered * (l.unitCost ?? 0), 0) * 100) / 100;

/** The register balance should equal the stock on hand. Returns a message when it does not. */
export function reconcile(registerBalance: number, stock: number): string | null {
  return registerBalance === stock ? null : `Register balance ${registerBalance} does not match stock on hand ${stock}.`;
}

// ---- mappers ------------------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export const batchFromRow = (b: any): DrugBatch => ({
  id: b.id, batchId: b.batch_number, stock: b.stock_level, expiryDate: b.expiry_date ? String(b.expiry_date).slice(0, 10) : null,
  receivedAt: b.received_at, supplierId: b.supplier_id ?? null, unitCost: b.unit_cost === null || b.unit_cost === undefined ? null : Number(b.unit_cost),
});

export const drugFromRow = (d: any): DrugItem => ({
  id: d.id,
  name: d.drug_name,
  category: d.category ?? 'General',
  currentStock: d.stock_level,
  minThreshold: d.min_threshold ?? 0,
  price: Number(d.price),
  costPrice: d.cost_price === null || d.cost_price === undefined ? null : Number(d.cost_price),
  reorderQuantity: d.reorder_quantity ?? null,
  unit: d.unit ?? 'unit',
  status: d.status ?? 'active',
  retireReason: d.retire_reason ?? null,
  registerRequired: !!d.register_required,
  controlClass: d.control_class ?? null,
  isControlledDrug: !!d.register_required,
  expiryDate: d.expiry_date ?? undefined,
  drugType: d.drug_type ?? undefined,
  manufacturer: d.manufacturer ?? undefined,
  genericName: d.generic_name ?? undefined,
  indications: d.indications ?? undefined,
  sideEffects: d.side_effects ?? undefined,
  suggestedDosage: d.suggested_dosage ?? undefined,
  batches: (d.drug_batches ?? []).map(batchFromRow),
});

export const movementFromRow = (m: any): StockMovement => ({
  id: m.id, seq: Number(m.seq), inventoryId: m.inventory_id, batchId: m.batch_id, type: m.movement_type, quantity: m.quantity, balanceAfter: m.balance_after,
  reason: m.reason, visitId: m.visit_id, poId: m.po_id, actorName: m.actor_name, createdAt: m.created_at,
});

/** The older three-label log used by dashboards. */
export function toLog(m: StockMovement, drugName: string): InventoryLog | null {
  const type = m.type === 'dispense' ? 'Dispensed' : m.type === 'dispose' ? 'Disposal' : m.type === 'internal_use' ? 'Internal Use' : null;
  return type ? { id: m.id, date: m.createdAt, drugId: m.inventoryId, drugName, type, amount: Math.abs(m.quantity), reason: m.reason ?? '' } : null;
}

export const supplierFromRow = (s: any): Supplier => ({
  id: s.id, name: s.name, contactName: s.contact_name, phone: s.phone, email: s.email, address: s.address, notes: s.notes, active: s.active,
});

export const poFromRow = (p: any): PurchaseOrder => ({
  id: p.id, poNumber: p.po_number, supplierId: p.supplier_id, status: p.status, expectedDate: p.expected_date ? String(p.expected_date).slice(0, 10) : null, notes: p.notes,
  createdAt: p.created_at, orderedAt: p.ordered_at, cancelReason: p.cancel_reason,
  lines: (p.purchase_order_lines ?? []).map((l: any): PoLine => ({
    id: l.id, poId: l.po_id, inventoryId: l.inventory_id, quantityOrdered: l.quantity_ordered, quantityReceived: l.quantity_received, unitCost: l.unit_cost === null ? null : Number(l.unit_cost),
  })),
});

export const registerFromRow = (r: any): RegisterEntry => {
  const sig = Array.isArray(r.controlled_register_signatures) ? r.controlled_register_signatures[0] : r.controlled_register_signatures;
  return {
    id: r.id, seq: Number(r.seq), inventoryId: r.inventory_id, entryType: r.entry_type, quantity: r.quantity, balanceAfter: r.balance_after,
    patientName: r.patient_name, patientIc: r.patient_ic, prescriberName: r.prescriber_name, reference: r.reference, reason: r.reason,
    performedBy: r.performed_by, performedByName: r.performed_by_name, visitId: r.visit_id, createdAt: r.created_at,
    signedBy: sig?.signed_by ?? null, signedByName: sig?.signed_by_name ?? null, signedAt: sig?.signed_at ?? null,
  };
};

export const inventoryEventFromRow = (r: any): InventoryEvent => ({
  id: r.id, entity: r.entity, entityId: r.entity_id, action: r.action, actor: r.actor, detail: r.detail, createdAt: r.created_at,
});
