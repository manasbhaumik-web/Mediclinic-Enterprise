import { Visit } from '../types';

/** Pure rules for which doctor a waiting patient belongs to. */

export interface ClinicDoctor { id: string; authId: string | null; name: string; department: string | null }

export type Assignment = 'mine' | 'unassigned' | 'other';

/** Whose patient this is, from the point of view of the doctor with staff id `myDoctorId`. */
export function assignmentOf(visit: Pick<Visit, 'doctorId'>, myDoctorId: string | null | undefined): Assignment {
  if (!visit.doctorId) return 'unassigned';
  return visit.doctorId === myDoctorId ? 'mine' : 'other';
}

const RANK: Record<Assignment, number> = { mine: 0, unassigned: 1, other: 2 };

/**
 * Puts the doctor's own patients first and other doctors' patients last. The order inside each group is kept,
 * so whatever sort the queue already has still applies within them.
 */
export function prioritiseAssigned<T extends Pick<Visit, 'doctorId'>>(queue: T[], myDoctorId: string | null | undefined): T[] {
  if (!myDoctorId) return queue;
  return queue
    .map((v, i) => ({ v, i, r: RANK[assignmentOf(v, myDoctorId)] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.v);
}

export function doctorName(doctors: ClinicDoctor[] | undefined, id: string | undefined): string | undefined {
  return id ? doctors?.find((d) => d.id === id)?.name : undefined;
}

/** Rooms a doctor can call a patient into, each with who is using it now (if anyone). */
export interface RoomOption { name: string; busyWith?: string }

export function roomOptions(roomNames: string[], visits: Pick<Visit, 'status' | 'consultRoom' | 'calledByName'>[], ignore?: (v: Pick<Visit, 'status' | 'consultRoom' | 'calledByName'>) => boolean): RoomOption[] {
  return roomNames.map((name) => {
    const user = visits.find((v) => v.status === 'Consulting' && !ignore?.(v) && v.consultRoom?.trim().toLowerCase() === name.trim().toLowerCase());
    return user ? { name, busyWith: user.calledByName ?? 'another doctor' } : { name };
  });
}
