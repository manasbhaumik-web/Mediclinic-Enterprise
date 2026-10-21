import { describe, expect, it } from 'vitest';
import { Appointment, Patient, Visit } from '../types';
import {
  appointmentFromRow, appointmentToRow, patientFromRow, patientToRow,
  prescriptionsToRows, soapToRow, visitFromRow,
} from './mappers';

describe('patient mapping', () => {
  const patient: Patient = {
    id: 'p1', fullName: 'Aina Binti Ali', icNumber: '900101-14-5555', gender: 'Female', dob: '1990-01-01',
    address: 'Shah Alam', phone: '0123456789', panelEmployer: 'Petronas', drugAllergies: ['Penicillin'],
    registeredDate: '2026-01-01',
  };

  it('writes snake_case columns', () => {
    expect(patientToRow(patient)).toMatchObject({ full_name: 'Aina Binti Ali', ic_number: '900101-14-5555', drug_allergies: ['Penicillin'] });
  });

  it('round-trips through a row', () => {
    const row = { ...patientToRow(patient), registered_date: patient.registeredDate };
    expect(patientFromRow(row)).toEqual(patient);
  });

  it('defaults missing optional columns', () => {
    const p = patientFromRow({ id: 'x', full_name: 'N', ic_number: '1', address: null, drug_allergies: null });
    expect(p.address).toBe('');
    expect(p.drugAllergies).toEqual([]);
  });
});

describe('visit mapping', () => {
  const visit = {
    id: 'v1',
    soap: {
      subjective: 'Cough',
      objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 70, temperature: 37, respiratoryRate: 16 },
      assessment: { icdCode: 'J06.9', description: 'URTI', clinicalNotes: 'rest' },
      plan: {
        prescription: [{ id: 'r1', drugName: 'Paracetamol', dosage: '500mg', dosageBM: '500mg', frequency: 'TDS', quantity: 10, pricePerUnit: 0.5, expiryDate: '2027-01-01', pillColor: 'white', capsuleStyle: 'round' }],
        followUpWeeks: 1, mcDays: 2, requiresReferral: false, pharmacyMemo: 'with food',
      },
    },
  } as unknown as Visit;

  it('soap rows use real column names (pharmacy_memo, not pharmacyMemo)', () => {
    const row = soapToRow(visit);
    expect(row).toHaveProperty('pharmacy_memo', 'with food');
    expect(row).not.toHaveProperty('pharmacyMemo');
    expect(row).toMatchObject({ visit_id: 'v1', bp_systolic: 120, icd_code: 'J06.9', mc_days: 2 });
  });

  it('prescription rows carry the visit id', () => {
    const rows = prescriptionsToRows(visit);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ visit_id: 'v1', drug_name: 'Paracetamol', price_per_unit: 0.5 });
  });

  it('reads a joined visit row with notes and prescriptions', () => {
    const row = {
      id: 'v1', patient_id: 'p1', status: 'Awaiting Consult', visit_date: '2026-01-01', total_bill: '12.5',
      panel_claimed: '0', paid_amount: '0', registered_time: '1700000000000', created_at: '2026-01-01T00:00:00Z',
      soap_notes: [{ subjective: 'Cough', bp_systolic: 120, pharmacy_memo: 'm' }],
      prescriptions: [{ id: 'r1', drug_name: 'Paracetamol', price_per_unit: 0.5, quantity: 10 }],
    };
    const v = visitFromRow(row);
    expect(v.totalBill).toBe(12.5);
    expect(v.registeredTime).toBe(1700000000000);
    expect(v.soap.subjective).toBe('Cough');
    expect(v.soap.objective.bpSystolic).toBe(120);
    expect(v.soap.plan.pharmacyMemo).toBe('m');
    expect(v.soap.plan.prescription[0]).toMatchObject({ drugName: 'Paracetamol', quantity: 10 });
  });

  it('tolerates a visit with no soap note or prescriptions yet', () => {
    const v = visitFromRow({ id: 'v2', patient_id: 'p', status: 'Awaiting Triage', created_at: '2026-01-01T00:00:00Z' });
    expect(v.soap.subjective).toBe('');
    expect(v.soap.plan.prescription).toEqual([]);
    expect(v.soap.objective.heartRate).toBe(0);
  });
});

describe('appointment mapping', () => {
  it('round-trips the writable fields', () => {
    const app: Appointment = {
      id: 'a1', patientId: 'p1', patientName: 'Aina', patientPhone: '012', appointmentTime: '2026-02-01T09:00:00Z',
      durationMinutes: 30, purpose: 'Review', status: 'Scheduled', createdAt: '2026-01-01T00:00:00Z',
    };
    const back = appointmentFromRow({ ...appointmentToRow(app), created_at: app.createdAt });
    expect(back).toMatchObject({ id: 'a1', patientName: 'Aina', durationMinutes: 30, status: 'Scheduled' });
  });
});
