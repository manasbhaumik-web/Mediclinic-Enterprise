import { supabase } from './supabase';

/** The public booking page talks to the database only through these functions; it never reads or writes tables. */

export interface BookingDoctor { id: string; name: string; department: string | null }
export interface BookingReceipt { reference: string; appointmentTime: string; doctor: string; service: string }

/** Messages the database raises on purpose are safe to show; anything else becomes a generic line. */
function friendly(error: { message?: string; code?: string } | null, fallback: string): Error {
  if (error?.code === 'P0001' && error.message) return new Error(error.message);
  return new Error(fallback);
}

export async function fetchBookingDoctors(): Promise<BookingDoctor[]> {
  const { data, error } = await supabase.rpc('public_booking_doctors');
  if (error) throw friendly(error, 'Doctors could not be loaded. Please try again.');
  return (data ?? []).map((d: any) => ({ id: d.id, name: d.name, department: d.department ?? null }));
}

export async function fetchBookingSlots(doctorId: string, day: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('public_booking_slots', { p_doctor: doctorId, p_day: day });
  if (error) throw friendly(error, 'Times could not be loaded. Please try again.');
  return (data ?? []).map((r: any) => (typeof r === 'string' ? r : r.slot));
}

export interface BookingRequest { name: string; ic: string; phone: string; service: string; doctorId: string; slot: string; notes?: string }

export async function bookAppointment(r: BookingRequest): Promise<BookingReceipt> {
  const { data, error } = await supabase.rpc('public_book_appointment', {
    p_name: r.name.trim(), p_ic: r.ic.trim(), p_phone: r.phone.trim(), p_service: r.service,
    p_doctor: r.doctorId, p_slot: r.slot, p_notes: r.notes?.trim() || null,
  });
  if (error) throw friendly(error, 'The booking could not be completed. Please try again or call the clinic.');
  return { reference: data.reference, appointmentTime: data.appointment_time, doctor: data.doctor, service: data.service };
}

export async function cancelBooking(reference: string, phone: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('public_cancel_booking', { p_reference: reference, p_phone: phone });
  if (error) throw friendly(error, 'The booking could not be cancelled. Please call the clinic.');
  return data === true;
}
