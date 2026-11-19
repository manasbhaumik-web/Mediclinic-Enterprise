import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The audit trail only helps if it covers every table that holds patient data, cannot be edited, holds no clinical values,
 * and the screens that show a patient actually record that they were opened. This reads the migrations and the screens.
 */
const root = process.cwd();
const sql = readdirSync(join(root, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(root, 'supabase', 'migrations', f), 'utf8')).join('\n');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const bodyOf = (fn: string) => {
  const start = sql.indexOf(`FUNCTION public.${fn}(`);
  return sql.slice(start, sql.indexOf('$function$;', sql.indexOf('AS $function$', start) + 10));
};

const AUDITED = ['patients', 'visits', 'soap_notes', 'prescriptions', 'investigations', 'device_results'];

describe('clinical audit trail', () => {
  it('has a trigger on every table that holds patient data', () => {
    for (const t of AUDITED) {
      expect(sql, t).toMatch(new RegExp(`CREATE TRIGGER audit_${t} AFTER INSERT OR UPDATE OR DELETE ON public\\.${t} FOR EACH ROW EXECUTE FUNCTION public\\.audit_clinical_change\\(\\)`));
    }
  });

  it('covers every table that holds a patient id or a visit id (so a new patient table is not forgotten)', () => {
    // Tables created with a patient or visit reference that are meant to be clinical must be in the list or be named here as exempt.
    // Scheduling, billing, messaging and the audit trail itself: not clinical records, and each has its own log or rules.
    const exempt = new Set(['appointments', 'message_outbox', 'transactions', 'einvoices', 'clinic_settings', 'clinical_audit']);
    const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS public\.(\w+) \(([\s\S]*?)\n\);/g)];
    const withPatient = tables.filter((m) => /\b(patient_id|visit_id)\b/.test(m[2])).map((m) => m[1]);
    for (const t of withPatient) expect(AUDITED.includes(t) || exempt.has(t), `${t} holds patient data but is not audited or listed as exempt`).toBe(true);
  });

  it('cannot be edited, removed or emptied, and only administrators can read it', () => {
    expect(sql).toMatch(/CREATE TRIGGER clinical_audit_no_change BEFORE UPDATE OR DELETE ON public\.clinical_audit/);
    expect(sql).toMatch(/CREATE TRIGGER clinical_audit_no_truncate BEFORE TRUNCATE ON public\.clinical_audit/);
    expect(sql).toMatch(/REVOKE ALL ON public\.clinical_audit FROM PUBLIC, anon, authenticated/);
    const policies = [...sql.matchAll(/CREATE POLICY "[^"]+" ON public\.clinical_audit FOR (\w+) USING \(public\.has_any_role\(ARRAY\['admin'\]\)\)/g)].map((m) => m[1]);
    expect(policies).toEqual(['SELECT']);
  });

  it('records who, when, what and which fields, and never the values', () => {
    const body = bodyOf('audit_clinical_change');
    const insert = body.match(/INSERT INTO clinical_audit \(([^)]*)\)\s*VALUES \(([^;]*)\);/);
    expect(insert, 'the trigger writes one row').not.toBeNull();
    const columns = insert![1].split(',').map((c) => c.trim());
    expect(columns).toEqual(['actor', 'actor_roles', 'action', 'entity', 'entity_id', 'patient_id', 'visit_id', 'fields']);
    // The values written are identifiers and field names only: the row's data is never passed in.
    expect(insert![2]).not.toMatch(/to_jsonb|v_row\s*[,)]|v_old|v_new|NEW\b|OLD\b/);
    expect(body).toMatch(/jsonb_object_keys/);
  });

  it('skips an update where only the timestamp moved', () => {
    expect(bodyOf('audit_clinical_change')).toMatch(/k <> 'updated_at'/);
  });

  it('lets signed-in staff record an opened record, role-checked and de-duplicated', () => {
    const body = bodyOf('audit_record_view');
    expect(body).toMatch(/require_role\(ARRAY\['doctor', 'clinic-assistant', 'receptionist', 'pharmacist', 'cashier', 'admin'\]\)/);
    expect(body).toMatch(/interval '10 minutes'/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.audit_record_view\(uuid, text\) FROM PUBLIC, anon/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.audit_clinical_change\(\) FROM PUBLIC, anon, authenticated/);
  });

  it('defines every function the screens call, and the summary is for administrators only', () => {
    const hook = read('src/hooks/useClinicalAudit.ts');
    for (const rpc of [...hook.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1])) expect(sql, rpc).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${rpc}\\(`));
    expect(bodyOf('audit_summary')).toMatch(/require_role\(ARRAY\['admin'\]\)/);
  });

  it('records an opened record on every screen that shows a patient', () => {
    const screens: [string, string][] = [
      ['src/features/consultation/ConsultationRoom.tsx', 'consultation'],
      ['src/features/triage/TriageModule.tsx', 'triage'],
      ['src/features/pharmacy/DispensaryDashboard.tsx', 'dispensary'],
      ['src/features/billing/BillingDesk.tsx', 'billing'],
      ['src/features/patientAdmin/PatientDetailModal.tsx', 'patient-admin'],
    ];
    for (const [file, context] of screens) {
      expect(read(file), file).toContain('useAuditView(');
      expect(read(file), file).toContain(`'${context}'`);
    }
  });

  it('signs out an unattended screen in both the staff app and the admin console', () => {
    expect(read('src/routes/ClinicShell.tsx')).toContain('<IdleGuard');
    expect(read('src/features/admin/AdminModule.tsx')).toContain('<IdleGuard');
  });

  it('closes the two reference tables to visitors', () => {
    expect(sql).toMatch(/CREATE POLICY "Allow authenticated read clinical_embeddings" ON public\.clinical_embeddings FOR SELECT TO authenticated USING \(true\)/);
    expect(sql).toMatch(/CREATE POLICY "Allow authenticated read diseases" ON public\.diseases FOR SELECT TO authenticated USING \(true\)/);
  });
});
