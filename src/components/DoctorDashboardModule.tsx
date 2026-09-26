import React, { useState } from 'react';
import { Patient, Visit, Language } from '../types';
import ConsultationRoom from './ConsultationRoom';
import { 
  Stethoscope, FileText, Calendar, Users, DollarSign, Activity, BrainCircuit, 
  CalendarClock, Clock, ChevronRight, Search, Download, Filter, TrendingUp, 
  ShieldCheck, CheckCircle2, BarChart3, CreditCard, Building2, RefreshCw, Volume2 
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
    { name: 'Direct Cash/QR', value: 30, color: '#0f3c4c' },
    { name: 'Insurance (Medisave)', value: 15, color: '#6366f1' },
    { name: 'Credit Card', value: 10, color: '#f59e0b' },
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
    setCalledVisitId(visitId);
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
          <div className="bg-[#f7fdfd] dark:bg-[#07252d] border border-[#b2f5ea] dark:border-teal-800/40 p-5 rounded-none shadow-sm space-y-4">
            
            {/* QUEUE HEADER TOOLBAR WITH METRICS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#b2f5ea] dark:border-teal-800/40 pb-4">
              <div>
                <h3 className="text-[#0f3c4c] dark:text-[#5eead4] font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0d9488] dark:text-[#2dd4bf]" />
                  Active Outpatient Waiting Queue
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Follow 3-Step Chronology: 1. Call for Consultation → 2. Start SOAP Consultation → 3. Auto-Return to Queue.
                </p>
              </div>

              {/* STATS METRIC BADGES */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono bg-[#e0f5f2] dark:bg-[#082830] text-[#0f766e] dark:text-[#5eead4] px-3 py-1.5 border border-[#b2f5ea] dark:border-teal-800/40 rounded-none font-bold shadow-2xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0d9488] dark:text-[#2dd4bf]" />
                  Queue Volume: <strong className="text-[#0f3c4c] dark:text-white font-mono text-xs">{doctorQueue.length} Patients</strong>
                </span>

                {doctorQueue.some(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0) && (
                  <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2.5 py-1.5 border border-rose-200 dark:border-rose-800/50 rounded-none shadow-2xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    {doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length} Allergy Alerts
                  </span>
                )}
              </div>
            </div>

            {/* SORTED QUEUE PREPARATION */}
            {(() => {
              const sortedQueue = [...doctorQueue].sort((a, b) => {
                const ptA = patientsMap[a.patientId];
                const ptB = patientsMap[b.patientId];
                if (!ptA || !ptB) return 0;
                if (ptA.drugAllergies.length > ptB.drugAllergies.length) return -1;
                if (ptB.drugAllergies.length > ptA.drugAllergies.length) return 1;
                return 0;
              });

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
              const isNextCalled = calledVisitId === nextVisit.id;

              return (
                <div className="space-y-4">
                  {/* HERO BANNER: CALL NEXT PATIENT (#1 ONLY) */}
                  {nextPatient && (
                    <div className="bg-[#0f3c4c] dark:bg-[#07252d] text-white p-5 rounded-none border border-[#0d9488]/40 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden">
                      {/* Decorative background flare */}
                      <div className="absolute -right-10 -top-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

                      <div className="space-y-2 z-10">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-[#5eead4] text-[#0f3c4c] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-none tracking-wider shadow-2xs">
                            NEXT IN LINE (#1)
                          </span>
                          {isNextCalled && (
                            <span className="bg-emerald-400 text-[#0f3c4c] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-none tracking-wider animate-pulse flex items-center gap-1 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-[#0f3c4c] animate-ping" />
                              📢 PATIENT CALLED
                            </span>
                          )}
                          {nextPatient.drugAllergies.length > 0 && (
                            <span className="bg-rose-500/30 text-rose-200 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-none border border-rose-400/40">
                              ⚠️ Allergy Alert ({nextPatient.drugAllergies.join(', ')})
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-black tracking-tight text-white flex flex-wrap items-baseline gap-2">
                          <span>{nextPatient.fullName}</span>
                          <span className="text-xs font-mono text-teal-200/90 font-normal">({nextPatient.gender}, {nextPatient.dob})</span>
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-teal-100 font-medium pt-0.5">
                          <span>Reason: <strong className="text-white font-bold">{nextVisit.soap?.subjective || 'General Medical Consultation'}</strong></span>
                          <span className="opacity-40">•</span>
                          <span>Panel: <strong className="text-[#5eead4] font-bold">{nextPatient.panelEmployer}</strong></span>
                        </div>

                        {/* Triaged Vitals Preview Chips */}
                        {nextVisit.soap?.objective && nextVisit.soap.objective.temperature > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                            <span className="bg-black/25 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                              BP: <strong className="text-white">{nextVisit.soap.objective.bpSystolic}/{nextVisit.soap.objective.bpDiastolic}</strong> mmHg
                            </span>
                            <span className="bg-black/25 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                              Temp: <strong className={nextVisit.soap.objective.temperature >= 37.5 ? 'text-rose-300 font-bold' : 'text-white'}>{nextVisit.soap.objective.temperature}°C</strong>
                            </span>
                            <span className="bg-black/25 px-2 py-0.5 rounded-none border border-white/10 text-teal-200">
                              HR: <strong className="text-white">{nextVisit.soap.objective.heartRate}</strong> bpm
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CHRONOLOGY ACTIONS */}
                      <div className="flex items-center gap-2 z-10 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCallPatient(nextVisit.id, nextPatient.fullName)}
                          className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-extrabold text-xs px-4 py-3 rounded-none transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
                        >
                          <Volume2 className="w-4 h-4 text-teal-200" />
                          <span>Call Patient</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartConsultation(nextVisit.id)}
                          className="bg-[#5eead4] hover:bg-[#2dd4bf] text-[#0f3c4c] font-black text-xs px-5 py-3 rounded-none shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Stethoscope className="w-4.5 h-4.5 text-[#0f3c4c]" />
                          <span>Continue SOAP assessment</span>
                          <ChevronRight className="w-4 h-4 text-[#0f3c4c]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REMAINING PATIENTS LIST (#2 ONWARDS - NO DUPLICATION) */}
                  {remainingQueue.length > 0 ? (
                    <div className="space-y-3 pt-2 border-t border-[#b2f5ea] dark:border-teal-800/40">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#0f3c4c] dark:text-[#5eead4] uppercase tracking-wider">
                          Subsequent Queue Items ({remainingQueue.length} Waiting)
                        </h4>
                        <span className="text-[10px] text-slate-400">Ordered by arrival chronology &amp; triage urgency</span>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {remainingQueue.map((visit, index) => {
                          const pt = patientsMap[visit.patientId];
                          if (!pt) return null;
                          const isConsulting = activeConsultationVisitId === visit.id;
                          const isCalled = calledVisitId === visit.id;
                          const queuePosition = index + 2; // Position #2, #3...

                          let triageLevel = 'MED';
                          if (pt.drugAllergies.length > 0) triageLevel = 'HIGH';

                          const waitTimeMinutes = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
                          const waitTimeColor = waitTimeMinutes >= 30 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' :
                            waitTimeMinutes >= 15 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' :
                              'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50';

                          return (
                            <div
                              key={visit.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-none border transition-all ${isConsulting
                                ? 'border-[#0d9488] bg-[#e0f5f2] dark:bg-[#0c3844] shadow-xs'
                                : 'border-[#b2f5ea] dark:border-teal-800/50 bg-white dark:bg-[#0c3844] hover:bg-[#f7fdfd] dark:hover:bg-[#0e4857]'
                                }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex flex-col items-center justify-center bg-[#e0f5f2] dark:bg-[#082830] text-[#0f3c4c] dark:text-[#5eead4] rounded-none w-11 h-11 border border-[#b2f5ea] dark:border-teal-800/40 shrink-0 font-mono">
                                  <span className="text-[9px] font-bold text-[#0d9488]">#</span>
                                  <span className="text-sm font-black">{queuePosition}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-extrabold text-[#0f3c4c] dark:text-white uppercase tracking-tight truncate">
                                      {pt.fullName}
                                    </h4>
                                    {isCalled && (
                                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider border border-emerald-300 dark:border-emerald-800 animate-pulse">
                                        📢 Called
                                      </span>
                                    )}
                                    {pt.drugAllergies.length > 0 && (
                                      <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider border border-rose-300 dark:border-rose-800">
                                        Allergy Alert ({pt.drugAllergies.join(', ')})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="font-mono bg-slate-100 dark:bg-[#082830] px-1.5 py-0.5 rounded-none text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/40">ID: {pt.id}</span>
                                    <span>Panel: <strong className="text-[#0d9488] dark:text-[#2dd4bf]">{pt.panelEmployer}</strong></span>
                                    <span className="hidden md:inline text-slate-300 dark:text-slate-600">•</span>
                                    <span className="truncate">Reason: <strong className="text-slate-700 dark:text-slate-300">{visit.soap?.subjective || 'General Checkup'}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-wrap sm:justify-end shrink-0">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-none flex items-center gap-1 border transition-colors ${waitTimeColor}`}>
                                  <Clock className="w-3 h-3" /> Wait: {waitTimeMinutes}m
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-none flex items-center gap-1 border ${triageLevel === 'HIGH' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50' :
                                  triageLevel === 'MED' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50' :
                                    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                  }`}>
                                  <BrainCircuit className="w-3 h-3" /> Triage: {triageLevel}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => handleCallPatient(visit.id, pt.fullName)}
                                  className="px-2.5 py-1.5 rounded-none text-[11px] font-bold bg-[#e0f5f2] dark:bg-[#082830] hover:bg-[#0d9488] hover:text-white text-[#0f766e] dark:text-[#5eead4] border border-[#b2f5ea] dark:border-teal-800/40 transition-all cursor-pointer shadow-2xs"
                                >
                                  📢 Call
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartConsultation(visit.id)}
                                  className="px-3.5 py-1.5 rounded-none text-[11px] font-bold bg-[#0d9488] dark:bg-[#0f766e] hover:bg-[#0f766e] dark:hover:bg-[#0d9488] text-white shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Stethoscope className="w-3.5 h-3.5" />
                                  <span>Start Consultation</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#e0f5f2]/40 dark:bg-[#082830] border border-[#b2f5ea] dark:border-teal-800/40 rounded-none text-center text-xs text-slate-500 dark:text-slate-400 italic font-medium">
                      No additional outpatients waiting in queue after Patient #1.
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
        <div className="space-y-5">
          {/* Header & Controls Toolbar */}
          <div className="bg-white border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0f3c4c] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  Doctor Monthly Clinical & Revenue Performance
                </h2>
                {showSampleReports && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-300 rounded-none">
                    Interactive Telemetry Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive consultation metrics, ICD-10 diagnostic volume, panel billing breakdown, and export options.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSampleReports(!showSampleReports)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-colors rounded-none ${
                  showSampleReports
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle between real live consultation data and simulated month telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>{showSampleReports ? 'Showing Sample Data' : 'Showing Live Data'}</span>
              </button>

              <select
                value={reportMonthHorizon}
                onChange={(e) => setReportMonthHorizon(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 rounded-none"
              >
                <option value="current">September 2026 (Current)</option>
                <option value="last_month">August 2026</option>
                <option value="q3_2026">Q3 2026 Cumulative</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0f3c4c] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm rounded-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200 p-4 flex items-center justify-between rounded-none shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Encounters</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{aggregatePatients}</span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Completed consultations</span>
              </div>
              <div className="w-10 h-10 bg-teal-50 flex items-center justify-center text-teal-600 rounded-none border border-teal-100">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200 p-4 flex items-center justify-between rounded-none shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Gross Billing (RM)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">RM {aggregateFees.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Avg RM {(aggregatePatients > 0 ? aggregateFees / aggregatePatients : 0).toFixed(2)} / visit</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center text-emerald-600 rounded-none border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200 p-4 flex items-center justify-between rounded-none shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Avg Consult Time</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{avgDuration} min</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Target: 15.0 mins/pt</span>
              </div>
              <div className="w-10 h-10 bg-blue-50 flex items-center justify-center text-blue-600 rounded-none border border-blue-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200 p-4 flex items-center justify-between rounded-none shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Top Diagnostic (ICD-10)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[130px]" title="J06.9 Acute Upper Respiratory">
                    J06.9 (URTI)
                  </span>
                </div>
                <span className="text-[10px] text-teal-600 font-bold block mt-0.5">38% of monthly visits</span>
              </div>
              <div className="w-10 h-10 bg-purple-50 flex items-center justify-center text-purple-600 rounded-none border border-purple-100">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Recharts Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area Chart: Daily Velocity */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Daily Encounter Velocity & Revenue Growth
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Patient volume vs gross financial yield throughout September 2026.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="flex items-center gap-1 text-teal-700">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', border: 'none', fontSize: '12px' }}
                      formatter={(value: any) => [`RM ${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="fees" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFees)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Payment Route Distribution */}
            <div className="bg-white border border-slate-200 p-5 rounded-none space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Corporate Panel & Payment Mix
                </h3>
                <p className="text-[11px] text-slate-400">
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
                    <Tooltip contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {samplePaymentMix.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 inline-block rounded-none" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Encounters Table with Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-none overflow-hidden space-y-0">
            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Detailed Encounter & Fee Ledger</h3>
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-none font-bold">
                  {filteredEncounters.length} Record{filteredEncounters.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, ICD code..."
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 sm:w-56 rounded-none"
                  />
                </div>

                {/* Payment Method Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1.5 rounded-none">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={reportPaymentFilter}
                    onChange={(e) => setReportPaymentFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none rounded-none"
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
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3 font-mono">Encounter ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">ICD-10 Diagnostic Code</th>
                    <th className="px-4 py-3">Payment Route</th>
                    <th className="px-4 py-3 text-center">Consult Time</th>
                    <th className="px-4 py-3 text-right">Total Fee (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEncounters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 italic">
                        No encounter records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEncounters.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">{visit.id}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{visit.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {visit.patientName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 font-mono text-[11px] font-semibold rounded-none border border-slate-200">
                            {visit.icdCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none border ${
                            visit.paymentMethod === 'Panel'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : visit.paymentMethod === 'Insurance'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : visit.paymentMethod === 'Credit Card'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {visit.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600">
                          {visit.durationMin} mins
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#0f3c4c]">
                          RM {visit.totalFee.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">
                Showing {filteredEncounters.length} of {displayEncounters.length} encounters
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Subtotal Fees:</span>
                <span className="font-mono font-bold text-teal-700 text-sm">RM {aggregateFees.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
