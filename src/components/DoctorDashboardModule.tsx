import React, { useState } from 'react';
import { Patient, Visit, Language, SOAPNotes } from '../types';
import ConsultationRoom from './ConsultationRoom';
import { 
  Stethoscope, FileText, Calendar, Users, DollarSign, Activity, BrainCircuit, 
  CalendarClock, Clock, ChevronLeft, ChevronRight, Search, Download, Filter, TrendingUp, 
  ShieldCheck, CheckCircle2, BarChart3, CreditCard, Building2, RefreshCw, Volume2, AlertCircle,
  Pin, Copy, Check, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  getChiefComplaintLabel, 
  getRankingRationale, 
  getTriageDetails 
} from '../utils/queueSorter';
import { useQueueFilter } from '../hooks/useQueueFilter';

import LegendSwatch from './ui/LegendSwatch';
import ActionMenu from './ui/ActionMenu';
import { chartTheme } from '../theme/chartTheme';
import { palette, seriesColors } from '../theme/palette';
import QueueToolbar from './doctor/QueueToolbar';
import NextPatientCard from './doctor/NextPatientCard';
import WaitingPatientsList from './doctor/WaitingPatientsList';
import ReportKpiGrid from './doctor/ReportKpiGrid';
import ReportCharts from './doctor/ReportCharts';
import EncountersTable from './doctor/EncountersTable';
interface DoctorDashboardModuleProps {
  doctorQueue: Visit[];
  completedVisits: Visit[];
  patientsMap: Record<string, Patient>;
  activeLanguage: Language;
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  onConsultationComplete: (soapData: SOAPNotes, issueMc: boolean, mcDuration: number) => void;
  doctorName?: string;
  doctorTab?: 'queue' | 'consultation' | 'reports';
  onTabChange?: (tab: 'queue' | 'consultation' | 'reports') => void;
}

