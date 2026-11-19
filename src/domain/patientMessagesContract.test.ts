import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Patient messages must never carry clinical detail, never go out unless an administrator turns them on, and the
 * worker's database functions must stay out of reach of signed-in users. This reads the migrations and the worker.
 */
const root = process.cwd();
const sql = readdirSync(join(root, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(root, 'supabase', 'migrations', f), 'utf8')).join('\n');
const worker = readFileSync(join(root, 'supabase', 'functions', 'messages-worker', 'index.ts'), 'utf8');
const hook = readFileSync(join(root, 'src', 'hooks', 'usePatientMessages.ts'), 'utf8');

const bodyOf = (fn: string) => {
  const start = sql.indexOf(`FUNCTION public.${fn}(`);
  return sql.slice(start, sql.indexOf('$function$;', sql.indexOf('AS $function$', start) + 10));
};

describe('patient message safety', () => {
  it('is off by default', () => {
    expect(sql).toMatch(/enabled boolean NOT NULL DEFAULT false/);
    expect(bodyOf('messages_plan')).toMatch(/IF NOT s\.enabled THEN\s+RETURN/);
    expect(bodyOf('messages_claim')).toMatch(/IF NOT s\.enabled THEN\s+RETURN '\[\]'/);
  });

  it('puts only a first name and dates or times in a message, never a result or diagnosis', () => {
    const plan = bodyOf('messages_plan');
    const params = [...plan.matchAll(/jsonb_build_array\(([^;]*?)\)(?:,| ,)/g)].map((m) => m[1]).join(' ');
    expect(params).toContain('first_name');
    for (const forbidden of ['result_value', 'result_notes', 'icd_code', 'description', 'clinical_notes', 'drug_name', 'abnormal']) {
      expect(params, forbidden).not.toContain(forbidden);
    }
  });

  it('respects opt-outs when queueing and again when sending', () => {
    expect(bodyOf('messages_plan')).toMatch(/message_opt_outs/);
    expect(bodyOf('messages_claim')).toMatch(/message_opt_outs/);
  });

  it('keeps quiet hours when sending', () => {
    expect(bodyOf('messages_claim')).toMatch(/v_quiet/);
  });

  it('keeps the worker functions away from signed-in users', () => {
    for (const fn of ['messages_plan', 'messages_claim', 'messages_report', 'messages_report_run']) {
      expect(sql, fn).toMatch(new RegExp(`REVOKE EXECUTE ON FUNCTION public\\.${fn}\\([^)]*\\) FROM PUBLIC, anon, authenticated`));
      expect(sql, fn).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\([^)]*\\) TO service_role`));
    }
    for (const rpc of [...worker.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1])) {
      expect(sql, rpc).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${rpc}\\(`));
    }
  });

  it('lets the screens call only role-checked functions', () => {
    for (const rpc of [...hook.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1])) {
      expect(bodyOf(rpc), rpc).toMatch(/require_role\(/);
    }
  });

  it('needs a secret to run and never takes a user token', () => {
    expect(worker).toContain('MESSAGES_WORKER_SECRET');
    expect(worker).toContain('timingSafeEqual');
  });

  it('keeps the message log and settings to administrators (opt-outs also to the front desk)', () => {
    expect(sql).toMatch(/CREATE POLICY "Admins can read the message log" ON public\.message_outbox FOR SELECT USING \(public\.has_any_role\(ARRAY\['admin'\]\)\)/);
    expect(sql).toMatch(/CREATE POLICY "Admins can read message settings" ON public\.patient_message_settings FOR SELECT USING \(public\.has_any_role\(ARRAY\['admin'\]\)\)/);
    for (const table of ['patient_message_settings', 'message_opt_outs', 'message_outbox']) {
      const policies = [...sql.matchAll(new RegExp(`CREATE POLICY "[^"]+" ON public\\.${table} FOR (\\w+)`, 'g'))].map((m) => m[1]);
      expect(policies, table).toEqual(['SELECT']);
    }
  });
});
