import { formatTicket } from '../../domain/ticket';
import { AlertCircle } from 'lucide-react';
import { Patient, Visit } from '../../types';

interface QueueRailProps {
  /** The room this doctor calls patients into; remembered between calls. */
  room?: string;
  onRoomChange?: (room: string) => void;
  queue: Visit[];
  patientsMap: Record<string, Patient>;
  userId: string | null;
  /** The visit the doctor is consulting now, if any. */
  activeVisitId: string | null;
  /** Ask to call a waiting patient (the page confirms the room first). */
  onCall: (visitId: string, patientName: string, position: number) => void;
}

const waitMinutes = (v: Visit) => (v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : 0);

/**
 * A narrow live queue beside the consultation, so the doctor never loses sight of who is waiting.
 * While a consultation is open, calling someone else is blocked: finish or return the current patient first.
 */
export default function QueueRail({ room, onRoomChange, queue, patientsMap, userId, activeVisitId, onCall }: QueueRailProps) {
  const mine = queue.find((v) => v.id === activeVisitId) ?? queue.find((v) => v.status === 'Consulting' && v.calledBy === userId);
  const others = queue.filter((v) => v.id !== mine?.id);
  const busy = !!mine;

  return (
    <aside aria-label="Waiting patients" className="w-full lg:w-64 shrink-0 bg-surface border border-line-subtle p-3 space-y-2 lg:sticky lg:top-0 self-start">
      {onRoomChange && (
        <label className="block px-1 pb-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-subtle">Your room</span>
          <input
            className="mt-1 w-full min-h-11 px-3 text-sm border border-line-strong bg-surface text-ink"
            value={room ?? ''}
            maxLength={60}
            onChange={(e) => onRoomChange(e.target.value)}
            aria-label="Consultation room you call patients into"
          />
        </label>
      )}
      {mine && (
        <>
          <h3 className="text-2xs font-bold uppercase tracking-wider text-subtle px-1">With me</h3>
          <div className="bg-surface-strong border border-primary p-2.5">
            <div className="text-sm font-bold text-ink truncate">{formatTicket(mine.ticketNo) && <span className="font-mono text-accent mr-1.5">{formatTicket(mine.ticketNo)}</span>}{patientsMap[mine.patientId]?.fullName ?? 'Patient'}</div>
            <div className="text-xs text-muted mt-0.5">{mine.consultRoom ? `${mine.consultRoom} · ` : ''}in consultation</div>
          </div>
        </>
      )}

      <h3 className="text-2xs font-bold uppercase tracking-wider text-subtle px-1 pt-1">Waiting ({others.length})</h3>
      {others.length === 0 && <p className="text-xs text-muted px-1">No one else is waiting.</p>}
      <ul className="space-y-2">
        {others.map((v, i) => {
          const pt = patientsMap[v.patientId];
          const mins = waitMinutes(v);
          const takenBy = v.status === 'Consulting' && v.calledBy && v.calledBy !== userId ? `${v.calledByName ?? 'Another doctor'}${v.consultRoom ? `, ${v.consultRoom}` : ''}` : null;
          const hasAllergy = (pt?.drugAllergies?.length ?? 0) > 0;
          return (
            <li key={v.id}>
              {takenBy ? (
                <div className="border border-line-subtle bg-surface-muted p-2.5 min-h-11">
                  <div className="text-sm font-semibold text-ink truncate">{formatTicket(v.ticketNo) && <span className="font-mono text-accent mr-1.5">{formatTicket(v.ticketNo)}</span>}{pt?.fullName ?? 'Patient'}</div>
                  <span className="chip-info mt-1 px-2 py-0.5 text-2xs inline-flex items-center gap-1">With {takenBy}</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  title={busy ? 'Finish or return your current patient first' : `Call ${pt?.fullName ?? 'patient'}`}
                  aria-label={`Call ${formatTicket(v.ticketNo)} ${pt?.fullName ?? 'patient'}, waiting ${mins} minutes${hasAllergy ? ', has drug allergies' : ''}`}
                  onClick={() => pt && onCall(v.id, pt.fullName, i + 1)}
                  className="w-full text-left min-h-11 border border-line-subtle bg-surface hover:bg-surface-accent disabled:opacity-60 disabled:hover:bg-surface p-2.5 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink truncate">{formatTicket(v.ticketNo) && <span className="font-mono text-accent mr-1.5">{formatTicket(v.ticketNo)}</span>}{pt?.fullName ?? 'Patient'}</span>
                    <span className={`text-xs font-bold shrink-0 ${mins >= 20 ? 'text-amber-700 dark:text-amber-300' : 'text-muted'}`}>{mins} min</span>
                  </span>
                  {hasAllergy && (
                    <span className="chip-danger mt-1 px-2 py-0.5 text-2xs inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" aria-hidden="true" />Allergy</span>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {busy && others.length > 0 && <p className="text-xs text-muted px-1">Finish or return your patient to call the next one.</p>}
    </aside>
  );
}
