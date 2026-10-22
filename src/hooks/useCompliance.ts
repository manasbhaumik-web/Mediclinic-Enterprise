import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuxiliary } from '../context/AuxiliaryContext';
import { useRegister } from './useInventoryData';
import {
  NotifiableCondition, SurveillanceRow, notifiableWithoutCode, summarizeCoding, summarizeSurveillance, summarizeUnsigned, surveillanceFromRow,
} from '../domain/compliance';

/**
 * Everything the compliance page reads. Counts come from the admin report functions (administrators never read
 * clinical notes directly); the notifiable list and the controlled-drug register are plain reads.
 */
export function useCompliance(from: string, to: string, now: number) {
  const { icd10Catalog } = useAuxiliary();

  const surveillance = useQuery({
    queryKey: ['compliance', 'surveillance', from, to],
    queryFn: async (): Promise<SurveillanceRow[]> => {
      const { data, error } = await supabase.rpc('report_disease_surveillance', { p_from: from, p_to: to });
      if (error) throw error;
      return (data ?? []).map(surveillanceFromRow);
    },
  });

  const coding = useQuery({
    queryKey: ['compliance', 'coding', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('report_diagnosis_coding', { p_from: from, p_to: to });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return { consulted: Number(row?.consulted ?? 0), coded: Number(row?.coded ?? 0) };
    },
  });

  const notifiable = useQuery({
    queryKey: ['compliance', 'notifiable'],
    queryFn: async (): Promise<NotifiableCondition[]> => {
      const { data, error } = await supabase.from('notifiable_conditions').select('icd_prefix, condition').order('condition');
      if (error) throw error;
      return (data ?? []).map((r) => ({ icdPrefix: r.icd_prefix as string, condition: r.condition as string }));
    },
  });

  const register = useRegister();

  const cases = useMemo(() => summarizeSurveillance(surveillance.data ?? []), [surveillance.data]);
  const codingSummary = useMemo(() => (coding.data ? summarizeCoding(coding.data.consulted, coding.data.coded) : null), [coding.data]);
  const recordable = useMemo(
    () => notifiableWithoutCode(notifiable.data ?? [], icd10Catalog.map((c) => c.code)),
    [notifiable.data, icd10Catalog],
  );
  const unsigned = useMemo(() => summarizeUnsigned(register.data ?? [], now), [register.data, now]);

  return {
    weekly: surveillance.data ?? [],
    cases,
    coding: codingSummary,
    notifiableTotal: notifiable.data?.length ?? 0,
    recordable,
    unsigned,
    registerEntries: register.data?.length ?? 0,
    isPending: surveillance.isPending || coding.isPending,
    hasError: !!(surveillance.error || coding.error || notifiable.error || register.error),
  };
}
