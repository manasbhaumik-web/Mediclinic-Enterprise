import { describe, expect, it } from 'vitest';
import { UserRole } from '../types';
import { ADMIN_ROLES, TAB_ROLES, canOpenTab, tabPath } from './permissions';

const ROLES: UserRole[] = ['doctor', 'pharmacist', 'receptionist', 'clinic-assistant', 'cashier', 'admin', 'hr'];

describe('route permissions', () => {
  it('every role can open the dashboard', () => {
    for (const role of ROLES) expect(TAB_ROLES.dashboard).toContain(role);
  });

  it('every role has at least one page besides the dashboard, except hr', () => {
    for (const role of ROLES.filter((r) => r !== 'hr')) {
      const pages = Object.entries(TAB_ROLES).filter(([tab, roles]) => tab !== 'dashboard' && roles.includes(role));
      expect(pages.length, role).toBeGreaterThan(0);
    }
  });

  it('keeps clinical and cash-handling pages away from the wrong roles', () => {
    expect(TAB_ROLES.consultation).toEqual(['doctor']);
    expect(TAB_ROLES.dispensary).toEqual(['pharmacist']);
    expect(TAB_ROLES.billing).toEqual(['cashier']);
    expect(TAB_ROLES.consultation).not.toContain('admin');
  });

  it('the admin console is limited to admin and hr', () => {
    expect([...ADMIN_ROLES].sort()).toEqual(['admin', 'hr']);
  });

  it('builds paths under /app', () => {
    expect(tabPath('queue')).toBe('/app/queue');
  });
});

describe('the front-desk workflow is split by role', () => {
  it('registration and appointments belong to the receptionist, triage to the assistant, billing to the cashier', () => {
    expect(TAB_ROLES.registration).toEqual(['receptionist']);
    expect(TAB_ROLES.triage).toEqual(['clinic-assistant']);
    expect(TAB_ROLES.appointments).toEqual(['receptionist', 'admin']);
    expect(TAB_ROLES.billing).toEqual(['cashier']);
  });

  it('each front-desk role sees only its own pages (plus the dashboard and My Leave)', () => {
    const pages = (role: UserRole) => (Object.keys(TAB_ROLES) as (keyof typeof TAB_ROLES)[]).filter((t) => canOpenTab([role], t)).sort();
    expect(pages('receptionist')).toEqual(['appointments', 'dashboard', 'my-leave', 'registration']);
    expect(pages('clinic-assistant')).toEqual(['dashboard', 'my-leave', 'triage']);
    expect(pages('cashier')).toEqual(['billing', 'dashboard', 'my-leave']);
  });

  it('a person holding several roles gets the union of their pages', () => {
    const all: UserRole[] = ['receptionist', 'clinic-assistant', 'cashier'];
    for (const tab of ['registration', 'appointments', 'triage', 'billing'] as const) expect(canOpenTab(all, tab), tab).toBe(true);
    expect(canOpenTab(all, 'consultation')).toBe(false);
    expect(canOpenTab(all, 'dispensary')).toBe(false);
    expect(canOpenTab(['receptionist', 'cashier'], 'triage')).toBe(false);
  });

  it('nobody signed out can open anything', () => {
    expect(canOpenTab(null, 'dashboard')).toBe(false);
    expect(canOpenTab([], 'dashboard')).toBe(false);
  });
});
