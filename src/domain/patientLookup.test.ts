import { describe, it, expect } from 'vitest';
import { missingPatientIds } from './patientLookup';
import type { Patient, Visit } from '../types';

const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';
const patient = (id: string) => ({ id } as Patient);
const visit = (patientId: string) => ({ patientId } as Visit);

describe('missingPatientIds', () => {
  it('names the patients visits point to that the list does not hold', () => {
    expect(missingPatientIds([patient(a)], [visit(a), visit(b)])).toEqual([b]);
  });

  it('lists each missing patient once, in a stable order', () => {
    expect(missingPatientIds([], [visit(b), visit(a), visit(b)])).toEqual([a, b]);
  });

  it('ignores ids that are not database ids, such as sample data', () => {
    expect(missingPatientIds([], [visit('p1'), visit('')])).toEqual([]);
  });

  it('is empty when every patient is loaded', () => {
    expect(missingPatientIds([patient(a), patient(b)], [visit(a), visit(b)])).toEqual([]);
  });
});
