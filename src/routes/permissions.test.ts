import { describe, expect, it } from 'vitest';
import { UserRole } from '../types';
import { ADMIN_ROLES, TAB_ROLES, tabPath } from './permissions';

const ROLES: UserRole[] = ['doctor', 'pharmacist', 'clinic-assistant', 'admin', 'hr'];

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
    expect(TAB_ROLES.billing).toEqual(['clinic-assistant']);
    expect(TAB_ROLES.consultation).not.toContain('admin');
  });

  it('the admin console is limited to admin and hr', () => {
    expect([...ADMIN_ROLES].sort()).toEqual(['admin', 'hr']);
  });

  it('builds paths under /app', () => {
    expect(tabPath('queue')).toBe('/app/queue');
  });
});