export default function DoctorDashboardModule({
  doctorQueue,
  completedVisits,
  patientsMap,
  activeLanguage,
  activeConsultationVisitId,
  setActiveConsultationVisitId,
  onConsultationComplete,
  doctorName = "Dr. Sarah Tan",
  doctorTab = "queue",
  onTabChange
}: DoctorDashboardModuleProps) {
  const [internalTab, setInternalTab] = useState<'queue' | 'consultation' | 'reports'>(doctorTab);
  const [calledVisitId, setCalledVisitId] = useState<string | null>(null);
  const [callAnnouncementToast, setCallAnnouncementToast] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [calledTimestampMap, setCalledTimestampMap] = useState<Record<string, string>>({});
  const [lastSyncedText, setLastSyncedText] = useState<string>('Just now');
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);
  const [pendingCallVisit, setPendingCallVisit] = useState<{ visitId: string; patientName: string; position: number } | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

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
  } = useQueueFilter({ queue: doctorQueue, patientsMap, initialEntriesPerPage: 6 });

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
        handleManualQueueRefresh();
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

  const requestCallPatient = (visitId: string, patientName: string, position: number) => {
    setPendingCallVisit({ visitId, patientName, position });
  };

  const confirmCallPatient = () => {
    if (!pendingCallVisit) return;
    const { visitId, patientName } = pendingCallVisit;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    setCalledVisitId(visitId);
    setCalledTimestampMap(prev => ({ ...prev, [visitId]: `${timeStr} by ${doctorName}` }));
    setActiveConsultationVisitId(visitId);
    setCallAnnouncementToast(`📢 Patient Called: ${patientName} → Consultation Room 1 (${timeStr})`);
    playCallChime();
    setPendingCallVisit(null);
    setTimeout(() => setCallAnnouncementToast(null), 4500);
  };

  const renderAllergyBadge = (drugAllergies: string[] = []) => {
    if (drugAllergies.length === 0) return null;
    return (
      <span className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-none text-2xs font-bold uppercase tracking-wider bg-rose-100 text-rose-950 dark:bg-rose-900/90 dark:text-rose-100 border border-rose-300 dark:border-rose-600 shadow-2xs font-mono shrink-0">
        <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-200 shrink-0" />
        <span>Allergy: {drugAllergies.join(', ')}</span>
      </span>
    );
  };

  // Reports Tab States & Datasets
  const [showSampleReports, setShowSampleReports] = useState<boolean>(completedVisits.length === 0);
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportPaymentFilter, setReportPaymentFilter] = useState<string>('all');
  const [reportMonthHorizon, setReportMonthHorizon] = useState<string>('current');

  const sampleDailyRevenueData = [
    { date: 'Sep 01', patients: 14, fees: 1820 },
    { date: 'Sep 05', patients: 19, fees: 2470 },
    { date: 'Sep 10', patients: 22, fees: 3100 },
    { date: 'Sep 15', patients: 18, fees: 2350 },
    { date: 'Sep 20', patients: 26, fees: 3840 },
    { date: 'Sep 24', patients: 21, fees: 2980 },
  ];

  const samplePaymentMix = [
    { name: 'Corporate Panel', value: 45, color: palette.brand },
    { name: 'Direct Cash/QR', value: 30, color: palette.primary },
    { name: 'Insurance (Medisave)', value: 15, color: seriesColors.tealMid },
    { name: 'Credit Card', value: 10, color: seriesColors.amberDark },
  ];

  const sampleMonthlyEncounters = [
    { id: 'MENC-901', date: '2026-09-24', patientName: 'Ahmad bin Razak', icdCode: 'J06.9 (URTI)', paymentMethod: 'Panel', durationMin: 12, totalFee: 145.00 },
    { id: 'MENC-902', date: '2026-09-24', patientName: 'Siti Nurhaliza', icdCode: 'E11.9 (Type 2 DM)', paymentMethod: 'Cash', durationMin: 18, totalFee: 210.00 },
    { id: 'MENC-903', date: '2026-09-23', patientName: 'Tan Wei Ming', icdCode: 'I10 (Essential HTN)', paymentMethod: 'Panel', durationMin: 15, totalFee: 175.50 },
    { id: 'MENC-904', date: '2026-09-23', patientName: 'Kavitha Subramaniam', icdCode: 'M54.5 (Lumbago/Back Pain)', paymentMethod: 'Insurance', durationMin: 22, totalFee: 320.00 },
    { id: 'MENC-905', date: '2026-09-22', patientName: 'Chong Kok Wai', icdCode: 'K21.9 (GERD)', paymentMethod: 'Credit Card', durationMin: 14, totalFee: 160.00 },
    { id: 'MENC-906', date: '2026-09-21', patientName: 'Nurul Huda', icdCode: 'J45.909 (Asthma)', paymentMethod: 'Panel', durationMin: 16, totalFee: 195.00 },
  ];

  const displayEncounters = (showSampleReports || completedVisits.length === 0)
    ? sampleMonthlyEncounters
    : completedVisits.map((v) => ({
        id: v.id,
        date: v.date,
        patientName: patientsMap[v.patientId]?.fullName || 'Patient #' + v.patientId,
        icdCode: v.soap?.assessment?.icdCode || 'N/A',
        paymentMethod: v.paymentMethod || 'Cash',
        durationMin: 15,
        totalFee: v.totalBill
      }));

  const filteredEncounters = displayEncounters.filter(e => {
    const matchesSearch = e.patientName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          e.icdCode.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          e.id.toLowerCase().includes(reportSearchQuery.toLowerCase());
    const matchesPayment = reportPaymentFilter === 'all' || e.paymentMethod === reportPaymentFilter;
    return matchesSearch && matchesPayment;
  });

  const aggregateFees = filteredEncounters.reduce((acc, curr) => acc + curr.totalFee, 0);
  const aggregatePatients = filteredEncounters.length;
  const avgDuration = aggregatePatients > 0 
    ? Math.round(filteredEncounters.reduce((acc, curr) => acc + curr.durationMin, 0) / aggregatePatients) 
    : 0;

  const handleExportCSV = () => {
    const headers = ['Encounter ID', 'Date', 'Patient Name', 'ICD-10 Diagnostic Code', 'Payment Route', 'Consult Duration (min)', 'Total Fee (RM)'];
    const rows = filteredEncounters.map(e => [
      e.id, e.date, `"${e.patientName}"`, `"${e.icdCode}"`, e.paymentMethod, e.durationMin, e.totalFee.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mediclinic_Doctor_Monthly_Report_${reportMonthHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Step 1: Call patient for consultation
  const handleCallPatient = (visitId: string, patientName: string) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    setCalledVisitId(visitId);
    setCalledTimestampMap(prev => ({ ...prev, [visitId]: timeStr }));
    setActiveConsultationVisitId(visitId);
    setCallAnnouncementToast(`📢 Calling Patient: ${patientName} to Consultation Room 1...`);
    setTimeout(() => setCallAnnouncementToast(null), 4000);
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
    setCalledVisitId(null);
    handleTabChange('queue'); // Auto-return back to Queue!
  };

  return (
    <div className="space-y-4 animate-fadeIn relative">
      
      {/* Step 1 Call Announcement Toast */}
      {callAnnouncementToast && (
        <div className="fixed top-20 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-none shadow-2xl border border-teal-500/40 flex items-center justify-center gap-3 animate-bounce-slow">
          <div className="w-8 h-8 rounded-none bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            📢
          </div>
          <div>
            <h4 className="type-card-title text-teal-300">Public PA Call System</h4>
            <p className="text-xs text-slate-200 font-medium">{callAnnouncementToast}</p>
          </div>
        </div>
      )}

      {/* Copy to Clipboard Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-[130] bg-deep text-teal-300 px-4 py-2.5 rounded-none shadow-xl border border-line flex items-center justify-center gap-2 text-xs font-mono font-bold animate-bounce-slow">
          <Check className="w-4 h-4 text-teal-300" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Healthcare Safety Call Confirmation Modal */}
      {pendingCallVisit && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-night-900 border-2 border-brand max-w-md w-full p-5 rounded-none shadow-2xl space-y-4 text-ink dark:text-white">
            <div className="flex items-center gap-3 border-b border-line dark:border-teal-800/60 pb-3">
              <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950 text-accent dark:text-teal-400 border border-line flex items-center justify-center shrink-0 font-bold text-base">
                📢
              </div>
              <div>
                <h3 className="type-card-title">Confirm Patient Call</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Healthcare Safety Verification</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                Broadcast public PA announcement and call <strong className="text-ink dark:text-teal-300 font-bold text-sm">{pendingCallVisit.patientName}</strong> (Queue Rank <span className="font-mono font-bold text-accent">#{pendingCallVisit.position}</span>) to Consultation Room 1 now?
              </p>

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
                className="px-4 py-2 rounded-none text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCallPatient}
                className="px-5 py-2 rounded-none text-xs font-bold bg-primary hover:bg-primary-hover text-white cursor-pointer shadow-md flex items-center justify-center gap-1.5"
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

            return (
              <div className="space-y-2">
                {/* Screen-reader announcements: the region stays mounted so changes are read out */}
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                  {nextPatient
                    ? `Next in line: ${nextPatient.fullName}. ${doctorQueue.length} waiting${overSlaCount > 0 ? `, ${overSlaCount} over the 20 minute limit` : ''}.`
                    : 'No patients waiting.'}
                </div>
                {/* Dominant Operational Alert Strip if Breaches or High Acuity Patients Exist */}
                {(overSlaCount > 0 || highPriorityCount > 0) && (
                  <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 px-3.5 py-2 rounded-none flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-2xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Operational Alert:</strong> {overSlaCount > 0 ? `${overSlaCount} patient(s) exceeding SLA wait time (>20m)` : ''}
                        {overSlaCount > 0 && highPriorityCount > 0 ? ' & ' : ''}
                        {highPriorityCount > 0 ? `${highPriorityCount} high acuity/allergy patient(s) requiring immediate attention` : ''}.
                      </span>
                    </div>
                    <span className="text-2xs font-mono uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 font-bold shrink-0">
                      Action Required
                    </span>
                  </div>
                )}

                <div className="bg-surface-accent dark:bg-night-850 text-ink dark:text-slate-100 p-3 px-4 rounded-none shadow-2xs border border-line dark:border-teal-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Left: Section Title & Live Telemetry Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-teal-50 dark:bg-teal-950/60 border border-line dark:border-teal-800 text-accent dark:text-teal-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="type-page-title text-ink dark:text-teal-300">
                          Doctor Consultation Queue
                        </h1>
                        <span className="inline-flex items-center justify-center gap-1 text-2xs text-accent dark:text-teal-400 bg-white/80 dark:bg-night-950 px-2 py-0.5 rounded-none border border-line dark:border-teal-800 font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Live
                        </span>
                      </div>
                      <p className="text-2xs text-slate-600 dark:text-slate-300 font-medium">
                        Triaged outpatient waiting list telemetry
                      </p>
                    </div>
                  </div>

                  {/* Center/Right: longest wait (counts live in the filter chips below) + refresh */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                      {/* Stat 4: Max Wait */}
                      <div className="bg-white dark:bg-night-950 text-sky-700 dark:text-sky-300 px-2.5 py-1.5 rounded-none border border-sky-200/80 dark:border-sky-900/40 border-l-2 border-l-sky-400 flex items-center justify-center gap-2 shadow-2xs">
                        <span className="text-2xs font-sans font-bold uppercase text-slate-500 dark:text-slate-400">Max Wait:</span>
                        <strong className="font-bold text-sm text-ink dark:text-teal-300">{maxWaitMinutes}m</strong>
                        <span className="text-2xs bg-sky-50/70 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-1 py-0.2 rounded-none font-sans font-bold border border-sky-200 dark:border-sky-800/60">Peak</span>
                      </div>
                    </div>

                    {/* Refresh Action Button */}
                    <button
                      type="button"
                      onClick={handleManualQueueRefresh}
                      disabled={isRefreshingQueue}
                      className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshingQueue ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingQueue ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. PATIENT QUEUE LIST RENDERING */}
          {doctorQueue.length === 0 ? (
            <div className="bg-surface-accent dark:bg-night-850 rounded-none p-12 border border-line dark:border-teal-800 text-center text-slate-500 dark:text-slate-400">
              <Users className="w-12 h-12 text-accent dark:text-teal-400 mx-auto mb-3 opacity-60" />
              <span className="text-xs font-bold block text-ink dark:text-teal-300">Your patient queue is currently empty.</span>
              <span className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 block">Waiting for triage clinic assistants to register and dispatch new outpatients.</span>
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
                  <NextPatientCard pinnedVisitIds={pinnedVisitIds} nextVisit={nextVisit} calledTimestampMap={calledTimestampMap} stepIndex={stepIndex} nextPatient={nextPatient} heroTriage={heroTriage} renderAllergyBadge={renderAllergyBadge} activeConsultationVisitId={activeConsultationVisitId} calledVisitId={calledVisitId} handleStartConsultation={handleStartConsultation} requestCallPatient={requestCallPatient} toggleDetails={toggleDetails} expandedDetails={expandedDetails} togglePinVisit={togglePinVisit} copyToClipboard={copyToClipboard} obj={obj} heroWait={heroWait} sortRule={sortRule} />
                );
              })()}

              {/* WAITING PATIENTS LIST */}
              <WaitingPatientsList currentPage={currentPage} sortedQueue={sortedQueue} totalPages={totalPages} sortRule={sortRule} remainingQueue={remainingQueue} nextVisit={nextVisit} patientsMap={patientsMap} activeConsultationVisitId={activeConsultationVisitId} expandedDetails={expandedDetails} startIndex={startIndex} pinnedVisitIds={pinnedVisitIds} toggleDetails={toggleDetails} renderAllergyBadge={renderAllergyBadge} togglePinVisit={togglePinVisit} copyToClipboard={copyToClipboard} handleStartConsultation={handleStartConsultation} requestCallPatient={requestCallPatient} entriesPerPage={entriesPerPage} setEntriesPerPage={setEntriesPerPage} setQueuePage={setQueuePage} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEPARATE PAGE: DEDICATED CONSULTATION SUITE PAGE                       */}
      {/* ========================================================================= */}
      {internalTab === 'consultation' && (
        <div className="space-y-4 animate-fadeIn">
          {activeConsultationVisitId ? (
            <div className="animate-fade-in-up">
              <ConsultationRoom
                currentPatient={patientsMap[doctorQueue.find(v => v.id === activeConsultationVisitId)?.patientId || ''] || null}
                activeVisit={doctorQueue.find(v => v.id === activeConsultationVisitId) || null}
                activeLanguage={activeLanguage}
                onConsultationComplete={handleDoctorSoapComplete}
                onCancel={() => {
                  setActiveConsultationVisitId(null);
                  setCalledVisitId(null);
                  setInternalTab('queue');
                }}
              />
            </div>
          ) : (
            <div className="enterprise-card border-dashed p-16 text-center text-slate-400 mt-2 flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-teal-100">
                <Stethoscope className="w-10 h-10 text-accent" />
              </div>
              <h4 className="type-section-title text-slate-800">No Active Patient Selected</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                Please choose an outpatient from your active patient queue to start SOAP clinical diagnosis, vitals examination, and prescription writing.
              </p>
              <button
                type="button"
                onClick={() => setInternalTab('queue')}
                className="mt-5 px-5 py-2 rounded-none text-xs font-bold bg-primary hover:bg-teal-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Go to Patient Waiting Queue</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY REPORTS & ANALYTICS VIEW */}
      {internalTab === 'reports' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header & Controls Toolbar */}
          <div className="bg-surface-muted dark:bg-night-850 border border-line-subtle dark:border-teal-800/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent dark:text-teal-300" />
                  Doctor Monthly Clinical &amp; Revenue Performance
                </h2>
                {showSampleReports && (
                  <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 text-2xs font-bold font-mono uppercase tracking-wider border border-amber-300 dark:border-amber-800 rounded-none">
                    Interactive Telemetry Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Comprehensive consultation metrics, ICD-10 diagnostic volume, panel billing breakdown, and export options.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSampleReports(!showSampleReports)}
                className={`px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border flex items-center gap-1.5 transition-colors rounded-none cursor-pointer ${
                  showSampleReports
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                    : 'bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border-line dark:border-teal-800/40'
                }`}
                title="Toggle between real live consultation data and simulated month telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>{showSampleReports ? 'Showing Sample Data' : 'Showing Live Data'}</span>
              </button>

              <select
                value={reportMonthHorizon}
                onChange={(e) => setReportMonthHorizon(e.target.value)}
                className="bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 text-ink dark:text-teal-100 text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand rounded-none cursor-pointer"
              >
                <option value="current">September 2026 (Current)</option>
                <option value="last_month">August 2026</option>
                <option value="q3_2026">Q3 2026 Cumulative</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-xs rounded-none cursor-pointer focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metrics Grid */}
          <ReportKpiGrid aggregatePatients={aggregatePatients} aggregateFees={aggregateFees} avgDuration={avgDuration} />

          {/* Interactive Recharts Analytics Section */}
          <ReportCharts sampleDailyRevenueData={sampleDailyRevenueData} samplePaymentMix={samplePaymentMix} />

          {/* Interactive Encounters Table with Search & Filter */}
          <EncountersTable filteredEncounters={filteredEncounters} reportSearchQuery={reportSearchQuery} setReportSearchQuery={setReportSearchQuery} reportPaymentFilter={reportPaymentFilter} setReportPaymentFilter={setReportPaymentFilter} displayEncounters={displayEncounters} aggregateFees={aggregateFees} />
        </div>
      )}
    </div>
  );
}
