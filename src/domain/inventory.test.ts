import { describe, expect, it } from 'vitest';
import {
  DrugBatch, DrugItem, PoLine, allocateFefo, buildAlerts, drugFromRow, isOverdue, poProgress, reconcile, registerFromRow, suggestOrderQuantity, toLog, usableStock,
} from './inventory';

const TODAY = '2026-10-21';
const b = (id: string, stock: number, expiryDate: string | null, receivedAt = '2026-01-01'): DrugBatch => ({ id, batchId: id.toUpperCase(), stock, expiryDate, receivedAt });
const drug = (over: Partial<DrugItem> = {}): DrugItem => ({
  id: 'd1', name: 'Test', category: 'x', currentStock: 0, minThreshold: 10, price: 1, unit: 'tab', status: 'active', registerRequired: false, controlClass: null, batches: [], ...over,
});

describe('FEFO allocation', () => {
  it('takes from the soonest-expiring batch first', () => {
    const r = allocateFefo([b('late', 20, '2027-06-01'), b('soon', 10, '2026-11-15')], 15, TODAY);
    expect(r.allocations.map((a) => [a.batchId, a.quantity])).toEqual([['soon', 10], ['late', 5]]);
    expect(r.shortfall).toBe(0);
  });
  it('skips expired and empty batches and reports a shortfall', () => {
    const r = allocateFefo([b('old', 50, '2026-10-20'), b('empty', 0, '2027-01-01'), b('ok', 5, '2027-01-01')], 8, TODAY);
    expect(r.allocations).toEqual([{ batchId: 'ok', batchNumber: 'OK', quantity: 5, expiryDate: '2027-01-01' }]);
    expect(r.shortfall).toBe(3);
  });
  it('uses unknown-expiry batches last', () => {
    const r = allocateFefo([b('none', 10, null), b('dated', 10, '2027-01-01')], 12, TODAY);
    expect(r.allocations.map((a) => a.batchId)).toEqual(['dated', 'none']);
  });
  it('breaks ties by received date', () => {
    const r = allocateFefo([b('b2', 5, '2027-01-01', '2026-03-01'), b('b1', 5, '2027-01-01', '2026-02-01')], 5, TODAY);
    expect(r.allocations[0].batchId).toBe('b1');
  });
});

describe('usable stock', () => {
  it('counts only in-date batches', () => {
    expect(usableStock(drug({ batches: [b('a', 10, '2026-10-20'), b('b', 7, '2026-10-21'), b('c', 3, null)] }), TODAY)).toBe(10);
  });
});

describe('alerts', () => {
  it('flags out of stock, low stock, expired and near-expiry batches', () => {
    const items = [
      drug({ id: 'o', name: 'Out', batches: [] }),
      drug({ id: 'l', name: 'Low', minThreshold: 10, batches: [b('l1', 8, '2027-06-01')] }),
      drug({ id: 'e', name: 'Expired', minThreshold: 1, batches: [b('e1', 5, '2026-09-01'), b('e2', 50, '2027-06-01')] }),
      drug({ id: 'n', name: 'Near', minThreshold: 1, batches: [b('n1', 20, '2026-12-01')] }),
      drug({ id: 'f', name: 'Fine', minThreshold: 1, batches: [b('f1', 50, '2027-06-01')] }),
    ];
    const a = buildAlerts(items, 60, TODAY);
    expect(a.map((x) => `${x.drugName}:${x.kind}`)).toEqual(['Expired:expired_stock', 'Out:out_of_stock', 'Low:low_stock', 'Near:near_expiry']);
    expect(a.find((x) => x.kind === 'near_expiry')?.detail).toMatch(/41 days/);
  });
  it('honours the near-expiry window setting', () => {
    const items = [drug({ minThreshold: 1, batches: [b('n1', 20, '2026-12-01')] })];
    expect(buildAlerts(items, 30, TODAY)).toHaveLength(0);
    expect(buildAlerts(items, 60, TODAY)).toHaveLength(1);
  });
  it('ignores retired drugs and flags batches with no expiry as information', () => {
    expect(buildAlerts([drug({ status: 'retired' })], 60, TODAY)).toHaveLength(0);
    const a = buildAlerts([drug({ minThreshold: 1, batches: [b('o', 10, null)] })], 60, TODAY);
    expect(a).toEqual([expect.objectContaining({ kind: 'no_expiry', severity: 'info' })]);
  });
  it('suggests the reorder quantity, else enough to reach twice the reorder level', () => {
    expect(suggestOrderQuantity({ reorderQuantity: 50, minThreshold: 10 }, 3)).toBe(50);
    expect(suggestOrderQuantity({ reorderQuantity: null, minThreshold: 10 }, 3)).toBe(17);
    expect(suggestOrderQuantity({ reorderQuantity: null, minThreshold: 0 }, 0)).toBe(1);
  });
});

