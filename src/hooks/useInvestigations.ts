/**
 * Laboratory and imaging orders: the worklist, and the moves that change an order (all through database functions,
 * which decide who may do what). Realtime refresh is wired in useClinicRealtime.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { investigationFromRow, type Investigation, type InvestigationKind, type InvestigationUrgency } from '../domain/investigations';

export const INVESTIGATION_KEY = ['investigations'] as const;

const NO_ITEMS: Investigation[] = [];
const SELECT = '*, patients(full_name, ic_number)';
/** Reviewed and cancelled orders stay visible for a week, then drop out of the worklist. */
const RECENT_DAYS = 7;

export interface NewOrder {
  kind: InvestigationKind;
  name: string;
  urgency: InvestigationUrgency;
  clinicalInfo?: string;
}

export interface ResultInput {
  value: string;
  unit: string;
  range: string;
  abnormal: boolean;
  notes: string;
}

export type MoveResult = { ok: true } | { ok: false; error: string };

type RpcCall = PromiseLike<{ error: { message?: string } | null }>;

export function useInvestigations() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: INVESTIGATION_KEY,
    enabled: !!session,
    queryFn: async (): Promise<Investigation[]> => {
      const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
      const { data, error } = await supabase.from('investigations')
        .select(SELECT)
        .or(`status.in.(Ordered,Collected,Resulted),updated_at.gte.${since}`)
        .order('ordered_at', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(investigationFromRow);
    },
  });

  const actions = useMemo(() => {
    const run = async (call: RpcCall, fallback: string): Promise<MoveResult> => {
      try {
        const { error } = await call;
        await qc.invalidateQueries({ queryKey: INVESTIGATION_KEY });
        return error ? { ok: false, error: error.message || fallback } : { ok: true };
      } catch {
        return { ok: false, error: fallback };
      }
    };
    return {
      order: (visitId: string, orders: NewOrder[]) => run(
        supabase.rpc('investigation_order', {
          p_visit_id: visitId,
          p_items: orders.map((o) => ({ kind: o.kind, name: o.name, urgency: o.urgency, clinical_info: o.clinicalInfo ?? '' })),
        }),
        'The order was not saved. Check the connection and try again.',
      ),
      collect: (id: string) => run(supabase.rpc('investigation_collect', { p_id: id }), 'The sample was not marked as collected.'),
      recordResult: (id: string, r: ResultInput) => run(
        supabase.rpc('investigation_record_result', {
          p_id: id, p_value: r.value, p_unit: r.unit, p_range: r.range, p_abnormal: r.abnormal, p_notes: r.notes,
        }),
        'The result was not saved. Check the connection and try again.',
      ),
      review: (id: string) => run(supabase.rpc('investigation_review', { p_id: id }), 'The result was not marked as reviewed.'),
      cancel: (id: string, reason: string) => run(supabase.rpc('investigation_cancel', { p_id: id, p_reason: reason }), 'The order was not cancelled.'),
    };
  }, [qc]);

  return {
    investigations: query.data ?? NO_ITEMS,
    isLoading: query.isLoading,
    loadError: query.error ? ((query.error as { message?: string }).message || 'Orders could not be loaded.') : null,
    ...actions,
  };
}
