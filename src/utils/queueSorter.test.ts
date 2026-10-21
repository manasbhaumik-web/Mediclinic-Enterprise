import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Patient, Visit } from '../types';
import { filterQueue, getChiefComplaintLabel, sortQueue } from './queueSorter';

const NOW = new Date('2026-01-01T10:00:00Z').getTime();
const minsAgo = (m: number) => NOW - m * 60000;

const patient = (id: string, allergies: string[] = [], name = id): Patient => ({
  id, fullName: name, icNumber: `ic-${id}`, gender: 'Male', dob: '1990-01-01', address: '', phone: '',
  panelEmployer: 'None', drugAllergies: allergies, registeredDate: '2026-01-01',
});

const visit = (id: string, patientId: string, waitMins: number): Visit => ({
  id, patientId, date: '2026-01-01', status: 'Awaiting Consult', totalBill: 0, panelClaimed: 0, paidAmount: 0,
  registeredTime: minsAgo(waitMins),
  soap: { subjective: '', objective: { bpSystolic: 0, bpDiastolic: 0, heartRate: 0, temperature: 0, respiratoryRate: 0 },
    assessment: { icdCode: '', description: '', clinicalNotes: '' },
    plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false } },
});

const patients: Record<string, Patient> = {
  a: patient('a', [], 'Aina'),
  b: patient('b', ['Penicillin'], 'Bala'),
  c: patient('c', [], 'Chen'),
};
const queue = [visit('v1', 'a', 30), visit('v2', 'b', 5), visit('v3', 'c', 25)];

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); });

describe('sortQueue', () => {
  it('urgency: drug-allergy patients first, then longest wait', () => {
    expect(sortQueue(queue, 'urgency', patients).map((v) => v.id)).toEqual(['v2', 'v1', 'v3']);
  });

  it('wait: longest wait first regardless of allergies', () => {
    expect(sortQueue(queue, 'wait', patients).map((v) => v.id)).toEqual(['v1', 'v3', 'v2']);
  });

  it('arrival: earliest registration first', () => {
    expect(sortQueue(queue, 'arrival', patients).map((v) => v.id)).toEqual(['v1', 'v3', 'v2']);
  });

  it('pinned visits float to the top without losing the rest of the order', () => {
    const sorted = sortQueue(queue, 'wait', patients, { v2: true });
    expect(sorted.map((v) => v.id)).toEqual(['v2', 'v1', 'v3']);
  });

  it('does not mutate the input array', () => {
    const copy = [...queue];
    sortQueue(queue, 'wait', patients);
    expect(queue).toEqual(copy);
  });
});

describe('filterQueue', () => {
  it('high acuity keeps only patients with drug allergies', () => {
    expect(filterQueue(queue, 'high', '', patients).map((v) => v.id)).toEqual(['v2']);
  });

  it('sla keeps visits waiting 20 minutes or more', () => {
    expect(filterQueue(queue, 'sla', '', patients).map((v) => v.id)).toEqual(['v1', 'v3']);
  });

  it('search matches patient names case-insensitively', () => {
    expect(filterQueue(queue, 'all', 'chen', patients).map((v) => v.id)).toEqual(['v3']);
  });
});

describe('getChiefComplaintLabel', () => {
  it('falls back to a general label and recognises common complaints', () => {
    expect(getChiefComplaintLabel(undefined)).toBe('General Outpatient Consultation');
    expect(getChiefComplaintLabel('Fever and sore throat')).toBe('Fever + sore throat');
    expect(getChiefComplaintLabel('cough for 3 days')).toBe('Cough & cold / URTI');
  });
});
