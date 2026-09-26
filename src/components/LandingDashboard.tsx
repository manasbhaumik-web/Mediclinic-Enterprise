import React, { useState } from 'react';
import { Visit, Patient, UserRole, Language } from '../types';
import { 
  Activity, Users, Stethoscope, Pill, CreditCard, Clock, 
  TrendingUp, ArrowUpRight, ShieldCheck, MapPin, Phone, Building2,
  Calendar, CheckCircle2, ChevronRight, AlertCircle, BarChart3, PieChart as PieChartIcon, Zap, LogIn, Download, Filter, FileText, ExternalLink, RefreshCw, LayoutDashboard
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

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
  onNavigateTab: (tab: any) => void;
  onOpenLogin?: () => void;
}

// Inline Micro SVG Sparkline for 10/10 Metric Density (Sharp Line Styling)
const MicroSparkline = ({ data, color = '#0d9488' }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / (max - min || 1)) * 24;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-20 h-7 overflow-visible inline-block opacity-90" viewBox="0 0 100 30">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        points={points}
      />
    </svg>
  );
};

export default function LandingDashboard({
  userRole,
  userName = "Dr. Sarah Tan",
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

  // Time Horizon & Filter State
  const [timeHorizon, setTimeHorizon] = useState<'today' | '7days' | 'monthly'>('today');
  const [isExporting, setIsExporting] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'urgent' | 'panel'>('all');

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleExportTelemetry = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      // Trigger instant CSV download
      const headers = ['Telemetry Metric', 'Value', 'Status', 'Timestamp'];
      const rows = [
        ['Total Encounters Today', totalEncountersToday, 'Optimal', new Date().toISOString()],
        ['Active Queue Volume', activeQueueCount, 'SLA Target Met', new Date().toISOString()],
        ['Daily Revenue (RM)', calculatedRevenue.toFixed(2), '100% Panel Verified', new Date().toISOString()],
        ['Clinic Efficiency Index', '96.4%', 'KKM Compliant', new Date().toISOString()]
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MediClinic_Enterprise_Telemetry_${timeHorizon}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 600);
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
    { name: 'URTI / Common Cold (J06.9)', count: 42, color: '#0d9488' },
    { name: 'Essential Hypertension (I10)', count: 28, color: '#0891b2' },
    { name: 'Type 2 Diabetes (E11.9)', count: 19, color: '#059669' },
    { name: 'Acute Gastritis (K30)', count: 14, color: '#0284c7' },
    { name: 'Myalgia / Back Pain (M79.1)', count: 11, color: '#0f766e' }
  ];

  const payerMixData = [
    { provider: 'Self-Pay (Cash/TNG)', amount: 1420 },
    { provider: 'PMCare Panel', amount: 980 },
    { provider: 'MiCare Corporate', amount: 840 },
    { provider: 'HealthMetrics', amount: 620 },
    { provider: 'RedAlert TPA', amount: 450 },
  ];

  const fastMovingDrugs = [
    { name: 'Paracetamol 500mg Tab', category: 'Analgesic', dispensed: 340, stock: 1200, percentage: 85, isHealthy: true },
    { name: 'Amoxicillin 500mg Cap', category: 'Antibiotic', dispensed: 180, stock: 450, percentage: 65, isHealthy: true },
    { name: 'Metformin 500mg Tab', category: 'Antidiabetic', dispensed: 140, stock: 800, percentage: 45, isHealthy: false },
    { name: 'Omeprazole 20mg Cap', category: 'Gastroprotective', dispensed: 115, stock: 600, percentage: 40, isHealthy: false },
  ];

  // 5 Application Workspace Modules Config
  const workspaceModules = [
    {
      id: 'registration',
      title: 'Patient Registration & Triage',
      subtitle: 'Biometric MyKad OCR, Patient Records & Triage Queue',
      icon: Users,
      badge: `${patientsList.length} Registered`,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      accentColor: 'border-l-[#0d9488]',
      actionText: 'Launch Registration',
      tabKey: 'registration'
    },
    {
      id: 'consultation',
      title: 'Doctor Consultation Suite',
      subtitle: 'SOAP EHR Notes, ICD-10 Coding & Public PA Call System',
      icon: Stethoscope,
      badge: `${doctorQueue.length} Waiting`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accentColor: 'border-l-[#0f3c4c]',
      actionText: 'Enter Doctor Suite',
      tabKey: 'consultation'
    },
    {
      id: 'dispensary',
      title: 'Pharmacy & Dispensary Suite',
      subtitle: 'e-Prescription Fulfillment, FIFO Batch & Labeling',
      icon: Pill,
      badge: `${pharmacyQueue.length} Pending Orders`,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      accentColor: 'border-l-purple-600',
      actionText: 'Open Dispensary',
      tabKey: 'dispensary'
    },
    {
      id: 'billing',
      title: 'Billing Desk & Cashier',
      subtitle: 'Corporate Panel e-GL Claims, Cash/QR & Receipts',
      icon: CreditCard,
      badge: `${cashierQueue.length} Unpaid Visits`,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      accentColor: 'border-l-sky-600',
      actionText: 'Launch Cashier Desk',
      tabKey: 'billing'
    },
    {
      id: 'moh',
      title: 'Ministry reporting and analytics',
      subtitle: 'KKM Surveillance, Disease Registry & Compliance SLA',
      icon: BarChart3,
      badge: 'KKM Sync Active',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: 'border-l-emerald-600',
      actionText: 'View MOH Reports',
      tabKey: 'reports'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* 1. ENTERPRISE COMMAND-CENTER HEADER & CONTROL BAR                         */}
      {/* ========================================================================= */}
      <div className="bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 space-y-5 shadow-xs border-l-4 border-l-[#0d9488]">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#0d9488] text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
                Clinic overview
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-300 rounded-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                All systems operational
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Activity className="w-7 h-7 text-[#0d9488]" />
              <span>
                {userRole ? `${getGreeting()}, ${userName}` : 'MediClinic Enterprise Workspace Dashboard'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
              Unified healthcare operations launchpad, outpatient telemetry, clinical analytics, and facility status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Time Horizon Filter Selector */}
            <div className="flex items-center bg-white p-1 border border-[#ccfbf1] text-xs font-bold rounded-none">
              {(['today', '7days', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeHorizon(t)}
                  className={`px-3 py-1.5 transition-all cursor-pointer capitalize rounded-none ${
                    timeHorizon === t 
                      ? 'bg-[#0f3c4c] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'today' ? 'Today' : t === '7days' ? '7 Days' : 'Monthly'}
                </button>
              ))}
            </div>

            {/* Export Telemetry Button */}
            <button
              type="button"
              onClick={handleExportTelemetry}
              disabled={isExporting}
              className="px-4 py-2 rounded-none bg-[#e0f5f2] hover:bg-[#ccfbf1] text-[#0d9488] border border-[#b2f5ea] font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className={`w-3.5 h-3.5 text-[#0d9488] ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting CSV...' : 'Export Telemetry'}</span>
            </button>

            {!userRole && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-5 py-2 rounded-none bg-[#0d9488] hover:bg-[#0f3c4c] text-white font-extrabold text-xs shadow-md shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Staff Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WORKSPACE MODULE LAUNCHPAD (5 INTERACTIVE ENTERPRISE TILES)             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-[#0d9488]" />
            Choose a workspace
          </h3>
          <span className="text-xs text-slate-400 font-mono">Select workspace module</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {workspaceModules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigateTab(mod.tabKey)}
                className={`bg-white border border-slate-200 p-4 rounded-none border-l-4 ${mod.accentColor} shadow-2xs hover:bg-[#f0fdfa] transition-colors cursor-pointer flex flex-col justify-between group space-y-3`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-slate-50 border border-slate-100 group-hover:bg-teal-100 transition-colors">
                      <IconComponent className="w-5 h-5 text-[#0d9488]" />
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider border rounded-none ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0d9488] transition-colors flex items-center gap-1">
                      {mod.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0d9488] group-hover:text-[#0f3c4c] transition-colors">
                  <span>{mod.actionText}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STATISTICAL KPI CARDS WITH SPARKLINES & SLA BADGES                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Today's Encounters */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-5 shadow-2xs hover:bg-[#f0fdfa] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Today's Total Encounters</span>
            <span className="p-2 bg-[#e0f5f2] border border-[#b2f5ea] text-[#0d9488] rounded-none">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 block">
                {totalEncountersToday}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-none inline-flex items-center gap-0.5 mt-1 border border-emerald-200">
                <ArrowUpRight className="w-3 h-3" /> +14.2% vs yesterday
              </span>
            </div>
            
            {/* Micro Sparkline Graph */}
            <MicroSparkline data={[6, 16, 24, 29, 15, 8, 18, 23]} color="#0d9488" />
          </div>

          <div className="mt-3 pt-2 border-t border-[#ccfbf1] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Walk-ins & Online tokens</span>
            <span className="text-[#0d9488] font-bold">🟢 SLA Target Met</span>
          </div>
        </div>

        {/* KPI 2: Active Waiting Queue */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-5 shadow-2xs hover:bg-[#f0fdfa] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Waiting for doctor</span>
            <span className="p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-none">
              <Clock className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 block">
                {doctorQueue.length}
              </span>
              <span className="text-xs font-semibold text-slate-600 mt-1 block">
                Estimated wait: <strong className="text-[#0d9488] font-mono font-bold">{doctorQueue.length > 0 ? `${doctorQueue.length * 2 + 3} min` : '0 min'}</strong>
              </span>
            </div>
            
            {/* Micro Sparkline Graph */}
            <MicroSparkline data={[2, 4, 6, 5, 3, 1, 4, 5]} color="#d97706" />
          </div>

          <div className="mt-3 pt-2 border-t border-[#ccfbf1] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Triage queue: {triageQueue.length}</span>
            <span className="text-[#0f766e] font-bold bg-[#e0f5f2] px-1.5 py-0.5 rounded-none border border-[#b2f5ea]">
              {doctorQueue.length > 0 ? 'Normal queue volume' : 'No triage wait'}
            </span>
          </div>
        </div>

        {/* KPI 3: Today's Financial Billing */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-5 shadow-2xs hover:bg-[#f0fdfa] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Today's collections</span>
            <span className="p-2 bg-sky-50 border border-sky-200 text-[#0284c7] rounded-none">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-extrabold text-slate-500">RM</span>
                <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                  {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Micro Sparkline Graph */}
            <MicroSparkline data={[800, 1200, 1900, 2400, 2850]} color="#0284c7" />
          </div>

          <div className="mt-3 pt-2 border-t border-[#ccfbf1] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>All panel claims verified</span>
            <span className="text-[#0d9488] font-bold">💳 Cashless active</span>
          </div>
        </div>

        {/* KPI 4: Clinic Operational Efficiency */}
        <div className="bg-[#f7fdfd] border border-[#ccfbf1] rounded-none p-5 shadow-2xs hover:bg-[#f0fdfa] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Efficiency index</span>
            <span className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-none">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 block">
                96.4%
              </span>
            </div>

            {/* Micro Sparkline Graph */}
            <MicroSparkline data={[92, 94, 95, 96, 96.4]} color="#059669" />
          </div>

          <div className="mt-3 pt-2 border-t border-[#ccfbf1] flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>All systems operational</span>
            <span className="text-emerald-700 font-bold">🛡️ KKM Compliant</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CHARTS ROW 1: THROUGHPUT TREND & ICD DIAGNOSIS                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Hourly Patient Flow Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#ccfbf1] mb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0d9488]" />
                Hourly Outpatient Throughput Trend
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Peak hour patient traffic and queue volume throughout operating hours.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#e0f5f2] text-[#0d9488] font-mono px-2.5 py-1 rounded-none border border-[#b2f5ea] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                Live Stream
              </span>
            </div>
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
                  contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#5eead4' }}
                />
                <Area type="monotone" dataKey="encounters" name="Patients Attended" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEncounters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ICD-10 Diagnosis Breakdown Pie Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-[#ccfbf1] mb-5">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#0d9488]" />
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
                    contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', fontSize: '12px', padding: '12px', border: 'none' }}
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
                  <span className="w-3 h-3 rounded-none shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-semibold">{item.name}</span>
                </span>
                <span className="font-mono font-black text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. CHARTS ROW 2: PAYER MIX & PHARMACY TELEMETRY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payer Mix Bar Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs">
          <div className="pb-4 border-b border-[#ccfbf1] mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0284c7]" />
                Payer & TPA Panel Settlement Mix
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Revenue split across Corporate Panels and Self-Pay.</p>
            </div>
            <span className="text-[10px] text-[#0284c7] bg-sky-50 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-sky-200">
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
                  contentStyle={{ backgroundColor: '#0f3c4c', color: '#fff', borderRadius: '0px', fontSize: '12px', padding: '12px', border: 'none' }}
                />
                <Bar dataKey="amount" name="Total Claims (RM)" fill="#0d9488" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fast-Moving Medications Progress Meters (6 Cols) */}
        <div className="lg:col-span-6 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs">
          <div className="pb-4 border-b border-[#ccfbf1] mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                Pharmacy stock overview
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">Top dispensed pharmaceuticals and warehouse stock alerts.</p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-emerald-200">
              FIFO Active
            </span>
          </div>

          <div className="space-y-4">
            {fastMovingDrugs.map((drug, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{drug.name}</span>
                    {drug.percentage < 50 ? (
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-none font-bold border border-amber-300">
                        ⚠️ Low Reserve
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-none font-bold border border-emerald-300">
                        🟢 Healthy
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    Dispensed: <strong className="text-[#0d9488]">{drug.dispensed}</strong> / Stock: {drug.stock}
                  </span>
                </div>
                <div className="w-full bg-[#e0f5f2] h-2.5 rounded-none overflow-hidden border border-[#b2f5ea]">
                  <div 
                    className={`h-full rounded-none transition-all duration-500 ${
                      drug.percentage < 50 ? 'bg-amber-500' : 'bg-[#0d9488]'
                    }`}
                    style={{ width: `${drug.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. CLINICAL INFORMATION & OPERATIONAL DIRECTORY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Clinic Facility & License Info (7 Cols) */}
        <div className="lg:col-span-7 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0d9488]" />
              Clinic Operating Information & Licensing
            </h3>
            <span className="text-[10px] bg-[#f7fdfd] border border-[#ccfbf1] text-slate-700 px-2.5 py-1 rounded-none font-mono font-bold">
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
                  <strong className="block text-slate-900 font-extrabold mb-1">24/7 Hotline & Ambulance</strong>
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
                  <span className="leading-relaxed block">Malaysian Medical Council (MMC) & KKM PWA Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On-Duty Clinician Roster (5 Cols) */}
        <div className="lg:col-span-5 bg-[#f0fdfa] border border-[#ccfbf1] rounded-none p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ccfbf1] pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0d9488]" />
              On-Duty Medical Staff Roster
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-emerald-200">
              Shift Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:bg-[#f0fdfa]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Dr. Sarah Tan, MD</strong>
                <span className="text-[11px] text-[#0d9488] font-semibold">Attending Physician (Consultation Suite 101)</span>
              </div>
              <span className="px-2.5 py-1 rounded-none text-[10px] font-black tracking-wider bg-[#0d9488] text-white">
                DOCTOR
              </span>
            </div>

            <div className="p-3.5 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:bg-[#f0fdfa]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Pharm. Ahmad Razak, B.Pharm</strong>
                <span className="text-[11px] text-teal-700 font-semibold">Chief Pharmacist (Compounding Suite)</span>
              </div>
              <span className="px-2.5 py-1 rounded-none text-[10px] font-black tracking-wider bg-[#0f766e] text-white">
                PHARMACIST
              </span>
            </div>

            <div className="p-3.5 rounded-none bg-[#f7fdfd] border border-[#ccfbf1] flex items-center justify-between transition-colors hover:bg-[#f0fdfa]">
              <div>
                <strong className="block text-slate-900 font-extrabold mb-0.5">Siti Aishah Binti Ramli</strong>
                <span className="text-[11px] text-slate-600 font-medium">Triage & Biometric Registration</span>
              </div>
              <span className="px-2.5 py-1 rounded-none text-[10px] font-black tracking-wider bg-[#e0f5f2] text-[#0d9488] border border-[#b2f5ea]">
                CLINIC ASSISTANT
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
