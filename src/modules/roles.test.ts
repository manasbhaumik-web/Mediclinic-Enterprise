import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_ROLES, PRIVILEGED_ROLES, ROLE_LABELS } from '../../supabase/functions/_shared/staffAccess';
import { ALL_ROLES, ROLE_LABEL, ROLE_LABEL_BM } from '../domain/roles';
import { ADMIN_ROLES } from '../routes/permissions';

/**
 * Roles are defined once, in `supabase/functions/_shared/staffAccess.ts` (`SYSTEM_ROLES`). Everything else
 * is derived from it or typed over it, and the database constraints must list the same roles.
 */

const sorted = (xs: readonly string[]) => [...xs].sort();

describe('roles', () => {
  it('derives the app role list and admin roles from the shared definition', () => {
    expect([...ALL_ROLES]).toEqual([...SYSTEM_ROLES]);
    expect([...ADMIN_ROLES]).toEqual([...PRIVILEGED_ROLES]);
  });

  it('has a label for every role in English, Malay and the staff form', () => {
    for (const labels of [ROLE_LABEL, ROLE_LABEL_BM, ROLE_LABELS]) {
      expect(sorted(Object.keys(labels))).toEqual(sorted(SYSTEM_ROLES));
      for (const r of SYSTEM_ROLES) expect(labels[r].trim()).not.toBe('');
    }
  });

  it('keeps the database role constraints in step with the roles in code', () => {
    const dir = join(process.cwd(), 'supabase', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const constraints = ['profiles_role_check', 'profiles_roles_check', 'staff_system_role_check', 'staff_system_roles_check'];
    for (const name of constraints) {
      // The newest migration that adds the constraint is the one in force.
      let roles: string[] | null = null;
      for (const f of files) {
        const text = readFileSync(join(dir, f), 'utf8');
        const at = text.lastIndexOf(`ADD CONSTRAINT ${name}`);
        if (at < 0) continue;
        const array = text.slice(at).match(/ARRAY\[([^\]]*)\]/);
        if (array) roles = [...array[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
      }
      expect(roles, `${name} not found in migrations`).not.toBeNull();
      expect(sorted(roles!), `${name} lists different roles than SYSTEM_ROLES`).toEqual(sorted(SYSTEM_ROLES));
    }
  });
});
