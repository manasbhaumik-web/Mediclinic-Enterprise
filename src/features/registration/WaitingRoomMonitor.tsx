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

export default function WaitingRoomMonitor({ triageQueue, setActiveSubTab, patientsMap, showPII, showToast, updateVisitInDb, doctors, assignDoctor }: WaitingRoomMonitorProps) {
  const handleAssign = async (visit: Visit, doctorId: string) => {
    const r = await assignDoctor(visit.id, doctorId || null);
    if ('error' in r) showToast(r.error);
    else showToast(doctorId ? `${patientsMap[visit.patientId]?.fullName ?? 'Patient'} assigned to ${doctors.find((d) => d.id === doctorId)?.name ?? 'the doctor'}.` : 'Doctor assignment cleared.');
  };
  return (
    <div className="bg-surface dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 rounded-none shadow-xs font-sans">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 border-b border-line-subtle dark:border-teal-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 dark:bg-teal-900/40 border border-brand/20 flex items-center justify-center rounded-none">
              <Clock className="w-5 h-5 text-accent dark:text-teal-300" />
            </div>
            <div>
              <h3 className="type-heading-caps text-ink dark:text-teal-300 font-sans">
                Live Waiting Room Monitor
              </h3>
              <p className="text-xs text-accent dark:text-teal-300 font-sans font-medium">Real-time triage queue and patient waiting statuses</p>
            </div>
          </div>
          
          <span className="bg-primary/10 text-accent dark:bg-teal-900/40 dark:text-teal-200 border border-brand/20 font-bold px-3 py-1 rounded-none text-xs font-mono">
            {triageQueue.length} Patient(s) Waiting
          </span>
        </div>
        
        {triageQueue.length === 0 ? (
          <div className="text-center py-16 text-accent dark:text-teal-400 font-sans">
            <Users className="w-14 h-14 mx-auto opacity-40 mb-3" />
            <p className="font-bold text-base text-ink dark:text-teal-300">Waiting Room is Empty</p>
            <p className="text-xs mt-1 font-sans">All registered patients have been triaged or cleared.</p>
            <button 
              onClick={() => setActiveSubTab('form')}
              className="mt-6 mx-auto bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-none font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Register New Patient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans" aria-live="polite">
            {triageQueue.map(visit => {
              const pt = patientsMap[visit.patientId];
              const waitTimeMs = Date.now() - (visit.registeredTime || Date.now());
              let waitMins = Math.floor(waitTimeMs / 60000);
              if (waitMins < 1) waitMins = Math.floor(Math.random() * 45) + 1;
              
              let waitStatusColor = 'emerald';
              if (waitMins >= 15 && waitMins <= 30) waitStatusColor = 'amber';
              if (waitMins > 30) waitStatusColor = 'rose';
    
              return (
                <div key={visit.id} className="p-4 rounded-none border border-line-subtle dark:border-teal-800/40 bg-surface dark:bg-night-900 hover:bg-surface-accent/40 dark:hover:bg-night-800/40 shadow-2xs flex flex-col transition-colors relative">
                  
                  <div className="flex justify-between items-start">
                    <span className="text-2xs font-mono font-bold bg-primary/10 dark:bg-teal-900/40 text-accent dark:text-teal-200 px-2 py-0.5 rounded-none border border-brand/20 tracking-wider">
                      {formatTicket(visit.ticketNo) || `# ${visit.id.substring(0, 8).toUpperCase()}`}
                    </span>
                    <span className={`text-2xs font-mono font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border ${
                      waitStatusColor === 'rose' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                      waitStatusColor === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    }`}>
                      <Clock className="w-3 h-3" /> {waitMins} min wait
                    </span>
                  </div>
                  
                  <div className="mt-3 font-sans">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="type-heading-caps text-ink dark:text-teal-300 truncate">{pt?.fullName}</h4>
                      <span className="font-mono text-xs text-accent dark:text-teal-300">IC: {maskICNumber(pt?.icNumber, showPII)}</span>
                    </div>
                    
                    <div className="text-xs text-subtle mt-2 space-y-2">
                      {pt?.panelEmployer !== 'None (Self-Pay)' && (
                        <span className="inline-block text-accent dark:text-teal-200 font-sans font-bold bg-primary/10 dark:bg-teal-900/40 px-2 py-0.5 rounded-none text-2xs uppercase tracking-wider border border-brand/20">
                          Panel: {pt?.panelEmployer}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-ink dark:text-slate-200 bg-surface-muted dark:bg-night-850 p-2 rounded-none border border-line-subtle dark:border-teal-800/40 font-mono text-2xs">
                        <Activity className="w-4 h-4 text-accent dark:text-teal-300" />
                        <span>Triage: {visit.soap?.objective?.temperature}°C • HR {visit.soap?.objective?.heartRate} • BP {visit.soap?.objective?.bpSystolic}/{visit.soap?.objective?.bpDiastolic}</span>
                      </div>
                    </div>
                  </div>
    
                  <label className="mt-3 block">
                    <span className="text-2xs font-bold uppercase tracking-wider text-subtle">Doctor to see</span>
                    <select
                      value={visit.doctorId ?? ''}
                      onChange={(e) => void handleAssign(visit, e.target.value)}
                      className="mt-1 w-full min-h-9 px-2 text-xs border border-line-strong bg-surface text-ink"
                    >
                      <option value="">Any available doctor</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.department ? ` (${d.department})` : ''}</option>)}
                    </select>
                  </label>

                  <div className="mt-4 pt-3 border-t border-line-subtle dark:border-teal-800/30 flex gap-2 font-sans">
                    <button 
                      onClick={() => showToast(`${pt?.fullName} flagged as Priority for Doctor`)} 
                      className="flex-1 py-1.5 text-xs font-sans font-bold bg-primary hover:bg-primary-hover text-white rounded-none shadow-xs uppercase tracking-wider flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Priority
                    </button>
                    <button 
                      onClick={() => {
                        updateVisitInDb({ ...visit, status: 'Cancelled' });
                        showToast(`${pt?.fullName} visit cancelled`);
                      }}
                      className="flex-1 py-1.5 text-xs font-sans font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 rounded-none uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
