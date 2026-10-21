/**
 * Clinic server state (patients, visits, appointments) via TanStack Query.
 * Replaces the old hand-rolled useSupabaseSync: caching, optimistic updates with rollback,
 * and realtime invalidation all live here.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Appointment, Patient, Visit } from '../types';
import {
  appointmentFromRow, appointmentToRow, patientFromRow, patientToRow,
  prescriptionsToRows, soapToRow, visitFromRow,
} from '../lib/mappers';
import { SEED_PATIENTS, SEED_VISITS } from '../mocks/seed';

export const QUERY_KEYS = {
  patients: ['patients'] as const,
  activeVisits: ['visits', 'active'] as const,
  completedVisits: ['visits', 'completed'] as const,
  appointments: ['appointments'] as const,
};

const VISIT_SELECT = '*, soap_notes(*), prescriptions(*)';
const isClosed = (v: Visit) => v.status === 'Paid' || v.status === 'Cancelled';

// Stable references so consumers don't re-render while a query has no data yet.
const NO_PATIENTS: Patient[] = [];
const NO_VISITS: Visit[] = [];
const NO_APPOINTMENTS: Appointment[] = [];

function mergeSeed<T extends { id: string }>(rows: T[], seed: T[]): T[] {
  if (seed.length === 0) return rows;
  const ids = new Set(rows.map((r) => r.id));
  return [...rows, ...seed.filter((s) => !ids.has(s.id))];
}

export function useClinicData() {
  const { session } = useAuth();
  const enabled = !!session;

  const patients = useQuery({
    queryKey: QUERY_KEYS.patients,
    enabled,
    queryFn: async (): Promise<Patient[]> => {
      // Capped; use searchPatients for anyone beyond the most recent 100.
      const { data, error } = await supabase.from('patients')
        .select('*').order('registered_date', { ascending: false }).limit(100);
      if (error) throw error;
      const rows = (data ?? []).map(patientFromRow);
      return mergeSeed(rows, SEED_PATIENTS.filter((p) => !rows.some((r) => r.icNumber === p.icNumber)));
    },
  });

  const activeVisits = useQuery({
    queryKey: QUERY_KEYS.activeVisits,
    enabled,
    queryFn: async (): Promise<Visit[]> => {
      const { data, error } = await supabase.from('visits')
        .select(VISIT_SELECT).neq('status', 'Paid').neq('status', 'Cancelled');
      if (error) throw error;
      return mergeSeed((data ?? []).map(visitFromRow), SEED_VISITS.filter((v) => !isClosed(v)));
    },
  });

  const completedVisits = useQuery({
    queryKey: QUERY_KEYS.completedVisits,
    enabled,
    queryFn: async (): Promise<Visit[]> => {
      const { data, error } = await supabase.from('visits')
        .select(VISIT_SELECT).eq('status', 'Paid')
        .order('visit_date', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []).map(visitFromRow);
    },
  });

  const appointments = useQuery({
    queryKey: QUERY_KEYS.appointments,
    enabled,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase.from('appointments')
        .select('*')
        .gte('appointment_time', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .order('appointment_time', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(appointmentFromRow);
    },
  });

  const mutations = useClinicMutations();

  return {
    patientsList: patients.data ?? NO_PATIENTS,
    visitsQueue: activeVisits.data ?? NO_VISITS,
    completedVisits: completedVisits.data ?? NO_VISITS,
    appointments: appointments.data ?? NO_APPOINTMENTS,
    isSyncing: enabled && (patients.isPending || activeVisits.isPending),
    syncError: patients.error ?? activeVisits.error ?? completedVisits.error ?? appointments.error ?? null,
    searchPatients,
    ...mutations,
  };
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Strip characters that have meaning in PostgREST's or() filter syntax.
  const safe = q.replace(/[%,()*\\]/g, '');
  if (!safe) return [];
  const { data, error } = await supabase.from('patients').select('*')
    .or(`full_name.ilike.%${safe}%,ic_number.ilike.%${safe}%,phone.ilike.%${safe}%`)
    .limit(20);
  if (error || !data) return [];
  return data.map(patientFromRow);
}

// Callers may ignore the result: on failure the optimistic update is already rolled back by onError.
// The wrappers below resolve true on success and false on failure so callers can chain follow-up work.
const logFailure = (action: string) => (err: unknown): false => {
  console.error(`Failed to ${action}`, err);
  return false;
};

function useClinicMutations() {
  const qc = useQueryClient();

  const addPatient = useMutation({
    mutationFn: async (patient: Patient) => {
      const { error } = await supabase.from('patients').insert([patientToRow(patient)]);
      if (error) throw error;
    },
    onMutate: async (patient) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.patients });
      const prev = qc.getQueryData<Patient[]>(QUERY_KEYS.patients);
      qc.setQueryData<Patient[]>(QUERY_KEYS.patients, (old = []) => [patient, ...old]);
      return { prev };
    },
    onError: (_e, _p, ctx) => qc.setQueryData(QUERY_KEYS.patients, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.patients }),
  });

  const addVisit = useMutation({
    mutationFn: async (visit: Visit) => {
      const { data, error } = await supabase.from('visits').insert([{
        id: visit.id,
        patient_id: visit.patientId,
        status: visit.status,
        visit_date: new Date().toISOString(),
        total_bill: visit.totalBill || 0,
        panel_claimed: visit.panelClaimed || 0,
        paid_amount: visit.paidAmount || 0,
      }]).select().single();
      if (error) throw error;
      if (data && visit.soap) {
        const { error: soapErr } = await supabase.from('soap_notes')
          .insert([{ visit_id: data.id, subjective: visit.soap.subjective || '' }]);
        if (soapErr) throw soapErr;
      }
    },
    onMutate: async (visit) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.activeVisits });
      const prev = qc.getQueryData<Visit[]>(QUERY_KEYS.activeVisits);
      qc.setQueryData<Visit[]>(QUERY_KEYS.activeVisits, (old = []) => [...old, visit]);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(QUERY_KEYS.activeVisits, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.activeVisits }),
  });

  const updateVisit = useMutation({
    mutationFn: async (visit: Visit) => {
      if (visit.status === 'Cancelled') {
        const { error } = await supabase.from('visits').delete().eq('id', visit.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('visits').update({
        status: visit.status,
        total_bill: visit.totalBill,
        panel_claimed: visit.panelClaimed,
        paid_amount: visit.paidAmount,
        payment_method: visit.paymentMethod,
        gl_number: visit.glNumber,
        mc_issued: visit.mcIssued,
      }).eq('id', visit.id);
      if (error) throw error;

      if (!visit.soap) return;

      const { data: existing, error: findErr } = await supabase.from('soap_notes')
        .select('id').eq('visit_id', visit.id).maybeSingle();
      if (findErr) throw findErr;
      const soapRow = soapToRow(visit);
      const { error: soapErr } = existing
        ? await supabase.from('soap_notes').update(soapRow).eq('id', existing.id)
        : await supabase.from('soap_notes').insert([soapRow]);
      if (soapErr) throw soapErr;

      // Once the pharmacy has dispensed or skipped a line it is part of the stock record and must not be rewritten.
      const { data: decided, error: decidedErr } = await supabase.from('prescriptions').select('id').eq('visit_id', visit.id).or('dispensed_at.not.is.null,skipped.eq.true').limit(1);
      if (decidedErr) throw decidedErr;
      const locked = (decided ?? []).length > 0;

      if (visit.soap.plan.prescription.length > 0 && !locked) {
        // Replace-all keeps prescriptions in step with the SOAP plan.
        const { error: delErr } = await supabase.from('prescriptions').delete().eq('visit_id', visit.id);
        if (delErr) throw delErr;
        const { error: rxErr } = await supabase.from('prescriptions').insert(prescriptionsToRows(visit));
        if (rxErr) throw rxErr;
      }
    },
    onMutate: async (visit) => {
      await qc.cancelQueries({ queryKey: ['visits'] });
      const prevActive = qc.getQueryData<Visit[]>(QUERY_KEYS.activeVisits);
      const prevCompleted = qc.getQueryData<Visit[]>(QUERY_KEYS.completedVisits);
      if (isClosed(visit)) {
        qc.setQueryData<Visit[]>(QUERY_KEYS.activeVisits, (old = []) => old.filter((v) => v.id !== visit.id));
        if (visit.status === 'Paid') {
          qc.setQueryData<Visit[]>(QUERY_KEYS.completedVisits, (old = []) => [visit, ...old.filter((v) => v.id !== visit.id)]);
        }
      } else {
        qc.setQueryData<Visit[]>(QUERY_KEYS.activeVisits, (old = []) => old.map((v) => (v.id === visit.id ? visit : v)));
      }
      return { prevActive, prevCompleted };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(QUERY_KEYS.activeVisits, ctx?.prevActive);
      qc.setQueryData(QUERY_KEYS.completedVisits, ctx?.prevCompleted);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  });

  const addAppointment = useMutation({
    mutationFn: async (app: Appointment) => {
      const { error } = await supabase.from('appointments').insert([appointmentToRow(app)]);
      if (error) throw error;
    },
    onMutate: async (app) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.appointments });
      const prev = qc.getQueryData<Appointment[]>(QUERY_KEYS.appointments);
      qc.setQueryData<Appointment[]>(QUERY_KEYS.appointments, (old = []) => [...old, app]);
      return { prev };
    },
    onError: (_e, _a, ctx) => qc.setQueryData(QUERY_KEYS.appointments, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments }),
  });

  const updateAppointment = useMutation({
    mutationFn: async (app: Appointment) => {
      const { error } = await supabase.from('appointments')
        .update({ status: app.status, notes: app.notes }).eq('id', app.id);
      if (error) throw error;
    },
    onMutate: async (app) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.appointments });
      const prev = qc.getQueryData<Appointment[]>(QUERY_KEYS.appointments);
      qc.setQueryData<Appointment[]>(QUERY_KEYS.appointments, (old = []) => old.map((a) => (a.id === app.id ? app : a)));
      return { prev };
    },
    onError: (_e, _a, ctx) => qc.setQueryData(QUERY_KEYS.appointments, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments }),
  });

  return {
    addPatientToDb: (p: Patient) => addPatient.mutateAsync(p).then(() => true as const, logFailure('insert patient')),
    addVisitToDb: (v: Visit) => addVisit.mutateAsync(v).then(() => true as const, logFailure('insert visit')),
    updateVisitInDb: (v: Visit) => updateVisit.mutateAsync(v).then(() => true as const, logFailure('update visit')),
    addAppointmentToDb: (a: Appointment) => addAppointment.mutateAsync(a).then(() => true as const, logFailure('insert appointment')),
    updateAppointmentInDb: (a: Appointment) => updateAppointment.mutateAsync(a).then(() => true as const, logFailure('update appointment')),
  };
}

/** Subscribes once to Postgres changes and refreshes the affected queries. Mount in one place only. */
export function useClinicRealtime() {
  const qc = useQueryClient();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('clinic_sync_' + Math.random().toString(36).substring(2, 9))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' },
        () => qc.invalidateQueries({ queryKey: ['visits'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' },
        () => qc.invalidateQueries({ queryKey: ['visits'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
        () => qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments }))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc, session]);
}
