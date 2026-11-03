import { describe, it, expect } from 'vitest';
import { TAB_ROLES, canOpenTab, ADMIN_ROLES } from '../routes/permissions';
import type { UserRole } from '../types';
import { APP_MODULES, ADMIN_SECTIONS, ADMIN_CATEGORIES, navModules, paletteModules, visibleAdminSections } from './index';

/** The module registry replaced several hand-written lists. These tables pin the behaviour those lists had. */

const ALL: UserRole[] = ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'];

const EXPECTED_TAB_ROLES: Record<string, UserRole[]> = {
  dashboard: ALL,
  queue: ['doctor'],
  consultation: ['doctor'],
  reports: ['doctor'],
  registration: ['receptionist', 'clinic-assistant'],
  triage: ['clinic-assistant'],
  appointments: ['receptionist', 'admin'],
  dispensary: ['pharmacist'],
  inventory: ['pharmacist'],
  billing: ['cashier'],
  'my-leave': ALL,
};

describe('route access (TAB_ROLES)', () => {
  it('keeps the page-to-role table exactly as it was', () => {
    expect(Object.fromEntries(Object.entries(TAB_ROLES).map(([k, v]) => [k, [...v]]))).toEqual(EXPECTED_TAB_ROLES);
  });

  it('lets a person with several roles open the union of their pages', () => {
    expect(canOpenTab(['doctor', 'cashier'], 'queue')).toBe(true);
    expect(canOpenTab(['doctor', 'cashier'], 'billing')).toBe(true);
    expect(canOpenTab(['doctor', 'cashier'], 'triage')).toBe(false);
    expect(canOpenTab(null, 'dashboard')).toBe(false);
  });

  it('keeps the admin console to admin and hr', () => {
    expect([...ADMIN_ROLES]).toEqual(['admin', 'hr']);
  });
});

const navIds = (roles: UserRole[]) => navModules(roles).map((m) => m.id);

describe('module registry', () => {
  it('has unique page ids, and every page is in the navbar, the user menu, or reachable only by URL on purpose', () => {
    const ids = APP_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of APP_MODULES) expect(m.label.en && m.label.bm && m.hint).toBeTruthy();
    const placed = APP_MODULES.filter((m) => 'nav' in m || ('userMenu' in m && m.userMenu)).map((m) => m.id);
    expect(placed.sort()).toEqual([...ids].sort());
  });

  it('shows the same navbar tabs per role as the hand-written navbar did', () => {
    expect(navIds(['doctor'])).toEqual(['dashboard', 'queue', 'consultation', 'reports']);
    expect(navIds(['pharmacist'])).toEqual(['dashboard', 'dispensary', 'inventory']);
    expect(navIds(['receptionist'])).toEqual(['dashboard', 'registration', 'appointments']);
    expect(navIds(['clinic-assistant'])).toEqual(['dashboard', 'registration', 'triage']);
    expect(navIds(['cashier'])).toEqual(['dashboard', 'billing']);
    // Admins may open appointments by URL, but only receptionists get the tab.
    expect(navIds(['admin'])).toEqual(['dashboard']);
    expect(navIds(['hr'])).toEqual(['dashboard']);
    expect(navIds(['doctor', 'receptionist'])).toEqual(['dashboard', 'registration', 'appointments', 'queue', 'consultation', 'reports']);
  });

  it('keeps my leave out of the navbar but in the command palette', () => {
    expect(navIds(ALL)).not.toContain('my-leave');
    expect(paletteModules(['cashier']).map((m) => m.id)).toEqual(['dashboard', 'billing', 'my-leave']);
  });

  it('offers the command palette every page the roles may open, and nothing else', () => {
    for (const role of ALL) {
      expect(paletteModules([role]).map((m) => m.id).sort()).toEqual(
        Object.entries(EXPECTED_TAB_ROLES).filter(([, roles]) => roles.includes(role)).map(([id]) => id).sort(),
      );
    }
  });
});

describe('admin sections', () => {
  const allOn = { staff: true, medicine: true, equipment: true, billing: true, reports: true };
  const ids = (role: 'admin' | 'hr', modules = allOn) => visibleAdminSections(role, modules).map((s) => s.id);

  it('has unique ids and every section sits in a known group', () => {
    const all = ADMIN_SECTIONS.map((s) => s.id);
    expect(new Set(all).size).toBe(all.length);
    const groups = ADMIN_CATEGORIES.map((c) => c.id) as string[];
    for (const s of ADMIN_SECTIONS) expect(groups).toContain(s.category);
  });

  it('shows administrators all 16 sections in menu order', () => {
    expect(ids('admin')).toEqual([
      'staff', 'patients', 'leave', 'medicine', 'equipment', 'operations', 'billing', 'payroll', 'einvoice', 'rcm',
      'moh', 'reports', 'security', 'architecture', 'integrations', 'settings',
    ]);
  });

  it('shows HR only the sections open to them', () => {
    expect(ids('hr')).toEqual(['staff', 'leave', 'payroll']);
  });

  it('hides a section when its clinic module is switched off', () => {
    expect(ids('admin', { ...allOn, medicine: false })).not.toContain('medicine');
    expect(ids('admin', { ...allOn, staff: false })).not.toContain('staff');
    expect(ids('hr', { ...allOn, staff: false })).toEqual(['leave', 'payroll']);
    expect(ids('admin', { ...allOn, billing: false, reports: false, equipment: false })).toEqual(
      ids('admin').filter((id) => !['billing', 'reports', 'equipment'].includes(id)),
    );
  });
});
