import { describe, it, expect } from 'vitest';
import { 
  matchAct342Disease, 
  createAct342Notification, 
  exportAct342FormText,
  ACT_342_NOTIFIABLE_DISEASES 
} from './act342Notification';

describe('Act 342 Prevention & Control of Infectious Diseases Domain', () => {
  it('correctly matches mandatory notifiable diseases under Act 342', () => {
    // Dengue Fever
    const dengue = matchAct342Disease('A90');
    expect(dengue).toBeDefined();
    expect(dengue?.diseaseName).toBe('Dengue Fever');
    expect(dengue?.urgency).toContain('Within 24 Hours');

    // Hand Foot Mouth Disease (HFMD)
    const hfmd = matchAct342Disease('B08.4');
    expect(hfmd).toBeDefined();
    expect(hfmd?.diseaseName).toContain('Hand, Foot and Mouth');

    // COVID-19
    const covid = matchAct342Disease('U07.1');
    expect(covid).toBeDefined();
    expect(covid?.diseaseName).toContain('COVID-19');

    // Non-notifiable common illness (e.g. Hypertension)
    const htn = matchAct342Disease('I10');
    expect(htn).toBeUndefined();
  });

  it('generates fully populated statutory e-Notifikasi record', () => {
    const record = createAct342Notification({
      icd10Code: 'A90',
      patientId: 'PT-101',
      patientName: 'Ahmad bin Razali',
      patientIc: '880101-14-5521',
      patientPhone: '012-9876543',
      patientAddress: 'No 12, Jalan SS2/19, Petaling Jaya',
      subDistrictMukim: 'Mukim Damansara',
      districtPKD: 'PKD Petaling',
      symptomOnsetDate: '2026-10-28',
      labConfirmationDetails: 'Dengue NS1 Ag Positive (Rapid Test)',
      doctorName: 'Dr. Tan Mei Ling',
      doctorMmcNo: 'MMC-48912'
    });

    expect(record.id).toMatch(/^NOTIF-/);
    expect(record.diseaseName).toBe('Dengue Fever');
    expect(record.patientName).toBe('Ahmad bin Razali');
    expect(record.urgency).toContain('Within 24 Hours');
    expect(record.districtPKD).toBe('PKD Petaling');
    expect(record.doctorMmcNo).toBe('MMC-48912');
  });

  it('exports official KKM text format containing mandatory statutory sections', () => {
    const record = createAct342Notification({
      icd10Code: 'B08.4',
      patientId: 'PT-102',
      patientName: 'Nurul Huda',
      patientIc: '190512-10-9988',
      patientPhone: '019-3322114',
      patientAddress: 'Shah Alam, Selangor'
    });

    const exported = exportAct342FormText(record);
    expect(exported).toContain('KEMENTERIAN KESIHATAN MALAYSIA (KKM)');
    expect(exported).toContain('NOTIFIKASI PENYAKIT BERJANGKIT DI BAWAH AKTA 342');
    expect(exported).toContain('Hand, Foot and Mouth Disease');
    expect(exported).toContain('Nurul Huda');
    expect(exported).toContain('PERAKUAN PENGAMAL PERUBATAN');
  });

  it('contains comprehensive coverage of core Malaysian outbreak surveillance pathogens', () => {
    const prefixes = ACT_342_NOTIFIABLE_DISEASES.map(d => d.icd10Prefix);
    expect(prefixes).toContain('A90');
    expect(prefixes).toContain('B08.4');
    expect(prefixes).toContain('U07.1');
    expect(prefixes).toContain('B05');
    expect(prefixes).toContain('A37');
    expect(prefixes).toContain('A01');
  });
});
