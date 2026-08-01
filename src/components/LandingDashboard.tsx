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
  const totalEncountersToday = completedVisits.length + doctorQueue.length + pharmacyQueue.length + cashierQueue.length + 18;
  const activeQueueCount = doctorQueue.length + pharmacyQueue.length;
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
      <Card className="border-l-4 border-l-[#0D9488]">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Activity className="w-7 h-7 text-[#0D9488]" />
              <span>
                {userRole ? `${getGreeting()}, ${userName}` : 'Welcome to MediClinic Enterprise Operations'}
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Real-time outpatient telemetry, clinical analytics, and facility operational status.
            </p>
          </div>
          <div className="flex gap-3">
            {!userRole ? (
              <Button onClick={onOpenLogin} icon={<LogIn className="w-4 h-4" />}>
                Staff Portal Login
              </Button>
            ) : (
              <>
                {userRole === 'doctor' && (
                  <Button onClick={() => onNavigateTab('consultation')} icon={<Stethoscope className="w-4 h-4" />}>
                    Queue &amp; Consultation
                  </Button>
                )}
                {userRole === 'pharmacist' && (
                  <Button onClick={() => onNavigateTab('dispensary')} icon={<Pill className="w-4 h-4" />}>
                    Go to Dispensary
                  </Button>
                )}
                {userRole === 'clinic-assistant' && (
                  <Button onClick={() => onNavigateTab('registration')} icon={<Users className="w-4 h-4" />}>
                    Patient Registration
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 2. STATISTICAL KPI TELEMETRY CARDS                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Today's Encounters */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wide">
              <span>Today's Encounters</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-[#0D9488]">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {totalEncountersToday}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Outpatient registrations &amp; walk-ins</p>
          </CardContent>
        </Card>

        {/* KPI 2: Active Waiting Queue */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wide">
              <span>Active Queue Volume</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {activeQueueCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Avg Wait: <strong className="text-slate-800 font-mono">11m</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Dr Lounge: {doctorQueue.length} | Pharmacy: {pharmacyQueue.length}</p>
          </CardContent>
        </Card>

        {/* KPI 3: Today's Financial Billing */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wide">
              <span>Daily Revenue &amp; Claims</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-500">RM</span>
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Cash + Corporate TPA Panel claims</p>
          </CardContent>
        </Card>

        {/* KPI 4: Clinic Operational Efficiency */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wide">
              <span>Clinic Efficiency Index</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                96.4%
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                OPTIMAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">KKM &amp; EMR SLA target compliance</p>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 3. STATISTICAL CHARTS ROW 1: PATIENT TRAFFIC & ICD DIAGNOSIS             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Hourly Patient Flow Area Chart (8 Cols) */}
        <Card className="lg:col-span-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0D9488]" />
                  Hourly Outpatient Throughput Trend
                </h3>
                <p className="text-xs text-slate-500 mt-1">Peak hour patient traffic and queue volume throughout operating hours.</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2.5 py-1 rounded-md border border-slate-200 font-medium tracking-wide uppercase">
                Live Stream
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEncounters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#5EEAD4' }}
                  />
                  <Area type="monotone" dataKey="encounters" name="Patients Attended" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorEncounters)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ICD-10 Diagnosis Breakdown Pie Chart (4 Cols) */}
        <Card className="lg:col-span-4 flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                ICD-10 Diagnosis Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-1">Top clinical diagnoses recorded today.</p>
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
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-bold font-mono text-slate-800">114</span>
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Cases</span>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="space-y-2.5 mt-auto border-t border-slate-100 pt-4 text-sm">
              {icdBreakdownData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2.5 truncate max-w-[200px]">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 4. STATISTICAL CHARTS ROW 2: PAYER MIX & DRUG CONSUMPTION TELEMETRY       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payer Mix Bar Chart (6 Cols) */}
        <Card className="lg:col-span-6">
          <CardContent className="p-6">
            <div className="pb-4 border-b border-slate-100 mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payer &amp; TPA Panel Settlement Mix
                </h3>
                <p className="text-xs text-slate-500 mt-1">Revenue split across Corporate Panels and Self-Pay.</p>
              </div>
              <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-mono font-semibold uppercase tracking-wide">
                MYR Currency
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payerMixData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis dataKey="provider" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', padding: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" name="Total Claims (RM)" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fast-Moving Medications Progress Meters (6 Cols) */}
        <Card className="lg:col-span-6">
          <CardContent className="p-6">
            <div className="pb-4 border-b border-slate-100 mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-600" />
                  Pharmacy Fast-Moving Drugs Telemetry
                </h3>
                <p className="text-xs text-slate-500 mt-1">Top dispensed pharmaceuticals and current warehouse stock reserve.</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-mono font-semibold uppercase tracking-wide">
                FIFO Stock Active
              </span>
            </div>

            <div className="space-y-5">
              {fastMovingDrugs.map((drug, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-800">{drug.name}</span>
                    <span className="font-mono text-slate-500 text-xs">
                      Dispensed: <strong className="text-slate-900">{drug.dispensed}</strong> / Stock: {drug.stock}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-[#0D9488] rounded-full transition-all duration-500" 
                      style={{ width: `${drug.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 5. CLINICAL INFORMATION & OPERATIONAL DIRECTORY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Clinic Facility & License Info (7 Cols) */}
        <Card className="lg:col-span-7">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0D9488]" />
                Clinic Operating Information &amp; Licensing
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono font-medium">
                Reg #KKM-2026-SL-8902
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 font-bold mb-1">Location Address</strong>
                    <span className="leading-relaxed block">Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600 pt-1">
                  <Phone className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 font-bold mb-1">24/7 Hotline &amp; Ambulance</strong>
                    <span className="leading-relaxed block">+60 3-5510 8899 / emergency@mediclinic.my</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-start gap-3 text-slate-600">
                  <Clock className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 font-bold mb-1">Operating Schedule</strong>
                    <span className="leading-relaxed block">Mon – Sun: 08:00 AM – 10:00 PM</span>
                    <span className="block text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wide">Open on Public Holidays</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600 pt-1">
                  <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 font-bold mb-1">Accreditation</strong>
                    <span className="leading-relaxed block">Malaysian Medical Council (MMC) &amp; KKM PWA Approved</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* On-Duty Clinician Roster (5 Cols) */}
        <Card className="lg:col-span-5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                On-Duty Medical Staff Roster
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wide">
                Shift Active
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors hover:bg-slate-100">
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Dr. Sarah Jenkins, MD</strong>
                  <span className="text-xs text-slate-500 font-medium">Attending Physician (Consultation Room 1)</span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-blue-100 text-blue-800">
                  DOCTOR
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors hover:bg-slate-100">
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Pharm. Ahmad Razak, B.Pharm</strong>
                  <span className="text-xs text-slate-500 font-medium">Chief Pharmacist (Compounding Suite)</span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-[#d97706] text-white">
                  PHARMACIST
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors hover:bg-slate-100">
                <div>
                  <strong className="block text-slate-900 font-bold mb-1">Siti Aishah Binti Ramli</strong>
                  <span className="text-xs text-slate-500 font-medium">Triage &amp; Biometric Registration</span>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-teal-100 text-teal-800">
                  CLINIC ASSISTANT
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
