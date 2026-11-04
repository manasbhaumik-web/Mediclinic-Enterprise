import type { UserRole, Visit } from '../types';
import type { VisitQueues } from './visitWorkflow';

export type Station = 'triage' | 'doctor' | 'pharmacy' | 'cashier';

const STATION_OF_ROLE: Partial<Record<UserRole, Station>> = {
  'clinic-assistant': 'triage',
  doctor: 'doctor',
  pharmacist: 'pharmacy',
  cashier: 'cashier',
};

/** The queues a person watches: one per role they hold that works from a queue. */
export function stationsForRoles(roles: readonly UserRole[]): Station[] {
  return [...new Set(roles.map((r) => STATION_OF_ROLE[r]).filter((s): s is Station => !!s))];
}

export type QueueSnapshot = Record<Station, string[]>;

export const snapshotOf = (q: Pick<VisitQueues, Station>): QueueSnapshot => ({
  triage: q.triage.map((v) => v.id),
  doctor: q.doctor.map((v) => v.id),
  pharmacy: q.pharmacy.map((v) => v.id),
  cashier: q.cashier.map((v) => v.id),
});

/**
 * Visits that joined a watched queue since the last snapshot. The first snapshot is only a baseline, so
 * opening the app never announces everyone already waiting.
 */
export function newArrivals(
  previous: QueueSnapshot | null,
  current: QueueSnapshot,
  watched: readonly Station[],
): { station: Station; visitIds: string[] }[] {
  if (!previous) return [];
  return watched
    .map((station) => ({ station, visitIds: current[station].filter((id) => !previous[station].includes(id)) }))
    .filter((a) => a.visitIds.length > 0);
}

export const STATION_MESSAGE: Record<Station, string> = {
  triage: 'waiting for triage',
  doctor: 'waiting for the doctor',
  pharmacy: 'ready at the pharmacy',
  cashier: 'ready for billing',
};

/**
 * Whether a consultation a doctor had open should still be open after a page reload: the patient must still be
 * with this doctor (called by them and consulting) or on hold for a result they may recall.
 */
export function keepActiveConsultation(visits: readonly Visit[], visitId: string | null, userId: string | null): boolean {
  if (!visitId) return false;
  const v = visits.find((x) => x.id === visitId);
  if (!v) return false;
  if (v.status === 'Holding for Results') return true;
  return v.status === 'Consulting' && !!userId && v.calledBy === userId;
}
