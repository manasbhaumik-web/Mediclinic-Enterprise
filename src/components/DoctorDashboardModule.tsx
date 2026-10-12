import React, { useState } from 'react';
import { Patient, Visit, Language } from '../types';
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
import { chartTheme } from '../theme/chartTheme';
import { palette, seriesColors } from '../theme/palette';
interface DoctorDashboardModuleProps {
  doctorQueue: Visit[];
  completedVisits: Visit[];
  patientsMap: Record<string, Patient>;
  activeLanguage: Language;
  activeConsultationVisitId: string | null;
  setActiveConsultationVisitId: (id: string | null) => void;
  onConsultationComplete: (soapData: any, issueMc: boolean, mcDuration: number) => void;
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
  const handleDoctorSoapComplete = (soapData: any, issueMc: boolean, mcDuration: number) => {
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
                  <span>Out-of-turn call notice: Patient is currently ranked #{pendingCallVisit.position} in line.</span>
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

                  {/* Center/Right: 4 Telemetry Stat Badges Bar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                      {/* Stat 1: Waiting */}
                      <div className="bg-white dark:bg-night-950 text-ink dark:text-teal-300 px-2.5 py-1.5 rounded-none border border-line dark:border-teal-800 border-l-2 border-l-brand flex items-center justify-center gap-2 shadow-2xs">
                        <span className="text-2xs font-sans font-bold uppercase text-slate-500 dark:text-slate-400">Waiting:</span>
                        <strong className="font-bold text-sm text-accent dark:text-teal-400">{doctorQueue.length}</strong>
                        <span className="text-2xs bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-1 py-0.2 rounded-none font-sans font-bold border border-teal-200 dark:border-teal-800/60">Active</span>
                      </div>

                      {/* Stat 2: High Priority */}
                      <div className="bg-white dark:bg-night-950 text-rose-700 dark:text-rose-300 px-2.5 py-1.5 rounded-none border border-rose-200/80 dark:border-rose-900/40 border-l-2 border-l-rose-400 flex items-center justify-center gap-2 shadow-2xs">
                        <span className="text-2xs font-sans font-bold uppercase text-slate-500 dark:text-slate-400">Allergy/High:</span>
                        <strong className="font-bold text-sm text-rose-600 dark:text-rose-400">{highPriorityCount}</strong>
                        <span className="text-2xs bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-1 py-0.2 rounded-none font-sans font-bold border border-rose-200 dark:border-rose-800/60">Acuity</span>
                      </div>

                      {/* Stat 3: Over SLA */}
                      <div className="bg-white dark:bg-night-950 text-amber-700 dark:text-amber-300 px-2.5 py-1.5 rounded-none border border-amber-200/80 dark:border-amber-900/40 border-l-2 border-l-amber-400 flex items-center justify-center gap-2 shadow-2xs">
                        <span className="text-2xs font-sans font-bold uppercase text-slate-500 dark:text-slate-400">&gt;20m SLA:</span>
                        <strong className="font-bold text-sm text-amber-600 dark:text-amber-400">{overSlaCount}</strong>
                        <span className="text-2xs bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1 py-0.2 rounded-none font-sans font-bold border border-amber-200 dark:border-amber-800/60">Risk</span>
                      </div>

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
              <div className="bg-surface border border-line-subtle p-4 flex flex-wrap items-center gap-x-7 gap-y-4">
                <div className="relative flex-1 basis-72 min-w-60">
                  <label htmlFor="queue-search-input" className="sr-only">Search the queue</label>
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="queue-search-input"
                    type="text"
                    value={queueSearchQuery}
                    onChange={(e) => { setQueueSearchQuery(e.target.value); setQueuePage(1); }}
                    placeholder="Search by patient name, IC/ID or complaint (Alt+F)"
                    className="w-full h-11 bg-surface text-ink text-sm pl-10 pr-9 border border-line focus:outline-none focus:border-brand placeholder:text-slate-500"
                  />
                  {queueSearchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => { setQueueSearchQuery(''); setQueuePage(1); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 text-slate-500 hover:text-ink text-base font-bold flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Show</span>
                  {([
                    { id: 'all', label: 'All', count: doctorQueue.length, warn: false },
                    { id: 'high', label: 'High acuity', count: doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length, warn: false },
                    { id: 'sla', label: 'Over 20 min', count: doctorQueue.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20).length, warn: true },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setAcuityFilter(f.id); setQueuePage(1); }}
                      className={`h-10 px-3.5 text-sm font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                        acuityFilter === f.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink border-line hover:bg-surface-accent'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-xs font-bold px-1.5 ${
                        acuityFilter === f.id
                          ? 'bg-white/20 text-white'
                          : f.warn ? 'bg-amber-100 text-amber-900' : 'bg-surface-accent text-ink'
                      }`}>{f.count}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Sort by</span>
                  <div className="flex border border-line bg-surface">
                    {(['urgency', 'wait', 'arrival'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setSortRule(r); setQueuePage(1); }}
                        className={`h-10 px-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                          sortRule === r ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface-accent'
                        }`}
                      >
                        {r === 'urgency' ? 'Urgency' : r === 'wait' ? 'Longest wait' : 'Arrival'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* NEXT IN LINE (#1 ONLY ON PAGE 1) */}
              {nextPatient && nextVisit && (() => {
                const heroTriage = getTriageDetails(nextPatient, nextVisit);
                const heroWait = nextVisit.registeredTime ? Math.floor((Date.now() - nextVisit.registeredTime) / 60000) : 0;
                const obj = nextVisit.soap?.objective;
                const stepIndex = activeConsultationVisitId === nextVisit.id ? 2 : calledVisitId === nextVisit.id ? 1 : 0;
                return (
                  <section aria-label="Next patient in line" className="bg-surface border border-line shadow-2xs">
                    <div className="bg-surface-accent border-b border-line-subtle px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5">Next in line</span>
                        {pinnedVisitIds[nextVisit.id] && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase px-2.5 py-1 flex items-center gap-1.5">
                            <Pin className="w-3 h-3 shrink-0" />
                            <span>Pinned priority</span>
                          </span>
                        )}
                        {calledTimestampMap[nextVisit.id] && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1">
                            Called at {calledTimestampMap[nextVisit.id]}
                          </span>
                        )}
                      </div>

                      <ol className="flex items-center gap-2.5 text-sm font-semibold">
                        {['Ready', 'Called', 'In consultation'].map((label, i) => (
                          <React.Fragment key={label}>
                            {i > 0 && <li aria-hidden="true" className="w-7 h-0.5 bg-line" />}
                            <li className={`flex items-center gap-2 ${i === stepIndex ? 'text-accent' : 'text-slate-600'}`} aria-current={i === stepIndex ? 'step' : undefined}>
                              <span className={`w-[22px] h-[22px] rounded-full text-xs font-bold flex items-center justify-center ${
                                i === stepIndex ? 'bg-primary text-white' : i < stepIndex ? 'bg-surface-strong text-accent' : 'border-2 border-line text-slate-600'
                              }`}>{i + 1}</span>
                              {label}
                            </li>
                          </React.Fragment>
                        ))}
                      </ol>
                    </div>

                    <div className="p-6 flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
                      <div className="flex-1 basis-[34rem] min-w-0 space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="text-2xl font-bold text-ink leading-tight">{nextPatient.fullName}</h3>
                          <p className="text-sm text-slate-600">ID {nextPatient.id} · {nextPatient.gender} · Born {nextPatient.dob}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 flex items-center gap-1.5 ${heroTriage.badgeBg}`}>
                            <heroTriage.icon className={`w-3.5 h-3.5 ${heroTriage.iconColor}`} />
                            <span>Triage: {heroTriage.level}</span>
                          </span>
                          {renderAllergyBadge(nextPatient.drugAllergies)}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
                          <div className="bg-surface-muted border border-line-subtle px-3.5 py-3 col-span-2 min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Chief complaint</div>
                            <div className="mt-1 text-base font-semibold text-ink">{getChiefComplaintLabel(nextVisit.soap?.subjective)}</div>
                          </div>
                          <div className={`px-3.5 py-3 border ${heroWait >= 20 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-surface-muted border-line-subtle text-ink'}`}>
                            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Waiting</div>
                            <div className="mt-1 text-base font-bold">{heroWait} min</div>
                          </div>
                          {obj && obj.temperature > 0 && (
                            <>
                              <div className="bg-surface-muted border border-line-subtle px-3.5 py-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Blood pressure</div>
                                <div className="mt-1 text-base font-semibold text-ink">{obj.bpSystolic}/{obj.bpDiastolic} <span className="text-xs font-medium text-slate-600">mmHg</span></div>
                              </div>
                              <div className={`px-3.5 py-3 border ${obj.temperature >= 37.5 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-surface-muted border-line-subtle text-ink'}`}>
                                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Temperature</div>
                                <div className="mt-1 text-base font-bold">{obj.temperature}°C</div>
                              </div>
                              <div className="bg-surface-muted border border-line-subtle px-3.5 py-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">Heart rate</div>
                                <div className="mt-1 text-base font-semibold text-ink">{obj.heartRate} <span className="text-xs font-medium text-slate-600">bpm</span></div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="bg-surface-accent px-3.5 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-accent">Why ranked first</span>
                          <span className="text-sm text-ink">{getRankingRationale(nextPatient, nextVisit, 0, sortRule)}</span>
                        </div>
                      </div>

                      <div className="flex-none basis-60 flex flex-col gap-2.5">
                        {activeConsultationVisitId === nextVisit.id || calledVisitId === nextVisit.id ? (
                          <button
                            type="button"
                            onClick={() => handleStartConsultation(nextVisit.id)}
                            className="h-[52px] bg-primary hover:bg-primary-hover text-white text-base font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          >
                            <Stethoscope className="w-[18px] h-[18px]" />
                            <span>Move to consultation</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestCallPatient(nextVisit.id, nextPatient.fullName, 1)}
                            className="h-[52px] bg-primary hover:bg-primary-hover text-white text-base font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          >
                            <Volume2 className="w-[18px] h-[18px]" />
                            <span>Call patient</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleDetails(nextVisit.id)}
                          className="h-11 bg-surface text-accent border border-primary text-sm font-semibold hover:bg-surface-accent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                        >
                          {expandedDetails[nextVisit.id] ? 'Hide details' : 'View details'}
                        </button>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => togglePinVisit(nextVisit.id, e)}
                            title="Toggle pin priority"
                            className={`flex-1 h-11 border text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                              pinnedVisitIds[nextVisit.id]
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-surface text-ink border-line hover:bg-surface-accent'
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                            <span>{pinnedVisitIds[nextVisit.id] ? 'Pinned' : 'Pin'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(nextPatient.id, 'Patient ID', e)}
                            title="Copy patient ID"
                            className="flex-1 h-11 bg-surface text-ink border border-line text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-accent transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy ID</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedDetails[nextVisit.id] && (
                      <div className="border-t border-line-subtle bg-surface-muted px-6 py-4 text-sm text-ink space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full clinical subjective note</strong>
                            <p className="leading-relaxed">{nextVisit.soap?.subjective || 'No additional history provided.'}</p>
                          </div>
                          <div>
                            <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Panel employer / coverage</strong>
                            <p className="font-semibold text-accent">{nextPatient.panelEmployer}</p>
                          </div>
                          <div>
                            <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Address &amp; contact</strong>
                            <p>{nextPatient.phone} · {nextPatient.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-line-subtle flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleStartConsultation(nextVisit.id)}
                            className="h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>Start clinical diagnosis</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(`${nextPatient.fullName} (${nextPatient.id})`, 'Patient Details', e)}
                            className="h-10 px-4 bg-surface text-ink border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-accent cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy full record</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* WAITING PATIENTS LIST */}
              <section aria-label="Waiting patients" className="bg-surface border border-line-subtle">
                <div className="px-5 py-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line-subtle">
                  <h4 className="text-base font-bold text-ink">
                    {currentPage === 1 ? 'Waiting after the next patient' : 'Patient queue list'}
                  </h4>
                  <span className="text-sm text-slate-600">
                    {sortedQueue.length} total · Page {currentPage} of {totalPages}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <div className="md:min-w-[960px]">
                    <div className="hidden md:grid grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_96px_208px] gap-4 items-center px-5 py-2.5 bg-surface-muted border-b border-line-subtle text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <span>Rank</span>
                      <span>Patient</span>
                      <span>Complaint</span>
                      <span>Why this position</span>
                      <span>Waiting</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {remainingQueue.length === 0 && (
                      <div className="px-5 py-10 text-center text-sm text-slate-600">
                        {nextVisit ? 'No other patients are waiting.' : 'No patients match this filter.'}
                      </div>
                    )}

                    {remainingQueue.map((visit, index) => {
                      const pt = patientsMap[visit.patientId];
                      if (!pt) return null;
                      const isConsulting = activeConsultationVisitId === visit.id;
                      const isExpanded = expandedDetails[visit.id];
                      const globalRankIndex = currentPage === 1 ? index + 1 : startIndex + index;
                      const queuePosition = globalRankIndex + 1;
                      const triage = getTriageDetails(pt, visit);
                      const waitMins = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
                      const isPinned = pinnedVisitIds[visit.id];
                      const overSla = waitMins >= 20;
                      const rankTint = triage.level === 'High'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : triage.level === 'Medium'
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-surface-accent text-ink border-line-subtle';

                      return (
                        <div
                          key={visit.id}
                          className={`border-b border-line-subtle transition-colors ${
                            isConsulting ? 'bg-surface-accent' : isPinned ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-muted'
                          }`}
                        >
                          <div
                            tabIndex={0}
                            onClick={() => toggleDetails(visit.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetails(visit.id); } }}
                            className="grid grid-cols-1 md:grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_96px_208px] gap-3 md:gap-4 items-center px-5 py-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                          >
                            <span className={`w-10 h-10 border text-sm font-bold flex items-center justify-center ${rankTint}`}>
                              #{queuePosition}
                            </span>

                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                                <h4 className="text-sm font-semibold text-ink">{pt.fullName}</h4>
                                <span className="text-xs text-slate-600">ID {pt.id}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {isPinned && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-bold uppercase px-2 py-0.5">Pinned</span>
                                )}
                                <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-0.5 ${triage.badgeBg}`}>
                                  {triage.level}
                                </span>
                                {renderAllergyBadge(pt.drugAllergies)}
                              </div>
                            </div>

                            <span className="text-sm font-medium text-accent min-w-0">
                              {getChiefComplaintLabel(visit.soap?.subjective)}
                            </span>

                            <span className="text-xs leading-snug text-slate-600 min-w-0">
                              {getRankingRationale(pt, visit, globalRankIndex, sortRule)}
                            </span>

                            <div className="flex flex-col items-start gap-1">
                              <span className={`text-sm font-bold px-2.5 py-1 border ${
                                overSla ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-surface-accent text-ink border-line-subtle'
                              }`}>
                                {waitMins} min
                              </span>
                              {overSla && <span className="text-2xs font-semibold text-amber-900">Over SLA</span>}
                            </div>

                            <div className="flex items-center gap-2 md:justify-end" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => togglePinVisit(visit.id, e)}
                                aria-label={isPinned ? 'Unpin patient' : 'Pin patient'}
                                title={isPinned ? 'Unpin' : 'Pin priority'}
                                className={`w-11 h-11 border flex items-center justify-center transition-colors cursor-pointer ${
                                  isPinned ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-surface text-ink border-line hover:bg-surface-accent'
                                }`}
                              >
                                <Pin className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => copyToClipboard(pt.id, 'Patient ID', e)}
                                aria-label="Copy patient ID"
                                title="Copy patient ID"
                                className="w-11 h-11 bg-surface text-ink border border-line flex items-center justify-center hover:bg-surface-accent transition-colors cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {isConsulting ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartConsultation(visit.id)}
                                  className="h-11 px-4 bg-deep text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                                >
                                  <Stethoscope className="w-4 h-4" />
                                  <span>Resume</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => requestCallPatient(visit.id, pt.fullName, queuePosition)}
                                  className="h-11 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                                >
                                  Call patient
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mx-5 mb-4 border border-line-subtle bg-surface-muted p-4 text-sm text-ink space-y-3 animate-fadeIn">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full reason / symptoms</strong>
                                  <p className="leading-relaxed">{visit.soap?.subjective || 'General Medical Consultation'}</p>
                                </div>
                                <div>
                                  <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Panel employer</strong>
                                  <p className="font-semibold text-accent">{pt.panelEmployer}</p>
                                </div>
                                <div>
                                  <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Demographics &amp; contact</strong>
                                  <p>{pt.gender}, {pt.dob} · {pt.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-3 border-t border-line-subtle flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleStartConsultation(visit.id)}
                                  className="h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <Stethoscope className="w-4 h-4" />
                                  <span>Direct consultation draft</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => copyToClipboard(`${pt.fullName} (${pt.id})`, 'Patient Details', e)}
                                  className="h-10 px-4 bg-surface text-ink border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-accent cursor-pointer"
                                >
                                  <Copy className="w-4 h-4" />
                                  <span>Copy record</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FOOTER: SHORTCUTS, PAGE SIZE, PAGINATION */}
                <div className="bg-surface-muted px-5 py-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      Showing {sortedQueue.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + entriesPerPage, sortedQueue.length)} of {sortedQueue.length}
                    </span>
                    <span className="hidden lg:inline text-slate-400">|</span>
                    <span className="hidden lg:flex items-center gap-2">
                      <span className="font-semibold">Shortcuts</span>
                      {[['Alt+Q', 'Queue'], ['Alt+C', 'Consult'], ['Alt+F', 'Search'], ['Alt+R', 'Refresh']].map(([key, label]) => (
                        <span key={key} className="border border-line bg-surface px-2 py-0.5 text-ink">
                          <kbd className="font-sans font-semibold">{key}</kbd> {label}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label className="flex items-center gap-2">
                      <span className="font-semibold">Per page</span>
                      <select
                        value={entriesPerPage}
                        onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setQueuePage(1); }}
                        className="h-10 bg-surface text-ink border border-line px-2 text-sm focus:outline-none focus:border-brand cursor-pointer"
                      >
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setQueuePage(prev => Math.max(1, prev - 1))}
                      className={`h-10 px-3.5 text-sm font-semibold border flex items-center gap-1 transition-colors ${
                        currentPage === 1
                          ? 'bg-surface text-slate-400 border-line-subtle cursor-not-allowed'
                          : 'bg-surface text-ink border-line hover:bg-surface-accent cursor-pointer'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        aria-current={pageNum === currentPage ? 'page' : undefined}
                        onClick={() => setQueuePage(pageNum)}
                        className={`w-10 h-10 text-sm font-semibold border flex items-center justify-center transition-colors cursor-pointer ${
                          pageNum === currentPage
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink border-line hover:bg-surface-accent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setQueuePage(prev => Math.min(totalPages, prev + 1))}
                      className={`h-10 px-3.5 text-sm font-semibold border flex items-center gap-1 transition-colors ${
                        currentPage === totalPages
                          ? 'bg-surface text-slate-400 border-line-subtle cursor-not-allowed'
                          : 'bg-surface text-ink border-line hover:bg-surface-accent cursor-pointer'
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Total Encounters</span>
                <div className="flex items-baseline gap-2">
                  <span className="type-metric text-ink dark:text-white">{aggregatePatients}</span>
                  <span className="text-2xs font-bold text-accent dark:text-teal-300 flex items-center gap-0.5 font-mono">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                </div>
                <span className="text-2xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Completed consultations</span>
              </div>
              <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Gross Billing (RM)</span>
                <div className="flex items-baseline gap-2">
                  <span className="type-metric text-ink dark:text-white">RM {aggregateFees.toFixed(2)}</span>
                </div>
                <span className="text-2xs text-accent dark:text-teal-300 font-bold font-mono block mt-0.5">Avg RM {(aggregatePatients > 0 ? aggregateFees / aggregatePatients : 0).toFixed(2)} / visit</span>
              </div>
              <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Avg Consult Time</span>
                <div className="flex items-baseline gap-2">
                  <span className="type-metric text-ink dark:text-white">{avgDuration} min</span>
                </div>
                <span className="text-2xs text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Target: 15.0 mins/pt</span>
              </div>
              <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-2xs text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Top Diagnostic (ICD-10)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-ink dark:text-white truncate max-w-[130px]" title="J06.9 Acute Upper Respiratory">
                    J06.9 (URTI)
                  </span>
                </div>
                <span className="text-2xs text-accent dark:text-teal-300 font-bold font-mono block mt-0.5">38% of monthly visits</span>
              </div>
              <div className="w-10 h-10 bg-surface-accent dark:bg-night-850 flex items-center justify-center text-accent dark:text-teal-300 rounded-none border border-line dark:border-teal-800/40">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Recharts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area Chart: Daily Velocity */}
            <div className="lg:col-span-2 bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    Daily Encounter Velocity &amp; Revenue Growth
                  </h3>
                  <p className="text-2xs text-slate-600 dark:text-slate-400 font-medium">
                    Patient volume vs gross financial yield throughout September 2026.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold font-mono">
                  <span className="flex items-center gap-1.5 text-accent dark:text-teal-300">
                    <span className="w-3 h-3 bg-primary inline-block rounded-none"></span> Revenue (RM)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleDailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={palette.brand} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={palette.brand} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.6} />
                    <XAxis dataKey="date" tick={chartTheme.tick} axisLine={{ stroke: palette.line }} />
                    <YAxis tick={chartTheme.tick} axisLine={{ stroke: palette.line }} />
                    <Tooltip
                      contentStyle={chartTheme.tooltip}
                      formatter={(value: any) => [`RM ${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="fees" stroke={palette.brand} strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Payment Route Distribution */}
            <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 p-5 rounded-none space-y-4 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="type-card-title text-ink dark:text-teal-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  Corporate Panel &amp; Payment Mix
                </h3>
                <p className="text-2xs text-slate-600 dark:text-slate-400 font-medium">
                  Distribution of patient settlement routes.
                </p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={samplePaymentMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {samplePaymentMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-line-subtle dark:border-teal-800/40">
                {samplePaymentMix.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <LegendSwatch color={item.color} size="sm" />
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-ink dark:text-teal-300">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Encounters Table with Search & Filter */}
          <div className="bg-surface dark:bg-night-900 border border-line-subtle dark:border-teal-800/40 rounded-none overflow-hidden space-y-0 shadow-xs">
            {/* Filter Bar */}
            <div className="p-4 bg-surface-muted dark:bg-night-850 border-b border-line-subtle dark:border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <h3 className="type-card-title text-ink dark:text-teal-300">Detailed Encounter &amp; Fee Ledger</h3>
                <span className="text-xs font-mono bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border border-line dark:border-teal-800/40 px-2 py-0.5 rounded-none font-bold">
                  {filteredEncounters.length} Record{filteredEncounters.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-accent" />
                  <input
                    type="text"
                    placeholder="Search patient, ICD code..."
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 text-xs font-bold text-ink dark:text-teal-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand w-48 sm:w-56 rounded-none"
                  />
                </div>

                {/* Payment Method Filter */}
                <div className="flex items-center justify-center gap-1.5 bg-surface dark:bg-night-900 border border-line dark:border-teal-800/40 px-2.5 py-1.5 rounded-none">
                  <Filter className="w-3.5 h-3.5 text-accent" />
                  <select
                    value={reportPaymentFilter}
                    onChange={(e) => setReportPaymentFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-ink dark:text-teal-100 focus:outline-none rounded-none cursor-pointer"
                  >
                    <option value="all">All Payment Routes</option>
                    <option value="Panel">Corporate Panel</option>
                    <option value="Cash">Direct Cash/QR</option>
                    <option value="Insurance">Insurance (Medisave)</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-accent dark:bg-night-850 text-accent dark:text-teal-300 border-b border-line dark:border-teal-800/40 uppercase tracking-wider font-bold font-mono">
                    <th className="px-4 py-3">Encounter ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">ICD-10 Diagnostic Code</th>
                    <th className="px-4 py-3">Payment Route</th>
                    <th className="px-4 py-3 text-center">Consult Time</th>
                    <th className="px-4 py-3 text-right">Total Fee (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-accent dark:divide-teal-800/30">
                  {filteredEncounters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 italic">
                        No encounter records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEncounters.map((visit) => (
                      <tr key={visit.id} className="hover:bg-surface-muted dark:hover:bg-night-850/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-accent dark:text-teal-300">{visit.id}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-medium">{visit.date}</td>
                        <td className="px-4 py-3 font-bold text-ink dark:text-white">
                          {visit.patientName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-surface-muted dark:bg-night-850 text-accent dark:text-teal-300 px-2 py-0.5 font-mono text-2xs font-bold rounded-none border border-line-subtle dark:border-teal-800/40">
                            {visit.icdCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-2xs font-bold font-mono uppercase rounded-none border ${
                            visit.paymentMethod === 'Panel'
                              ? 'bg-surface-accent dark:bg-night-800 text-accent dark:text-teal-300 border-line dark:border-teal-800/40'
                              : visit.paymentMethod === 'Insurance'
                              ? 'bg-teal-900/10 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                              : visit.paymentMethod === 'Credit Card'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                              : 'bg-surface-accent dark:bg-night-850 text-accent dark:text-teal-300 border-line-subtle dark:border-teal-800/40'
                          }`}>
                            {visit.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-medium">
                          {visit.durationMin} mins
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-ink dark:text-teal-300">
                          RM {visit.totalFee.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-surface-muted dark:bg-night-850 border-t border-line-subtle dark:border-teal-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="font-mono">
                Showing {filteredEncounters.length} of {displayEncounters.length} encounters
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink dark:text-teal-200">Subtotal Fees:</span>
                <span className="font-mono font-bold text-accent dark:text-teal-300 text-sm">RM {aggregateFees.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
