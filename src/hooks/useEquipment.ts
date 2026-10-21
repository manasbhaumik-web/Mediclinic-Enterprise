import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { EquipmentEvent, EquipmentItem, RetireMethod, equipmentEventFromRow, equipmentFromRow } from '../domain/equipment';

export const EQUIPMENT_KEY = ['equipment'] as const;

export function useEquipmentList() {
  return useQuery({
    queryKey: [...EQUIPMENT_KEY, 'items'],
    queryFn: async (): Promise<EquipmentItem[]> => {
      const { data, error } = await supabase.from('equipment').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map(equipmentFromRow);
    },
  });
}

/** History for one item, or the latest events across everything when no id is given. */
export function useEquipmentEvents(equipmentId?: string | null, limit = 300) {
  return useQuery({
    queryKey: [...EQUIPMENT_KEY, 'events', equipmentId ?? 'all', limit],
    queryFn: async (): Promise<EquipmentEvent[]> => {
      let q = supabase.from('equipment_events').select('*').order('seq', { ascending: false }).limit(limit);
      if (equipmentId) q = q.eq('equipment_id', equipmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(equipmentEventFromRow);
    },
  });
}

export function useEquipmentSettings() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: [...EQUIPMENT_KEY, 'settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment_settings').select('*').maybeSingle();
      if (error) throw error;
      return { dueSoonDays: (data?.due_soon_days as number | undefined) ?? 30 };
    },
  });
  const save = useMutation({
    mutationFn: async (dueSoonDays: number) => {
      const { error } = await supabase.from('equipment_settings').update({ due_soon_days: dueSoonDays, updated_at: new Date().toISOString() }).eq('id', true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
  return { settings, save };
}

/** Calls an eq_* database function. A business-rule refusal comes back as an Error whose message is the sentence to show. */
async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface ServiceInput {
  kind: 'service' | 'calibration' | 'inspection' | 'repair';
  performed_on: string;
  performed_by: string;
  outcome: 'pass' | 'conditional' | 'fail';
  findings?: string;
  cost?: number | null;
  certificate_ref?: string;
  next_due?: string | null;
  safety_cert_expiry?: string | null;
}

export function useEquipmentActions() {
  const qc = useQueryClient();
  const opts = { onSettled: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }) };
  return {
    save: useMutation({ mutationFn: (v: { id?: string | null; data: Record<string, unknown> }) => rpc<string>('eq_save', { p_id: v.id ?? null, p: v.data }), ...opts }),
    recordService: useMutation({ mutationFn: (v: { id: string; data: ServiceInput }) => rpc('eq_record_service', { p_id: v.id, p: v.data }), ...opts }),
    reportFault: useMutation({ mutationFn: (v: { id: string; description: string }) => rpc('eq_report_fault', { p_id: v.id, p_description: v.description }), ...opts }),
    setStatus: useMutation({ mutationFn: (v: { id: string; status: 'Operational' | 'Maintenance' | 'Out of service'; reason: string }) => rpc('eq_set_status', { p_id: v.id, p_status: v.status, p_reason: v.reason }), ...opts }),
    move: useMutation({ mutationFn: (v: { id: string; location: string; custodian: string; reason: string }) => rpc('eq_move', { p_id: v.id, p_location: v.location, p_custodian: v.custodian, p_reason: v.reason }), ...opts }),
    decommission: useMutation({ mutationFn: (v: { id: string; reason: string; method: RetireMethod }) => rpc('eq_decommission', { p_id: v.id, p_reason: v.reason, p_method: v.method }), ...opts }),
    restore: useMutation({ mutationFn: (v: { id: string; reason: string }) => rpc('eq_restore', { p_id: v.id, p_reason: v.reason }), ...opts }),
  };
}
