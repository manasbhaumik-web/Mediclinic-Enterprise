import { describe, it, expect } from 'vitest';
import { keepActiveConsultation, newArrivals, snapshotOf, stationsForRoles } from './stationAlerts';
import type { Visit } from '../types';

const v = (id: string, status: Visit['status'], calledBy?: string) => ({ id, status, calledBy } as Visit);
const queues = (o: Partial<Record<'triage' | 'doctor' | 'pharmacy' | 'cashier', string[]>>) => snapshotOf({
  triage: (o.triage ?? []).map((id) => v(id, 'Awaiting Triage')),
  doctor: (o.doctor ?? []).map((id) => v(id, 'Awaiting Consult')),
  pharmacy: (o.pharmacy ?? []).map((id) => v(id, 'Awaiting Dispensation')),
  cashier: (o.cashier ?? []).map((id) => v(id, 'Awaiting Billing')),
});

describe('stationsForRoles', () => {
  it('maps queue roles to their queues and ignores the rest', () => {
    expect(stationsForRoles(['doctor'])).toEqual(['doctor']);
    expect(stationsForRoles(['clinic-assistant', 'receptionist', 'cashier'])).toEqual(['triage', 'cashier']);
    expect(stationsForRoles(['admin', 'hr', 'receptionist'])).toEqual([]);
  });
});

describe('newArrivals', () => {
  it('announces nobody on the first snapshot', () => {
    expect(newArrivals(null, queues({ doctor: ['a', 'b'] }), ['doctor'])).toEqual([]);
  });

  it('reports visits that joined a watched queue', () => {
    expect(newArrivals(queues({ doctor: ['a'] }), queues({ doctor: ['a', 'b'] }), ['doctor'])).toEqual([{ station: 'doctor', visitIds: ['b'] }]);
  });

  it('ignores queues the person does not watch and visits that left', () => {
    expect(newArrivals(queues({ pharmacy: ['a'] }), queues({ pharmacy: ['a', 'b'], doctor: [] }), ['doctor'])).toEqual([]);
    expect(newArrivals(queues({ doctor: ['a', 'b'] }), queues({ doctor: ['a'] }), ['doctor'])).toEqual([]);
  });
});

describe('keepActiveConsultation', () => {
  const visits = [v('1', 'Consulting', 'dr-1'), v('2', 'Consulting', 'dr-2'), v('3', 'Holding for Results', 'dr-2'), v('4', 'Awaiting Dispensation')];

  it('keeps a consultation that is still with this doctor', () => {
    expect(keepActiveConsultation(visits, '1', 'dr-1')).toBe(true);
  });

  it('drops one taken by another doctor, finished, or gone', () => {
    expect(keepActiveConsultation(visits, '2', 'dr-1')).toBe(false);
    expect(keepActiveConsultation(visits, '4', 'dr-1')).toBe(false);
    expect(keepActiveConsultation(visits, '9', 'dr-1')).toBe(false);
    expect(keepActiveConsultation(visits, null, 'dr-1')).toBe(false);
  });

  it('keeps a held patient the doctor can recall', () => {
    expect(keepActiveConsultation(visits, '3', 'dr-1')).toBe(true);
  });
});
