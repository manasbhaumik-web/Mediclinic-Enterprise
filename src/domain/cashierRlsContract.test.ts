import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The bill's medication cost comes from the prescriptions attached to the visit (see VISIT_SELECT in
 * useClinicData). If the cashier cannot read them, the invoice silently leaves the medicines out, so the
 * migrations must keep granting the cashier read access, only at billing, and never write access.
 */

const dir = join(process.cwd(), 'supabase', 'migrations');
const all = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

describe('cashier access to prescriptions', () => {
  it('can read the prescriptions of a visit at billing', () => {
    const at = all.lastIndexOf('CREATE POLICY "Cashier can read prescriptions of visits at billing"');
    expect(at).toBeGreaterThan(-1);
    const policy = all.slice(at, all.indexOf(';', at));
    expect(policy).toContain('FOR SELECT');
    expect(policy).toContain("has_any_role(ARRAY['cashier'])");
    expect(policy).toContain("'Awaiting Billing'");
    expect(policy).toContain("'Paid'");
  });

  it('is read-only and limited to billing', () => {
    const at = all.lastIndexOf('CREATE POLICY "Cashier can read prescriptions of visits at billing"');
    const policy = all.slice(at, all.indexOf(';', at));
    expect(policy).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
    expect(policy).not.toContain("'Awaiting Dispensation'");
    expect(policy).not.toContain("'Awaiting Consult'");
  });
});
