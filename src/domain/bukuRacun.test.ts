import { describe, expect, it } from 'vitest';
import {
  classifyPoisonCategory,
  generateBukuRacunEntries,
  exportBukuRacunCsv,
} from './bukuRacun';
import { Visit, Patient } from '../types';

describe('bukuRacun domain logic', () => {
  it('correctly categorizes Malaysian Group B, Group C and exempt medicines', () => {
    expect(classifyPoisonCategory('Amoxicillin 500mg Capsule')).toBe('Group B (Prescription Only)');
    expect(classifyPoisonCategory('Augmentin 625mg Tablet')).toBe('Group B (Prescription Only)');
    expect(classifyPoisonCategory('Amlodipine 5mg Tab')).toBe('Group B (Prescription Only)');
    expect(classifyPoisonCategory('Voltaren 50mg Tablet')).toBe('Group B (Prescription Only)');

    expect(classifyPoisonCategory('Cetirizine 10mg Tab')).toBe('Group C (Pharmacy Only)');
    expect(classifyPoisonCategory('Piriton 4mg Tab')).toBe('Group C (Pharmacy Only)');
    expect(classifyPoisonCategory('Ventolin Inhaler 100mcg')).toBe('Group C (Pharmacy Only)');

    expect(classifyPoisonCategory('Paracetamol 500mg Tablet')).toBe('Exempt');
    expect(classifyPoisonCategory('Vitamin C 1000mg Effervescent')).toBe('Exempt');
  });

  it('generates compliant statutory ledger entries with patient IC and prescriber info', () => {
    const pt: Patient = {
      id: 'pt-1',
      fullName: 'Ahmad bin Razak',
      icNumber: '880512-14-5531',
      gender: 'Male',
      dob: '1988-05-12',
      address: 'No 12, Jalan Ampang, Kuala Lumpur',
      phone: '012-3456789',
      panelEmployer: 'Petronas',
      drugAllergies: [],
      registeredDate: '2026-01-01',
    };

    const visit: Visit = {
      id: 'v-101',
      patientId: 'pt-1',
      date: '2026-10-31',
      status: 'Paid',
      totalBill: 85,
      panelClaimed: 85,
      paidAmount: 85,
      doctorName: 'Dr. Siti Aminah',
      receiptNumber: 'RCP-2026-001',
      soap: {
        subjective: 'Fever and sore throat',
        objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 75, temperature: 38.2, respiratoryRate: 16 },
        assessment: { icdCode: 'J02.9', description: 'Acute pharyngitis', clinicalNotes: 'Antibiotic therapy indicated' },
        plan: {
          prescription: [
            {
              id: 'rx-1',
              drugName: 'Amoxicillin 500mg Capsule',
              dosage: '500mg TDS',
              dosageBM: '500mg 3 kali sehari',
              frequency: 'TDS (3x Daily)',
              quantity: 21,
              pricePerUnit: 1.20,
              expiryDate: '2027-12-31',
              pillColor: '#008080',
              capsuleStyle: 'solid',
            },
            {
              id: 'rx-2',
              drugName: 'Paracetamol 500mg Tablet',
              dosage: '1000mg QDS PRN',
              dosageBM: '1000mg 4 kali sehari jika perlu',
              frequency: 'PRN',
              quantity: 20,
              pricePerUnit: 0.50,
              expiryDate: '2028-06-30',
              pillColor: '#ffffff',
              capsuleStyle: 'solid',
            },
          ],
          followUpWeeks: 0,
          mcDays: 2,
          requiresReferral: false,
        },
      },
    };

    const entries = generateBukuRacunEntries([visit], { 'pt-1': pt });

    // Only Amoxicillin (Group B) should be included; Paracetamol is Exempt
    expect(entries.length).toBe(1);
    const entry = entries[0];

    expect(entry.serialNo).toBe('BR-00001');
    expect(entry.patientName).toBe('Ahmad bin Razak');
    expect(entry.patientIc).toBe('880512-14-5531');
    expect(entry.medicineName).toBe('Amoxicillin 500mg Capsule');
    expect(entry.poisonCategory).toBe('Group B (Prescription Only)');
    expect(entry.prescribingDoctor).toBe('Dr. Siti Aminah');
    expect(entry.quantityDispensed).toBe(21);
    expect(entry.prescriptionRef).toBe('RCP-2026-001');
  });

  it('exports valid CSV conforming to official KKM column structure', () => {
    const pt: Patient = {
      id: 'pt-1',
      fullName: 'Ahmad bin Razak',
      icNumber: '880512-14-5531',
      gender: 'Male',
      dob: '1988-05-12',
      address: 'Kuala Lumpur',
      phone: '012-3456789',
      panelEmployer: 'Self-Pay',
      drugAllergies: [],
      registeredDate: '2026-01-01',
    };

    const visit: Visit = {
      id: 'v-101',
      patientId: 'pt-1',
      date: '2026-10-31',
      status: 'Paid',
      totalBill: 50,
      panelClaimed: 0,
      paidAmount: 50,
      soap: {
        subjective: 'Allergic rhinitis',
        objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 75, temperature: 36.5, respiratoryRate: 16 },
        assessment: { icdCode: 'J30.9', description: 'Allergic rhinitis', clinicalNotes: 'Antihistamine' },
        plan: {
          prescription: [
            {
              id: 'rx-1',
              drugName: 'Cetirizine 10mg Tab',
              dosage: '10mg OD',
              dosageBM: '10mg 1 kali sehari',
              frequency: 'OD (Once Daily)',
              quantity: 10,
              pricePerUnit: 0.80,
              expiryDate: '2027-12-31',
              pillColor: '#008080',
              capsuleStyle: 'solid',
            },
          ],
          followUpWeeks: 0,
          mcDays: 0,
          requiresReferral: false,
        },
      },
    };

    const entries = generateBukuRacunEntries([visit], { 'pt-1': pt });
    const csv = exportBukuRacunCsv(entries);

    expect(csv).toContain('No. Siri,Tarikh,No. Preskripsi / Resit');
    expect(csv).toContain('Ahmad bin Razak');
    expect(csv).toContain('880512-14-5531');
    expect(csv).toContain('Cetirizine 10mg Tab');
    expect(csv).toContain('Group C (Pharmacy Only)');
  });
});
