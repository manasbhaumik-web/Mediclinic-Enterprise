import { formatTicket } from '../../domain/ticket';
import { AlertCircle, X, PanelLeftClose } from 'lucide-react';
import { Patient, Visit } from '../../types';
import { assignmentOf, ClinicDoctor, doctorName, RoomOption } from '../../domain/doctorAssignment';
import RoomPicker from './RoomPicker';

interface QueueRailProps {
  /** The room this doctor calls patients into; remembered between calls. */
  room?: string;
  onRoomChange?: (room: string) => void;
  /** The clinic's rooms, with who is using each; empty when the clinic has not listed any. */
  roomOptions?: RoomOption[];
  doctors?: ClinicDoctor[];
  /** This doctor's staff id, to mark their own assigned patients. */
  myDoctorId?: string | null;
  queue: Visit[];
  patientsMap: Record<string, Patient>;
  userId: string | null;
  /** The visit the doctor is consulting now, if any. */
  activeVisitId: string | null;
  /** Ask to call a waiting patient (the page confirms the room first). */
  onCall: (visitId: string, patientName: string, position: number) => void;
  /** Callback when the user closes or undocks the queue rail. */
  onClose?: () => void;
  /** Whether the queue rail is presented as a slide-over modal drawer. */
  isDrawer?: boolean;
}

const waitMinutes = (v: Visit) => (v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : 0);

/**
 * A live queue rail or slide-over drawer, showing waiting patients without obstructing the consultation room.
 * While a consultation is open, calling someone else is blocked: finish or return the current patient first.
 */
export default function QueueRail({
  room,
  onRoomChange,
  roomOptions = [],
  doctors,
  myDoctorId = null,
  queue,
  patientsMap,
  userId,
  activeVisitId,
  onCall,
  onClose,
  isDrawer = false,
}: QueueRailProps) {
  const mine = queue.find((v) => v.id === activeVisitId) ?? queue.find((v) => v.status === 'Consulting' && v.calledBy === userId);
  const others = queue.filter((v) => v.id !== mine?.id);
  const busy = !!mine;

  const content = (
    <>
      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-line">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-2xs font-bold uppercase tracking-wider text-ink font-mono">Queue Rail</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono tabular-nums font-bold text-accent bg-surface-accent px-1.5 py-0.5 border border-line">
            {others.length} Waiting
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-surface-accent border border-line text-muted hover:text-ink cursor-pointer rounded-none"
              title="Close Queue Panel"
              aria-label="Close Queue Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {onRoomChange && (
        <div className="px-1 pb-1">
          <RoomPicker id="rail-room" label="Your room" value={room ?? ''} onChange={onRoomChange} options={roomOptions} />
        </div>
      )}

      {mine && (
        <div className="space-y-1">
          <h3 className="text-2xs font-bold uppercase tracking-wider text-muted px-1">With me</h3>
          <div className="bg-surface-strong border border-primary p-2.5">
            <div className="text-sm font-bold text-ink truncate">
              {formatTicket(mine.ticketNo) && <span className="font-mono tabular-nums text-accent mr-1.5">{formatTicket(mine.ticketNo)}</span>}
              {patientsMap[mine.patientId]?.fullName ?? 'Patient'}
            </div>
            <div className="text-xs text-muted mt-0.5 font-medium">
              {mine.consultRoom ? `${mine.consultRoom} · ` : ''}in consultation
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-2xs font-bold uppercase tracking-wider text-muted px-1 pt-1 flex items-center justify-between">
          <span>Waiting Roster</span>
          <span className="font-mono tabular-nums text-accent font-bold">({others.length})</span>
        </h3>
        {others.length === 0 && <p className="text-xs text-muted px-1 py-2 italic font-mono">No one else is waiting.</p>}
        <ul className="space-y-2">
          {others.map((v, i) => {
            const pt = patientsMap[v.patientId];
            const mins = waitMinutes(v);
            const takenBy =
              v.status === 'Consulting' && v.calledBy && v.calledBy !== userId
                ? `${v.calledByName ?? 'Another doctor'}${v.consultRoom ? `, ${v.consultRoom}` : ''}`
                : null;
            const hasAllergy = (pt?.drugAllergies?.length ?? 0) > 0;
            const assignment = assignmentOf(v, myDoctorId);

            const stripeClass = hasAllergy
              ? ''
              : mins >= 20
              ? ''
              : assignment === 'mine'
              ? ''
              : '';

            return (
              <li key={v.id}>
                {takenBy ? (
                  <div className={`border border-line-subtle bg-surface-muted p-2.5 min-h-11 ${stripeClass}`}>
                    <div className="text-sm font-semibold text-ink truncate">
                      {formatTicket(v.ticketNo) && <span className="font-mono tabular-nums text-accent mr-1.5">{formatTicket(v.ticketNo)}</span>}
                      {pt?.fullName ?? 'Patient'}
                    </div>
                    <span className="chip-info mt-1 px-2 py-0.5 text-2xs inline-flex items-center gap-1 font-mono">
                      With {takenBy}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    title={busy ? 'Finish or return your current patient first' : `Call ${pt?.fullName ?? 'patient'}`}
                    aria-label={`Call ${formatTicket(v.ticketNo)} ${pt?.fullName ?? 'patient'}, waiting ${mins} minutes${hasAllergy ? ', has drug allergies' : ''}`}
                    onClick={() => pt && onCall(v.id, pt.fullName, i + 1)}
                    className={`w-full text-left min-h-11 border border-line-subtle bg-surface hover:bg-surface-accent disabled:opacity-60 disabled:hover:bg-surface p-2.5 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${stripeClass}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink truncate">
                        {formatTicket(v.ticketNo) && <span className="font-mono tabular-nums text-accent mr-1.5">{formatTicket(v.ticketNo)}</span>}
                        {pt?.fullName ?? 'Patient'}
                      </span>
                      <span className={`text-xs font-bold shrink-0 font-mono tabular-nums ${mins >= 20 ? 'text-amber-700 dark:text-amber-300' : 'text-muted'}`}>
                        {mins}m
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasAllergy && (
                        <span className="chip-danger px-1.5 py-0.2 text-2xs inline-flex items-center gap-1 font-mono font-bold">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" />Allergy
                        </span>
                      )}
                      {assignment === 'mine' && <span className="chip-ok px-1.5 py-0.2 text-2xs inline-flex items-center font-mono">Assigned to you</span>}
                      {assignment === 'other' && (
                        <span className="chip-neutral px-1.5 py-0.2 text-2xs inline-flex items-center font-mono">
                          Assigned to {doctorName(doctors, v.doctorId) ?? 'another doctor'}
                        </span>
                      )}
                    </div>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {busy && others.length > 0 && <p className="text-2xs text-muted px-1 pt-1 border-t border-line font-medium font-mono">Finish or return patient to call next.</p>}
    </>
  );

  if (isDrawer) {
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Waiting patients drawer"
        onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
        onKeyDown={(e) => { if (e.key === 'Escape' && onClose) onClose(); }}
        className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex justify-start animate-fadeIn"
      >
        <aside
          aria-label="Waiting patients drawer"
          className="w-80 sm:w-96 bg-surface h-full border-r border-line shadow-2xl p-4 overflow-y-auto space-y-3 animate-slideInLeft"
        >
          {content}
        </aside>
      </div>
    );
  }

  return (
    <aside aria-label="Waiting patients" className="w-full lg:w-64 shrink-0 bg-surface border border-line p-3 space-y-2.5 lg:sticky lg:top-0 self-start">
      {content}
    </aside>
  );
}
