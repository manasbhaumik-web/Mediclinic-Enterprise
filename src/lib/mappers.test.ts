import { describe, expect, it } from 'vitest';
import { Appointment, Patient, Visit } from '../types';
import {
  appointmentFromRow, appointmentToRow, patientFromRow, patientToRow,
  buildSignoffArgs, prescriptionsToRows, soapToRow, visitFromRow,
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

  it('prescription rows link to stock by id and never set the dispensed fields', () => {
    const v = { ...visit, soap: { ...visit.soap, plan: { ...visit.soap!.plan, prescription: [{ ...visit.soap!.plan.prescription[0], inventoryId: 'inv-1' }] } } } as unknown as Visit;
    const [row] = prescriptionsToRows(v);
    expect(row).toMatchObject({ inventory_id: 'inv-1' });
    expect(row).not.toHaveProperty('dispensed_at');
    expect(row).not.toHaveProperty('skipped');
  });

  it('reads the stock link and dispensing state from a prescription row', () => {
    const v = visitFromRow({ id: 'v', patient_id: 'p', status: 'Dispensing', created_at: '2026-01-01T00:00:00Z', prescriptions: [{ id: 'r', drug_name: 'X', quantity: 2, price_per_unit: 1, inventory_id: 'inv-9', dispensed_at: '2026-01-02T00:00:00Z', dispensed_quantity: 2 }] });
    expect(v.soap.plan.prescription[0]).toMatchObject({ inventoryId: 'inv-9', dispensedAt: '2026-01-02T00:00:00Z', dispensedQuantity: 2, skipped: false });
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

describe('buildSignoffArgs', () => {
  const visit = {
    id: 'v1', patientId: 'p1', date: '2026-10-22', status: 'Awaiting Dispensation', totalBill: 999, panelClaimed: 5, paidAmount: 999, paymentMethod: 'Cash', mcIssued: true,
    soap: {
      subjective: 'cough', objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 70, temperature: 37, respiratoryRate: 16 },
      assessment: { icdCode: 'J06.9', description: 'URTI', clinicalNotes: 'n' },
      plan: {
        prescription: [{ drugName: 'Paracetamol', dosage: '1 tab', dosageBM: '1 biji', frequency: 'TDS', quantity: 10, pricePerUnit: 0.5, expiryDate: '', pillColor: 'white', capsuleStyle: 'round', inventoryId: 'inv1' }],
        followUpWeeks: 1, mcDays: 2, requiresReferral: false, pharmacyMemo: 'm',
      },
    },
  } as unknown as Visit;

  it('sends the clinical content and the certificate flag, never a status or billing figure', () => {
    const a = buildSignoffArgs(visit, true);
    expect(a.visit_payload).toEqual({ id: 'v1', mc_issued: true });
    expect(a.soap_payload).toMatchObject({ icd_code: 'J06.9', subjective: 'cough', mc_days: 2 });
    expect(a.rx_payload).toHaveLength(1);
    expect(a.rx_payload[0]).toMatchObject({ drug_name: 'Paracetamol', quantity: 10, price_per_unit: 0.5, inventory_id: 'inv1' });
    const everything = JSON.stringify(a);
    expect(everything).not.toMatch(/total_bill|paid_amount|panel_claimed|payment_method|"status"/);
  });
});

describe('called-patient mapping', () => {
  it('reads who called the patient, the room and the time', () => {
    const v = visitFromRow({ id: 'v', patient_id: 'p', status: 'Consulting', created_at: '2026-01-01T00:00:00Z', consult_room: 'Room 2', called_by: 'u1', called_by_name: 'Dr. Sarah Jenkins', called_at: '2026-01-01T09:30:00Z' });
    expect(v).toMatchObject({ status: 'Consulting', consultRoom: 'Room 2', calledBy: 'u1', calledByName: 'Dr. Sarah Jenkins', calledAt: Date.parse('2026-01-01T09:30:00Z') });
  });
  it('leaves the call fields empty for a patient nobody has called', () => {
    const v = visitFromRow({ id: 'v', patient_id: 'p', status: 'Awaiting Consult', created_at: '2026-01-01T00:00:00Z', consult_room: null, called_by: null, called_by_name: null, called_at: null });
    expect(v.consultRoom).toBeUndefined();
    expect(v.calledBy).toBeUndefined();
    expect(v.calledAt).toBeUndefined();
  });
});
