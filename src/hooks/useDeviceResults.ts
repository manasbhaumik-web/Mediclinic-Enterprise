/**
 * Connected lab and imaging devices: the device list and test-code map (administration), and the inbox of results the
 * devices have sent (staff accept or reject each one). Every change goes through a database function that checks the role.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  deviceCodeFromRow, deviceResultFromRow, labDeviceFromRow,
  type DeviceCode, type DeviceKind, type DeviceProtocol, type DeviceResult, type LabDevice,
} from '../domain/deviceResults';
import type { MoveResult } from './useInvestigations';
import { INVESTIGATION_KEY } from './useInvestigations';
import type { DeviceObservation } from '../../supabase/functions/_shared/deviceMessages';

export const DEVICE_KEY = ['lab-devices'] as const;
export const DEVICE_RESULT_KEY = ['device-results'] as const;

const NO_DEVICES: LabDevice[] = [];
const NO_CODES: DeviceCode[] = [];
const NO_RESULTS: DeviceResult[] = [];
/** Accepted and rejected results stay in the inbox for a week. */
const RECENT_DAYS = 7;

type RpcCall = PromiseLike<{ data?: unknown; error: { message?: string } | null }>;

const errorText = (e: unknown, fallback: string) => ((e as { message?: string } | null)?.message || fallback);

export interface DeviceForm {
  name: string;
  kind: DeviceKind;
  protocol: DeviceProtocol;
  location: string;
  active: boolean;
}

export interface ImportSummary {
  received: number;
  duplicates: number;
  skipped: number;
  unmatched: number;
}

export function useLabDevices() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const devices = useQuery({
    queryKey: DEVICE_KEY,
    enabled: !!session,
    queryFn: async (): Promise<LabDevice[]> => {
      const { data, error } = await supabase.from('lab_devices').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map(labDeviceFromRow);
    },
  });

  const codes = useQuery({
    queryKey: [...DEVICE_KEY, 'codes'],
    enabled: !!session,
    queryFn: async (): Promise<DeviceCode[]> => {
      const { data, error } = await supabase.from('lab_device_codes').select('*').order('device_code');
      if (error) throw error;
      return (data ?? []).map(deviceCodeFromRow);
    },
  });

  const actions = useMemo(() => {
    const run = async (call: RpcCall, fallback: string): Promise<MoveResult> => {
      try {
        const { error } = await call;
        await qc.invalidateQueries({ queryKey: DEVICE_KEY });
        return error ? { ok: false, error: errorText(error, fallback) } : { ok: true };
      } catch {
        return { ok: false, error: fallback };
      }
    };
    return {
      save: (id: string | null, form: DeviceForm) => run(
        supabase.rpc('lab_device_save', { p_id: id, p: form }), 'The device was not saved.',
      ),
      setKey: (id: string, hash: string, hint: string) => run(
        supabase.rpc('lab_device_set_key', { p_id: id, p_hash: hash, p_hint: hint }), 'The key was not saved.',
      ),
      clearKey: (id: string) => run(supabase.rpc('lab_device_clear_key', { p_id: id }), 'The key was not removed.'),
      saveCode: (deviceId: string, code: string, testName: string) => run(
        supabase.rpc('lab_device_code_save', { p_device_id: deviceId, p_code: code, p_test_name: testName }), 'The code was not saved.',
      ),
      deleteCode: (deviceId: string, code: string) => run(
        supabase.rpc('lab_device_code_delete', { p_device_id: deviceId, p_code: code }), 'The code was not removed.',
      ),
    };
  }, [qc]);

  return {
    devices: devices.data ?? NO_DEVICES,
    codes: codes.data ?? NO_CODES,
    isLoading: devices.isLoading,
    loadError: devices.error ? errorText(devices.error, 'Devices could not be loaded.') : null,
    ...actions,
  };
}

export function useDeviceResults() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: DEVICE_RESULT_KEY,
    enabled: !!session,
    queryFn: async (): Promise<DeviceResult[]> => {
      const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
      const { data, error } = await supabase.from('device_results')
        .select('*')
        .or(`status.eq.Pending,received_at.gte.${since}`)
        .order('received_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(deviceResultFromRow);
    },
  });

  const actions = useMemo(() => {
    const refresh = () => Promise.all([
      qc.invalidateQueries({ queryKey: DEVICE_RESULT_KEY }),
      qc.invalidateQueries({ queryKey: INVESTIGATION_KEY }),
      qc.invalidateQueries({ queryKey: DEVICE_KEY }),
    ]);
    const run = async (call: RpcCall, fallback: string): Promise<MoveResult> => {
      try {
        const { error } = await call;
        await refresh();
        return error ? { ok: false, error: errorText(error, fallback) } : { ok: true };
      } catch {
        return { ok: false, error: fallback };
      }
    };
    return {
      accept: (id: string, investigationId?: string) => run(
        supabase.rpc('device_result_accept', { p_id: id, p_investigation_id: investigationId ?? null }), 'The result was not recorded.',
      ),
      reject: (id: string, reason: string) => run(
        supabase.rpc('device_result_reject', { p_id: id, p_reason: reason }), 'The result was not rejected.',
      ),
      /** Loads results from a file the person chose. Returns the counts, or the reason it failed. */
      importResults: async (deviceId: string, observations: DeviceObservation[], format: string): Promise<{ ok: true; summary: ImportSummary } | { ok: false; error: string }> => {
        try {
          const { data, error } = await supabase.rpc('device_results_import', {
            p_device_id: deviceId,
            p_format: format,
            p_items: observations.map((o) => ({
              message_id: o.messageId, patient_ref: o.patientRef, device_code: o.deviceCode, value: o.value, unit: o.unit,
              range: o.range, abnormal: o.abnormal, observed_at: o.observedAt ?? null, notes: o.notes,
            })),
          });
          await refresh();
          if (error) return { ok: false, error: errorText(error, 'The file was not imported.') };
          return { ok: true, summary: data as ImportSummary };
        } catch {
          return { ok: false, error: 'The file was not imported. Check the connection and try again.' };
        }
      },
    };
  }, [qc]);

  return {
    results: query.data ?? NO_RESULTS,
    isLoading: query.isLoading,
    loadError: query.error ? errorText(query.error, 'Results could not be loaded.') : null,
    ...actions,
  };
}
