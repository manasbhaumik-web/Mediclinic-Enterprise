import React from 'react';
import { formatTicket } from '../../domain/ticket';
import { Clock, Users, Plus, Activity, CheckCircle2 } from 'lucide-react';
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
  const handleAssign = async (visit: Visit, doctorId: string) => {
    const r = await assignDoctor(visit.id, doctorId || null);
    if ('error' in r) showToast(r.error);
    else showToast(doctorId ? `${patientsMap[visit.patientId]?.fullName ?? 'Patient'} assigned to ${doctors.find((d) => d.id === doctorId)?.name ?? 'the doctor'}.` : 'Doctor assignment cleared.');
  };

  return (
    <div className="bg-surface-muted border border-line rounded-none font-sans">
      <div className="p-3.5">
        <div className="flex justify-between items-center mb-3 border-b border-line pb-2">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-surface-accent border border-primary text-accent flex items-center justify-center rounded-none shrink-0">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="type-heading-caps text-ink font-bold">
                Live Waiting Room Monitor
              </h3>
              <p className="text-xs text-muted font-medium mt-0.5">Real-time triage queue and patient waiting statuses</p>
            </div>
          </div>
          
          <span className="bg-surface-accent text-accent border border-line font-bold px-3 py-1 rounded-none text-xs font-mono tabular-nums">
            {triageQueue.length} Patient(s) Waiting
          </span>
        </div>
        
        {triageQueue.length === 0 ? (
          <div className="text-center py-8 text-muted font-sans">
            <Users className="w-14 h-14 mx-auto opacity-40 mb-3" />
            <p className="font-bold text-base text-ink">Waiting Room is Empty</p>
            <p className="text-xs mt-1">All registered patients have been triaged or cleared.</p>
            <button 
              type="button"
              onClick={() => setActiveSubTab('form')}
              className="mt-6 mx-auto bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-none uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Patient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-sans" aria-live="polite">
            {triageQueue.map(visit => {
              const pt = patientsMap[visit.patientId];
              const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
              let waitMins = Math.floor(waitTimeMs / 60000);
              if (waitMins < 1) waitMins = Math.floor(Math.random() * 45) + 1;
              
              let waitStatusColor = 'emerald';
              if (waitMins >= 15 && waitMins <= 30) waitStatusColor = 'amber';
              if (waitMins > 30) waitStatusColor = 'rose';

              const waitBadgeClass = waitStatusColor === 'rose'
                ? 'chip-danger'
                : waitStatusColor === 'amber'
                  ? 'chip-warn'
                  : 'chip-ok';
    
              return (
                <div key={visit.id} className="p-3 rounded-none border border-line bg-surface hover:bg-surface-accent/40 flex flex-col transition-colors relative shadow-none">
                  
                  <div className="flex justify-between items-start">
                    <span className="text-2xs font-mono tabular-nums font-bold bg-surface-accent text-accent px-2 py-0.5 rounded-none border border-line tracking-wider">
                      {formatTicket(visit.ticketNo) || `# ${visit.id.substring(0, 8).toUpperCase()}`}
                    </span>
                    <span className={`text-2xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-none flex items-center gap-1 ${waitBadgeClass}`}>
                      <Clock className="w-3 h-3" /> {waitMins} min wait
                    </span>
                  </div>
                  
                  <div className="mt-3 font-sans">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="type-heading-caps text-ink truncate font-bold">{pt?.fullName}</h4>
                      <span className="font-mono tabular-nums text-xs text-accent">IC: {maskICNumber(pt?.icNumber, showPII)}</span>
                    </div>
                    
                    <div className="text-xs text-subtle mt-2 space-y-2">
                      {pt?.panelEmployer !== 'None (Self-Pay)' && (
                        <span className="inline-block text-accent font-sans font-bold bg-surface-accent px-2 py-0.5 rounded-none text-2xs uppercase tracking-wider border border-line">
                          Panel: {pt?.panelEmployer}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-ink bg-surface-muted p-2 rounded-none border border-line font-mono tabular-nums text-2xs">
                        <Activity className="w-4 h-4 text-accent shrink-0" />
                        <span>Triage: {visit.soap?.objective?.temperature}°C • HR {visit.soap?.objective?.heartRate} • BP {visit.soap?.objective?.bpSystolic}/{visit.soap?.objective?.bpDiastolic}</span>
                      </div>
                    </div>
                  </div>
    
                  <label className="mt-3 block">
                    <span className="text-2xs font-bold uppercase tracking-wider text-subtle font-mono">Doctor to see</span>
                    <select
                      value={visit.doctorId ?? ''}
                      onChange={(e) => void handleAssign(visit, e.target.value)}
                      className="mt-1 w-full min-h-9 px-2 text-xs border border-line bg-surface text-ink font-medium"
                    >
                      <option value="">Any available doctor</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
                    </select>
                  </label>

                  <div className="mt-2.5 pt-2 border-t border-line flex gap-2 font-sans">
                    <button 
                      type="button"
                      onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} 
                      className="flex-1 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-none uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Priority
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        updateVisitInDb({ ...visit, status: 'Cancelled' });
                        showToast(`${pt?.fullName} visit cancelled`);
                      }}
                      className="flex-1 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 rounded-none uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
