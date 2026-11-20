import { describe, expect, it } from 'vitest';
import { csvField, csvRow } from './csv';
import { auditCsv } from './clinicalAudit';
import { exportTPAClaimsCSV } from './tpaPanelClaims';
import { exportBukuRacunCsv } from './bukuRacun';
import { exportShiftCsv } from './cashDrawer';
import { exportDDALedgerCsv } from './dangerousDrugsDDA';
import { exportColdChainMonthlyCsv } from './coldChainVaccines';
import { exportCKAPSLocumAttendanceLedger } from './locumDoctorSession';

const ATTACK = '=HYPERLINK("http://example.com","click")';

describe('csvField', () => {
  it('neutralises text a spreadsheet would run as a formula', () => {
    for (const bad of ['=1+1', '+cmd|calc', '-1+1', '@SUM(A1)', '\tx', '\rx']) {
      expect(csvField(bad).replace(/^"/, '').startsWith("'")).toBe(true);
    }
  });
  it('leaves plain numbers alone, including negatives', () => {
    expect(csvField(-12.5)).toBe('-12.5');
    expect(csvField('-1.00')).toBe('-1.00');
    expect(csvField(0)).toBe('0');
  });
  it('keeps a phone number as text', () => {
    expect(csvField('+60123456789')).toBe("'+60123456789");
  });
  it('quotes commas, quotes and line breaks', () => {
    expect(csvField('Tan, Ah Kow')).toBe('"Tan, Ah Kow"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('a\nb')).toBe('"a\nb"');
  });
  it('writes nothing for a missing value', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });
  it('builds a row', () => {
    expect(csvRow(['a', 1, null, 'b,c'])).toBe('a,1,,"b,c"');
  });
});

describe('every CSV export is safe to open in a spreadsheet', () => {
  it('the patient audit export', () => {
    const csv = auditCsv(
      [{ id: 1, at: '2026-11-20T01:00:00Z', actor: 'u1', actorRoles: ['doctor'], action: 'view', entity: 'patients', entityId: 'p1', patientId: 'p1', fields: [], context: 'consultation' } as never],
      () => 'Dr A',
      () => ATTACK,
    );
    expect(csv).toContain(`"'=HYPERLINK(""http://example.com"",""click"")"`);
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/m);
  });

  it('the panel claims export, even for a name with quotes and a comma', () => {
    const csv = exportTPAClaimsCSV([{
      id: 'C1', glNumber: 'GL1', providerName: 'MiCare, TPA', employerName: 'Acme "Co"', patientName: '=1+1', patientIc: '990101-10-1111',
      visitDate: '2026-11-01', totalBillRM: 53, panelBilledRM: 40, patientExcessRM: 13, status: 'Pending Submission',
    } as never]);
    const line = csv.split('\n')[1];
    expect(line).toContain(`'=1+1`);
    expect(line).toContain('"MiCare, TPA"');
    expect(line).toContain('"Acme ""Co"""');
  });

  it('the poison book export', () => {
    const csv = exportBukuRacunCsv([{
      serialNo: 1, date: '2026-11-01', prescriptionRef: 'R1', patientName: '@evil', patientIc: '990101-10-1111', patientAddress: '1, Jalan "A"',
      prescribingDoctor: 'Dr X', doctorMmcNo: '1', medicineName: 'Morphine', poisonCategory: 'A', dosageInstructions: 'x', quantityDispensed: 5,
      batchNo: 'B', diagnosis: 'd', dispensedBy: 'P',
    } as never]);
    expect(csv).toContain(`'@evil`);
    expect(csv).toContain('"1, Jalan ""A"""');
  });

  it('the cash drawer export keeps a negative variance a number', () => {
    const csv = exportShiftCsv({
      shiftDate: '2026-11-20', closedAt: 'x', counterId: 'C1', cashierName: '=cmd', openingFloat: 0, totalCashCollected: 0, totalCardCollected: 0,
      totalEWalletCollected: 0, totalPanelInvoiced: 0, totalRevenue: 0, expectedCashInDrawer: 0, actualCashCounted: 0, variance: -1, status: 'SHORT',
      transactionCount: 0, explanation: '',
    } as never);
    expect(csv).toContain("'=cmd");
    expect(csv).toContain('Variance (RM),-1.00');
  });

  it('the dangerous drugs ledger export', () => {
    const csv = exportDDALedgerCsv([{
      id: 'T1', timestamp: 't', drugName: 'Morphine', transactionType: 'DISPENSE', referenceNo: 'r', batchNo: 'b', expiryDate: 'e', quantityIn: 0,
      quantityOut: 1, quantityWastage: 0, runningBalance: 9, patientName: '+evil', patientIc: 'ic', prescribingDoctorName: 'X', prescribingDoctorMMC: '1',
      custodianStaffName: 'C', custodianStaffRole: 'pharmacist', dualWitnessStaffName: 'W', reasonOrNotes: 'a, b',
    } as never]);
    expect(csv).toContain(`'+evil`);
    expect(csv).toContain('"a, b"');
  });

  it('the cold chain export', () => {
    const csv = exportColdChainMonthlyCsv([{
      id: 'L1', date: 'd', shift: 'AM', loggedAt: 't', currentTempC: 5, minTempC: 4, maxTempC: 6, isCompliant: true, operatorStaffName: '=bad', operatorStaffId: 'S1', notes: 'ok',
    } as never]);
    expect(csv).toContain(`'=bad (S1)`);
  });

  it('the locum attendance export', () => {
    const csv = exportCKAPSLocumAttendanceLedger(
      [{
        id: 'S1', locumDoctorId: 'L', doctorName: '=Dr', mmcNumber: '1', checkInTime: 'a', actualHoursWorked: 1, hourlyRateMyr: 50, patientsConsultedCount: 1,
        totalPayoutMyr: 50, paymentStatus: 'paid', verifiedByStaff: 'V',
      } as never],
      [],
    );
    expect(csv).toContain(`'=Dr`);
  });
});
