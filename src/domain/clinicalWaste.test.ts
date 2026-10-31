import { describe, it, expect } from 'vitest';
import { 
  sealSharpsBin, 
  createClinicalWasteConsignment, 
  exportClinicalWasteManifestText,
  SharpsBinRecord,
  APPROVED_CONCESSIONAIRES 
} from './clinicalWaste';

describe('Scheduled Clinical Waste (SW 404) & Sharps Management Domain', () => {
  it('correctly transitions sharps container to sealed status upon reaching 3/4 fill line', () => {
    const activeBin: SharpsBinRecord = {
      id: 'SB-01',
      binSerialNo: 'SHARPS-2026-001',
      capacityLitres: 5,
      location: 'Injection Bay',
      deployedDate: '2026-05-01',
      deployedByNurse: 'SN Siti',
      status: 'In-Use'
    };

    const sealed = sealSharpsBin(activeBin, 'SN Nurul', '2026-05-15T10:00:00.000Z');
    expect(sealed.status).toBe('Sealed (3/4 Full)');
    expect(sealed.sealedByNurse).toBe('SN Nurul');
    expect(sealed.sealedDate).toBe('2026-05-15T10:00:00.000Z');
  });

  it('creates valid SW 404 clinical waste consignment record', () => {
    const record = createClinicalWasteConsignment({
      consignmentNoteNo: 'CN-MEDIVEST-8849',
      concessionaireName: 'Medivest Sdn Bhd',
      yellowBagsCount: 4,
      sharpsBinsCount: 2,
      totalWeightKg: 18.5,
      driverName: 'Mohd Faiz',
      vehiclePlateNo: 'WVY 8412',
      clinicStaffName: 'SN Siti'
    });

    expect(record.id).toMatch(/^CWM-/);
    expect(record.concessionaireName).toBe('Medivest Sdn Bhd');
    expect(record.yellowBagsCount).toBe(4);
    expect(record.totalWeightKg).toBe(18.5);
    expect(record.vehiclePlateNo).toBe('WVY 8412');
    expect(record.eSwisRegistered).toBe(true);
  });

  it('exports compliant Department of Environment (JAS) manifest text', () => {
    const record = createClinicalWasteConsignment({
      consignmentNoteNo: 'CN-RADICARE-1192',
      concessionaireName: 'Radicare (M) Sdn Bhd',
      yellowBagsCount: 3,
      sharpsBinsCount: 1,
      totalWeightKg: 12.0,
      driverName: 'Anuar',
      vehiclePlateNo: 'BNE 4912',
      clinicStaffName: 'SN Siti'
    });

    const manifestText = exportClinicalWasteManifestText(record);
    expect(manifestText).toContain('SCHEDULED CLINICAL WASTE CONSIGNMENT NOTE (SW 404');
    expect(manifestText).toContain('CN-RADICARE-1192');
    expect(manifestText).toContain('Radicare (M) Sdn Bhd');
    expect(manifestText).toContain('12.00 KG');
    expect(manifestText).toContain('DOE e-SWIS Status:  Registered & Synced');
  });

  it('recognizes major Malaysian clinical waste concessionaires', () => {
    expect(APPROVED_CONCESSIONAIRES).toContain('Medivest Sdn Bhd');
    expect(APPROVED_CONCESSIONAIRES).toContain('Radicare (M) Sdn Bhd');
    expect(APPROVED_CONCESSIONAIRES).toContain('Pantai Medivest');
  });
});
