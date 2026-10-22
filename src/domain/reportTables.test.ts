import { describe, expect, it } from 'vitest';
import { toCsv } from './reports';
import { categoryTable, claimsTable, diagnosesTable, ledgerTable, periodLabel, prescribingTable, revenueTable, stockTable, volumeTable } from './reportTables';

const at = (daysAgo: number) => new Date(2026, 9, 22 - daysAgo, 12).toISOString();

describe('report tables', () => {
  it('labels a period', () => {
    expect(periodLabel('2026-10-01', '2026-10-22')).toMatch(/1 Oct 2026 to 22 Oct 2026/);
  });

  it('revenue by month ends with a total row that adds up', () => {
    const t = revenueTable([
      { month: '2026-09', patientPaid: 60.5, panelClaimed: 90, total: 150.5, visits: 2 },
      { month: '2026-10', patientPaid: 0, panelClaimed: 0, total: 0, visits: 0 },
    ], '1 Sep to 22 Oct');
    expect(t.rows.at(-1)).toEqual(['Total', 2, '60.50', '90.00', '150.50']);
    expect(toCsv(t).split('\r\n')[0]).toBe('Month,Paid visits,Paid by patients (RM),Claimed from panels (RM),Total (RM)');
  });

  it('revenue by category shows discounts as a deduction and states its coverage', () => {
    const t = categoryTable({
      categories: [{ kind: 'consultation', label: 'Consultation', amount: 70 }, { kind: 'procedure', label: 'Procedures / nursing', amount: 30 },
        { kind: 'medication', label: 'Medication', amount: 30 }, { kind: 'other', label: 'Other charges', amount: 10 }],
      discounts: 10, tax: 7.8, total: 137.8, itemised: 2, payments: 5,
    }, 'p');
    expect(t.subtitle).toContain('2 of 5 payments');
    expect(t.rows.slice(-3)).toEqual([['Discounts', '-10.00'], ['SST', '7.80'], ['Total billed', '137.80']]);
  });

  it('lists only pending claims, longest wait first', () => {
    const t = claimsTable([
      { status: 'Pending Claim', date: at(5), panelClaimed: 100, receiptNo: 'RC-2026-000002', patientName: 'Lim', panelName: 'MiCare', glNumber: 'GL-2' },
      { status: 'Pending Claim', date: at(40), panelClaimed: 25.5, receiptNo: 'RC-2026-000001', patientName: 'Siti', panelName: 'PMCare', glNumber: 'GL-1' },
      { status: 'Claim Paid', date: at(50), panelClaimed: 99 },
      { status: 'Completed', date: at(1), panelClaimed: 0 },
    ], '2026-10-22');
    expect(t.rows.map((r) => [r[0], r[5], r[6]])).toEqual([['RC-2026-000001', 40, '25.50'], ['RC-2026-000002', 5, '100.00']]);
  });

  it('exports diagnoses, volume, prescribing and the ledger as shown', () => {
    expect(diagnosesTable([{ icdCode: 'A90', diagnosis: 'Dengue fever', visits: 3 }], 'p').rows).toEqual([['A90', 'Dengue fever', 3]]);
    const v = volumeTable([{ day: '2026-10-19', total: 6, completed: 5, cancelled: 1, inProgress: 0 }], 'p', 'week');
    expect(v.columns[0]).toBe('Week starting');
    expect(v.rows).toEqual([['2026-10-19', 6, 5, 1, 0]]);
    expect(prescribingTable([{ drugName: 'Paracetamol', prescriptions: 9, totalQuantity: 90, isControlled: false, onHand: null }], 'p').rows).toEqual([['Paracetamol', 9, 90, 'No', null]]);
    const l = ledgerTable([{ date: at(0), receiptNo: 'RC-1', patientName: 'Siti', paymentMethod: 'Cash', paidAmount: 50, panelClaimed: 0, status: 'Completed' }], 'p');
    expect(l.rows[0].slice(0, 7)).toEqual(['RC-1', '2026-10-22', 'Siti', 'Cash', '', '50.00', '0.00']);
  });

  it('stock on hand values at recorded cost and counts batches without one', () => {
    const t = stockTable([
      { name: 'A', status: 'active', minThreshold: 5, unit: 'tab', batches: [{ id: '1', batchId: 'b', stock: 10, expiryDate: '2027-01-01', unitCost: 2 }, { id: '2', batchId: 'c', stock: 4, expiryDate: '2027-01-01', unitCost: null }] },
      { name: 'Retired', status: 'retired', minThreshold: 0, unit: 'tab', batches: [] },
    ], '2026-10-22');
    expect(t.rows).toEqual([['A', 'tab', 14, 5, '20.00', 1]]);
  });
});
