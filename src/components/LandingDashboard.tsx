import React from 'react';
import { Visit, Patient, UserRole, Language } from '../types';
import { 
  Activity, Users, Stethoscope, Pill, CreditCard, Clock, 
  TrendingUp, ArrowUpRight, ShieldCheck, MapPin, Phone, Building2,
  Calendar, CheckCircle2, ChevronRight, AlertCircle, BarChart3, PieChart as PieChartIcon, Zap, LogIn
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';

interface LandingDashboardProps {
  userRole: UserRole | null;
  userName?: string;
  triageQueue?: Visit[];
  doctorQueue: Visit[];
  pharmacyQueue: Visit[];
  cashierQueue: Visit[];
  completedVisits: Visit[];
  patientsList: Patient[];
  activeLanguage: Language;
  onNavigateTab: (tab: 'dashboard' | 'registration' | 'consultation' | 'dispensary' | 'billing') => void;
  onOpenLogin?: () => void;
}

export default function LandingDashboard({
  userRole,
  userName = "Dr. Sarah Jenkins",
  triageQueue = [],
  doctorQueue,
  pharmacyQueue,
  cashierQueue,
  completedVisits,
  patientsList,
  activeLanguage,
  onNavigateTab,
  onOpenLogin
}: LandingDashboardProps) {

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Derived Metrics
  const totalEncountersToday = completedVisits.length + triageQueue.length + doctorQueue.length + pharmacyQueue.length + cashierQueue.length + 18;
  const activeQueueCount = triageQueue.length + doctorQueue.length + pharmacyQueue.length;
  const calculatedRevenue = completedVisits.reduce((acc, curr) => acc + (curr.paidAmount || 0) + (curr.panelClaimed || 0), 0) + 2850;

  // Statistical Data Arrays for Recharts
  const hourlyTrafficData = [
    { hour: '08:00 AM', encounters: 6, waiting: 2 },
    { hour: '09:00 AM', encounters: 16, waiting: 4 },
    { hour: '10:00 AM', encounters: 24, waiting: 6 },
    { hour: '11:00 AM', encounters: 29, waiting: 5 },
    { hour: '12:00 PM', encounters: 15, waiting: 3 },
    { hour: '01:00 PM', encounters: 8, waiting: 1 },
    { hour: '02:00 PM', encounters: 18, waiting: 4 },
    { hour: '03:00 PM', encounters: 23, waiting: 5 },
    { hour: '04:00 PM', encounters: 19, waiting: 3 },
    { hour: '05:00 PM', encounters: 12, waiting: 2 },
  ];

  const icdBreakdownData = [
    { name: 'URTI / Common Cold (J06.9)', count: 42, color: '#0D9488' },
    { name: 'Essential Hypertension (I10)', count: 28, color: '#2563EB' },
    { name: 'Type 2 Diabetes (E11.9)', count: 19, color: '#7C3AED' },
    { name: 'Acute Gastritis (K30)', count: 14, color: '#F59E0B' },
    { name: 'Myalgia / Back Pain (M79.1)', count: 11, color: '#EF4444' }
  ];

  const payerMixData = [
    { provider: 'Self-Pay (Cash/TNG)', amount: 1420 },
    { provider: 'PMCare Panel', amount: 980 },
    { provider: 'MiCare Corporate', amount: 840 },
    { provider: 'HealthMetrics', amount: 620 },
    { provider: 'RedAlert TPA', amount: 450 },
  ];

  const fastMovingDrugs = [
    { name: 'Paracetamol 500mg Tab', category: 'Analgesic', dispensed: 340, stock: 1200, percentage: 85 },
    { name: 'Amoxicillin 500mg Cap', category: 'Antibiotic', dispensed: 180, stock: 450, percentage: 65 },
    { name: 'Metformin 500mg Tab', category: 'Antidiabetic', dispensed: 140, stock: 800, percentage: 45 },
    { name: 'Omeprazole 20mg Cap', category: 'Gastroprotective', dispensed: 115, stock: 600, percentage: 40 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* 1. GREETINGS & PUBLIC PORTAL BANNER                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs border-l-4 border-l-[#0d9488]">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Activity className="w-7 h-7 text-[#0d9488]" />
            <span>
              {userRole ? `${getGreeting()}, ${userName}` : 'Welcome to MediClinic Enterprise Operations'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal">
            Real-time outpatient telemetry, clinical analytics, and facility operational status.
          </p>
        </div>
        <div className="flex gap-3">
          {!userRole ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Staff Portal Login</span>
            </button>
          ) : (
            <>
              {userRole === 'doctor' && (
                <button 
                  type="button"
                  onClick={() => onNavigateTab('consultation')} 
                  className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Queue &amp; Consultation</span>
                </button>
              )}
              {userRole === 'pharmacist' && (
                <button 
                  type="button"
                  onClick={() => onNavigateTab('dispensary')} 
                  className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Pill className="w-4 h-4" />
                  <span>Go to Dispensary</span>
                </button>
              )}
              {userRole === 'clinic-assistant' && (
                <button 
                  type="button"
                  onClick={() => onNavigateTab('registration')} 
                  className="px-5 py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Patient Registration</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATISTICAL KPI TELEMETRY CARDS                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Today's Encounters */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-2xl p-5 shadow-2xs hover:border-[#0d9488] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Today's Encounters</span>
            <span className="p-2 rounded-xl bg-[#e0f5f2] border border-[#b2f5ea] text-[#0d9488]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
              {totalEncountersToday}
            </span>
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Outpatient registrations &amp; walk-ins</p>
        </div>

        {/* KPI 2: Active Waiting Queue */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-2xl p-5 shadow-2xs hover:border-[#0d9488] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Active Queue Volume</span>
            <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
              {activeQueueCount}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Avg Wait: <strong className="text-[#0d9488] font-mono font-bold">11m</strong>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Triage: {triageQueue.length} | Doctor: {doctorQueue.length} | Pharmacy: {pharmacyQueue.length}</p>
        </div>

        {/* KPI 3: Today's Financial Billing */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-2xl p-5 shadow-2xs hover:border-[#0d9488] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Daily Revenue &amp; Claims</span>
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-[#0284c7]">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-slate-500">RM</span>
            <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
              {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Cash + Corporate TPA Panel claims</p>
        </div>

        {/* KPI 4: Clinic Operational Efficiency */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-2xl p-5 shadow-2xs hover:border-[#0d9488] transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Clinic Efficiency Index</span>
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
              96.4%
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              OPTIMAL
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">KKM &amp; EMR SLA target compliance</p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. STATISTICAL CHARTS ROW 1: PATIENT TRAFFIC & ICD DIAGNOSIS             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Hourly Patient Flow Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#ccfbf1] mb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0d9488]" />
                Hourly Outpatient Throughput Trend
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Peak hour patient traffic and queue volume throughout operating hours.</p>
            </div>
            <span className="text-[10px] bg-[#e0f5f2] text-[#0d9488] font-mono px-2.5 py-1 rounded-full border border-[#b2f5ea] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEncounters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccfbf1" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#5eead4' }}
                />
                <Area type="monotone" dataKey="encounters" name="Patients Attended" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEncounters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ICD-10 Diagnosis Breakdown Pie Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-[#ccfbf1] mb-5">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                ICD-10 Diagnosis Distribution
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Top clinical diagnoses recorded today.</p>
            </div>

            <div className="h-48 w-full relative flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={icdBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    stroke="none"
                  >
                    {icdBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-black font-mono text-slate-900">114</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cases</span>
              </div>
            </div>
          </div>

          {/* Mini Legend */}
          <div className="space-y-2 mt-auto border-t border-[#ccfbf1] pt-4 text-xs">
            {icdBreakdownData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2 truncate max-w-[180px]">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-semibold">{item.name}</span>
                </span>
                <span className="font-mono font-black text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. STATISTICAL CHARTS ROW 2: PAYER MIX & DRUG CONSUMPTION TELEMETRY       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payer Mix Bar Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs">
          <div className="pb-4 border-b border-[#ccfbf1] mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                Payer &amp; TPA Panel Settlement Mix
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Revenue split across Corporate Panels and Self-Pay.</p>
            </div>
            <span className="text-[10px] text-[#0284c7] bg-sky-50 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider border border-sky-200">
              MYR Currency
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payerMixData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ccfbf1" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis dataKey="provider" type="category" tick={{ fontSize: 11, fill: '#1e293b' }} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" name="Total Claims (RM)" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fast-Moving Medications Progress Meters (6 Cols) */}
        <div className="lg:col-span-6 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs">
          <div className="pb-4 border-b border-[#ccfbf1] mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                Pharmacy Fast-Moving Drugs Telemetry
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Top dispensed pharmaceuticals and current warehouse stock reserve.</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
              FIFO Stock Active
            </span>
          </div>

          <div className="space-y-4">
            {fastMovingDrugs.map((drug, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900">{drug.name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Dispensed: <strong className="text-[#0d9488]">{drug.dispensed}</strong> / Stock: {drug.stock}
                  </span>
                </div>
                <div className="w-full bg-[#e0f5f2] h-2.5 rounded-full overflow-hidden border border-[#b2f5ea]">
                  <div 
                    className="h-full bg-[#0d9488] rounded-full transition-all duration-500" 
                    style={{ width: `${drug.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. CLINICAL INFORMATION & OPERATIONAL DIRECTORY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Clinic Facility & License Info (7 Cols) */}
        <div className="lg:col-span-7 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0d9488]" />
              Clinic Operating Information &amp; Licensing
            </h3>
            <span className="text-[10px] bg-[#f7fdfd] border border-[#ccfbf1] text-slate-700 px-2.5 py-1 rounded-full font-mono font-bold">
              Reg #KKM-2026-SL-8902
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-extrabold mb-1">Location Address</strong>
                  <span className="leading-relaxed block">Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-600 pt-1">
                <Phone className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-extrabold mb-1">24/7 Hotline &amp; Ambulance</strong>
                  <span className="leading-relaxed block">+60 3-5510 8899 / emergency@mediclinic.my</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-[#ccfbf1] pt-4 md:pt-0 md:pl-6">
              <div className="flex items-start gap-3 text-slate-600">
                <Clock className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-extrabold mb-1">Operating Schedule</strong>
                  <span className="leading-relaxed block">Mon – Sun: 08:00 AM – 10:00 PM</span>
                  <span className="block text-[10px] text-emerald-700 font-extrabold mt-1 uppercase tracking-wide">Open on Public Holidays</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-600 pt-1">
                <ShieldCheck className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-extrabold mb-1">Accreditation</strong>
                  <span className="leading-relaxed block">Malaysian Medical Council (MMC) &amp; KKM PWA Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On-Duty Clinician Roster (5 Cols) */}
        <div className="lg:col-span-5 bg-[#f0fdfa] border border-[#ccfbf1] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0d9488]" />
              On-Duty Medical Staff Roster
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
              Shift Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:border-[#0d9488]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Dr. Sarah Jenkins, MD</strong>
                <span className="text-[11px] text-[#0d9488] font-semibold">Attending Physician (Consultation Suite 101)</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider bg-[#0d9488] text-white">
                DOCTOR
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:border-[#0d9488]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Pharm. Ahmad Razak, B.Pharm</strong>
                <span className="text-[11px] text-teal-700 font-semibold">Chief Pharmacist (Compounding Suite)</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider bg-[#0f766e] text-white">
                PHARMACIST
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:border-[#0d9488]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Siti Aishah Binti Ramli</strong>
                <span className="text-[11px] text-slate-600 font-medium">Triage &amp; Biometric Registration</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider bg-[#e0f5f2] text-[#0d9488] border border-[#b2f5ea]">
                CLINIC ASSISTANT
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
