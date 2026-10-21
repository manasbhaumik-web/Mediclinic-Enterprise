import { describe, expect, it } from 'vitest';
import {
  duplicateMessage, duplicateMessageFromDbError, findStaffDuplicate, normalizeEmail, normalizeIdNumber,
} from './staffIdentity';

const existing = [
  { id: '1', name: 'Aina Ali', email: 'aina@clinic.my', icNumber: '900101-14-5555', dob: '1990-01-01' },
  { id: '2', name: 'Marcus Wong', email: 'marcus@clinic.my', icNumber: null, dob: '1982-08-25' },
];

describe('normalisation', () => {
  it('treats emails as equal regardless of capitals and spaces', () => {
    expect(normalizeEmail('  Aina@Clinic.MY ')).toBe('aina@clinic.my');
  });

  it('treats NRIC formats and passport numbers consistently', () => {
    expect(normalizeIdNumber('900101-14-5555')).toBe('900101145555');
    expect(normalizeIdNumber('900101 14 5555')).toBe('900101145555');
    expect(normalizeIdNumber('a1234567')).toBe('A1234567');
    expect(normalizeIdNumber(null)).toBe('');
  });
});

describe('findStaffDuplicate', () => {
  it('blocks the same email in any capitalisation', () => {
    const m = findStaffDuplicate({ name: 'Someone Else', email: 'AINA@Clinic.my ' }, existing);
    expect(m).toMatchObject({ kind: 'email', blocking: true });
    expect(m?.with.id).toBe('1');
  });

  it('blocks the same ID number even when written differently', () => {
    const m = findStaffDuplicate({ name: 'X', email: 'x@clinic.my', icNumber: '900101145555' }, existing);
    expect(m).toMatchObject({ kind: 'id_number', blocking: true });
  });

  it('flags the same name and date of birth as a probable duplicate that can be overridden', () => {
    const m = findStaffDuplicate({ name: ' aina  ali', email: 'other@clinic.my', dob: '1990-01-01' }, existing);
    expect(m).toMatchObject({ kind: 'name_dob', blocking: false });
  });

  it('does not flag the same name with a different date of birth, or no date of birth', () => {
    expect(findStaffDuplicate({ name: 'Aina Ali', email: 'o@clinic.my', dob: '1991-02-02' }, existing)).toBeNull();
    expect(findStaffDuplicate({ name: 'Aina Ali', email: 'o@clinic.my' }, existing)).toBeNull();
  });

  it('ignores records without an ID number rather than treating blanks as equal', () => {
    expect(findStaffDuplicate({ name: 'New', email: 'new@clinic.my', icNumber: '' }, existing)).toBeNull();
    expect(findStaffDuplicate({ name: 'New', email: 'new@clinic.my', icNumber: null }, [{ id: '9', icNumber: null }])).toBeNull();
  });

  it('does not match a record against itself when editing', () => {
    expect(findStaffDuplicate({ id: '1', name: 'Aina Ali', email: 'aina@clinic.my', icNumber: '900101-14-5555' }, existing)).toBeNull();
  });

  it('still catches a clash with someone else when editing', () => {
    expect(findStaffDuplicate({ id: '2', email: 'aina@clinic.my' }, existing)).toMatchObject({ kind: 'email' });
  });

  it('puts certain matches ahead of probable ones', () => {
    const m = findStaffDuplicate({ name: 'Marcus Wong', email: 'aina@clinic.my', dob: '1982-08-25' }, existing);
    expect(m?.kind).toBe('email');
  });
});

describe('messages', () => {
  it('names the existing person and explains how to override only a probable match', () => {
    expect(duplicateMessage({ kind: 'email', blocking: true, with: { name: 'Aina Ali' } })).toBe('A staff member with this email already exists (Aina Ali).');
    expect(duplicateMessage({ kind: 'name_dob', blocking: false, with: { name: 'Aina Ali' } })).toContain('confirm to add them anyway');
  });

  it('turns database unique violations into the same wording', () => {
    expect(duplicateMessageFromDbError('duplicate key value violates unique constraint "staff_email_unique_ci"')).toMatch(/email already exists/);
    expect(duplicateMessageFromDbError('duplicate key value violates unique constraint "staff_id_number_unique"')).toMatch(/ID number already exists/);
    expect(duplicateMessageFromDbError('duplicate key value violates unique constraint "other"')).toBe('This staff member already exists.');
    expect(duplicateMessageFromDbError('permission denied')).toBeNull();
  });
});
