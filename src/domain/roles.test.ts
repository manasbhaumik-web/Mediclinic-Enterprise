import { describe, expect, it } from 'vitest';
import { ALL_ROLES, hasAnyRole, isUserRole, joinRoleLabels, normalizeRoles } from './roles';

describe('isUserRole', () => {
  it('knows the seven roles and rejects anything else', () => {
    ALL_ROLES.forEach((r) => expect(isUserRole(r)).toBe(true));
    expect(isUserRole('clerk')).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
  });
});

describe('normalizeRoles', () => {
  it('puts the primary role first and drops repeats and unknown values', () => {
    expect(normalizeRoles('clinic-assistant', ['cashier', 'receptionist', 'clinic-assistant', 'clerk'])).toEqual(['clinic-assistant', 'receptionist', 'cashier']);
  });
  it('falls back to the primary role when no list is stored', () => {
    expect(normalizeRoles('doctor')).toEqual(['doctor']);
    expect(normalizeRoles('doctor', null)).toEqual(['doctor']);
  });
  it('is empty for a profile with no valid role', () => {
    expect(normalizeRoles('nonsense', [])).toEqual([]);
  });
});

describe('hasAnyRole', () => {
  it('passes when one of several roles is allowed', () => {
    expect(hasAnyRole(['receptionist', 'cashier'], ['cashier', 'admin'])).toBe(true);
  });
  it('fails for no overlap, no roles, or a missing list', () => {
    expect(hasAnyRole(['receptionist'], ['cashier'])).toBe(false);
    expect(hasAnyRole([], ['cashier'])).toBe(false);
    expect(hasAnyRole(null, ['cashier'])).toBe(false);
  });
});

describe('joinRoleLabels', () => {
  it('joins readable names', () => {
    expect(joinRoleLabels(['receptionist', 'clinic-assistant', 'cashier'])).toBe('Receptionist · Assistant · Cashier');
  });
});
