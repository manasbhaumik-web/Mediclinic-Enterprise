import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INVESTIGATION_CATALOG } from './investigations';

/**
 * The lab and imaging screens call database functions by name and rely on the table being locked to those functions.
 * This reads the app and the migrations and checks they still agree.
 */
const migrations = () => {
  const dir = join(process.cwd(), 'supabase', 'migrations');
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
};
const hook = readFileSync(join(process.cwd(), 'src', 'hooks', 'useInvestigations.ts'), 'utf8');

describe('lab and imaging database contract', () => {
  it('defines every function the screens call', () => {
    const sql = migrations();
    const called = [...hook.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1]);
    expect(called.length).toBeGreaterThanOrEqual(5);
    for (const fn of called) expect(sql, fn).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`));
  });

  it('lets nobody write the table directly: row security on, only a read policy', () => {
    const sql = migrations();
    expect(sql).toMatch(/ALTER TABLE public\.investigations ENABLE ROW LEVEL SECURITY/);
    const policies = [...sql.matchAll(/CREATE POLICY "[^"]+"\s+ON public\.investigations FOR (\w+)/g)].map((m) => m[1]);
    expect(policies).toEqual(['SELECT']);
  });

  it('limits each move to the right role', () => {
    const sql = migrations();
    const roleOf = (fn: string) => {
      const body = sql.slice(sql.indexOf(`FUNCTION public.${fn}(`));
      return body.match(/require_role\(ARRAY\[([^\]]+)\]\)/)?.[1].replace(/'/g, '').split(/,\s*/);
    };
    expect(roleOf('investigation_order')).toEqual(['doctor']);
    expect(roleOf('investigation_review')).toEqual(['doctor']);
    expect(roleOf('investigation_collect')).toEqual(['clinic-assistant', 'doctor']);
    expect(roleOf('investigation_record_result')).toEqual(['clinic-assistant', 'doctor']);
  });

  it('uses only the statuses the table accepts', () => {
    const sql = migrations();
    for (const status of ['Ordered', 'Collected', 'Resulted', 'Reviewed', 'Cancelled']) expect(sql).toContain(`'${status}'`);
  });

  it('sends the doctor-selected lab tests through sign-off, using names the catalog knows', () => {
    const consult = readFileSync(join(process.cwd(), 'src', 'features', 'consultation', 'PlanTab.tsx'), 'utf8');
    const listed = [...consult.matchAll(/\{ id: '[a-z]+', name: '([^']+)', category/g)].map((m) => m[1]);
    const catalog = INVESTIGATION_CATALOG.map((c) => c.name);
    for (const n of listed) expect(catalog, n).toContain(n);
  });
});
