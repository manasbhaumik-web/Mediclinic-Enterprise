import { describe, expect, it } from 'vitest';
import {
  SYSTEM_ROLES, assignableRoles, canGrant, canGrantAll, canManageAccessOf, isSystemRole, normalizeRoleSet, suggestSystemRole, suggestSystemRoles, validateStaffInput,
} from './staffAccess';

describe('assignableRoles', () => {
  it('admin can grant every role', () => {
    expect(assignableRoles('admin')).toEqual([...SYSTEM_ROLES]);
  });

  it('HR can grant clinical and front-desk roles but never admin or HR', () => {
    expect(assignableRoles('hr')).toEqual(['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier']);
    expect(canGrant('hr', 'admin')).toBe(false);
    expect(canGrant('hr', 'hr')).toBe(false);
  });

  it('everyone else, and signed-out callers, can grant nothing', () => {
    for (const r of ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', null, undefined, '']) {
      expect(assignableRoles(r as string | null)).toEqual([]);
    }
  });
});

describe('canManageAccessOf', () => {
  it('admin can manage anyone', () => {
    for (const r of [...SYSTEM_ROLES, null] as const) expect(canManageAccessOf('admin', r)).toBe(true);
  });

  it('HR cannot touch admin or HR accounts, which would let HR escalate or lock out admins', () => {
    expect(canManageAccessOf('hr', 'admin')).toBe(false);
    expect(canManageAccessOf('hr', 'hr')).toBe(false);
    expect(canManageAccessOf('hr', 'doctor')).toBe(true);
    expect(canManageAccessOf('hr', null)).toBe(true);
  });

  it('other roles manage nobody', () => {
    expect(canManageAccessOf('doctor', null)).toBe(false);
    expect(canManageAccessOf(undefined, 'doctor')).toBe(false);
  });
});

describe('suggestSystemRole', () => {
  it.each([
    ['Senior GP Physician', 'General Practice', 'doctor'],
    ['Consultant Pediatrician', 'Pediatrics', 'doctor'],
    ['Dr. Sarah Tan', '', 'doctor'],
    ['Chief Pharmacist', 'Pharmacy', 'pharmacist'],
    ['Staff Nurse (Shift A)', 'General Practice', 'clinic-assistant'],
    ['Senior Patient Registrar', 'Front Desk & Reception', 'receptionist'],
    ['Receptionist & Cashier', 'Administration', 'receptionist'],
    ['Billing Cashier', 'Front Counter', 'cashier'],
  ])('%s -> %s', (title, dept, expected) => {
    expect(suggestSystemRole(title, dept)).toBe(expected);
  });

  it('never suggests admin or HR, and returns null when unsure', () => {
    expect(suggestSystemRole('HR & Payroll Specialist', 'Human Resources')).toBeNull();
    expect(suggestSystemRole('Healthcare Operations Manager', 'Administration')).toBeNull();
    expect(suggestSystemRole('Cleaner', '')).toBeNull();
  });
});

describe('validateStaffInput', () => {
  it('accepts a complete record', () => {
    expect(validateStaffInput({ name: 'A', email: 'a@b.my', role: 'Nurse', salaryBase: 4000 })).toEqual([]);
  });

  it('reports each problem', () => {
    expect(validateStaffInput({})).toEqual(['Name is required', 'Email is required', 'Job title is required']);
    expect(validateStaffInput({ name: 'A', email: 'not-an-email', role: 'x' })).toEqual(['Email is not valid']);
    expect(validateStaffInput({ name: 'A', email: 'a@b.my', role: 'x', salaryBase: -1 })).toEqual(['Salary must be a number of zero or more']);
  });

  it('isSystemRole guards unknown values', () => {
    expect(isSystemRole('doctor')).toBe(true);
    expect(isSystemRole('superuser')).toBe(false);
    expect(isSystemRole(undefined)).toBe(false);
  });
});

describe('several roles per person', () => {
  it('suggests every role a job title implies', () => {
    expect(suggestSystemRoles('Receptionist & Cashier', 'Administration')).toEqual(['receptionist', 'cashier']);
    expect(suggestSystemRoles('Front desk, triage and billing', '')).toEqual(['receptionist', 'clinic-assistant', 'cashier']);
    expect(suggestSystemRoles('Cleaner', '')).toEqual([]);
  });

  it('normalizes a role set: valid roles only, no repeats, order kept', () => {
    expect(normalizeRoleSet(['cashier', 'clerk', 'receptionist', 'cashier'])).toEqual(['cashier', 'receptionist']);
    expect(normalizeRoleSet('doctor')).toEqual([]);
    expect(normalizeRoleSet(undefined)).toEqual([]);
  });

  it('HR may grant the front-desk roles together but not a set containing admin', () => {
    expect(canGrantAll('hr', ['receptionist', 'clinic-assistant', 'cashier'])).toBe(true);
    expect(canGrantAll('hr', ['receptionist', 'admin'])).toBe(false);
    expect(canGrantAll('hr', [])).toBe(false);
    expect(canGrantAll('admin', ['doctor', 'admin'])).toBe(true);
  });

  it('HR cannot manage a person who holds a privileged role among others', () => {
    expect(canManageAccessOf('hr', ['receptionist', 'cashier'])).toBe(true);
    expect(canManageAccessOf('hr', ['doctor', 'admin'])).toBe(false);
    expect(canManageAccessOf('admin', ['doctor', 'admin'])).toBe(true);
  });
});
