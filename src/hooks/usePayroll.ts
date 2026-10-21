import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  PayItem, Payslip, PayrollEvent, PayrollRun, RateRow, eventFromRow, payItemFromRow, rateFromRow, runFromRow, slipFromRow,
} from '../domain/payroll';

const K = ['payroll'] as const;

export interface PayProfile {
  id: string;
  name: string;
  role: string;
  department: string | null;
  status: string;
  salaryBase: number;
  citizenship: string;
  epfNumber: string | null;
  socsoNumber: string | null;
  taxRef: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
}

export interface PayrollResult { ok?: boolean; message?: string; runId?: string; blockers?: string[]; [k: string]: unknown }

/* eslint-disable @typescript-eslint/no-explicit-any */
const profileFromRow = (r: any): PayProfile => ({
  id: r.id, name: r.name, role: r.role, department: r.department ?? null, status: r.status, salaryBase: Number(r.salary_base) || 0,
  citizenship: r.citizenship ?? 'citizen', epfNumber: r.epf_number ?? null, socsoNumber: r.socso_number ?? null, taxRef: r.tax_ref ?? null,
  bankName: r.bank_name ?? null, bankAccountHolder: r.bank_account_holder ?? null, bankAccountNumber: r.bank_account_number ?? null,
});

export function usePayrollRuns() {
  return useQuery({
    queryKey: [...K, 'runs'],
    queryFn: async (): Promise<PayrollRun[]> => {
      const { data, error } = await supabase.from('payroll_runs').select('*').order('period_month', { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []).map(runFromRow);
    },
  });
}

export function usePayrollRun(runId: string | null) {
  const run = useQuery({
    queryKey: [...K, 'run', runId],
    enabled: !!runId,
    queryFn: async (): Promise<PayrollRun | null> => {
      const { data, error } = await supabase.from('payroll_runs').select('*').eq('id', runId!).maybeSingle();
      if (error) throw error;
      return data ? runFromRow(data) : null;
    },
  });
  const slips = useQuery({
    queryKey: [...K, 'slips', runId],
    enabled: !!runId,
    queryFn: async (): Promise<Payslip[]> => {
      const { data, error } = await supabase.from('payslips').select('*').eq('run_id', runId!);
      if (error) throw error;
      return (data ?? []).map(slipFromRow).sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    },
  });
  const events = useQuery({
    queryKey: [...K, 'events', runId],
    enabled: !!runId,
    queryFn: async (): Promise<PayrollEvent[]> => {
      const { data, error } = await supabase.from('payroll_events').select('*').eq('run_id', runId!).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(eventFromRow);
    },
  });
  return { run, slips, events };
}

export function usePayrollRates() {
  return useQuery({
    queryKey: [...K, 'rates'],
    queryFn: async (): Promise<ReturnType<typeof rateFromRow>[]> => {
      const { data, error } = await supabase.from('payroll_rates').select('*').order('scheme').order('effective_from', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rateFromRow);
    },
  });
}

export function usePayProfiles() {
  const qc = useQueryClient();
  const profiles = useQuery({
    queryKey: [...K, 'profiles'],
    queryFn: async (): Promise<PayProfile[]> => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role, department, status, salary_base, citizenship, epf_number, socso_number, tax_ref, bank_name, bank_account_holder, bank_account_number')
        .order('name');
      if (error) throw error;
      return (data ?? []).map(profileFromRow);
    },
  });
  const items = useQuery({
    queryKey: [...K, 'items'],
    queryFn: async (): Promise<PayItem[]> => {
      const { data, error } = await supabase.from('staff_pay_items').select('*').order('created_at');
      if (error) throw error;
      return (data ?? []).map(payItemFromRow);
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: [...K] });

  const saveProfile = useMutation({
    mutationFn: async (p: Omit<PayProfile, 'name' | 'role' | 'department' | 'status'>) => {
      const { error } = await supabase.from('staff').update({
        salary_base: p.salaryBase, citizenship: p.citizenship,
        epf_number: p.epfNumber || null, socso_number: p.socsoNumber || null, tax_ref: p.taxRef || null,
        bank_name: p.bankName || null, bank_account_holder: p.bankAccountHolder || null, bank_account_number: p.bankAccountNumber || null,
      }).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const saveItem = useMutation({
    mutationFn: async (i: Omit<PayItem, 'id'> & { id?: string }) => {
      const row = { staff_id: i.staffId, kind: i.kind, label: i.label, amount: i.amount, contributory: i.contributory, active: i.active };
      const { error } = i.id ? await supabase.from('staff_pay_items').update(row).eq('id', i.id) : await supabase.from('staff_pay_items').insert(row);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_pay_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  return { profiles, items, saveProfile, saveItem, removeItem };
}

export function usePayrollActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: [...K] });

  const call = useMutation({
    mutationFn: async (body: Record<string, unknown>): Promise<PayrollResult> => {
      const { data, error } = await supabase.functions.invoke('payroll', { body });
      if (error) {
        // functions.invoke hides the JSON body of non-2xx replies; read it so the screen can show the real reason.
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const j = await ctx.json();
            if (j?.error || j?.message) throw new Error(String(j.error ?? j.message) + (Array.isArray(j.blockers) && j.blockers.length ? `\n- ${j.blockers.join('\n- ')}` : ''));
          } catch (e) { if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e; }
        }
        throw new Error(error.message || 'Request failed');
      }
      return (data ?? {}) as PayrollResult;
    },
    onSettled: refresh,
  });

  const saveRate = useMutation({
    mutationFn: async (r: Partial<RateRow> & { id?: string; note?: string | null }) => {
      const row = {
        scheme: r.scheme, label: r.label, effective_from: r.effectiveFrom, priority: r.priority ?? 0,
        eligibility: r.eligibility ?? {}, config: r.config, active: r.active ?? true, note: r.note ?? null,
      };
      const { error } = r.id ? await supabase.from('payroll_rates').update(row).eq('id', r.id) : await supabase.from('payroll_rates').insert(row);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const setVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from('payroll_rates').update({ verified }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });
  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('payroll_rates').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { call, saveRate, setVerified, setActive };
}
