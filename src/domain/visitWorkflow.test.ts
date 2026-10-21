import { describe, expect, it } from 'vitest';
import { Visit } from '../types';
import {
  completeConsultation, completeDispensing, completeTriage, settlePayment, splitQueues,
} from './visitWorkflow';

const soap = (): Visit['soap'] => ({
  subjective: '',
  objective: { bpSystolic: 0, bpDiastolic: 0, heartRate: 0, temperature: 0, respiratoryRate: 0 },
  assessment: { icdCode: '', description: '', clinicalNotes: '' },
  plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false },
});

const visit = (overrides: Partial<Visit> = {}): Visit => ({
  id: 'v1', patientId: 'p1', date: '2026-01-01', soap: soap(), status: 'Awaiting Triage',
  totalBill: 0, panelClaimed: 0, paidAmount: 0, ...overrides,
});

describe('splitQueues', () => {
  it('routes each status to exactly one queue', () => {
    const visits = [
      visit({ id: 'a', status: 'Awaiting Triage' }),
      visit({ id: 'b', status: 'Awaiting Consult' }),
      visit({ id: 'c', status: 'Consulting' }),
      visit({ id: 'd', status: 'Awaiting Dispensation' }),
      visit({ id: 'e', status: 'Awaiting Billing' }),
    ];
    const q = splitQueues(visits);
    expect(q.triage.map((v) => v.id)).toEqual(['a']);
    expect(q.doctor.map((v) => v.id)).toEqual(['b', 'c']);
    expect(q.pharmacy.map((v) => v.id)).toEqual(['d']);
    expect(q.cashier.map((v) => v.id)).toEqual(['e']);
  });

  it('ignores visits that are closed or in transient states', () => {
    const q = splitQueues([visit({ status: 'Paid' }), visit({ status: 'Cancelled' }), visit({ status: 'Dispensing' })]);
    expect(q.triage.length + q.doctor.length + q.pharmacy.length + q.cashier.length).toBe(0);
  });
});

describe('transitions', () => {
  it('triage keeps existing SOAP data and merges vitals', () => {
    const start = visit({ soap: { ...soap(), objective: { ...soap().objective, heartRate: 70 } } });
    const next = completeTriage(start, { temperature: 38.5 }, 'Fever');
    expect(next.status).toBe('Awaiting Consult');
    expect(next.soap.subjective).toBe('Fever');
    expect(next.soap.objective).toMatchObject({ heartRate: 70, temperature: 38.5 });
  });

  it('consultation sends the visit to the pharmacy and records the MC flag', () => {
    const next = completeConsultation(visit({ status: 'Consulting' }), soap(), true);
    expect(next.status).toBe('Awaiting Dispensation');
    expect(next.mcIssued).toBe(true);
  });

  it('dispensing sends the visit to the cashier', () => {
    expect(completeDispensing(visit({ status: 'Awaiting Dispensation' })).status).toBe('Awaiting Billing');
  });

  it('settling a payment closes the visit with payment details', () => {
    const next = settlePayment(visit({ status: 'Awaiting Billing' }), {
      paymentMethod: 'Panel', paidAmount: 20, panelClaimed: 80, glNumber: 'GL-1',
    });
    expect(next).toMatchObject({ status: 'Paid', paymentMethod: 'Panel', paidAmount: 20, panelClaimed: 80, glNumber: 'GL-1' });
  });

  it('never mutates the input visit', () => {
    const start = visit();
    Object.freeze(start);
    expect(() => completeTriage(start, {}, 'x')).not.toThrow();
    expect(start.status).toBe('Awaiting Triage');
  });

  it('walks a visit through the full lifecycle in order', () => {
    let v = visit();
    const seen = [v.status];
    v = completeTriage(v, {}, 'Cough'); seen.push(v.status);
    v = completeConsultation(v, v.soap, false); seen.push(v.status);
    v = completeDispensing(v); seen.push(v.status);
    v = settlePayment(v, { paymentMethod: 'Cash', paidAmount: 50, panelClaimed: 0 }); seen.push(v.status);
    expect(seen).toEqual(['Awaiting Triage', 'Awaiting Consult', 'Awaiting Dispensation', 'Awaiting Billing', 'Paid']);
  });
});
