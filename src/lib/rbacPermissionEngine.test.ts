import { describe, expect, it } from 'vitest';
import { RBACPermissionEngine as RBAC } from './rbacPermissionEngine';

describe('RBACPermissionEngine', () => {
  it('denies everything without a role', () => {
    expect(RBAC.hasPermission(null, 'VIEW_FULL_NRIC')).toBe(false);
    expect(RBAC.hasPermission(undefined, 'COLLECT_PAYMENT')).toBe(false);
  });

  it('only clinicians write SOAP notes and issue MCs', () => {
    expect(RBAC.hasPermission('doctor', 'EDIT_CLINICAL_SOAP')).toBe(true);
    expect(RBAC.hasPermission('doctor', 'ISSUE_MC_LEAVE')).toBe(true);
    for (const role of ['pharmacist', 'clinic-assistant', 'hr'] as const) {
      expect(RBAC.hasPermission(role, 'EDIT_CLINICAL_SOAP')).toBe(false);
      expect(RBAC.hasPermission(role, 'ISSUE_MC_LEAVE')).toBe(false);
    }
  });

  it('only doctor, pharmacist and admin may dispense scheduled poisons (Poisons Act 1952)', () => {
    for (const role of ['doctor', 'pharmacist', 'admin'] as const) {
      expect(RBAC.hasPermission(role, 'DISPENSE_POISON_SCHEDULE')).toBe(true);
    }
    for (const role of ['clinic-assistant', 'hr'] as const) {
      expect(RBAC.hasPermission(role, 'DISPENSE_POISON_SCHEDULE')).toBe(false);
    }
  });

  it('only admin can change system settings', () => {
    expect(RBAC.hasPermission('admin', 'CONFIGURE_SYSTEM_SETTINGS')).toBe(true);
    for (const role of ['doctor', 'pharmacist', 'clinic-assistant', 'hr'] as const) {
      expect(RBAC.hasPermission(role, 'CONFIGURE_SYSTEM_SETTINGS')).toBe(false);
    }
  });

  it('assertPermission throws with the role and permission in the message', () => {
    expect(() => RBAC.assertPermission('hr', 'EDIT_CLINICAL_SOAP', 'charting')).toThrow(/hr.*EDIT_CLINICAL_SOAP.*charting/);
    expect(() => RBAC.assertPermission('doctor', 'EDIT_CLINICAL_SOAP')).not.toThrow();
  });

  it('getPermissionsForRole matches hasPermission', () => {
    const perms = RBAC.getPermissionsForRole('pharmacist');
    expect(perms).toContain('DISPENSE_POISON_SCHEDULE');
    expect(perms.every((p) => RBAC.hasPermission('pharmacist', p))).toBe(true);
  });
});
