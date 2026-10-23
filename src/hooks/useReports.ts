import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  DoctorVisit, PaidVisitRow, PrescribingRow, VolumeDay, monthWindow, prescribingFromRow, summarizeDoctorMonth, volumeFromRow,
} from '../domain/reports';

const ROW_CAP = 5000;
const DAY_MS = 86_400_000;

/** Start of a local YYYY-MM-DD day, and of the day after `to`, as ISO instants. */
const dayWindow = (from: string, to: string) => ({
  from: new Date(`${from}T00:00:00`).toISOString(),
  to: new Date(new Date(`${to}T00:00:00`).getTime() + DAY_MS).toISOString(),
});

export interface DiagnosisRow { icdCode: string; diagnosis: string | null; visits: number }

/**
 * What the admin Analytics Reports read for a period. Counts come from the administrator report functions, since
 * administrators never read clinical notes; revenue comes from paid visits.
 */
export function useAdminReports(from: string, to: string) {
  const window = dayWindow(from, to);

  const paid = useQuery({
    queryKey: ['reports', 'paid-visits', from, to],
    queryFn: async (): Promise<PaidVisitRow[]> => {
      const { data, error } = await supabase.from('visits').select('visit_date, paid_amount, panel_claimed, payment_method')
        .eq('status', 'Paid').gte('visit_date', window.from).lt('visit_date', window.to).limit(ROW_CAP);
      if (error) throw error;
      return (data ?? []).map((v) => ({
        visitDate: v.visit_date as string, paidAmount: Number(v.paid_amount), panelClaimed: Number(v.panel_claimed), paymentMethod: (v.payment_method as string | null) ?? null,
      }));
    },
  });

  const volume = useQuery({
    queryKey: ['reports', 'volume', from, to],
    queryFn: async (): Promise<VolumeDay[]> => {
      const { data, error } = await supabase.rpc('report_visit_volume', { p_from: from, p_to: to });
      if (error) throw error;
      return (data ?? []).map(volumeFromRow);
    },
  });

  const diagnoses = useQuery({
    queryKey: ['reports', 'diagnoses', from, to],
    queryFn: async (): Promise<DiagnosisRow[]> => {
      const { data, error } = await supabase.rpc('report_top_diagnoses', { p_from: from, p_to: to, p_limit: 10 });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ icdCode: r.icd_code, diagnosis: r.diagnosis ?? null, visits: Number(r.visits) }));
    },
  });

  const prescribing = useQuery({
    queryKey: ['reports', 'prescribing', from, to],
    queryFn: async (): Promise<PrescribingRow[]> => {
      const { data, error } = await supabase.rpc('report_prescribing', { p_from: from, p_to: to, p_limit: 15 });
      if (error) throw error;
      return (data ?? []).map(prescribingFromRow);
    },
  });

  return {
    paidVisits: paid.data ?? [],
    capped: (paid.data?.length ?? 0) >= ROW_CAP,
    volume: volume.data ?? [],
    diagnoses: diagnoses.data ?? [],
    prescribing: prescribing.data ?? [],
    isPending: paid.isPending || volume.isPending || diagnoses.isPending || prescribing.isPending,
    hasError: !!(paid.error || volume.error || diagnoses.error || prescribing.error),
  };
}

const CONSULTED = ['Awaiting Dispensation', 'Dispensing', 'Awaiting Billing', 'Paid'];

const one = <T,>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined);

/**
 * A doctor's own consultations for a month: the ones they signed off. Consultations finished before doctors were
 * recorded on sign-off cannot be attributed, so their number is reported separately.
 */
export function useDoctorMonth(userId: string | undefined, monthKey: string) {
  const { from, to } = monthWindow(monthKey);

  const mine = useQuery({
    queryKey: ['reports', 'doctor', userId, monthKey],
    enabled: !!userId,
    queryFn: async (): Promise<DoctorVisit[]> => {
      const { data, error } = await supabase.from('visits')
        .select('id, status, paid_amount, panel_claimed, payment_method, signed_off_at, patients(full_name), soap_notes(icd_code, description, mc_days, requires_referral, mc_reason, referral_hospital, referral_department, lab_orders)')
        .eq('signed_off_by', userId!).gte('signed_off_at', from).lt('signed_off_at', to)
        .order('signed_off_at', { ascending: false }).limit(2000);
      if (error) throw error;
      return (data ?? []).map((v: any) => {
        const soap = one<any>(v.soap_notes);
        return {
          id: v.id,
          signedOffAt: v.signed_off_at,
          status: v.status,
          patientName: one<any>(v.patients)?.full_name ?? 'Patient',
          icdCode: soap?.icd_code ?? null,
          diagnosis: soap?.description ?? null,
          paymentMethod: v.payment_method ?? null,
          fee: v.status === 'Paid' ? Number(v.paid_amount) + Number(v.panel_claimed) : null,
          mcDays: Number(soap?.mc_days ?? 0),
          referral: !!soap?.requires_referral,
          mcReason: soap?.mc_reason ?? null,
          referralTo: [soap?.referral_hospital, soap?.referral_department].filter(Boolean).join(', ') || null,
          labOrders: Array.isArray(soap?.lab_orders) ? soap.lab_orders : [],
        };
      });
    },
  });

  const unattributed = useQuery({
    queryKey: ['reports', 'doctor-unattributed', monthKey],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase.from('visits').select('id', { count: 'exact', head: true })
        .is('signed_off_by', null).in('status', CONSULTED).gte('visit_date', from).lt('visit_date', to);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const visits = mine.data ?? [];
  const summary = useMemo(() => summarizeDoctorMonth(visits), [visits]);

  return {
    visits,
    summary,
    unattributed: unattributed.data ?? 0,
    /** True when the row limit was reached, so the month may hold more consultations than are listed. */
    truncated: visits.length >= 2000,
    isPending: mine.isPending,
    hasError: !!(mine.error || unattributed.error),
  };
}
