import { describe, it, expect } from 'vitest';
import {
  INVESTIGATION_CATALOG, actionableCount, investigationFromRow, ordersFromNames, outsideRange, parseRange, sortWorklist, unreviewedSummary, type Investigation,
} from './investigations';

const inv = (o: Partial<Investigation>): Investigation => ({
  id: 'i', visitId: 'v', patientId: 'p', patientName: 'A', patientIc: '', kind: 'lab', name: 'FBC', urgency: 'routine',
  clinicalInfo: '', status: 'Ordered', orderedAt: '2026-11-19T08:00:00Z', abnormal: false, ...o,
});

describe('parseRange', () => {
  it('reads a span, an upper limit and a lower limit', () => {
    expect(parseRange('3.5-5.0')).toEqual({ low: 3.5, high: 5 });
    expect(parseRange('3.5 – 5.0')).toEqual({ low: 3.5, high: 5 });
    expect(parseRange('<5.7')).toEqual({ high: 5.7 });
    expect(parseRange('>= 10')).toEqual({ low: 10 });
    expect(parseRange('1,000-2,000')).toEqual({ low: 1000, high: 2000 });
  });

  it('does not guess at text or reversed ranges', () => {
    expect(parseRange('Negative')).toBeNull();
    expect(parseRange('')).toBeNull();
    expect(parseRange(undefined)).toBeNull();
    expect(parseRange('5-3')).toBeNull();
  });
});

describe('outsideRange', () => {
  it('flags numbers outside the range', () => {
    expect(outsideRange('6.1', '3.5-5.0')).toBe(true);
    expect(outsideRange('3.0', '3.5-5.0')).toBe(true);
    expect(outsideRange('4.2', '3.5-5.0')).toBe(false);
    expect(outsideRange('5.0', '3.5-5.0')).toBe(false);
    expect(outsideRange('6.5', '<5.7')).toBe(true);
    expect(outsideRange('9', '>10')).toBe(true);
  });

  it('says nothing when it cannot tell', () => {
    expect(outsideRange('Positive', '3.5-5.0')).toBeNull();
    expect(outsideRange('4.2', 'Negative')).toBeNull();
    expect(outsideRange('4.2', undefined)).toBeNull();
    expect(outsideRange('', '3.5-5.0')).toBeNull();
  });
});

describe('work waiting', () => {
  const items = [inv({ id: '1', status: 'Ordered' }), inv({ id: '2', status: 'Collected' }), inv({ id: '3', status: 'Resulted' }), inv({ id: '4', status: 'Reviewed' }), inv({ id: '5', status: 'Cancelled' })];

  it('counts samples and scans for an assistant and results to read for a doctor', () => {
    expect(actionableCount(['clinic-assistant'], items)).toBe(2);
    expect(actionableCount(['doctor'], items)).toBe(1);
    expect(actionableCount(['doctor', 'clinic-assistant'], items)).toBe(3);
    expect(actionableCount(['cashier'], items)).toBe(0);
  });

  it('puts urgent orders first, then the oldest', () => {
    const sorted = sortWorklist([
      inv({ id: 'new', orderedAt: '2026-11-19T10:00:00Z' }),
      inv({ id: 'old', orderedAt: '2026-11-19T08:00:00Z' }),
      inv({ id: 'urgent', urgency: 'urgent', orderedAt: '2026-11-19T11:00:00Z' }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(['urgent', 'old', 'new']);
  });
});

describe('unreviewedSummary', () => {
  it('counts results not yet read and how many are abnormal', () => {
    const items = [inv({ status: 'Resulted', abnormal: true }), inv({ status: 'Resulted' }), inv({ status: 'Reviewed', abnormal: true }), inv({ status: 'Ordered' })];
    expect(unreviewedSummary(items)).toEqual({ count: 2, abnormal: 1 });
    expect(unreviewedSummary([])).toEqual({ count: 0, abnormal: 0 });
  });
});

describe('investigationFromRow', () => {
  it('reads a joined row with the patient and result', () => {
    const i = investigationFromRow({
      id: 'x', visit_id: 'v', patient_id: 'p', kind: 'imaging', name: 'Chest X-Ray (PA View)', urgency: 'urgent', clinical_info: 'cough',
      status: 'Resulted', ordered_at: '2026-11-19T08:00:00Z', result_notes: 'Clear lung fields', abnormal: false,
      patients: { full_name: 'Siti', ic_number: '900101-14-5678' },
    });
    expect(i).toMatchObject({ patientName: 'Siti', kind: 'imaging', urgency: 'urgent', status: 'Resulted', resultNotes: 'Clear lung fields' });
  });

  it('falls back safely on unexpected values', () => {
    const i = investigationFromRow({ id: 'x', visit_id: 'v', patient_id: 'p', kind: 'weird', name: 'T', status: 'nope', ordered_at: '2026-11-19T08:00:00Z' });
    expect(i).toMatchObject({ kind: 'lab', status: 'Ordered', urgency: 'routine', patientName: 'Unknown patient' });
  });
});

describe('catalog', () => {
  it('has unique names, both kinds, and matches the consultation lab list', () => {
    const names = INVESTIGATION_CATALOG.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(INVESTIGATION_CATALOG.some((c) => c.kind === 'imaging')).toBe(true);
    expect(INVESTIGATION_CATALOG.some((c) => c.kind === 'lab')).toBe(true);
    for (const n of ['Full Blood Count (FBC)', 'Chest X-Ray (PA View)', '12-Lead Electrocardiogram (ECG)']) expect(names).toContain(n);
  });
});

describe('ordersFromNames', () => {
  it('turns ticked test names into orders, imaging for scans and lab for the rest', () => {
    const o = ordersFromNames(['Full Blood Count (FBC)', 'Chest X-Ray (PA View)'], 'rule out chest infection');
    expect(o.map((x) => [x.name, x.kind])).toEqual([['Full Blood Count (FBC)', 'lab'], ['Chest X-Ray (PA View)', 'imaging']]);
    expect(o.every((x) => x.urgency === 'routine' && x.clinicalInfo === 'rule out chest infection')).toBe(true);
  });
  it('treats a name outside the catalogue as a lab test', () => {
    expect(ordersFromNames(['Something New'])[0].kind).toBe('lab');
  });
  it('drops blanks and repeats and handles nothing ticked', () => {
    expect(ordersFromNames(['A', ' a ', '', 'B']).map((x) => x.name)).toEqual(['A', 'B']);
    expect(ordersFromNames(undefined)).toEqual([]);
    expect(ordersFromNames([])).toEqual([]);
  });
});
