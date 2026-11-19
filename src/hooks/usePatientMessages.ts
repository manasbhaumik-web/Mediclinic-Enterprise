/**
 * Patient WhatsApp messages (administration): the settings, the message log and the opt-out list.
 * Every change goes through a database function that checks the role.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { outboxFromRow, optOutFromRow, settingsFromRow, type MessageSettings, type OptOut, type OutboxMessage } from '../domain/patientMessages';
import type { MoveResult } from './useInvestigations';

const KEY = ['patient-messages'] as const;
const NO_ROWS: never[] = [];

type RpcCall = PromiseLike<{ error: { message?: string } | null }>;
const errorText = (e: unknown, fallback: string) => ((e as { message?: string } | null)?.message || fallback);

export function usePatientMessages() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const settings = useQuery({
    queryKey: [...KEY, 'settings'],
    enabled: !!session,
    queryFn: async (): Promise<MessageSettings> => {
      const { data, error } = await supabase.from('patient_message_settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return settingsFromRow(data);
    },
  });

  const outbox = useQuery({
    queryKey: [...KEY, 'outbox'],
    enabled: !!session,
    refetchInterval: 60_000,
    queryFn: async (): Promise<OutboxMessage[]> => {
      const { data, error } = await supabase.from('message_outbox').select('*').order('scheduled_for', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(outboxFromRow);
    },
  });

  const optOuts = useQuery({
    queryKey: [...KEY, 'optouts'],
    enabled: !!session,
    queryFn: async (): Promise<OptOut[]> => {
      const { data, error } = await supabase.from('message_opt_outs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(optOutFromRow);
    },
  });

  const actions = useMemo(() => {
    const run = async (call: RpcCall, fallback: string): Promise<MoveResult> => {
      try {
        const { error } = await call;
        await qc.invalidateQueries({ queryKey: KEY });
        return error ? { ok: false, error: errorText(error, fallback) } : { ok: true };
      } catch {
        return { ok: false, error: fallback };
      }
    };
    return {
      saveSettings: (s: Partial<MessageSettings>) => run(supabase.rpc('patient_message_settings_save', {
        p: {
          enabled: s.enabled, appointment_enabled: s.appointmentEnabled, appointment_hours: s.appointmentHours,
          results_enabled: s.resultsEnabled, followup_enabled: s.followupEnabled, followup_days_before: s.followupDaysBefore,
          template_appointment: s.templateAppointment, template_results: s.templateResults, template_followup: s.templateFollowup,
          language_code: s.languageCode, quiet_start: s.quietStart, quiet_end: s.quietEnd,
        },
      }), 'The settings were not saved.'),
      setOptOut: (phone: string, on: boolean, reason = '') => run(supabase.rpc('message_opt_out_set', { p_phone: phone, p_on: on, p_reason: reason }), 'The opt-out was not saved.'),
      cancel: (id: string) => run(supabase.rpc('message_cancel', { p_id: id }), 'The message was not cancelled.'),
      retry: (id: string) => run(supabase.rpc('message_retry', { p_id: id }), 'The message was not queued again.'),
    };
  }, [qc]);

  return {
    settings: settings.data,
    outbox: outbox.data ?? (NO_ROWS as OutboxMessage[]),
    optOuts: optOuts.data ?? (NO_ROWS as OptOut[]),
    isLoading: settings.isLoading,
    loadError: (settings.error || outbox.error || optOuts.error) ? errorText(settings.error || outbox.error || optOuts.error, 'Messages could not be loaded.') : null,
    ...actions,
  };
}
