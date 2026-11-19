import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Devices post results with a key, and staff work an inbox. These checks read the app, the edge function and the
 * migrations and make sure the pieces still agree, and that the key table and the service-only function stay locked.
 */
const root = process.cwd();
const migrations = () => {
  const dir = join(root, 'supabase', 'migrations');
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
};
const hook = readFileSync(join(root, 'src', 'hooks', 'useDeviceResults.ts'), 'utf8');
const edge = readFileSync(join(root, 'supabase', 'functions', 'lab-device-ingest', 'index.ts'), 'utf8');

describe('lab device database contract', () => {
  it('defines every function the screens and the edge function call', () => {
    const sql = migrations();
    const called = [...hook.matchAll(/rpc\('([a-z_]+)'/g), ...edge.matchAll(/rpc\('([a-z_]+)'/g)].map((m) => m[1]);
    expect(called.length).toBeGreaterThanOrEqual(8);
    for (const fn of called) expect(sql, fn).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`));
  });

  it('keeps device keys unreadable: row security on, no policies, only a fingerprint stored', () => {
    const sql = migrations();
    expect(sql).toMatch(/ALTER TABLE public\.lab_device_keys ENABLE ROW LEVEL SECURITY/);
    expect(sql).not.toMatch(/CREATE POLICY "[^"]+"\s+ON public\.lab_device_keys/);
    expect(sql).toMatch(/key_hash text NOT NULL UNIQUE CHECK \(key_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/);
  });

  it('lets only the edge function (service role) store device messages directly', () => {
    const sql = migrations();
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.device_results_ingest\(uuid, jsonb, text\) FROM PUBLIC, anon, authenticated/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.device_results_ingest\(uuid, jsonb, text\) TO service_role/);
    expect(edge).toContain("rpc('device_results_ingest'");
  });

  it('has no direct write policy on the inbox or the device tables', () => {
    const sql = migrations();
    for (const table of ['device_results', 'lab_devices', 'lab_device_codes']) {
      const policies = [...sql.matchAll(new RegExp(`CREATE POLICY "[^"]+"\\s+ON public\\.${table} FOR (\\w+)`, 'g'))].map((m) => m[1]);
      expect(policies, table).toEqual(['SELECT']);
    }
  });

  it('limits each move to the right role', () => {
    const sql = migrations();
    const roleOf = (fn: string) => {
      const body = sql.slice(sql.indexOf(`FUNCTION public.${fn}(`));
      return body.match(/require_role\(ARRAY\[([^\]]+)\]\)/)?.[1].replace(/'/g, '').split(/,\s*/);
    };
    expect(roleOf('device_result_accept')).toEqual(['clinic-assistant', 'doctor']);
    expect(roleOf('device_result_reject')).toEqual(['clinic-assistant', 'doctor']);
    expect(roleOf('device_results_import')).toEqual(['clinic-assistant', 'doctor', 'admin']);
    for (const fn of ['lab_device_save', 'lab_device_set_key', 'lab_device_clear_key', 'lab_device_code_save', 'lab_device_code_delete']) {
      expect(roleOf(fn), fn).toEqual(['admin']);
    }
  });

  it('stores results as Pending and never records on an order by itself', () => {
    const sql = migrations();
    const ingest = sql.slice(sql.indexOf('FUNCTION public.device_results_ingest('), sql.indexOf('FUNCTION public.device_results_import('));
    expect(ingest).not.toMatch(/UPDATE investigations/);
    expect(sql).toMatch(/status text NOT NULL DEFAULT 'Pending'/);
  });
});
