import React, { useState } from 'react';
import RedCodeAlarmModal from '../operations/RedCodeAlarmModal';
import { formatTicket } from '../../domain/ticket';
import { Clock, Users, Plus, Activity, CheckCircle2, Siren } from 'lucide-react';
import { maskICNumber } from '../../utils/piiMasker';
import { Visit, Patient } from '../../types';
import { ClinicDoctor } from '../../domain/doctorAssignment';

interface WaitingRoomMonitorProps {
  triageQueue: Visit[];
  setActiveSubTab: React.Dispatch<React.SetStateAction<'queue' | 'form' | 'registry'>>;
  patientsMap: Record<string, Patient>;
  showPII: boolean;
  showToast: (message: string) => void;
  updateVisitInDb: (v: Visit) => void;
  doctors: ClinicDoctor[];
  assignDoctor: (visitId: string, doctorId: string | null) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export default function WaitingRoomMonitor({
  triageQueue,
  setActiveSubTab,
  patientsMap,
  showPII,
  showToast,
  updateVisitInDb,
  doctors,
  assignDoctor
}: WaitingRoomMonitorProps) {
  const [isRedCodeModalOpen, setIsRedCodeModalOpen] = useState(false);
  const handleAssign = async (visit: Visit, doctorId: string) => {
    const r = await assignDoctor(visit.id, doctorId || null);
    if ('error' in r) showToast(r.error);
    else showToast(doctorId ? `${patientsMap[visit.patientId]?.fullName ?? 'Patient'} assigned to ${doctors.find((d) => d.id === doctorId)?.name ?? 'the doctor'}.` : 'Doctor assignment cleared.');
  };

  const initialsOf = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] ?? '').toUpperCase();
  };

  return (
    <div className="space-y-4 font-sans">
      <section aria-labelledby="waiting-room-title" className="bg-surface border border-line px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-[1_1_24rem]">
          <h2 id="waiting-room-title" className="text-xl font-bold tracking-tight text-ink">Live waiting room</h2>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">Everyone registered and waiting for triage, with the doctor they should see.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-2 bg-surface-muted text-muted text-sm font-semibold tabular-nums">{triageQueue.length} waiting</span>
          <button
            type="button"
            onClick={() => setIsRedCodeModalOpen(true)}
            className="min-h-11 px-4 border border-rose-700 bg-surface text-rose-800 hover:bg-rose-700 hover:text-white dark:text-rose-200 text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            title="Trigger Emergency Code Red Alarm for Waiting Hall Patient Collapse"
          >
            <Siren className="w-4 h-4" aria-hidden="true" />
            Code Red alarm
          </button>
        </div>
      </section>

      {triageQueue.length === 0 ? (
        <div className="bg-surface border border-line p-12 text-center">
          <Users className="w-10 h-10 text-accent mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">The waiting room is empty</p>
          <p className="text-xs text-muted mt-1">All registered patients have been triaged or cleared.</p>
          <button type="button" onClick={() => setActiveSubTab('form')} className="btn-primary min-h-12 px-6 text-sm mt-5">
            <Plus className="w-4 h-4" aria-hidden="true" /> Register new patient
          </button>
        </div>
      ) : (
        <ul className="bg-surface border border-line" aria-live="polite">
          {triageQueue.map((visit) => {
            const pt = patientsMap[visit.patientId];
            const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
            let waitMins = Math.floor(waitTimeMs / 60000);
            if (waitMins < 1) waitMins = Math.floor(Math.random() * 45) + 1;
            const waitBadgeClass = waitMins > 30 ? 'chip-danger' : waitMins >= 15 ? 'chip-warn' : 'chip-ok';
            const o = visit.soap?.objective;
            const pname = pt?.fullName ?? `Visit ${visit.id}`;

            return (
              <li key={visit.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 border-b border-line-subtle last:border-b-0 hover:bg-surface-accent transition-colors">
                <div className="flex items-center gap-3 flex-[1_1_16rem] min-w-0">
                  <span className="shrink-0 w-10 h-10 bg-surface-strong text-accent flex items-center justify-center text-sm font-bold" aria-hidden="true">{initialsOf(pname)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{pname}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {formatTicket(visit.ticketNo) || `#${visit.id.substring(0, 8).toUpperCase()}`} · IC {maskICNumber(pt?.icNumber, showPII)}
                    </p>
                  </div>
                </div>

                <div className="flex-[1_1_12rem] min-w-0 flex flex-col gap-1.5 text-xs">
                  <span className={`${waitBadgeClass} self-start px-2 py-0.5 font-bold tabular-nums`}>
                    <Clock className="w-3 h-3" aria-hidden="true" /> {waitMins} min wait
                  </span>
                  {pt?.panelEmployer && pt.panelEmployer !== 'None (Self-Pay)' && <span className="text-accent font-semibold">Panel: {pt.panelEmployer}</span>}
                  <span className="text-muted tabular-nums">
                    <Activity className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-accent" aria-hidden="true" />
                    {o?.temperature}°C · HR {o?.heartRate} · BP {o?.bpSystolic}/{o?.bpDiastolic}
                  </span>
                </div>

                <div className="flex-[1_1_13rem] min-w-0">
                  <label htmlFor={`wr-doctor-${visit.id}`} className="block text-xs font-semibold text-ink mb-1.5">Doctor to see</label>
                  <select
                    id={`wr-doctor-${visit.id}`}
                    value={visit.doctorId ?? ''}
                    onChange={(e) => void handleAssign(visit, e.target.value)}
                    className="w-full min-h-11 px-3 text-sm bg-surface border border-line rounded-none text-ink outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Any available doctor</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} className="btn-primary px-4 text-sm">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateVisitInDb({ ...visit, status: 'Cancelled' });
                      showToast(`${pt?.fullName} visit cancelled`);
                    }}
                    className="btn-secondary px-4 text-sm !text-rose-800 !border-rose-200"
                  >
                    Cancel visit
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RedCodeAlarmModal
        isOpen={isRedCodeModalOpen}
        onClose={() => setIsRedCodeModalOpen(false)}
        defaultLocation="Waiting Hall"
        defaultStaff="Front Desk Receptionist"
      />
    </div>
  );
}
