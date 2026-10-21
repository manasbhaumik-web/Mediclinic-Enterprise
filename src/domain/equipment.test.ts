import { describe, expect, it } from 'vitest';
import { EquipmentItem, bookValue, buildEquipmentAlerts, daysBetween, dueState, equipmentFromRow } from './equipment';

const TODAY = '2026-10-21';
const item = (over: Partial<EquipmentItem> = {}): EquipmentItem => ({
  id: 'e1', assetTag: 'EQ-0001', name: 'Pump', type: 'Diagnostic', model: null, manufacturer: null, supplier: null, serialNumber: 'S1',
  purchaseDate: null, costPrice: null, warrantyExpiry: null, usefulLifeYears: null, salvageValue: 0, location: null, custodian: null, riskClass: null,
  serviceIntervalMonths: 6, calibrationRequired: false, calibrationIntervalMonths: null, lastServiceDate: null, nextServiceDue: '2027-06-01',
  lastCalibrationDate: null, nextCalibrationDue: null, safetyCertRef: null, safetyCertExpiry: null, notes: null, status: 'Operational',
  retiredAt: null, retireReason: null, retireMethod: null, ...over,
});

describe('due dates', () => {
  it('counts days and classifies', () => {
    expect(daysBetween('2026-10-21', '2026-11-20')).toBe(30);
    expect(dueState(null, TODAY, 30)).toBe('none');
    expect(dueState('2026-10-20', TODAY, 30)).toBe('overdue');
    expect(dueState('2026-10-21', TODAY, 30)).toBe('soon');
    expect(dueState('2026-11-20', TODAY, 30)).toBe('soon');
    expect(dueState('2026-11-21', TODAY, 30)).toBe('ok');
  });
});

describe('depreciation', () => {
  const base = { costPrice: 10000, purchaseDate: '2024-10-21', usefulLifeYears: 5, salvageValue: 1000 };
  it('is straight-line from cost to salvage', () => {
    const v = bookValue(base, TODAY)!;
    expect(v.annual).toBe(1800);
    expect(v.bookValue).toBeGreaterThan(6300);
    expect(v.bookValue).toBeLessThan(6500);
  });
  it('never goes below salvage and needs its inputs', () => {
    expect(bookValue({ ...base, purchaseDate: '2000-01-01' }, TODAY)!.bookValue).toBe(1000);
    expect(bookValue({ ...base, costPrice: null }, TODAY)).toBeNull();
    expect(bookValue({ ...base, usefulLifeYears: null }, TODAY)).toBeNull();
  });
});

describe('alerts', () => {
  it('flags overdue service, escalating for high-risk equipment', () => {
    const a = buildEquipmentAlerts([item({ nextServiceDue: '2026-09-01' }), item({ id: 'e2', nextServiceDue: '2026-09-01', riskClass: 'high' })], 30, TODAY);
    expect(a.map((x) => [x.equipmentId, x.kind, x.severity])).toEqual([['e2', 'service_overdue', 'critical'], ['e1', 'service_overdue', 'warn']]);
  });
  it('flags calibration that was never recorded, and one coming due', () => {
    expect(buildEquipmentAlerts([item({ calibrationRequired: true, calibrationIntervalMonths: 12 })], 30, TODAY).map((x) => x.detail)).toContain('Calibration required but never recorded');
    expect(buildEquipmentAlerts([item({ calibrationRequired: true, nextCalibrationDue: '2026-11-01' })], 30, TODAY).map((x) => x.kind)).toContain('calibration_soon');
  });
  it('flags out-of-service equipment and expired certificates', () => {
    const k = buildEquipmentAlerts([item({ status: 'Out of service', safetyCertExpiry: '2026-01-01' })], 30, TODAY).map((x) => x.kind);
    expect(k).toEqual(expect.arrayContaining(['out_of_service', 'cert_expired']));
  });
  it('ignores decommissioned equipment and notes a missing schedule', () => {
    expect(buildEquipmentAlerts([item({ status: 'Decommissioned', nextServiceDue: '2020-01-01' })], 30, TODAY)).toEqual([]);
    expect(buildEquipmentAlerts([item({ nextServiceDue: null })], 30, TODAY).map((x) => x.kind)).toEqual(['no_schedule']);
  });
});

describe('row mapping', () => {
  it('maps database columns', () => {
    const e = equipmentFromRow({ id: 'x', asset_tag: 'EQ-0009', name: 'N', type: null, status: 'Operational', cost_price: '1200.50', next_maintenance: '2027-01-01', calibration_required: true });
    expect(e).toMatchObject({ assetTag: 'EQ-0009', type: 'Other', costPrice: 1200.5, nextServiceDue: '2027-01-01', calibrationRequired: true, salvageValue: 0 });
  });
});
