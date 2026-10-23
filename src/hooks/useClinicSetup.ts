/**
 * Clinic set-up data that several screens share: the doctors, the consultation rooms, and which online services
 * are limited to one specialty. Admins edit rooms and services; everyone signed in reads them.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ClinicDoctor } from '../domain/doctorAssignment';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ConsultationRoom { id: string; name: string; active: boolean; sortOrder: number }
export interface BookingService { service: string; department: string | null; active: boolean; sortOrder: number }

const KEYS = {
  doctors: ['clinic-doctors'] as const,
  rooms: ['consultation-rooms'] as const,
  services: ['booking-services'] as const,
};

const NONE_DOCTORS: ClinicDoctor[] = [];
const NONE_ROOMS: ConsultationRoom[] = [];

export function useClinicDoctors() {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: KEYS.doctors,
    enabled: !!session,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ClinicDoctor[]> => {
      const { data, error } = await supabase.rpc('clinic_doctors');
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ id: d.id, authId: d.auth_id ?? null, name: d.name, department: d.department ?? null }));
    },
  });
  return q.data ?? NONE_DOCTORS;
}

/** All rooms, active or not (the admin screen needs both). */
export function useConsultationRooms() {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: KEYS.rooms,
    enabled: !!session,
    staleTime: 60_000,
    queryFn: async (): Promise<ConsultationRoom[]> => {
      const { data, error } = await supabase.from('consultation_rooms').select('*').order('sort_order').order('name');
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, active: r.active, sortOrder: r.sort_order }));
    },
  });
  return q.data ?? NONE_ROOMS;
}

export function useBookingServices() {
  const { session } = useAuth();
  return useQuery({
    queryKey: KEYS.services,
    enabled: !!session,
    queryFn: async (): Promise<BookingService[]> => {
      const { data, error } = await supabase.from('booking_services').select('*').order('sort_order');
      if (error) throw error;
      return (data ?? []).map((s: any) => ({ service: s.service, department: s.department ?? null, active: s.active, sortOrder: s.sort_order }));
    },
  });
}

/** Admin-only writes. Each resolves with the database's reason on failure. */
export function useClinicSetupActions() {
  const qc = useQueryClient();
  type Result = { ok: true } | { ok: false; error: string };
  const done = (error: { message?: string; code?: string } | null, key: readonly string[]): Result => {
    void qc.invalidateQueries({ queryKey: key });
    if (!error) return { ok: true };
    return { ok: false, error: error.code === '23505' ? 'A room with that name already exists.' : error.message || 'That could not be saved.' };
  };

  return {
    addRoom: async (name: string, sortOrder: number): Promise<Result> =>
      done((await supabase.from('consultation_rooms').insert([{ name: name.trim(), sort_order: sortOrder }])).error, KEYS.rooms),
    updateRoom: async (id: string, patch: { name?: string; active?: boolean }): Promise<Result> =>
      done((await supabase.from('consultation_rooms').update(patch).eq('id', id)).error, KEYS.rooms),
    updateService: async (service: string, patch: { department?: string | null; active?: boolean }): Promise<Result> =>
      done((await supabase.from('booking_services').update(patch).eq('service', service)).error, KEYS.services),
  };
}
