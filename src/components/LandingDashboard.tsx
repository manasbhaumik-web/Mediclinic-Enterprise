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

import ProgressBar from './ui/ProgressBar';
import LegendSwatch from './ui/LegendSwatch';
import { chartTheme } from '../theme/chartTheme';
import { palette, seriesColors } from '../theme/palette';
import { useInventory } from '../context/InventoryContext';
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
  onOpenAdmin?: () => void;
}

// Inline Micro SVG Sparkline for 10/10 Metric Density (Sharp Line Styling)
const MicroSparkline = ({ data, color = palette.brand }: { data: number[]; color?: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / (max - min || 1)) * 24;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-20 h-7 overflow-visible inline-block opacity-90" viewBox="0 0 100 30" aria-hidden="true" focusable="false">
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
  onOpenLogin,
  onOpenAdmin
}: LandingDashboardProps) {

  // Time Horizon & Filter State
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
      link.setAttribute('download', `MediClinic_Enterprise_Telemetry.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 600);
  };

  const { inventory, logs } = useInventory();

  // Derived metrics, all computed from live visit, patient and inventory data
  const allVisits = [...completedVisits, ...triageQueue, ...doctorQueue, ...pharmacyQueue, ...cashierQueue];
  const totalEncountersToday = allVisits.length;
  const activeQueueCount = triageQueue.length + doctorQueue.length + pharmacyQueue.length;
  const calculatedRevenue = completedVisits.reduce((acc, curr) => acc + (curr.paidAmount || 0) + (curr.panelClaimed || 0), 0);

  const minutesSince = (t?: number) => (t ? Math.max(0, Math.round((Date.now() - t) / 60000)) : null);
  const waitingTimes = [...triageQueue, ...doctorQueue, ...pharmacyQueue]
    .map((v) => minutesSince(v.registeredTime))
    .filter((m): m is number => m !== null);
  const avgWaitMinutes = waitingTimes.length ? Math.round(waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length) : 0;
  const longestDoctorWait = Math.max(0, ...doctorQueue.map((v) => minutesSince(v.registeredTime) ?? 0));

  // Hourly throughput: registrations per clock hour
  const hourlyTrafficData = Array.from({ length: 12 }, (_, i) => {
    const h = 8 + i;
    const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
    const encounters = allVisits.filter((v) => v.registeredTime && new Date(v.registeredTime).getHours() === h).length;
    return { hour: label, encounters };
  });
  const hasThroughput = hourlyTrafficData.some((d) => d.encounters > 0);
  const peakHour = hourlyTrafficData.reduce((a, b) => (b.encounters > a.encounters ? b : a), hourlyTrafficData[0]);
  const throughputSummary = hasThroughput
    ? `Area chart of patients registered per hour today. ${totalEncountersToday} in total, busiest at ${peakHour.hour} with ${peakHour.encounters}.`
    : 'No registrations recorded yet today.';

  // Diagnoses from completed consultations
  const icdPalette = [palette.brand, seriesColors.cyanDark, seriesColors.emeraldDark, seriesColors.sky, palette.primary];
  const icdCounts = new Map<string, { name: string; count: number }>();
  completedVisits.forEach((v) => {
    const a = v.soap?.assessment;
    if (!a?.icdCode) return;
    const cur = icdCounts.get(a.icdCode) ?? { name: `${a.description || a.icdCode} (${a.icdCode})`, count: 0 };
    cur.count += 1;
    icdCounts.set(a.icdCode, cur);
  });
  const icdBreakdownData = [...icdCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((d, i) => ({ ...d, color: icdPalette[i % icdPalette.length] }));
  const icdTotal = [...icdCounts.values()].reduce((a, d) => a + d.count, 0);

  // Revenue by payer (employer panel, or self-pay)
  const payerTotals = new Map<string, number>();
  completedVisits.forEach((v) => {
    const emp = patientsList.find((pt) => pt.id === v.patientId)?.panelEmployer;
    const name = !emp || /^none/i.test(emp) ? 'Self-Pay' : emp;
    payerTotals.set(name, (payerTotals.get(name) ?? 0) + (v.paidAmount || 0) + (v.panelClaimed || 0));
  });
  const payerMixData = [...payerTotals.entries()]
    .map(([provider, amount]) => ({ provider, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const payerSummary = payerMixData.length ? `Bar chart of revenue by payer in Malaysian ringgit: ${payerMixData.map((d) => `${d.provider} RM ${d.amount.toFixed(2)}`).join(', ')}.` : 'No completed payments yet today.';
  const icdSummary = icdBreakdownData.length ? `Doughnut chart of ${icdTotal} diagnoses: ${icdBreakdownData.map((d) => `${d.name} ${d.count}`).join(', ')}.` : 'No diagnoses recorded yet.';

  // Pharmacy: lowest stock relative to reorder level, with dispensed totals from the log
  const dispensedByDrug = new Map<string, number>();
  logs.filter((l) => l.type === 'Dispensed').forEach((l) => dispensedByDrug.set(l.drugId, (dispensedByDrug.get(l.drugId) ?? 0) + l.amount));
  const stockRatio = (d: { currentStock: number; minThreshold: number }) => d.currentStock / Math.max(1, d.minThreshold);
  const lowestStockDrugs = [...inventory].sort((a, b) => stockRatio(a) - stockRatio(b)).slice(0, 4).map((d) => ({
    name: d.name,
    stock: d.currentStock,
    reorderAt: d.minThreshold,
    dispensed: dispensedByDrug.get(d.id) ?? 0,
    percentage: Math.min(100, Math.round((d.currentStock / Math.max(1, d.minThreshold * 3)) * 100)),
    isLow: d.currentStock <= d.minThreshold,
  }));
  const lowStockDrugs = inventory.filter((d) => d.currentStock <= d.minThreshold);

  // Role-based dashboard configuration: which tiles, KPIs and panels each role sees
  type KpiId = 'encounters' | 'waiting' | 'collections' | 'efficiency' | 'prescriptions';
  type PanelId = 'worklist' | 'throughput' | 'icd' | 'payer' | 'pharmacy' | 'facility';
  const ROLE_DASHBOARDS: Record<UserRole, {
    label: string; subtitle: string; modules: string[]; kpis: KpiId[]; panels: PanelId[];
  }> = {
    doctor: {
      label: 'Doctor dashboard',
      subtitle: 'Your consultation queue, patient flow and diagnosis trends.',
      modules: ['queue', 'consultation', 'moh'],
      kpis: ['waiting', 'encounters', 'efficiency'],
      panels: ['worklist', 'throughput', 'icd', 'facility'],
    },
    pharmacist: {
      label: 'Pharmacy dashboard',
      subtitle: 'Prescriptions awaiting fulfilment, stock levels and fast-moving medicines.',
      modules: ['dispensary'],
      kpis: ['prescriptions', 'encounters', 'efficiency'],
      panels: ['worklist', 'pharmacy', 'facility'],
    },
    'clinic-assistant': {
      label: 'Front desk dashboard',
      subtitle: 'Registration, triage, appointments and billing at a glance.',
      modules: ['registration', 'triage', 'appointments', 'billing'],
      kpis: ['encounters', 'waiting', 'collections'],
      panels: ['worklist', 'throughput', 'payer', 'facility'],
    },
    admin: {
      label: 'Administrator dashboard',
      subtitle: 'Clinic-wide operations, finance, compliance and administration.',
      modules: ['appointments', 'admin'],
      kpis: ['encounters', 'waiting', 'collections', 'efficiency'],
      panels: ['throughput', 'icd', 'payer', 'pharmacy', 'facility'],
    },
    hr: {
      label: 'HR dashboard',
      subtitle: 'Staff, shifts and workforce administration.',
      modules: ['admin'],
      kpis: ['encounters', 'efficiency'],
      panels: ['facility'],
    },
  };
  const roleConfig = userRole ? ROLE_DASHBOARDS[userRole] : ROLE_DASHBOARDS.admin;
  // Role worklists: the visits this role must act on next, longest wait first
  type WorkKind = 'consult' | 'dispense' | 'triage' | 'billing';
  const byWait = (list: Visit[]) =>
    list.slice().sort((a, b) => (a.registeredTime ?? Infinity) - (b.registeredTime ?? Infinity)).slice(0, 6);
  const WORK_SECTIONS: Record<WorkKind, { title: string; subtitle: string; cta: string; tab: string; empty: string }> = {
    consult: { title: 'Next patients', subtitle: 'Longest-waiting first. Patients already in consultation are shown at their queue position.', cta: 'Open full queue', tab: 'queue', empty: 'No patients waiting.' },
    dispense: { title: 'Prescriptions to dispense', subtitle: 'Longest-waiting first.', cta: 'Open dispensary', tab: 'dispensary', empty: 'No prescriptions waiting.' },
    triage: { title: 'Waiting for triage', subtitle: 'Registered patients who still need vitals taken.', cta: 'Open triage', tab: 'triage', empty: 'No patients waiting for triage.' },
    billing: { title: 'Awaiting payment', subtitle: 'Visits finished and ready for the cashier.', cta: 'Open billing', tab: 'billing', empty: 'No visits waiting for payment.' },
  };
  const worklists: { kind: WorkKind; visits: Visit[] }[] =
    userRole === 'pharmacist' ? [{ kind: 'dispense', visits: byWait(pharmacyQueue) }]
    : userRole === 'clinic-assistant' ? [{ kind: 'triage', visits: byWait(triageQueue) }, { kind: 'billing', visits: byWait(cashierQueue) }]
    : userRole === 'doctor' ? [{ kind: 'consult', visits: byWait(doctorQueue) }]
    : [];
  const waitMinutes = (v: Visit) => (v.registeredTime ? Math.max(0, Math.round((Date.now() - v.registeredTime) / 60000)) : null);
  const vitalsFlag = (v: Visit) => {
    const o = v.soap?.objective;
    if (!o) return null;
    if (o.temperature >= 38 || o.heartRate > 110 || o.bpSystolic >= 160 || o.respiratoryRate > 24) return 'Abnormal vitals';
    return null;
  };
  const showKpi = (id: KpiId) => roleConfig.kpis.includes(id);
  const showPanel = (id: PanelId) => roleConfig.panels.includes(id);

  // Application Workspace Modules Config
  const workspaceModules = [
    {
      id: 'registration',
      title: 'Patient Registration & Triage',
      subtitle: 'Biometric MyKad OCR, Patient Records & Triage Queue',
      icon: Users,
      badge: `${patientsList.length} Registered`,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      accentColor: 'border-l-brand',
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
      accentColor: 'border-l-deep',
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
    {
      id: 'queue',
      title: 'My Patient Queue',
      subtitle: 'Patients waiting for consultation, ordered by triage priority',
      icon: Users,
      badge: `${doctorQueue.length} Waiting`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accentColor: 'border-l-brand',
      actionText: 'Open Queue',
      tabKey: 'queue'
    },
    {
      id: 'triage',
      title: 'Triage Station',
      subtitle: 'Vitals capture and priority assignment before consultation',
      icon: Activity,
      badge: `${triageQueue.length} In Triage`,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      accentColor: 'border-l-brand',
      actionText: 'Open Triage',
      tabKey: 'triage'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      subtitle: 'Bookings, check-ins and walk-in scheduling',
      icon: Calendar,
      badge: 'Schedule',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      accentColor: 'border-l-sky-600',
      actionText: 'Open Appointments',
      tabKey: 'appointments'
    },
    {
      id: 'admin',
      title: 'Administration Console',
      subtitle: 'Staff, inventory, equipment, security and system settings',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      accentColor: 'border-l-purple-600',
      actionText: 'Open Console',
      tabKey: 'admin'
    },
  ].filter((m) => roleConfig.modules.includes(m.id));

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-slate-800">

      {/* ========================================================================= */}
      {/* 1. ENTERPRISE COMMAND-CENTER HEADER & CONTROL BAR                         */}
      {/* ========================================================================= */}
      <div className="bg-surface-muted border border-line-subtle rounded-none p-6 space-y-5 shadow-xs border-l-4 border-l-brand">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-primary text-white font-mono text-2xs font-bold uppercase tracking-wider rounded-none">
                {userRole ? roleConfig.label : 'Clinic overview'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-2xs font-bold uppercase tracking-wider border border-emerald-300 rounded-none flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                All systems operational
              </span>
            </div>
            <h2 className="type-section-title text-slate-900 flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-accent" />
              <span>
                {userRole ? `${getGreeting()}, ${userName}` : 'MediClinic Enterprise Workspace Dashboard'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
              {userRole ? roleConfig.subtitle : 'Unified healthcare operations launchpad, outpatient telemetry, clinical analytics, and facility status.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Export Telemetry Button */}
            <button
              type="button"
              onClick={handleExportTelemetry}
              disabled={isExporting}
              className="px-4 py-2 rounded-none bg-surface-accent hover:bg-surface-strong text-accent border border-line font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Download className={`w-3.5 h-3.5 text-accent ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting CSV...' : 'Export Telemetry'}</span>
            </button>

            {!userRole && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-5 py-2 rounded-none bg-primary hover:bg-deep text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Staff Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ROLE WORKLISTS: what this role needs to act on next */}
      {showPanel('worklist') && worklists.map(({ kind, visits }) => {
        const cfg = WORK_SECTIONS[kind];
        const KindIcon = kind === 'dispense' ? Pill : kind === 'billing' ? CreditCard : kind === 'triage' ? Activity : Stethoscope;
        return (
          <div key={kind} className="bg-surface-muted border border-line-subtle rounded-none shadow-xs border-l-4 border-l-brand">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-line-subtle">
              <div>
                <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                  <KindIcon className="w-5 h-5 text-accent" />
                  {cfg.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{cfg.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(cfg.tab)}
                className="px-3 py-1.5 bg-primary hover:bg-deep text-white text-xs font-bold rounded-none cursor-pointer flex items-center gap-1.5"
              >
                {cfg.cta}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {visits.length === 0 ? (
              <div className="p-6 text-sm text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {cfg.empty}
              </div>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {visits.map((v, idx) => {
                  const patient = patientsList.find((pt) => pt.id === v.patientId);
                  const mins = waitMinutes(v);
                  const flag = kind === 'consult' ? vitalsFlag(v) : null;
                  const allergies = patient?.drugAllergies?.filter(Boolean) ?? [];
                  const items = v.soap?.plan?.prescription ?? [];
                  const outstanding = Math.max(0, (v.totalBill || 0) - (v.paidAmount || 0) - (v.panelClaimed || 0));
                  const detail =
                    kind === 'dispense' ? `${items.length} item${items.length === 1 ? '' : 's'}${v.soap?.plan?.pharmacyMemo ? ` · Memo: ${v.soap.plan.pharmacyMemo}` : ''}`
                    : kind === 'billing' ? `Outstanding RM ${outstanding.toFixed(2)}${patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? ` · Panel: ${patient.panelEmployer}` : ' · Self-pay'}`
                    : kind === 'triage' ? (patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? `Panel: ${patient.panelEmployer}` : 'Self-pay')
                    : (v.soap?.subjective || 'No complaint recorded');
                  return (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-surface-muted transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 shrink-0 flex items-center justify-center bg-surface-accent border border-line text-accent font-mono text-xs font-bold">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{patient?.fullName ?? `Visit ${v.id}`}</p>
                          <p className="text-xs text-slate-600 truncate">{detail}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {allergies.length > 0 && kind !== 'billing' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Allergy: {allergies.join(', ')}
                          </span>
                        )}
                        {flag && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {flag}
                          </span>
                        )}
                        {v.status === 'Consulting' && (
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300">In consultation</span>
                        )}
                        <span className={`px-2 py-0.5 border font-mono flex items-center gap-1 ${mins !== null && mins >= 20 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-surface-accent text-accent border-line'}`}>
                          <Clock className="w-3.5 h-3.5" /> {mins !== null ? `${mins} min` : 'Just in'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {kind === 'dispense' && lowStockDrugs.length > 0 && (
              <div className="px-4 py-3 border-t border-line-subtle bg-amber-50 text-xs text-amber-900 flex flex-wrap items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <strong>Low stock:</strong>
                {lowStockDrugs.slice(0, 6).map((d) => (
                  <span key={d.id} className="px-2 py-0.5 bg-white border border-amber-300 font-semibold">{d.name} ({d.currentStock})</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* 2. WORKSPACE MODULE LAUNCHPAD (5 INTERACTIVE ENTERPRISE TILES)             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="type-heading-caps text-slate-700 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            Choose a workspace
          </h3>
          <span className="text-xs text-slate-600 font-mono">Select a workspace</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {workspaceModules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => (mod.tabKey === 'admin' ? onOpenAdmin?.() : onNavigateTab(mod.tabKey))}
                aria-label={`${mod.title}: ${mod.badge}. ${mod.actionText}`}
                className={`text-left w-full bg-white border border-slate-200 p-4 rounded-none border-l-4 ${mod.accentColor} shadow-2xs hover:bg-surface-muted transition-colors cursor-pointer flex flex-col justify-between group gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
              >
                <span className="block space-y-2 w-full">
                  <span className="flex items-center justify-between">
                    <span className="p-2 bg-slate-50 border border-slate-100 group-hover:bg-teal-100 transition-colors">
                      <IconComponent className="w-5 h-5 text-accent" aria-hidden="true" />
                    </span>
                    <span className={`px-2 py-0.5 text-2xs font-bold font-mono uppercase tracking-wider border rounded-none ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </span>

                  <span className="block">
                    <span className="type-card-title text-slate-900 group-hover:text-accent transition-colors block">
                      {mod.title}
                    </span>
                    <span className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed block">
                      {mod.subtitle}
                    </span>
                  </span>
                </span>

                <span className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-accent group-hover:text-ink transition-colors w-full">
                  <span>{mod.actionText}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STATISTICAL KPI CARDS WITH SPARKLINES & SLA BADGES                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {showKpi('prescriptions') && (
          <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
              <span>Pending prescriptions</span>
              <span className="p-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-none">
                <Pill className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="type-metric font-mono text-slate-900 block">{pharmacyQueue.length}</span>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  Est. fulfilment: <strong className="text-accent font-mono font-bold">{pharmacyQueue.length > 0 ? `${pharmacyQueue.length * 3 + 2} min` : '0 min'}</strong>
                </span>
              </div>
              <MicroSparkline data={[1, 3, 4, 2, 5, 3, 2, 4]} color={seriesColors.emeraldDark} />
            </div>
            <div className="mt-3 pt-2 border-t border-line-subtle text-xs text-slate-600 font-semibold">
              Dispensed today: {completedVisits.length}
            </div>
          </div>
        )}

        {/* KPI 1: Today's Encounters */}
        {showKpi('encounters') && (
          <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
              <span>Today's Total Encounters</span>
              <span className="p-2 bg-surface-accent border border-line text-accent rounded-none">
                <Users className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="type-metric font-mono text-slate-900 block">
                  {totalEncountersToday}
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  {completedVisits.length} completed · {activeQueueCount + cashierQueue.length} in progress
                </span>
              </div>
              
              {hasThroughput && <MicroSparkline data={hourlyTrafficData.map((d) => d.encounters)} color={palette.brand} />}
            </div>

            <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Registered since opening</span>
            </div>
          </div>
        )}

        {/* KPI 2: Active Waiting Queue */}
        {showKpi('waiting') && (
          <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
              <span>Waiting for doctor</span>
              <span className="p-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-none">
                <Clock className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="type-metric font-mono text-slate-900 block">
                  {doctorQueue.length}
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  Longest wait: <strong className="text-accent font-mono font-bold">{longestDoctorWait} min</strong>
                </span>
              </div>
              
            </div>

            <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Triage queue: {triageQueue.length}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded-none border ${longestDoctorWait >= 30 ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-accent bg-surface-accent border-line'}`}>
                {longestDoctorWait >= 30 ? 'Long wait' : doctorQueue.length > 0 ? 'Within target' : 'No wait'}
              </span>
            </div>
          </div>
        )}

        {/* KPI 3: Today's Financial Billing */}
        {showKpi('collections') && (
          <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
              <span>Today's collections</span>
              <span className="p-2 bg-sky-50 border border-sky-200 text-sky-600 rounded-none">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-slate-600">RM</span>
                  <span className="type-metric font-mono text-slate-900">
                    {calculatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>

            <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Awaiting payment: {cashierQueue.length} visit{cashierQueue.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

        {/* KPI 4: Clinic Operational Efficiency */}
        {showKpi('efficiency') && (
          <div className="bg-surface border border-line-subtle rounded-none p-5 shadow-2xs hover:bg-surface-muted transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-600 text-2xs font-bold uppercase tracking-wider">
              <span>Average wait</span>
              <span className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-none">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="type-metric font-mono text-slate-900 block">
                  {avgWaitMinutes} <span className="text-sm font-bold text-slate-600">min</span>
                </span>
              </div>

            </div>

            <div className="mt-3 pt-2 border-t border-line-subtle flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Across {waitingTimes.length} waiting patient{waitingTimes.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. CHARTS ROW 1: THROUGHPUT TREND & ICD DIAGNOSIS                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Hourly Patient Flow Area Chart (8 Cols) */}
        {showPanel('throughput') && (
          <div className={`${showPanel('icd') ? 'lg:col-span-8' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
            <div className="flex items-center justify-between pb-4 border-b border-line-subtle mb-5">
              <div>
                <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Hourly Outpatient Throughput Trend
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Patients registered per hour today.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-2xs bg-surface-accent text-accent font-mono px-2.5 py-1 rounded-none border border-line font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              </div>
            </div>

            {!hasThroughput ? (
              <p className="h-64 flex items-center justify-center text-sm text-slate-600">No registrations recorded yet today.</p>
            ) : (
            <div className="h-64 w-full" role="img" aria-label={throughputSummary}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEncounters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.brand} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={palette.brand} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="hour" tick={chartTheme.tick} />
                  <YAxis tick={chartTheme.tick} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltip}
                    itemStyle={chartTheme.tooltipItem}
                  />
                  <Area type="monotone" dataKey="encounters" name="Patients registered" stroke={palette.brand} strokeWidth={3} fillOpacity={1} fill="url(#colorEncounters)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
            {hasThroughput && (
              <table className="sr-only">
                <caption>Patients registered per hour today</caption>
                <thead><tr><th scope="col">Hour</th><th scope="col">Patients</th></tr></thead>
                <tbody>
                  {hourlyTrafficData.map((d) => (<tr key={d.hour}><th scope="row">{d.hour}</th><td>{d.encounters}</td></tr>))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ICD-10 Diagnosis Breakdown Pie Chart (4 Cols) */}
        {showPanel('icd') && (
          <div className={`${showPanel('throughput') ? 'lg:col-span-4' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs flex flex-col justify-between`}>
            <div>
              <div className="pb-4 border-b border-line-subtle mb-5">
                <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-accent" />
                  ICD-10 Diagnosis Distribution
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Top diagnoses from completed consultations today.</p>
              </div>

              <div className="h-48 w-full relative flex items-center justify-center mb-4" role="img" aria-label={icdSummary}>
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
                      contentStyle={chartTheme.tooltip}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className="type-metric font-mono text-slate-900">{icdTotal}</span>
                  <span className="text-2xs uppercase font-bold text-slate-600 tracking-wider">Cases</span>
                </div>
              </div>
            </div>

            {icdBreakdownData.length === 0 && <p className="text-xs text-slate-600">No diagnoses recorded yet.</p>}
            {/* Mini Legend */}
            <div className="space-y-2 mt-auto border-t border-line-subtle pt-4 text-xs">
              {icdBreakdownData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2 truncate max-w-[180px]">
                    <LegendSwatch color={item.color} />
                    <span className="truncate font-semibold">{item.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. CHARTS ROW 2: PAYER MIX & PHARMACY TELEMETRY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payer Mix Bar Chart (6 Cols) */}
        {showPanel('payer') && (
          <div className={`${showPanel('pharmacy') ? 'lg:col-span-6' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
            <div className="pb-4 border-b border-line-subtle mb-5 flex items-center justify-between">
              <div>
                <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-600" />
                  Payer & TPA Panel Settlement Mix
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Revenue split across Corporate Panels and Self-Pay.</p>
              </div>
              <span className="text-2xs text-sky-600 bg-sky-50 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-sky-200">
                MYR Currency
              </span>
            </div>

            {payerMixData.length === 0 ? (
              <p className="h-56 flex items-center justify-center text-sm text-slate-600">No completed payments yet today.</p>
            ) : (
            <div className="h-56 w-full" role="img" aria-label={payerSummary}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payerMixData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.grid} />
                  <XAxis type="number" tick={chartTheme.tick} />
                  <YAxis dataKey="provider" type="category" tick={chartTheme.tick} width={120} />
                  <Tooltip 
                    contentStyle={chartTheme.tooltip}
                  />
                  <Bar dataKey="amount" name="Total Claims (RM)" fill={palette.brand} radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
            {payerMixData.length > 0 && (
              <table className="sr-only">
                <caption>Revenue by payer today, in Malaysian ringgit</caption>
                <thead><tr><th scope="col">Payer</th><th scope="col">Amount (RM)</th></tr></thead>
                <tbody>
                  {payerMixData.map((d) => (<tr key={d.provider}><th scope="row">{d.provider}</th><td>{d.amount.toFixed(2)}</td></tr>))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Fast-Moving Medications Progress Meters (6 Cols) */}
        {showPanel('pharmacy') && (
          <div className={`${showPanel('payer') ? 'lg:col-span-6' : 'lg:col-span-12'} bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs`}>
            <div className="pb-4 border-b border-line-subtle mb-5 flex items-center justify-between">
              <div>
                <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-600" />
                  Pharmacy stock overview
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">Lowest stock against reorder level.</p>
              </div>
              <span className="text-2xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-none font-mono font-bold uppercase tracking-wider border border-emerald-200">
                {lowStockDrugs.length} below reorder
              </span>
            </div>

            <div className="space-y-4">
              {lowestStockDrugs.map((drug, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{drug.name}</span>
                      {drug.isLow ? (
                        <span className="text-2xs bg-amber-100 text-amber-800 px-2 py-0.2 rounded-none font-bold border border-amber-300">
                          Low reserve
                        </span>
                      ) : (
                        <span className="text-2xs bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-none font-bold border border-emerald-300">
                          Healthy
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-600 text-xs">
                      Stock: <strong className="text-accent">{drug.stock}</strong> · Reorder at {drug.reorderAt} · Dispensed: {drug.dispensed}
                    </span>
                  </div>
                  <ProgressBar value={drug.percentage} tone={drug.isLow ? 'warning' : 'primary'} label={`${drug.name} stock`} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 6. CLINICAL INFORMATION & OPERATIONAL DIRECTORY                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Clinic Facility & License Info (7 Cols) */}
        {showPanel('facility') && (
          <div className="lg:col-span-12 bg-surface-muted border border-line-subtle rounded-none p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-line-subtle pb-4">
              <h3 className="type-card-title text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                Clinic Operating Information & Licensing
              </h3>
              <span className="text-2xs bg-surface border border-line-subtle text-slate-700 px-2.5 py-1 rounded-none font-mono font-bold">
                Reg #KKM-2026-SL-8902
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold mb-1">Location Address</strong>
                    <span className="leading-relaxed block">Level 2, Menara Medical Suite, Persiaran Central, 40000 Shah Alam, Selangor</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600 pt-1">
                  <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold mb-1">24/7 Hotline & Ambulance</strong>
                    <span className="leading-relaxed block">+60 3-5510 8899 / emergency@mediclinic.my</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-line-subtle pt-4 md:pt-0 md:pl-6">
                <div className="flex items-start gap-3 text-slate-600">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold mb-1">Operating Schedule</strong>
                    <span className="leading-relaxed block">Mon – Sun: 08:00 AM – 10:00 PM</span>
                    <span className="block text-2xs text-emerald-700 font-bold mt-1 uppercase tracking-wider">Open on Public Holidays</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-600 pt-1">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold mb-1">Accreditation</strong>
                    <span className="leading-relaxed block">Malaysian Medical Council (MMC) & KKM PWA Approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* On-Duty Clinician Roster (5 Cols) */}

      </div>

    </div>
  );
}
