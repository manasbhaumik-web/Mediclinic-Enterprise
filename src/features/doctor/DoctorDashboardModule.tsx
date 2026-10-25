import React, { useState } from 'react';
import { Patient, Visit, Language, SOAPNotes } from '../../types';
import ConsultationRoom from '../consultation/ConsultationRoom';
import { 
  Stethoscope, Users, RefreshCw, Volume2, AlertCircle, Copy, Check,
  CheckCircle2, AlertTriangle, ArrowRight, Clock
} from 'lucide-react';
import { 
  getChiefComplaintLabel, 
  getRankingRationale, 
  getTriageDetails 
} from '../../utils/queueSorter';
import { useQueueFilter } from '../../hooks/useQueueFilter';

import ActionMenu from '../../components/ui/ActionMenu';
import QueueToolbar from './QueueToolbar';
import NextPatientCard from './NextPatientCard';
import WaitingPatientsList from './WaitingPatientsList';
import QueueRail from './QueueRail';
import { formatTicket } from '../../domain/ticket';
import { calculatePatientAge } from '../../domain/patientAge';
import { draftKey } from '../../domain/consultationDraft';
import DoctorMonthlyReport from './DoctorMonthlyReport';
import RoomPicker from './RoomPicker';
import { useClinicDoctors, useConsultationRooms } from '../../hooks/useClinicSetup';
import { assignmentOf, doctorName as nameOfDoctor, roomOptions } from '../../domain/doctorAssignment';
interface DoctorDashboardModuleProps {
  doctorQueue: Visit[];
  patientsMap: Record<string, Patient>;
  activeLanguage: Language;
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  onConsultationComplete: (soapData: SOAPNotes, issueMc: boolean, mcDuration: number) => void;
  doctorName?: string;
  userId?: string | null;
  /** `override` is true once the doctor has confirmed calling a patient who is assigned to someone else. */
  onCallPatient?: (visitId: string, room: string, override?: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
  onReleasePatient?: (visitId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  doctorTab?: 'queue' | 'consultation' | 'reports';
  onTabChange?: (tab: 'queue' | 'consultation' | 'reports') => void;
}

export default function DoctorDashboardModule({
  doctorQueue,
  patientsMap,
  activeLanguage,
  activeConsultationVisitId,
  setActiveConsultationVisitId,
  onConsultationComplete,
  doctorName = "Dr. Sarah Tan",
  doctorTab = "queue",
  userId = null,
  onCallPatient,
  onReleasePatient,
  onTabChange
}: DoctorDashboardModuleProps) {
  const [internalTab, setInternalTab] = useState<'queue' | 'consultation' | 'reports'>(doctorTab);
  const [room, setRoom] = useState<string>(() => {
    try { return localStorage.getItem('mediclinic.consultRoom') || 'Consultation Room 1'; } catch { return 'Consultation Room 1'; }
  });
  const [callAnnouncementToast, setCallAnnouncementToast] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [lastSyncedText, setLastSyncedText] = useState<string>('Just now');
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [pendingCallVisit, setPendingCallVisit] = useState<{ visitId: string; patientName: string; position: number; assignedTo?: string } | null>(null);

  // Who the doctor is (a staff record), the clinic's rooms, and which of them another doctor is using right now.
  const doctors = useClinicDoctors();
  const rooms = useConsultationRooms();
  const myDoctorId = doctors.find((d) => d.authId === userId)?.id ?? null;
  const activeVisit = doctorQueue.find((v) => v.id === activeConsultationVisitId);
  const roomChoices = roomOptions(
    rooms.filter((r) => r.active).map((r) => r.name),
    doctorQueue,
    (v) =>
      Boolean(
        (userId && v.calledBy === userId) ||
        (doctorName && v.calledByName === doctorName) ||
        v.id === activeConsultationVisitId
      )
  );
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [queueRailMode, setQueueRailMode] = useState<'hidden' | 'drawer' | 'docked'>('hidden');

  // Who has been called is saved on the visit, so it survives a refresh and every screen sees it.
  const calledVisitId = doctorQueue.find((v) => v.status === 'Consulting' && v.calledBy === userId)?.id ?? null;
  const calledTimestampMap: Record<string, string> = Object.fromEntries(
    doctorQueue.filter((v) => v.status === 'Consulting' && v.calledAt).map((v) => [
      v.id,
      `${new Date(v.calledAt as number).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })} by ${v.calledByName ?? 'a doctor'}${v.consultRoom ? `, ${v.consultRoom}` : ''}`,
    ]),
  );
  // After a refresh, pick the consultation back up.
  React.useEffect(() => {
    if (calledVisitId && !activeConsultationVisitId) setActiveConsultationVisitId(calledVisitId);
  }, [calledVisitId, activeConsultationVisitId, setActiveConsultationVisitId]);

  // Custom Hook: Extracted queue sorting, filtering, pinning, and pagination
  const {
    sortRule, setSortRule,
    acuityFilter, setAcuityFilter,
    queueSearchQuery, setQueueSearchQuery,
    queuePage, currentPage, setQueuePage,
    entriesPerPage, setEntriesPerPage,
    pinnedVisitIds, togglePinVisit,
    sortedQueue, paginatedQueue,
    nextVisit, nextPatient, remainingQueue,
    totalPages, startIndex
  } = useQueueFilter({ queue: doctorQueue, patientsMap, initialEntriesPerPage: 6, myDoctorId });

  // Keep workstation room aligned with the active consultation's room
  React.useEffect(() => {
    if (activeVisit?.consultRoom && activeVisit.consultRoom !== room) {
      setRoom(activeVisit.consultRoom);
      try { localStorage.setItem('mediclinic.consultRoom', activeVisit.consultRoom); } catch { /* ignore */ }
    }
  }, [activeVisit?.consultRoom, room]);

  // Once the clinic's rooms are known, make sure the chosen room is one of them and is free.
  React.useEffect(() => {
    if (roomChoices.length === 0) return;
    const current = roomChoices.find((o) => o.name === room);
    if (current && !current.busyWith) return;
    const free = roomChoices.find((o) => !o.busyWith);
    if (free) setRoom(free.name);
  }, [roomChoices.map((o) => `${o.name}:${o.busyWith ?? ''}`).join('|'), room]);

  // Global Keyboard Shortcuts (Alt+Q, Alt+C, Alt+F, Alt+R)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'q') {
        e.preventDefault();
        setInternalTab('queue');
      } else if (key === 'c') {
        e.preventDefault();
        setInternalTab('consultation');
      } else if (key === 'f') {
        e.preventDefault();
        const inputEl = document.getElementById('queue-search-input');
        if (inputEl) inputEl.focus();
      } else if (key === 'r') {
        e.preventDefault();
        if (internalTab === 'consultation' && activeConsultationVisitId) {
          setQueueRailMode((prev) => (prev === 'drawer' ? 'hidden' : 'drawer'));
        } else {
          handleManualQueueRefresh();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyToClipboard = (text: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const playCallChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Ignore
    }
  };

  const toggleDetails = (visitId: string) => {
    setExpandedDetails(prev => ({ ...prev, [visitId]: !prev[visitId] }));
  };

  const handleManualQueueRefresh = () => {
    setIsRefreshingQueue(true);
    setQueuePage(1);
    setTimeout(() => {
      setIsRefreshingQueue(false);
      setLastSyncedText('Just now');
    }, 600);
  };

  // Calling the next patient in turn needs no confirmation. Calling someone out of turn, or while another
  // consultation is open, asks first (and lets the doctor change the room).
  // A patient assigned to another doctor always asks first, whatever their place in the queue.
  const requestCallPatient = (visitId: string, patientName: string, position: number) => {
    const visit = doctorQueue.find((v) => v.id === visitId);
    const assignedTo = visit && assignmentOf(visit, myDoctorId) === 'other' ? (nameOfDoctor(doctors, visit.doctorId) ?? 'another doctor') : undefined;
    if (position <= 1 && !activeConsultationVisitId && !assignedTo) {
      void performCall(visitId, patientName);
      return;
    }
    setPendingCallVisit({ visitId, patientName, position, assignedTo });
  };

  const confirmCallPatient = () => {
    if (!pendingCallVisit) return;
    const { visitId, patientName, assignedTo } = pendingCallVisit;
    setPendingCallVisit(null);
    void performCall(visitId, patientName, !!assignedTo);
  };

  const performCall = async (visitId: string, patientName: string, override = false) => {
    const roomName = room.trim() || 'Consultation Room 1';
    const result = onCallPatient ? await onCallPatient(visitId, roomName, override) : { ok: false as const, error: 'Calling patients is not available here.' };
    if ('error' in result) {
      setCallAnnouncementToast(`Could not call ${patientName}: ${result.error}`);
      setTimeout(() => setCallAnnouncementToast(null), 6000);
      return;
    }
    setRoom(roomName);
    try { localStorage.setItem('mediclinic.consultRoom', roomName); } catch { /* ignore */ }
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    setActiveConsultationVisitId(visitId);
    const ticket = formatTicket(doctorQueue.find((v) => v.id === visitId)?.ticketNo);
    setCallAnnouncementToast(`Patient called: ${ticket ? `${ticket} ` : ''}${patientName} to ${roomName} (${timeStr})`);
    playCallChime();
    setTimeout(() => setCallAnnouncementToast(null), 4500);
  };

  const renderAllergyBadge = (drugAllergies: string[] = []) => {
    if (drugAllergies.length === 0) return null;
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-none text-2xs font-bold uppercase tracking-wider bg-rose-100 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-300 dark:border-rose-600  font-mono shrink-0">
        <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-200 shrink-0" />
        <span>Allergy: {drugAllergies.join(', ')}</span>
      </span>
    );
  };

  React.useEffect(() => {
    if (doctorTab) {
      setInternalTab(doctorTab);
    }
  }, [doctorTab]);

  const handleTabChange = (tab: 'queue' | 'consultation' | 'reports') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Step 2: Start consultation when patient is attended
  const handleStartConsultation = (visitId: string) => {
    setActiveConsultationVisitId(visitId);
    handleTabChange('consultation');
  };

  // Step 3: Complete consultation and return back to Queue
  const handleDoctorSoapComplete = (soapData: SOAPNotes, issueMc: boolean, mcDuration: number) => {
    onConsultationComplete(soapData, issueMc, mcDuration);
    setActiveConsultationVisitId(null);
    handleTabChange('queue'); // Auto-return back to Queue!
  };

  return (
    <div className="space-y-4 animate-fadeIn relative">
      
      {/* Step 1 Call Announcement Toast */}
      {callAnnouncementToast && (
        <div className="fixed top-20 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-none  border border-teal-500/40 flex items-center justify-center gap-3 animate-bounce-slow">
          <div className="w-8 h-8 rounded-none bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            📢
          </div>
          <div>
            <h4 className="type-card-title text-teal-300">Patient call</h4>
            <p className="text-xs text-slate-200 font-medium">{callAnnouncementToast}</p>
          </div>
        </div>
      )}

      {/* Copy to Clipboard Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-[130] bg-deep text-teal-300 px-4 py-2.5 rounded-none  border border-line flex items-center justify-center gap-2 text-xs font-mono font-bold animate-bounce-slow">
          <Check className="w-4 h-4 text-teal-300" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Healthcare Safety Call Confirmation Modal */}
      {pendingCallVisit && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border-2 border-brand max-w-md w-full p-5 rounded-none shadow-none space-y-4 text-ink">
            <div className="flex items-center gap-3 border-b border-line dark:border-teal-800/60 pb-3">
              <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950 text-accent dark:text-teal-400 border border-line flex items-center justify-center shrink-0 font-bold text-base">
                📢
              </div>
              <div>
                <h3 className="type-card-title">Confirm Patient Call</h3>
                <p className="text-xs text-subtle dark:text-slate-400 font-medium">Healthcare Safety Verification</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-muted dark:text-slate-200 leading-relaxed font-sans">
                Call <strong className="text-ink dark:text-teal-300 font-bold text-sm">{pendingCallVisit.patientName}</strong> (Queue Rank <span className="font-mono font-bold text-accent">#{pendingCallVisit.position}</span>) to {room || 'a consultation room'} now?
              </p>

              <RoomPicker id="call-room" label="Consultation room" value={room} onChange={setRoom} options={roomChoices} onEnter={confirmCallPatient} />

              {pendingCallVisit.assignedTo && (
                <div role="alert" className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 p-2.5 text-amber-800 dark:text-amber-300 text-2xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>This patient is assigned to {pendingCallVisit.assignedTo}. Call them only if that doctor is unavailable.</span>
                </div>
              )}

              {pendingCallVisit.position > 1 && (
                <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 p-2.5 text-amber-800 dark:text-amber-300 text-2xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Out-of-turn call notice: Patient is currently at position #{pendingCallVisit.position} in line.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingCallVisit(null)}
                title="Dismiss call announcement without paging patient"
                className="px-4 py-2 rounded-none text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCallPatient}
                title="Broadcast audio announcement and advance patient to in-consultation"
                className="px-5 py-2 rounded-none text-xs font-bold bg-primary hover:bg-primary-hover text-white cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Call patient now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SEPARATE PAGE: DEDICATED PATIENT WAITING QUEUE PAGE                   */}
      {/* ========================================================================= */}
      {internalTab === 'queue' && (
        <div className="animate-fadeIn w-full space-y-4 pb-8">
          
          {/* 1. SINGLE INTEGRATED HORIZONTAL CLINICAL COMMAND BAR & DOMINANT OPERATIONAL ALERT */}
          {(() => {
            const overSlaCount = doctorQueue.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20).length;
            const highPriorityCount = doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length;
            const maxWaitMinutes = doctorQueue.reduce((max, v) => {
              const mins = v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0;
              return mins > max ? mins : max;
            }, 0);
            const avgWaitMinutes = doctorQueue.length > 0
              ? Math.round(doctorQueue.reduce((acc, v) => acc + (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0), 0) / doctorQueue.length)
              : 0;

            return (
              <div className="space-y-3">
                {/* Screen-reader announcements */}
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                  {nextPatient
                    ? `Next in line: ${nextPatient.fullName}. ${doctorQueue.length} waiting${overSlaCount > 0 ? `, ${overSlaCount} over the 20 minute limit` : ''}.`
                    : 'No patients waiting.'}
                </div>

                {/* Live Triage Command Bar (4 High-Density KPI Tiles) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface p-3.5 border border-line flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-subtle block font-sans">Active Queue</span>
                      <span className="text-xl font-bold font-mono tabular-nums text-ink">{doctorQueue.length}</span>
                      <span className="text-2xs text-muted block mt-0.5">Patients waiting</span>
                    </div>
                    <Users className="w-5 h-5 text-accent opacity-60 shrink-0" />
                  </div>

                  <div className={`bg-surface p-3.5 border border-line ${overSlaCount > 0 ? 'border-l-amber-500' : 'border-l-emerald-600'} flex items-center justify-between`}>
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-subtle block font-sans">Wait Time (Avg / Max)</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-bold font-mono tabular-nums text-ink">{avgWaitMinutes}m</span>
                        <span className={`text-xs font-mono tabular-nums font-semibold ${overSlaCount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-muted'}`}>/ {maxWaitMinutes}m max</span>
                      </div>
                      <span className="text-2xs text-muted block mt-0.5">{overSlaCount > 0 ? `${overSlaCount} over 20m SLA` : 'Within SLA target'}</span>
                    </div>
                    <Clock className={`w-5 h-5 ${overSlaCount > 0 ? 'text-amber-600' : 'text-emerald-600'} opacity-60 shrink-0`} />
                  </div>

                  <div className={`bg-surface p-3.5 border border-line ${highPriorityCount > 0 ? 'border-l-rose-600' : 'border-l-line'} flex items-center justify-between`}>
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-subtle block font-sans">Clinical Acuity</span>
                      <span className={`text-xl font-bold font-mono tabular-nums ${highPriorityCount > 0 ? 'text-rose-600' : 'text-ink'}`}>{highPriorityCount}</span>
                      <span className="text-2xs text-muted block mt-0.5">{highPriorityCount > 0 ? 'Allergy/Priority flags' : 'Standard triage'}</span>
                    </div>
                    <AlertTriangle className={`w-5 h-5 ${highPriorityCount > 0 ? 'text-rose-600' : 'text-muted'} opacity-60 shrink-0`} />
                  </div>

                  <div className="bg-surface p-3.5 border border-line flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-subtle block font-sans">Station Room</span>
                      <span className="text-lg font-bold font-mono tabular-nums text-accent">{room ? `Room ${room}` : 'Station 1'}</span>
                      <span className="text-2xs text-muted block mt-0.5">Live audio paging ready</span>
                    </div>
                    <Volume2 className="w-5 h-5 text-accent opacity-60 shrink-0" />
                  </div>
                </div>

                {/* Dominant Operational Alert Strip if Breaches or High Acuity Patients Exist */}
                {(overSlaCount > 0 || highPriorityCount > 0) && (
                  <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 px-3.5 py-2.5 rounded-none flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Queue Alert:</strong> {overSlaCount > 0 ? `${overSlaCount} patient(s) exceeding SLA wait time (>20m)` : ''}
                        {overSlaCount > 0 && highPriorityCount > 0 ? ' & ' : ''}
                        {highPriorityCount > 0 ? `${highPriorityCount} patient(s) with high acuity / drug allergy flags` : ''}.
                      </span>
                    </div>
                    <span className="text-2xs font-mono uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 font-bold shrink-0">
                      Attention Needed
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. PATIENT QUEUE LIST RENDERING */}
          {doctorQueue.length === 0 ? (
            <div className="bg-surface-accent dark:bg-night-850 rounded-none p-12 border border-line dark:border-teal-800 text-center text-subtle dark:text-slate-400">
              <Users className="w-12 h-12 text-accent dark:text-teal-400 mx-auto mb-3 opacity-60" />
              <span className="text-xs font-bold block text-ink dark:text-teal-300">Your patient queue is currently empty.</span>
              <span className="text-2xs text-subtle dark:text-slate-400 mt-0.5 block">Waiting for triage clinic assistants to register and dispatch new outpatients.</span>
            </div>
          ) : (
            <div className="space-y-5">

              {/* TOOLBAR: SEARCH, FILTER, SORT */}
              <QueueToolbar queueSearchQuery={queueSearchQuery} setQueueSearchQuery={setQueueSearchQuery} setQueuePage={setQueuePage} doctorQueue={doctorQueue} patientsMap={patientsMap} setAcuityFilter={setAcuityFilter} acuityFilter={acuityFilter} setSortRule={setSortRule} sortRule={sortRule} />

              {/* NEXT IN LINE (#1 ONLY ON PAGE 1) */}
              {nextPatient && nextVisit && (() => {
                const heroTriage = getTriageDetails(nextPatient, nextVisit);
                const heroWait = nextVisit.registeredTime ? Math.floor((Date.now() - nextVisit.registeredTime) / 60000) : 0;
                const obj = nextVisit.soap?.objective;
                const stepIndex = activeConsultationVisitId === nextVisit.id ? 2 : calledVisitId === nextVisit.id ? 1 : 0;
                return (
                  <NextPatientCard userId={userId} pinnedVisitIds={pinnedVisitIds} nextVisit={nextVisit} calledTimestampMap={calledTimestampMap} stepIndex={stepIndex} nextPatient={nextPatient} heroTriage={heroTriage} renderAllergyBadge={renderAllergyBadge} activeConsultationVisitId={activeConsultationVisitId} calledVisitId={calledVisitId ?? ''} handleStartConsultation={handleStartConsultation} requestCallPatient={requestCallPatient} toggleDetails={toggleDetails} expandedDetails={expandedDetails} togglePinVisit={togglePinVisit} copyToClipboard={copyToClipboard} obj={obj} heroWait={heroWait} sortRule={sortRule} />
                );
              })()}

              {/* WAITING PATIENTS LIST */}
              <WaitingPatientsList userId={userId} currentPage={currentPage} sortedQueue={sortedQueue} totalPages={totalPages} sortRule={sortRule} remainingQueue={remainingQueue} nextVisit={nextVisit} patientsMap={patientsMap} activeConsultationVisitId={activeConsultationVisitId} expandedDetails={expandedDetails} startIndex={startIndex} pinnedVisitIds={pinnedVisitIds} toggleDetails={toggleDetails} renderAllergyBadge={renderAllergyBadge} togglePinVisit={togglePinVisit} copyToClipboard={copyToClipboard} handleStartConsultation={handleStartConsultation} requestCallPatient={requestCallPatient} entriesPerPage={entriesPerPage} setEntriesPerPage={setEntriesPerPage} setQueuePage={setQueuePage} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEPARATE PAGE: DEDICATED CONSULTATION SUITE PAGE                       */}
      {/* ========================================================================= */}
      {internalTab === 'consultation' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Top Live Queue Telemetry HUD Bar (Visible during active consultation) */}
          {activeConsultationVisitId && (() => {
            const currentActiveVisit = doctorQueue.find((v) => v.id === activeConsultationVisitId);
            const activeRoom = currentActiveVisit?.consultRoom || room;
            // Exclude current in-consultation patient from waiting count and next-in-line
            const waitingInQueue = sortedQueue.filter((v) => v.id !== activeConsultationVisitId);
            const upcomingNextVisit = waitingInQueue[0];
            const upcomingNextPatient = upcomingNextVisit ? patientsMap[upcomingNextVisit.patientId] : undefined;

            return (
              <div className="bg-surface border border-line p-3 flex flex-wrap items-center justify-between gap-3 shadow-none">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-ink">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="uppercase tracking-wider text-2xs text-muted">Consultation Station:</span>
                    <span className="text-accent">{activeRoom}</span>
                  </div>
                  <div className="h-4 w-px bg-line hidden sm:block" />
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted text-2xs uppercase tracking-wider">Queue:</span>
                    <strong className="text-ink tabular-nums">{waitingInQueue.length}</strong>
                    <span className="text-muted">waiting</span>
                    {upcomingNextVisit && upcomingNextPatient ? (
                      <span className="text-2xs text-muted hidden md:inline">
                        · Next: <strong className="text-ink">{upcomingNextPatient.fullName}</strong>
                      </span>
                    ) : (
                      <span className="text-2xs text-muted hidden md:inline">
                        · Next: <strong className="text-slate-400 font-normal">None (Queue Clear)</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQueueRailMode(queueRailMode === 'drawer' ? 'hidden' : 'drawer')}
                    className={`min-h-8 px-3 py-1.5 text-xs font-mono uppercase font-bold tracking-wider border rounded-none cursor-pointer flex items-center gap-1.5 transition-colors ${
                      queueRailMode === 'drawer'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface hover:bg-surface-accent text-accent hover:text-ink border-line'
                    }`}
                    title="Slide out live patient queue roster without squeezing consultation view (Alt+R)"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{queueRailMode === 'drawer' ? 'Close Queue Rail' : `View Queue Rail (${waitingInQueue.length})`}</span>
                  </button>

                <button
                  type="button"
                  onClick={() => setQueueRailMode(queueRailMode === 'docked' ? 'hidden' : 'docked')}
                  className={`min-h-8 px-2.5 py-1.5 text-2xs font-mono uppercase font-bold tracking-wider border rounded-none cursor-pointer flex items-center gap-1 transition-colors ${
                    queueRailMode === 'docked'
                      ? 'bg-surface-accent text-primary border-primary'
                      : 'bg-surface hover:bg-surface-accent text-muted hover:text-ink border-line'
                  }`}
                  title="Toggle docked side-rail beside consultation window"
                >
                  <span>{queueRailMode === 'docked' ? 'Undock Side-Rail' : 'Dock Side-Rail'}</span>
                </button>
              </div>
            </div>
            );
          })()}

          {/* Slide-over Drawer mode when invoked */}
          {activeConsultationVisitId && queueRailMode === 'drawer' && (
            <QueueRail
              room={room}
              roomOptions={roomChoices}
              doctors={doctors}
              myDoctorId={myDoctorId}
              onRoomChange={(r) => { setRoom(r); try { localStorage.setItem('mediclinic.consultRoom', r); } catch { /* ignore */ } }}
              queue={sortedQueue}
              patientsMap={patientsMap}
              userId={userId}
              activeVisitId={activeConsultationVisitId}
              onCall={requestCallPatient}
              isDrawer={true}
              onClose={() => setQueueRailMode('hidden')}
            />
          )}

          {/* Main workspace layout: Side-by-side if docked or on standby; 100% full width when in consultation */}
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            {(!activeConsultationVisitId || queueRailMode === 'docked') && (
              <QueueRail
                room={room}
                roomOptions={roomChoices}
                doctors={doctors}
                myDoctorId={myDoctorId}
                onRoomChange={(r) => { setRoom(r); try { localStorage.setItem('mediclinic.consultRoom', r); } catch { /* ignore */ } }}
                queue={sortedQueue}
                patientsMap={patientsMap}
                userId={userId}
                activeVisitId={activeConsultationVisitId}
                onCall={requestCallPatient}
                onClose={activeConsultationVisitId ? () => setQueueRailMode('hidden') : undefined}
              />
            )}

            <div className="flex-1 min-w-0 w-full space-y-4">
            {activeConsultationVisitId ? (
            <div className="animate-fade-in-up">
              <ConsultationRoom
                currentPatient={patientsMap[doctorQueue.find(v => v.id === activeConsultationVisitId)?.patientId || ''] || null}
                activeVisit={doctorQueue.find(v => v.id === activeConsultationVisitId) || null}
                activeLanguage={activeLanguage}
                onConsultationComplete={handleDoctorSoapComplete}
                onCancel={() => {
                  // Leaving without signing off puts the patient back in the queue for everyone.
                  const id = activeConsultationVisitId;
                  // Draft preserved so doctor can resume consultation seamlessly
                  setActiveConsultationVisitId(null);
                  setInternalTab('queue');
                  if (id && onReleasePatient) void onReleasePatient(id).then((r) => {
                    if ('error' in r) { setCallAnnouncementToast(r.error); setTimeout(() => setCallAnnouncementToast(null), 6000); }
                  });
                }}
              />
            </div>
          ) : (
            <div className="border border-line bg-surface p-6 rounded-none space-y-6">
              {/* Standby Header Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-accent border border-primary text-accent flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="type-section-title text-ink font-bold">Consultation Suite Standby</h3>
                      <span className="chip-brand px-2 py-0.5 text-2xs font-mono font-bold">
                        {room ? (room.toLowerCase().includes('room') ? room : `Room ${room}`) : 'Station Online'}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Ready for next outpatient encounter. Select a patient from the queue rail or call #1 below.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-surface-accent border border-line text-xs font-mono tabular-nums font-bold text-accent px-3 py-1.5">
                    Queue: <strong className="text-ink">{sortedQueue.length}</strong> Waiting
                  </span>
                </div>
              </div>

              {/* Next in Line Callout or Queue Empty */}
              {nextVisit && nextPatient ? (
                <div className="border border-primary bg-surface-strong p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase tracking-wider text-accent bg-surface px-2 py-0.5 border border-line">
                        Next in Line (#1)
                      </span>
                      <span className="font-mono tabular-nums text-sm font-bold text-accent">
                        {formatTicket(nextVisit.ticketNo)}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-muted">
                      Waiting {nextVisit.registeredTime ? Math.floor((Date.now() - nextVisit.registeredTime) / 60000) : 0} min
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-ink flex items-center gap-2">
                        <span>{nextPatient.fullName}</span>
                        <span className="text-xs text-muted font-normal">
                          ({calculatePatientAge(nextPatient.dob).displayAge}, {nextPatient.gender})
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1.5">
                        <span>IC: <strong className="font-mono text-ink">{nextPatient.icNumber ? `${nextPatient.icNumber.slice(0, 6)}-${nextPatient.icNumber.slice(6, 8)}-****` : 'N/A'}</strong></span>
                        <span>·</span>
                        <span>Coverage: <strong className="text-accent">{nextPatient.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : nextPatient.panelEmployer}</strong></span>
                        {nextPatient.drugAllergies && nextPatient.drugAllergies.length > 0 && (
                          <span className="chip-danger px-2 py-0.5 text-2xs font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            ALLERGY: {nextPatient.drugAllergies.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => requestCallPatient(nextVisit.id, nextPatient.fullName, 1)}
                        title="Broadcast audio announcement to call next triage patient into room"
                        className="btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Call Patient {formatTicket(nextVisit.ticketNo)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInternalTab('queue')}
                        title="Switch to dedicated full-width patient waiting queue workspace"
                        className="btn-secondary px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>View Queue</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-line bg-surface-muted p-8 text-center text-muted">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <h4 className="type-card-title text-ink font-bold">Waiting Queue Clear</h4>
                  <p className="text-xs text-muted mt-1">No outpatients are currently awaiting consultation.</p>
                </div>
              )}

              {/* Quick Operation Metrics & Keyboard Help */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-surface p-3.5 border border-line">
                  <span className="text-2xs font-bold uppercase text-subtle block font-sans">Active Queue</span>
                  <span className="text-lg font-mono tabular-nums font-bold text-ink">{sortedQueue.length}</span>
                  <span className="text-2xs text-muted block mt-0.5">Patients in waiting roster</span>
                </div>
                <div className="bg-surface p-3.5 border border-line">
                  <span className="text-2xs font-bold uppercase text-subtle block font-sans">Active Station</span>
                  <span className="text-lg font-mono tabular-nums font-bold text-emerald-600">{room ? (room.toLowerCase().includes('room') ? room : `Room ${room}`) : 'Unassigned'}</span>
                  <span className="text-2xs text-muted block mt-0.5">Live audio broadcast connected</span>
                </div>
                <div className="bg-surface p-3.5 border border-line">
                  <span className="text-2xs font-bold uppercase text-subtle block font-sans">Clinical Shortcuts</span>
                  <span className="text-xs font-mono font-bold text-accent block mt-1">Alt+1..4 Tabs · Ctrl+Enter Sign</span>
                  <span className="text-2xs text-muted block mt-0.5">Session draft autosave enabled</span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      )}

      {/* MONTHLY REPORT: the signed-in doctor's own consultations */}
      {internalTab === 'reports' && <DoctorMonthlyReport />}
    </div>
  );
}
