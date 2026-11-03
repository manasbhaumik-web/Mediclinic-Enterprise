import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { completeTriage, completeDispensing } from './visitWorkflow';
import { completeVisitProcedure } from './procedures';
import type { Visit } from '../types';

/**
 * The database is the final judge of a visit's status. These tests read the newest migrations and check that
 * every status the app uses is accepted, and every move the app makes is one a role is allowed to make.
 * This is how a client that "works" in unit tests but is refused by the database gets caught.
 */

const dir = join(process.cwd(), 'supabase', 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
const read = (f: string) => readFileSync(join(dir, f), 'utf8');

/** The newest migration that contains `marker`. */
const newestWith = (marker: string): string => {
  const hit = [...files].reverse().find((f) => read(f).includes(marker));
  if (!hit) throw new Error(`No migration contains ${marker}`);
  return read(hit);
};

const clientStatuses = (): string[] => {
  const types = readFileSync(join(process.cwd(), 'src', 'types.ts'), 'utf8');
  const block = types.slice(types.indexOf('export type VisitStatus ='));
  const end = block.indexOf(';');
  return [...block.slice(0, end).matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

const dbStatuses = (): string[] => {
  const text = newestWith('ADD CONSTRAINT visits_status_check');
  const at = text.lastIndexOf('ADD CONSTRAINT visits_status_check');
  const array = text.slice(at).match(/ARRAY\[([\s\S]*?)\]/)!;
  return [...array[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

/** Every 'From>To' move named in the newest guard_visit_update. */
const allowedMoves = (): Set<string> => {
  const text = newestWith('FUNCTION public.guard_visit_update()');
  const at = text.lastIndexOf('FUNCTION public.guard_visit_update()');
  const body = text.slice(at, text.indexOf('$function$;', at));
  return new Set([...body.matchAll(/'([A-Za-z ]+>[A-Za-z ]+)'/g)].map((m) => m[1]));
};

const visit = (status: Visit['status'], procedures: unknown[] = []): Visit => ({
  id: 'v1', patientId: 'p1', date: '2026-11-03', status,
  soap: {
    subjective: '', objective: { bpSystolic: 0, bpDiastolic: 0, heartRate: 0, temperature: 0, respiratoryRate: 0 },
    assessment: { icdCode: '', description: '', clinicalNotes: '' },
    plan: { prescription: [], procedures, followUpWeeks: 1, mcDays: 0, requiresReferral: false },
  },
  totalBill: 0, panelClaimed: 0, paidAmount: 0,
} as unknown as Visit);

describe('visit statuses and the database', () => {
  it('accepts every status the app can set', () => {
    const db = new Set(dbStatuses());
    const missing = clientStatuses().filter((s) => !db.has(s));
    expect(missing, `the database refuses these statuses: ${missing.join(', ')}`).toEqual([]);
  });

  it('allows every move the app makes by updating the visit', () => {
    const moves: [string, string][] = [
      ['Awaiting Triage', completeTriage(visit('Awaiting Triage'), {}, '').status],
      ['Awaiting Dispensation', completeDispensing(visit('Awaiting Dispensation')).status],
      ['Consulting', 'Holding for Results'], // the doctor puts a patient on hold (ClinicPages)
      ['Awaiting Procedure', completeVisitProcedure(visit('Awaiting Procedure', [{ id: 'a', status: 'Pending', price: 0 }]), 'a', 'n1', {}).status],
    ];
    const allowed = allowedMoves();
    const refused = moves.map(([from, to]) => `${from}>${to}`).filter((m) => !allowed.has(m));
    expect(refused, `no role may make: ${refused.join(', ')}`).toEqual([]);
  });

  it('lets a hold be released back to the queue (done through clear_visit_hold)', () => {
    expect(allowedMoves().has('Holding for Results>Awaiting Consult')).toBe(true);
    expect(newestWith('FUNCTION public.clear_visit_hold(')).toContain("v_status <> 'Holding for Results'");
  });

  it('lets a doctor sign off a patient who was recalled from hold', () => {
    expect(allowedMoves().has('Holding for Results>Awaiting Dispensation')).toBe(true);
    expect(newestWith('FUNCTION public.signoff_consultation(')).toContain("'Holding for Results'");
  });
});
