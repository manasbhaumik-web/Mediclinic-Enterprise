import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { TPAConfig } from '../types';
import { EInvoiceStatus } from '../domain/einvoice';
import { PaidVisit, monthBounds, summarizeEInvoiceHealth, summarizeRevenue } from '../domain/revenue';

const ROW_CAP = 5000;

const paidVisits = (fromIso: string, toIso?: string) => async (): Promise<PaidVisit[]> => {
  let q = supabase.from('visits').select('paid_amount, panel_claimed, payment_method').eq('status', 'Paid').gte('visit_date', fromIso).limit(ROW_CAP);
  if (toIso) q = q.lt('visit_date', toIso);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((v) => ({ paidAmount: Number(v.paid_amount), panelClaimed: Number(v.panel_claimed), paymentMethod: (v.payment_method as string | null) ?? null }));
};

/** Revenue for the current and previous calendar month, bills waiting at the cashier, e-invoice health and panel set-up. */
export function useRevenue(now: Date) {
  const { start, previousStart } = monthBounds(now);
  const startIso = start.toISOString();
  const previousIso = previousStart.toISOString();

  const thisMonth = useQuery({ queryKey: ['revenue', 'month', startIso], queryFn: paidVisits(startIso) });
  const lastMonth = useQuery({ queryKey: ['revenue', 'month', previousIso], queryFn: paidVisits(previousIso, startIso) });

  const awaitingBilling = useQuery({
    queryKey: ['revenue', 'awaiting-billing'],
    queryFn: async () => {
      const { count, error } = await supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'Awaiting Billing');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const einvoices = useQuery({
    queryKey: ['revenue', 'einvoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('einvoices').select('status, total_payable').limit(ROW_CAP);
      if (error) throw error;
      return (data ?? []).map((r) => ({ status: r.status as EInvoiceStatus, totalPayable: Number(r.total_payable) }));
    },
  });

  const panels = useQuery({
    queryKey: ['revenue', 'panels'],
    queryFn: async (): Promise<TPAConfig[]> => {
      const { data, error } = await supabase.from('tpa_config').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map((t) => ({
        name: t.name as string, coverageLimit: Number(t.coverage_limit), coPayRequired: !!t.co_pay_required,
        coPayPercentage: t.co_pay_percentage === null ? undefined : Number(t.co_pay_percentage),
      }));
    },
  });

  const current = useMemo(() => summarizeRevenue(thisMonth.data ?? []), [thisMonth.data]);
  const previous = useMemo(() => summarizeRevenue(lastMonth.data ?? []), [lastMonth.data]);
  const eInvoiceHealth = useMemo(() => summarizeEInvoiceHealth(einvoices.data ?? []), [einvoices.data]);

  return {
    current, previous, eInvoiceHealth,
    awaitingBilling: awaitingBilling.data ?? 0,
    panels: panels.data ?? [],
    hasEInvoices: (einvoices.data ?? []).length > 0,
    isPending: thisMonth.isPending,
    capped: (thisMonth.data?.length ?? 0) >= ROW_CAP,
    hasError: !!(thisMonth.error || lastMonth.error || awaitingBilling.error || einvoices.error || panels.error),
  };
}
