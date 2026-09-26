import React, { useState } from 'react';
import { Patient, Visit, Language } from '../types';
import ConsultationRoom from './ConsultationRoom';
import { 
  Stethoscope, FileText, Calendar, Users, DollarSign, Activity, BrainCircuit, 
  CalendarClock, Clock, ChevronRight, Search, Download, Filter, TrendingUp, 
  ShieldCheck, CheckCircle2, BarChart3, CreditCard, Building2, RefreshCw, Volume2, AlertCircle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

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
  const [sortRule, setSortRule] = useState<'urgency' | 'wait' | 'arrival'>('urgency');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [calledTimestampMap, setCalledTimestampMap] = useState<Record<string, string>>({});
  const [lastSyncedText, setLastSyncedText] = useState<string>('Just now');
  const [isRefreshingQueue, setIsRefreshingQueue] = useState<boolean>(false);

  const toggleDetails = (visitId: string) => {
    setExpandedDetails(prev => ({ ...prev, [visitId]: !prev[visitId] }));
  };

  const handleManualQueueRefresh = () => {
    setIsRefreshingQueue(true);
    setTimeout(() => {
      setIsRefreshingQueue(false);
      setLastSyncedText('Just now');
    }, 600);
  };

  const getChiefComplaintLabel = (subjective?: string) => {
    if (!subjective) return 'General Outpatient Consultation';
    const text = subjective.trim();
    const lower = text.toLowerCase();
    
    if (lower.includes('fever') && (lower.includes('throat') || lower.includes('sore'))) return 'Fever + sore throat';
    if (lower.includes('epigastric') || lower.includes('reflux') || lower.includes('gastritis') || lower.includes('heartburn')) return 'Epigastric pain / reflux';
    if (lower.includes('back') || lower.includes('lumbago') || lower.includes('myalgia')) return 'Low back pain / myalgia';
    if (lower.includes('cough') || lower.includes('urti') || lower.includes('cold') || lower.includes('flu')) return 'Cough & cold / URTI';
    if (lower.includes('hypertension') || lower.includes('bp') || lower.includes('diabetes')) return 'Chronic disease follow-up';
    if (lower.includes('asthma') || lower.includes('breath') || lower.includes('wheezing')) return 'Asthma / Dyspnea flare';
    if (lower.includes('rash') || lower.includes('eczema') || lower.includes('skin')) return 'Skin rash / Allergy';
    if (lower.includes('diarrhea') || lower.includes('vomiting') || lower.includes('food poison')) return 'Gastroenteritis / Diarrhea';
    
    if (text.length > 36) return text.substring(0, 33) + '...';
    return text;
  };

  const getTriageDetails = (pt?: Patient, visit?: Visit) => {
    const allergies = pt?.drugAllergies?.length || 0;
    const waitMins = visit?.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
    const temp = visit?.soap?.objective?.temperature || 0;
    
    if (allergies > 0 || waitMins >= 30 || temp >= 38.0) {
      return {
        level: 'High',
        stripColor: 'border-l-4 border-l-rose-600 dark:border-l-rose-500',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-extrabold',
        icon: AlertCircle,
        iconColor: 'text-rose-600 dark:text-rose-400'
      };
    } else if (waitMins >= 15 || temp >= 37.3) {
      return {
        level: 'Medium',
        stripColor: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-extrabold',
        icon: Clock,
        iconColor: 'text-amber-600 dark:text-amber-400'
      };
    } else {
      return {
        level: 'Low',
        stripColor: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-extrabold',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600 dark:text-emerald-400'
      };
    }
  };

  const renderAllergyBadge = (drugAllergies: string[] = []) => {
    if (drugAllergies.length === 0) return null;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-2 border-rose-600 shadow-2xs font-mono shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
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
    { name: 'Corporate Panel', value: 45, color: '#0d9488' },
    { name: 'Direct Cash/QR', value: 30, color: '#0f766e' },
    { name: 'Insurance (Medisave)', value: 15, color: '#14b8a6' },
    { name: 'Credit Card', value: 10, color: '#d97706' },
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
        <div className="fixed top-20 right-6 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/40 flex items-center gap-3 animate-bounce-slow">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            📢
          </div>
          <div>
            <h4 className="text-xs font-bold text-teal-300">Public PA Call System</h4>
            <p className="text-xs text-slate-200 font-medium">{callAnnouncementToast}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SEPARATE PAGE: DEDICATED PATIENT WAITING QUEUE PAGE                   */}
      {/* ========================================================================= */}
      {internalTab === 'queue' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#f7fdfd] dark:bg-[#07252d] p-5 rounded-none space-y-4">
            
            {/* QUEUE HEADER TOOLBAR WITH ACTIONABLE METRICS */}
            {(() => {
              const overSlaCount = doctorQueue.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20).length;
              const highPriorityCount = doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length;
              const maxWaitMinutes = doctorQueue.reduce((max, v) => {
                const mins = v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0;
                return mins > max ? mins : max;
              }, 0);

              return (
                <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 p-4 rounded-none space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#0d9488]" />
                        Patient Queue
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        Triaged outpatient consultation queue organized for quick scanning and decisive workflow management.
                      </p>
                    </div>

                    {/* Actionable Metrics Summary Row */}
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                      <span className="bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/40 px-3 py-1.5 rounded-none flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#0d9488]" />
                        <span>{doctorQueue.length} {doctorQueue.length === 1 ? 'patient waiting' : 'patients waiting'}</span>
                      </span>

                      <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-none flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{highPriorityCount} High Priority</span>
                      </span>

                      <span 
                        className="bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-none flex items-center gap-1.5 cursor-help"
                        title="Patients waiting over 20 minutes target clinical turnaround time"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{overSlaCount} Waiting over 20 min</span>
                      </span>

                      <span className="bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-800 px-3 py-1.5 rounded-none">
                        Longest Wait: <strong>{maxWaitMinutes} min</strong>
                      </span>
                    </div>
                  </div>

                  {/* Sorting Controls & Refresh Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#ccfbf1] dark:border-teal-800/40 text-xs font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-[#0d9488]" /> Sort By:
                      </span>
                      <div className="changer-container">
                        {(['urgency', 'wait', 'arrival'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSortRule(r)}
                            className={`changer-btn ${
                              sortRule === r
                                ? 'changer-btn-active'
                                : 'changer-btn-inactive'
                            }`}
                          >
                            {r === 'urgency' ? 'Clinical urgency' : r === 'wait' ? 'Longest wait' : 'Arrival order'}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                        ({sortRule === 'urgency' ? 'High-acuity & allergies first' : sortRule === 'wait' ? 'Descending wait time' : 'Registration order'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isRefreshingQueue && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Refreshing...
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleManualQueueRefresh}
                        disabled={isRefreshingQueue}
                        className="px-2.5 py-1 bg-[#e0f5f2] hover:bg-[#ccfbf1] text-[#0d9488] border border-[#b2f5ea] rounded-none transition-all cursor-pointer font-bold flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:outline-none text-xs"
                        title="Refresh clinical queue data"
                        aria-label="Refresh clinical queue data"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQueue ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SORTED QUEUE PREPARATION */}
            {(() => {
              const sortQueue = (queue: Visit[]) => {
                const list = [...queue];
                if (sortRule === 'urgency') {
                  return list.sort((a, b) => {
                    const ptA = patientsMap[a.patientId];
                    const ptB = patientsMap[b.patientId];
                    const allergiesA = ptA?.drugAllergies?.length || 0;
                    const allergiesB = ptB?.drugAllergies?.length || 0;
                    const waitA = a.registeredTime ? Math.floor((Date.now() - a.registeredTime) / 60000) : 0;
                    const waitB = b.registeredTime ? Math.floor((Date.now() - b.registeredTime) / 60000) : 0;
                    if (allergiesA > 0 && allergiesB === 0) return -1;
                    if (allergiesB > 0 && allergiesA === 0) return 1;
                    return waitB - waitA;
                  });
                } else if (sortRule === 'wait') {
                  return list.sort((a, b) => {
                    const waitA = a.registeredTime ? Math.floor((Date.now() - a.registeredTime) / 60000) : 0;
                    const waitB = b.registeredTime ? Math.floor((Date.now() - b.registeredTime) / 60000) : 0;
                    return waitB - waitA;
                  });
                } else {
                  return list.sort((a, b) => (a.registeredTime || 0) - (b.registeredTime || 0));
                }
              };

              const sortedQueue = sortQueue(doctorQueue);

              if (doctorQueue.length === 0) {
                return (
                  <div className="bg-white dark:bg-[#0c3844] rounded-none p-12 border border-[#b2f5ea] dark:border-teal-800/50 text-center text-slate-400">
                    <Users className="w-12 h-12 text-[#0d9488] dark:text-[#2dd4bf] mx-auto mb-3 opacity-50" />
                    <span className="text-xs font-bold block text-[#0f3c4c] dark:text-[#5eead4]">Your patient queue is currently empty.</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Waiting for triage clinic assistants to register and dispatch new outpatients.</span>
                  </div>
                );
              }

              const nextVisit = sortedQueue[0];
              const nextPatient = patientsMap[nextVisit.patientId];
              const remainingQueue = sortedQueue.slice(1);

              return (
                <div className="space-y-4">
                  {/* HERO BANNER: CALL NEXT PATIENT (#1 ONLY) */}
                  {nextPatient && (
                    <div className={`bg-[#0f3c4c] text-white p-5 rounded-none ${getTriageDetails(nextPatient, nextVisit).stripColor} border-t border-r border-b border-[#0d9488]/40 shadow-md relative overflow-hidden space-y-3`}>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0d9488]/40 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#5eead4] text-[#0f3c4c] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-none tracking-wider shadow-2xs font-mono">
                            NEXT IN LINE (#1)
                          </span>
                          
                          {/* Urgency Badge */}
                          {(() => {
                            const t = getTriageDetails(nextPatient, nextVisit);
                            const IconComp = t.icon;
                            return (
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-none border flex items-center gap-1 font-mono ${t.badgeBg}`}>
                                <IconComp className={`w-3 h-3 ${t.iconColor}`} />
                                <span>Triage: {t.level}</span>
                              </span>
                            );
                          })()}

                          {/* Allergy Badge */}
                          {renderAllergyBadge(nextPatient.drugAllergies)}

                          {/* Called timestamp badge & explicit workflow feedback */}
                          {calledTimestampMap[nextVisit.id] && (
                            <span className="bg-emerald-400 text-[#0f3c4c] text-[10px] font-black uppercase px-2 py-0.5 rounded-none font-mono animate-pulse flex items-center gap-1">
                              📢 Called at {calledTimestampMap[nextVisit.id]}
                            </span>
                          )}
                        </div>

                        {/* Full 3-Step Visual Workflow Tracker */}
                        <div className="text-[11px] font-mono font-bold bg-black/40 px-3 py-1 border border-teal-500/30 rounded-none flex items-center gap-1.5">
                          <span className={activeConsultationVisitId === nextVisit.id ? 'text-teal-200' : calledVisitId === nextVisit.id ? 'text-teal-200' : 'text-emerald-300 font-extrabold underline'}>
                            Ready
                          </span>
                          <span className="text-teal-400">→</span>
                          <span className={calledVisitId === nextVisit.id ? 'text-emerald-300 font-extrabold underline' : 'text-teal-200 opacity-60'}>
                            Called
                          </span>
                          <span className="text-teal-400">→</span>
                          <span className={activeConsultationVisitId === nextVisit.id ? 'text-emerald-300 font-extrabold underline' : 'text-teal-200 opacity-60'}>
                            In Consultation
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-black text-white flex items-baseline gap-2">
                            <span>{nextPatient.fullName}</span>
                            <span className="text-xs font-mono text-teal-200 font-normal">ID: {nextPatient.id} · ({nextPatient.gender}, {nextPatient.dob})</span>
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100 font-medium">
                            <span className="font-bold text-white bg-teal-900/60 px-2 py-0.5 border border-teal-500/40">
                              Complaint: {getChiefComplaintLabel(nextVisit.soap?.subjective)}
                            </span>
                            <span className="opacity-50">•</span>
                            <span className="font-mono text-amber-200">
                              Wait: <strong>{nextVisit.registeredTime ? Math.floor((Date.now() - nextVisit.registeredTime) / 60000) : 0} min</strong>
                            </span>
                          </div>

                          {/* Vitals summary preview */}
                          {nextVisit.soap?.objective && nextVisit.soap.objective.temperature > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                              <span className="bg-black/30 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                                BP: <strong className="text-white">{nextVisit.soap.objective.bpSystolic}/{nextVisit.soap.objective.bpDiastolic}</strong> mmHg
                              </span>
                              <span className="bg-black/30 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                                Temp: <strong className={nextVisit.soap.objective.temperature >= 37.5 ? 'text-rose-300 font-bold' : 'text-white'}>{nextVisit.soap.objective.temperature}°C</strong>
                              </span>
                              <span className="bg-black/30 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                                HR: <strong className="text-white">{nextVisit.soap.objective.heartRate}</strong> bpm
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Dominant Primary Action & Secondary Toggle */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleDetails(nextVisit.id)}
                            className="px-3 py-2 rounded-none text-xs font-bold text-teal-100 hover:text-white underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:outline-none"
                          >
                            {expandedDetails[nextVisit.id] ? 'Hide details' : 'More details'}
                          </button>

                          {activeConsultationVisitId === nextVisit.id ? (
                            <button
                              type="button"
                              onClick={() => handleStartConsultation(nextVisit.id)}
                              className="px-6 py-2.5 rounded-none text-xs font-black bg-[#5eead4] hover:bg-[#2dd4bf] text-[#0f3c4c] shadow-lg flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                            >
                              <Stethoscope className="w-4 h-4 text-[#0f3c4c]" />
                              <span>Move to consultation</span>
                              <ChevronRight className="w-4 h-4 text-[#0f3c4c]" />
                            </button>
                          ) : calledVisitId === nextVisit.id ? (
                            <button
                              type="button"
                              onClick={() => handleStartConsultation(nextVisit.id)}
                              className="px-6 py-2.5 rounded-none text-xs font-black bg-emerald-400 hover:bg-emerald-300 text-[#0f3c4c] shadow-lg flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                            >
                              <Stethoscope className="w-4 h-4 text-[#0f3c4c]" />
                              <span>Move to consultation</span>
                              <ChevronRight className="w-4 h-4 text-[#0f3c4c]" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(nextVisit.id, nextPatient.fullName)}
                              className="px-6 py-2.5 rounded-none text-xs font-black bg-[#0d9488] hover:bg-teal-600 text-white shadow-lg flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:outline-none"
                            >
                              <Volume2 className="w-4 h-4 text-white" />
                              <span>Call patient</span>
                              <ChevronRight className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Secondary Details Drawer */}
                      {expandedDetails[nextVisit.id] && (
                        <div className="pt-3 border-t border-[#0d9488]/40 text-xs text-teal-100 space-y-2 bg-black/20 p-3 rounded-none animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <strong className="block text-white mb-0.5">Full Clinical Subjective Note:</strong>
                              <p className="text-slate-200 leading-relaxed font-sans">{nextVisit.soap?.subjective || 'No additional history provided.'}</p>
                            </div>
                            <div>
                              <strong className="block text-white mb-0.5">Panel Employer / Coverage:</strong>
                              <p className="text-[#5eead4] font-bold">{nextPatient.panelEmployer}</p>
                            </div>
                            <div>
                              <strong className="block text-white mb-0.5">Address &amp; Contact:</strong>
                              <p className="text-slate-200">{nextPatient.phone} · {nextPatient.address}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REMAINING PATIENTS LIST (#2 ONWARDS) - COMPACT ROW GRID */}
                  {remainingQueue.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#b2f5ea] dark:border-teal-800/40">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider flex items-center gap-1.5">
                          <span>Subsequent Patients ({remainingQueue.length} Waiting)</span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono font-medium">
                          Active Sort: <strong className="text-[#0d9488]">{sortRule === 'urgency' ? 'Clinical Urgency & Allergies' : sortRule === 'wait' ? 'Longest Wait First' : 'Arrival Order'}</strong>
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {remainingQueue.map((visit, index) => {
                          const pt = patientsMap[visit.patientId];
                          if (!pt) return null;
                          const isConsulting = activeConsultationVisitId === visit.id;
                          const isExpanded = expandedDetails[visit.id];
                          const queuePosition = index + 2;
                          const triage = getTriageDetails(pt, visit);
                          const TriageIcon = triage.icon;
                          const waitMins = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;

                          return (
                            <div
                              key={visit.id}
                              tabIndex={0}
                              onClick={() => toggleDetails(visit.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetails(visit.id); } }}
                              className={`border rounded-none ${triage.stripColor} transition-all p-3 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:outline-none ${
                                isConsulting 
                                  ? 'bg-[#e0f5f2] dark:bg-[#0c3844] border-[#0d9488] shadow-xs' 
                                  : 'bg-white dark:bg-[#0c3844] hover:bg-[#f0fdfa] dark:hover:bg-[#0e4857] border-slate-200 dark:border-teal-800/50'
                              }`}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                
                                {/* Col 1-4: Queue # + Name + ID + Triage & Allergy */}
                                <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                                  <div className="w-7 h-7 bg-[#e0f5f2] dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-800/40 text-[#0f3c4c] dark:text-[#5eead4] font-mono font-black text-xs flex items-center justify-center shrink-0">
                                    #{queuePosition}
                                  </div>

                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                        {pt.fullName}
                                      </h4>
                                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">ID: {pt.id}</span>
                                      
                                      {/* Urgency Badge */}
                                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-none border flex items-center gap-1 font-mono ${triage.badgeBg}`}>
                                        <TriageIcon className={`w-3 h-3 ${triage.iconColor}`} />
                                        <span>{triage.level}</span>
                                      </span>

                                      {/* Allergy Badge */}
                                      {renderAllergyBadge(pt.drugAllergies)}
                                    </div>
                                  </div>
                                </div>

                                {/* Col 5-8: Chief Complaint */}
                                <div className="md:col-span-4 min-w-0">
                                  <span className="text-xs font-bold text-[#0d9488] dark:text-[#2dd4bf] truncate block">
                                    {getChiefComplaintLabel(visit.soap?.subjective)}
                                  </span>
                                </div>

                                {/* Col 9-10: Dedicated Aligned Wait Time Column */}
                                <div className="md:col-span-1 font-mono text-xs text-slate-600 dark:text-slate-300 font-bold text-left md:text-center">
                                  <span className={waitMins >= 20 ? 'text-amber-600 dark:text-amber-400 font-black' : ''}>
                                    {waitMins}m wait
                                  </span>
                                </div>

                                {/* Col 11-12: Action / Call Button */}
                                <div className="md:col-span-2 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  {isConsulting ? (
                                    <button
                                      type="button"
                                      onClick={() => handleStartConsultation(visit.id)}
                                      className="px-3 py-1.5 rounded-none text-xs font-extrabold bg-[#0f3c4c] dark:bg-[#0d9488] text-white shadow-xs flex items-center gap-1 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:outline-none"
                                    >
                                      <Stethoscope className="w-3.5 h-3.5 text-teal-300" />
                                      <span>Resume</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleCallPatient(visit.id, pt.fullName)}
                                      className="px-3 py-1.5 rounded-none text-xs font-bold bg-slate-100 hover:bg-[#0d9488] text-slate-800 hover:text-white dark:bg-[#082830] dark:hover:bg-[#0d9488] border border-slate-300 dark:border-teal-800/40 transition-all cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#0d9488] focus-visible:outline-none"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                      <span>Call</span>
                                    </button>
                                  )}
                                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-[#0d9488]' : ''}`} />
                                </div>
                              </div>

                              {/* Expandable Details Drawer */}
                              {isExpanded && (
                                <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-teal-800/40 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#082830] p-3 rounded-none space-y-2 animate-fadeIn">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Full Reason / Symptoms:</strong>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{visit.soap?.subjective || 'General Medical Consultation'}</p>
                                    </div>
                                    <div>
                                      <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Panel Employer:</strong>
                                      <p className="text-[#0d9488] dark:text-[#2dd4bf] font-bold">{pt.panelEmployer}</p>
                                    </div>
                                    <div>
                                      <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Demographics &amp; Vitals:</strong>
                                      <p className="text-slate-600 dark:text-slate-300">{pt.gender}, {pt.dob} · {pt.phone}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
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
                <Stethoscope className="w-10 h-10 text-[#0D9488]" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-lg">No Active Patient Selected</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                Please choose an outpatient from your active patient queue to start SOAP clinical diagnosis, vitals examination, and prescription writing.
              </p>
              <button
                type="button"
                onClick={() => setInternalTab('queue')}
                className="mt-5 px-5 py-2 rounded-lg text-xs font-bold bg-[#0D9488] hover:bg-teal-700 text-white shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
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
          <div className="bg-[#f0fdfa] dark:bg-[#082830] border border-[#ccfbf1] dark:border-teal-800/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0d9488] dark:text-[#5eead4]" />
                  Doctor Monthly Clinical &amp; Revenue Performance
                </h2>
                {showSampleReports && (
                  <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 text-[10px] font-bold font-mono uppercase tracking-wider border border-amber-300 dark:border-amber-800 rounded-none">
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
                    : 'bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-800/40'
                }`}
                title="Toggle between real live consultation data and simulated month telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>{showSampleReports ? 'Showing Sample Data' : 'Showing Live Data'}</span>
              </button>

              <select
                value={reportMonthHorizon}
                onChange={(e) => setReportMonthHorizon(e.target.value)}
                className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 text-[#0f3c4c] dark:text-teal-100 text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0d9488] rounded-none cursor-pointer"
              >
                <option value="current">September 2026 (Current)</option>
                <option value="last_month">August 2026</option>
                <option value="q3_2026">Q3 2026 Cumulative</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-4 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs rounded-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Total Encounters</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#0f3c4c] dark:text-white">{aggregatePatients}</span>
                  <span className="text-[10px] font-bold text-[#0d9488] dark:text-[#5eead4] flex items-center gap-0.5 font-mono">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Completed consultations</span>
              </div>
              <div className="w-10 h-10 bg-[#e0f5f2] dark:bg-[#082830] flex items-center justify-center text-[#0d9488] dark:text-[#5eead4] rounded-none border border-[#b2f5ea] dark:border-teal-800/40">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Gross Billing (RM)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#0f3c4c] dark:text-white">RM {aggregateFees.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-[#0d9488] dark:text-[#5eead4] font-bold font-mono block mt-0.5">Avg RM {(aggregatePatients > 0 ? aggregateFees / aggregatePatients : 0).toFixed(2)} / visit</span>
              </div>
              <div className="w-10 h-10 bg-[#e0f5f2] dark:bg-[#082830] flex items-center justify-center text-[#0d9488] dark:text-[#5eead4] rounded-none border border-[#b2f5ea] dark:border-teal-800/40">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Avg Consult Time</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#0f3c4c] dark:text-white">{avgDuration} min</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Target: 15.0 mins/pt</span>
              </div>
              <div className="w-10 h-10 bg-[#e0f5f2] dark:bg-[#082830] flex items-center justify-center text-[#0f766e] dark:text-[#5eead4] rounded-none border border-[#b2f5ea] dark:border-teal-800/40">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-4 flex items-center justify-between rounded-none shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-teal-200/80 font-bold uppercase tracking-wider font-mono block mb-1">Top Diagnostic (ICD-10)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black text-[#0f3c4c] dark:text-white truncate max-w-[130px]" title="J06.9 Acute Upper Respiratory">
                    J06.9 (URTI)
                  </span>
                </div>
                <span className="text-[10px] text-[#0d9488] dark:text-[#5eead4] font-bold font-mono block mt-0.5">38% of monthly visits</span>
              </div>
              <div className="w-10 h-10 bg-[#e0f5f2] dark:bg-[#082830] flex items-center justify-center text-[#0d9488] dark:text-[#5eead4] rounded-none border border-[#b2f5ea] dark:border-teal-800/40">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Recharts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area Chart: Daily Velocity */}
            <div className="lg:col-span-2 bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-5 rounded-none space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0d9488]" />
                    Daily Encounter Velocity &amp; Revenue Growth
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Patient volume vs gross financial yield throughout September 2026.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold font-mono">
                  <span className="flex items-center gap-1.5 text-[#0f766e] dark:text-[#5eead4]">
                    <span className="w-3 h-3 bg-[#0d9488] inline-block rounded-none"></span> Revenue (RM)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleDailyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" opacity={0.6} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#0f766e', fontWeight: 'bold' }} axisLine={{ stroke: '#b2f5ea' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#0f766e', fontWeight: 'bold' }} axisLine={{ stroke: '#b2f5ea' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', border: '1px solid #2dd4bf', fontSize: '12px' }}
                      formatter={(value: any) => [`RM ${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="fees" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Payment Route Distribution */}
            <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 p-5 rounded-none space-y-4 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-[#0f3c4c] dark:text-[#5eead4] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0d9488]" />
                  Corporate Panel &amp; Payment Mix
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
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
                    <Tooltip contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', border: '1px solid #2dd4bf', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#ccfbf1] dark:border-teal-800/40">
                {samplePaymentMix.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 inline-block rounded-none" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#0f3c4c] dark:text-[#5eead4]">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Encounters Table with Search & Filter */}
          <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#ccfbf1] dark:border-teal-800/40 rounded-none overflow-hidden space-y-0 shadow-xs">
            {/* Filter Bar */}
            <div className="p-4 bg-[#f0fdfa] dark:bg-[#082830] border-b border-[#ccfbf1] dark:border-teal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0d9488]" />
                <h3 className="text-sm font-extrabold text-[#0f3c4c] dark:text-[#5eead4]">Detailed Encounter &amp; Fee Ledger</h3>
                <span className="text-xs font-mono bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/40 px-2 py-0.5 rounded-none font-bold">
                  {filteredEncounters.length} Record{filteredEncounters.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0d9488]" />
                  <input
                    type="text"
                    placeholder="Search patient, ICD code..."
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 text-xs font-bold text-[#0f3c4c] dark:text-teal-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d9488] w-48 sm:w-56 rounded-none"
                  />
                </div>

                {/* Payment Method Filter */}
                <div className="flex items-center gap-1.5 bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 px-2.5 py-1.5 rounded-none">
                  <Filter className="w-3.5 h-3.5 text-[#0d9488]" />
                  <select
                    value={reportPaymentFilter}
                    onChange={(e) => setReportPaymentFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#0f3c4c] dark:text-teal-100 focus:outline-none rounded-none cursor-pointer"
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
                  <tr className="bg-[#e0f5f2] dark:bg-[#082830] text-[#0f766e] dark:text-[#5eead4] border-b border-[#b2f5ea] dark:border-teal-800/40 uppercase tracking-wider font-bold font-mono">
                    <th className="px-4 py-3">Encounter ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">ICD-10 Diagnostic Code</th>
                    <th className="px-4 py-3">Payment Route</th>
                    <th className="px-4 py-3 text-center">Consult Time</th>
                    <th className="px-4 py-3 text-right">Total Fee (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6f4f1] dark:divide-teal-800/30">
                  {filteredEncounters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 italic">
                        No encounter records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEncounters.map((visit) => (
                      <tr key={visit.id} className="hover:bg-[#f0fdfa] dark:hover:bg-[#082830]/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#0f766e] dark:text-teal-300">{visit.id}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 font-medium">{visit.date}</td>
                        <td className="px-4 py-3 font-extrabold text-[#0f3c4c] dark:text-white">
                          {visit.patientName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-[#f0fdfa] dark:bg-[#082830] text-[#0f766e] dark:text-[#5eead4] px-2 py-0.5 font-mono text-[11px] font-bold rounded-none border border-[#ccfbf1] dark:border-teal-800/40">
                            {visit.icdCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded-none border ${
                            visit.paymentMethod === 'Panel'
                              ? 'bg-[#e0f5f2] dark:bg-[#0c3844] text-[#0f766e] dark:text-[#5eead4] border-[#b2f5ea] dark:border-teal-800/40'
                              : visit.paymentMethod === 'Insurance'
                              ? 'bg-teal-900/10 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                              : visit.paymentMethod === 'Credit Card'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                              : 'bg-[#e6f4f1] dark:bg-[#082830] text-[#0d9488] dark:text-teal-300 border-[#ccfbf1] dark:border-teal-800/40'
                          }`}>
                            {visit.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300 font-medium">
                          {visit.durationMin} mins
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-[#0f3c4c] dark:text-[#5eead4]">
                          RM {visit.totalFee.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-[#f0fdfa] dark:bg-[#082830] border-t border-[#ccfbf1] dark:border-teal-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="font-mono">
                Showing {filteredEncounters.length} of {displayEncounters.length} encounters
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0f3c4c] dark:text-teal-200">Subtotal Fees:</span>
                <span className="font-mono font-black text-[#0d9488] dark:text-[#5eead4] text-sm">RM {aggregateFees.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
