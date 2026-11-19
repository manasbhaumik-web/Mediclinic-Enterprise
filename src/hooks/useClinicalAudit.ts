/**
 * The audit trail for patient data: the administrator's search (read-only), and the small call the screens make when a
 * patient's record is opened. Recording an "opened" entry never blocks a screen: if it fails, the screen still works.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PAGE_SIZE, auditFromRow, dayEndMy, dayStartMy, type AuditFilters, type ClinicalAuditEntry } from '../domain/clinicalAudit';

const KEY = ['clinical-audit'] as const;

export interface AuditSummary {
  events: number;
  views: number;
  changes: number;
  staff: number;
}

export function useClinicalAudit(filters: AuditFilters, page: number) {
  const { session } = useAuth();

  const list = useQuery({
    queryKey: [...KEY, 'list', filters, page],
    enabled: !!session,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ entries: ClinicalAuditEntry[]; total: number; patients: Record<string, string> }> => {
      let q = supabase.from('clinical_audit').select('*', { count: 'exact' }).order('at', { ascending: false }).order('id', { ascending: false });
      if (filters.patientId) q = q.eq('patient_id', filters.patientId);
      if (filters.actor) q = q.eq('actor', filters.actor);
      if (filters.action) q = q.eq('action', filters.action);
      if (filters.entity) q = q.eq('entity', filters.entity);
      if (filters.from) q = q.gte('at', dayStartMy(filters.from));
      if (filters.to) q = q.lt('at', dayEndMy(filters.to));
      const { data, count, error } = await q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      const entries = (data ?? []).map(auditFromRow);
      const ids = [...new Set(entries.map((e) => e.patientId).filter((x): x is string => !!x))];
      const patients: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: ps } = await supabase.from('patients').select('id, full_name').in('id', ids);
        for (const p of ps ?? []) patients[p.id] = p.full_name;
      }
      return { entries, total: count ?? entries.length, patients };
    },
  });

  const staff = useQuery({
    queryKey: [...KEY, 'staff'],
    enabled: !!session,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('staff').select('auth_id, name').not('auth_id', 'is', null);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((s: any) => [s.auth_id, s.name]));
    },
  });

  const summary = useQuery({
    queryKey: [...KEY, 'summary'],
    enabled: !!session,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AuditSummary> => {
      const { data, error } = await supabase.rpc('audit_summary');
      if (error) throw error;
      return data as AuditSummary;
    },
  });

  return {
    entries: list.data?.entries ?? [],
    total: list.data?.total ?? 0,
    patientNames: list.data?.patients ?? {},
    staffNames: staff.data ?? {},
    summary: summary.data,
    isLoading: list.isLoading,
    loadError: list.error ? ((list.error as { message?: string }).message || 'The audit trail could not be loaded.') : null,
  };
}

/** Finds a patient by name or IC number so the audit trail can be narrowed to them. */
export async function searchPatientsForAudit(text: string): Promise<{ id: string; name: string; ic: string }[]> {
  const t = text.trim().replace(/[%,()]/g, '');
  if (t.length < 2) return [];
  const { data } = await supabase.from('patients').select('id, full_name, ic_number').or(`full_name.ilike.%${t}%,ic_number.ilike.%${t}%`).limit(8);
  return (data ?? []).map((p: any) => ({ id: p.id, name: p.full_name, ic: p.ic_number ?? '' }));
}

/** Records that this person opened the patient's record on this screen. Safe to call on every open. */
export function useAuditView(patientId: string | undefined | null, context: string) {
  const { session } = useAuth();
  useEffect(() => {
    if (!session || !patientId) return;
    // Seed patients and anything that is not a real id are not in the database, so there is nothing to record.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)) return;
    void Promise.resolve(supabase.rpc('audit_record_view', { p_patient_id: patientId, p_context: context })).catch(() => undefined);
  }, [session, patientId, context]);
}
