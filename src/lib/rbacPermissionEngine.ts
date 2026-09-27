/**
 * Role-Based Access Control (RBAC) & Governance Permission Engine
 * Enforces role-based clinical boundaries for Malaysian healthcare clinics
 * compliant with Act 586 and Poison Act 1952 regulations.
 */

import { UserRole } from '../types';

export type ClinicalPermission =
  | 'VIEW_FULL_NRIC'
  | 'EDIT_CLINICAL_SOAP'
  | 'DISPENSE_POISON_SCHEDULE'
  | 'ISSUE_MC_LEAVE'
  | 'COLLECT_PAYMENT'
  | 'APPLY_BILLING_DISCOUNT'
  | 'VIEW_FINANCIAL_REPORTS'
  | 'MANAGE_INVENTORY_STOCK'
  | 'MANAGE_STAFF_ACCOUNTS'
  | 'EXPORT_MOH_AUDIT_LOGS'
  | 'CONFIGURE_SYSTEM_SETTINGS';

const ROLE_PERMISSIONS: Record<UserRole, Set<ClinicalPermission>> = {
  doctor: new Set([
    'VIEW_FULL_NRIC',
    'EDIT_CLINICAL_SOAP',
    'DISPENSE_POISON_SCHEDULE',
    'ISSUE_MC_LEAVE',
    'COLLECT_PAYMENT',
    'VIEW_FINANCIAL_REPORTS',
    'MANAGE_INVENTORY_STOCK',
    'EXPORT_MOH_AUDIT_LOGS',
  ]),
  pharmacist: new Set([
    'VIEW_FULL_NRIC',
    'DISPENSE_POISON_SCHEDULE',
    'COLLECT_PAYMENT',
    'MANAGE_INVENTORY_STOCK',
  ]),
  'clinic-assistant': new Set([
    'VIEW_FULL_NRIC',
    'COLLECT_PAYMENT',
    'APPLY_BILLING_DISCOUNT',
  ]),
  admin: new Set([
    'VIEW_FULL_NRIC',
    'EDIT_CLINICAL_SOAP',
    'DISPENSE_POISON_SCHEDULE',
    'ISSUE_MC_LEAVE',
    'COLLECT_PAYMENT',
    'APPLY_BILLING_DISCOUNT',
    'VIEW_FINANCIAL_REPORTS',
    'MANAGE_INVENTORY_STOCK',
    'MANAGE_STAFF_ACCOUNTS',
    'EXPORT_MOH_AUDIT_LOGS',
    'CONFIGURE_SYSTEM_SETTINGS',
  ]),
  hr: new Set([
    'VIEW_FULL_NRIC',
    'VIEW_FINANCIAL_REPORTS',
    'MANAGE_STAFF_ACCOUNTS',
  ]),
};

export class RBACPermissionEngine {
  /**
   * Checks whether a given user role possesses the requested permission.
   */
  public static hasPermission(role: UserRole | null | undefined, permission: ClinicalPermission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? permissions.has(permission) : false;
  }

  /**
   * Asserts permission and throws an explicit security exception if access is denied.
   */
  public static assertPermission(role: UserRole | null | undefined, permission: ClinicalPermission, contextLabel: string = 'Operation'): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`[RBAC Access Denied] Role '${role || 'unauthenticated'}' lacks permission '${permission}' required for ${contextLabel}.`);
    }
  }

  /**
   * Gets all authorized permissions for a role.
   */
  public static getPermissionsForRole(role: UserRole): ClinicalPermission[] {
    return Array.from(ROLE_PERMISSIONS[role] || []);
  }
}