describe('purchase orders and the register', () => {
  const lines: PoLine[] = [
    { id: 'l1', poId: 'p', inventoryId: 'a', quantityOrdered: 40, quantityReceived: 10, unitCost: 2 },
    { id: 'l2', poId: 'p', inventoryId: 'b', quantityOrdered: 60, quantityReceived: 60, unitCost: null },
  ];
  it('reports progress', () => expect(poProgress(lines)).toEqual({ ordered: 100, received: 70, percent: 70 }));
  it('flags overdue orders only while goods are outstanding', () => {
    expect(isOverdue({ status: 'ordered', expectedDate: '2026-10-01' }, TODAY)).toBe(true);
    expect(isOverdue({ status: 'received', expectedDate: '2026-10-01' }, TODAY)).toBe(false);
    expect(isOverdue({ status: 'ordered', expectedDate: null }, TODAY)).toBe(false);
  });
  it('reconciles the register balance with stock', () => {
    expect(reconcile(90, 90)).toBeNull();
    expect(reconcile(90, 80)).toMatch(/does not match/);
  });
});

describe('mappers', () => {
  it('reads a drug with its batches', () => {
    const d = drugFromRow({ id: 'x', drug_name: 'A', stock_level: 5, price: '1.5', min_threshold: 2, register_required: true, control_class: 'dangerous_drug', drug_batches: [{ id: 'b', batch_number: 'B1', stock_level: 5, expiry_date: '2027-01-01' }] });
    expect(d).toMatchObject({ name: 'A', price: 1.5, registerRequired: true, isControlledDrug: true, status: 'active', unit: 'unit' });
    expect(d.batches?.[0]).toMatchObject({ batchId: 'B1', stock: 5, expiryDate: '2027-01-01' });
  });
  it('maps ledger rows to the older log shape', () => {
    const m = { id: '1', seq: 1, inventoryId: 'd', batchId: null, type: 'dispense', quantity: -4, balanceAfter: 6, reason: 'x', visitId: null, poId: null, actorName: null, createdAt: 'z' } as const;
    expect(toLog(m, 'Drug')).toMatchObject({ type: 'Dispensed', amount: 4 });
    expect(toLog({ ...m, type: 'receive', quantity: 4 }, 'Drug')).toBeNull();
  });
  it('reads a register entry with its signature', () => {
    const e = registerFromRow({ id: 'r', seq: '2', inventory_id: 'd', entry_type: 'dispense', quantity: -10, balance_after: 90, performed_by: 'u', controlled_register_signatures: [{ signed_by: 'w', signed_by_name: 'Witness', signed_at: 't' }] });
    expect(e).toMatchObject({ seq: 2, signedByName: 'Witness' });
    expect(registerFromRow({ id: 'r', seq: 3, inventory_id: 'd', entry_type: 'dispense', quantity: -1, balance_after: 1, performed_by: 'u', controlled_register_signatures: [] }).signedBy).toBeNull();
  });
});
