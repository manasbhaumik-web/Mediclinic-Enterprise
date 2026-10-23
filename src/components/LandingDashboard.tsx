import { useColorTheme } from '../hooks/useColorTheme';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ROLE_BANNER, bannerFor, getGreeting } from '../lib/roleBanner';
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
import MicroSparkline from './dashboard/MicroSparkline';
import type { KpiId, PanelId } from './dashboard/types';
import KpiCards from './dashboard/KpiCards';
import FlowAndDiagnosisCharts from './dashboard/FlowAndDiagnosisCharts';
import PayerAndPharmacyCharts from './dashboard/PayerAndPharmacyCharts';
import ClinicDirectory from './dashboard/ClinicDirectory';
interface LandingDashboardProps {
  userRole: UserRole | null;
  /** Every role the person holds. The dashboard shows the union of their tiles, KPIs, panels and worklists. */
  roles?: UserRole[];
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

export default function LandingDashboard({
  userRole,
  roles,
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
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh

  // Time Horizon & Filter State
  const [isExporting, setIsExporting] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'urgent' | 'panel'>('all');

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
  const ROLE_DASHBOARDS: Record<UserRole, {
    label: string; subtitle: string; modules: string[]; kpis: KpiId[]; panels: PanelId[];
  }> = {
    doctor: {
      ...ROLE_BANNER['doctor'],
      modules: ['queue', 'consultation', 'report'],
      kpis: ['waiting', 'encounters', 'efficiency'],
      panels: ['worklist', 'throughput', 'icd', 'facility'],
    },
    pharmacist: {
      ...ROLE_BANNER['pharmacist'],
      modules: ['dispensary'],
      kpis: ['prescriptions', 'encounters', 'efficiency'],
      panels: ['worklist', 'pharmacy', 'facility'],
    },
    receptionist: {
      ...ROLE_BANNER['receptionist'],
      modules: ['registration', 'appointments'],
      kpis: ['encounters', 'waiting'],
      panels: ['worklist', 'throughput', 'facility'],
    },
    'clinic-assistant': {
      ...ROLE_BANNER['clinic-assistant'],
      modules: ['triage'],
      kpis: ['waiting', 'encounters'],
      panels: ['worklist', 'throughput', 'facility'],
    },
    cashier: {
      ...ROLE_BANNER['cashier'],
      modules: ['billing'],
      kpis: ['collections', 'encounters'],
      panels: ['worklist', 'payer', 'facility'],
    },
    admin: {
      ...ROLE_BANNER['admin'],
      modules: ['appointments', 'admin'],
      kpis: ['encounters', 'waiting', 'collections', 'efficiency'],
      panels: ['throughput', 'icd', 'payer', 'pharmacy', 'facility'],
    },
    hr: {
      ...ROLE_BANNER['hr'],
      modules: ['admin'],
      kpis: ['encounters', 'efficiency'],
      panels: ['facility'],
    },
  };
  // Someone with several roles (a small clinic's front desk) gets the union of what each role sees.
  const held: UserRole[] = roles && roles.length > 0 ? roles : userRole ? [userRole] : [];
  const configs = (held.length > 0 ? held : (['admin'] as UserRole[])).map((r) => ROLE_DASHBOARDS[r]);
  const union = <T,>(pick: (c: (typeof configs)[number]) => T[]): T[] => Array.from(new Set(configs.flatMap(pick)));
  const roleConfig = { ...bannerFor(held.length > 0 ? held : ['admin']), modules: union((c) => c.modules), kpis: union((c) => c.kpis), panels: union((c) => c.panels) };
  // Role worklists: the visits this role must act on next, longest wait first
  type WorkKind = 'consult' | 'dispense' | 'registered' | 'triage' | 'billing';
  const byWait = (list: Visit[]) =>
    list.slice().sort((a, b) => (a.registeredTime ?? Infinity) - (b.registeredTime ?? Infinity)).slice(0, 6);
  const WORK_SECTIONS: Record<WorkKind, { title: string; subtitle: string; cta: string; rowCta: string; tab: string; empty: string }> = {
    consult: { title: 'Next patients', subtitle: 'Longest-waiting first. Patients already in consultation are shown at their queue position.', cta: 'Open full queue', rowCta: 'Go to queue', tab: 'queue', empty: 'No patients waiting.' },
    dispense: { title: 'Prescriptions to dispense', subtitle: 'Longest-waiting first.', cta: 'Open dispensary', rowCta: 'Dispense', tab: 'dispensary', empty: 'No prescriptions waiting.' },
    registered: { title: 'Registered, waiting for triage', subtitle: 'Patients you registered who have not had their readings taken yet.', cta: 'Open registration', rowCta: 'Open registration', tab: 'registration', empty: 'No one is waiting for triage.' },
    triage: { title: 'Waiting for triage', subtitle: 'Registered patients who still need vitals taken.', cta: 'Open triage', rowCta: 'Take vitals', tab: 'triage', empty: 'No patients waiting for triage.' },
    billing: { title: 'Awaiting payment', subtitle: 'Visits finished and ready for the cashier.', cta: 'Open billing', rowCta: 'Collect payment', tab: 'billing', empty: 'No visits waiting for payment.' },
  };
  // In visit order: registered, triage, consult, dispense, billing. Each role's list is only what it acts on.
  const worklists: { kind: WorkKind; visits: Visit[] }[] = [
    ...(held.includes('receptionist') && !held.includes('clinic-assistant') ? [{ kind: 'registered' as WorkKind, visits: byWait(triageQueue) }] : []),
    ...(held.includes('clinic-assistant') ? [{ kind: 'triage' as WorkKind, visits: byWait(triageQueue) }] : []),
    ...(held.includes('doctor') ? [{ kind: 'consult' as WorkKind, visits: byWait(doctorQueue) }] : []),
    ...(held.includes('pharmacist') ? [{ kind: 'dispense' as WorkKind, visits: byWait(pharmacyQueue) }] : []),
    ...(held.includes('cashier') ? [{ kind: 'billing' as WorkKind, visits: byWait(cashierQueue) }] : []),
  ];
  const waitMinutes = (v: Visit) => (v.registeredTime ? Math.max(0, Math.round((Date.now() - v.registeredTime) / 60000)) : null);
  const vitalsFlag = (v: Visit) => {
    const o = v.soap?.objective;
    if (!o) return null;
    if (o.temperature >= 38 || o.heartRate > 110 || o.bpSystolic >= 160 || o.respiratoryRate > 24) return 'Abnormal vitals';
    return null;
  };
  const showKpi = (id: KpiId) => roleConfig.kpis.includes(id);
  const showPanel = (id: PanelId) => roleConfig.panels.includes(id);

  const WAITING_BADGE = 'chip-warn';
  const NEUTRAL_BADGE = 'chip-neutral';

  // Application Workspace Modules Config
  const workspaceModules = [
    {
      id: 'registration',
      title: 'Patient Registration & Triage',
      subtitle: 'Biometric MyKad OCR, Patient Records & Triage Queue',
      icon: Users,
      badge: `${patientsList.length} Registered`,
      badgeColor: 'chip-brand',
      actionText: 'Launch Registration',
      tabKey: 'registration'
    },
    {
      id: 'consultation',
      title: 'Doctor Consultation Suite',
      subtitle: 'SOAP EHR Notes, ICD-10 Coding & Public PA Call System',
      icon: Stethoscope,
      badge: `${doctorQueue.length} Waiting`,
      badgeColor: doctorQueue.length > 0 ? WAITING_BADGE : NEUTRAL_BADGE,
      actionText: 'Enter Doctor Suite',
      tabKey: 'consultation'
    },
    {
      id: 'dispensary',
      title: 'Pharmacy & Dispensary Suite',
      subtitle: 'e-Prescription Fulfillment, FIFO Batch & Labeling',
      icon: Pill,
      badge: `${pharmacyQueue.length} Pending Orders`,
      badgeColor: 'chip-info',
      actionText: 'Open Dispensary',
      tabKey: 'dispensary'
    },
    {
      id: 'billing',
      title: 'Billing Desk & Cashier',
      subtitle: 'Corporate Panel e-GL Claims, Cash/QR & Receipts',
      icon: CreditCard,
      badge: `${cashierQueue.length} Unpaid Visits`,
      badgeColor: 'chip-info',
      actionText: 'Launch Cashier Desk',
      tabKey: 'billing'
    },
    {
      id: 'report',
      title: 'My Monthly Report',
      subtitle: 'Your signed-off consultations, billing and diagnoses for the month',
      icon: BarChart3,
      badge: 'This month',
      badgeColor: NEUTRAL_BADGE,
      actionText: 'Open Monthly Report',
      tabKey: 'reports'
    },
    {
      id: 'queue',
      title: 'My Patient Queue',
      subtitle: 'Patients waiting for consultation, ordered by triage priority',
      icon: Users,
      badge: `${doctorQueue.length} Waiting`,
      badgeColor: doctorQueue.length > 0 ? WAITING_BADGE : NEUTRAL_BADGE,
      actionText: 'Open Queue',
      tabKey: 'queue'
    },
    {
      id: 'triage',
      title: 'Triage Station',
      subtitle: 'Vitals capture and priority assignment before consultation',
      icon: Activity,
      badge: `${triageQueue.length} In Triage`,
      badgeColor: 'chip-brand',
      actionText: 'Open Triage',
      tabKey: 'triage'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      subtitle: 'Bookings, check-ins and walk-in scheduling',
      icon: Calendar,
      badge: 'Schedule',
      badgeColor: 'chip-info',
      actionText: 'Open Appointments',
      tabKey: 'appointments'
    },
    {
      id: 'admin',
      title: 'Administration Console',
      subtitle: 'Staff, inventory, equipment, security and system settings',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'chip-info',
      actionText: 'Open Console',
      tabKey: 'admin'
    },
  ].filter((m) => roleConfig.modules.includes(m.id));

  const [bannerSlot, setBannerSlot] = useState<HTMLElement | null>(() => document.getElementById('page-banner-slot'));
  React.useEffect(() => { setBannerSlot(document.getElementById('page-banner-slot')); }, []);

  // The staff shell hosts this block as its page banner; on the public page there is no slot, so it renders inline.
  const headerBanner = (
    <>
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-primary text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
                {userRole ? roleConfig.label : 'Clinic overview'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-300 rounded-none flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                All systems operational
              </span>
            </div>
            <h2 className="type-section-title text-ink flex items-center gap-2.5">
              <span>
                {userRole ? `${getGreeting()}, ${userName}` : 'MediClinic Enterprise Workspace Dashboard'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-ink/75 mt-1 font-normal">
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
    </>
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-ink">

      {/* ========================================================================= */}
      {/* 1. ENTERPRISE COMMAND-CENTER HEADER & CONTROL BAR                         */}
      {/* ========================================================================= */}
      {bannerSlot ? createPortal(headerBanner, bannerSlot) : <div className="bg-surface border border-line-subtle rounded-none p-6 shadow-xs">{headerBanner}</div>}

      {/* ROLE WORKLISTS: what this role needs to act on next */}
      {showPanel('worklist') && worklists.map(({ kind, visits }) => {
        const cfg = WORK_SECTIONS[kind];
        const KindIcon = kind === 'dispense' ? Pill : kind === 'billing' ? CreditCard : kind === 'triage' ? Activity : Stethoscope;
        return (
          <div key={kind} className="bg-surface border border-line-subtle rounded-none shadow-xs">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-line-subtle">
              <div>
                <h3 className="type-card-title text-ink flex items-center gap-2">
                  <KindIcon className="w-5 h-5 text-accent" />
                  {cfg.title}
                </h3>
                <p className="text-xs text-ink/75 mt-0.5">{cfg.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(cfg.tab)}
                className="min-h-11 px-4 bg-primary hover:bg-deep text-white text-xs font-bold rounded-none cursor-pointer flex items-center gap-1.5"
              >
                {cfg.cta}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {visits.length === 0 ? (
              <div className="p-6 text-sm text-ink/75 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
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
                          <p className="text-sm font-bold text-ink truncate">{patient?.fullName ?? `Visit ${v.id}`}</p>
                          <p className="text-xs text-ink/75 truncate">{detail}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {allergies.length > 0 && kind !== 'billing' && (
                          <span className="chip chip-danger">
                            <AlertCircle className="w-3.5 h-3.5" /> Allergy: {allergies.join(', ')}
                          </span>
                        )}
                        {flag && (
                          <span className="chip chip-danger">
                            <AlertCircle className="w-3.5 h-3.5" /> {flag}
                          </span>
                        )}
                        {v.status === 'Consulting' && (
                          <span className="chip chip-info">In consultation</span>
                        )}
                        <span className={`chip font-mono ${mins !== null && mins >= 20 ? 'chip-warn' : 'chip-brand'}`}>
                          <Clock className="w-3.5 h-3.5" /> {mins !== null ? `${mins} min` : 'Just in'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab(cfg.tab)}
                          className="min-h-11 px-4 bg-primary hover:bg-deep text-white text-xs font-bold rounded-none cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                          {cfg.rowCta}
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {kind === 'dispense' && lowStockDrugs.length > 0 && (
              <div className="px-4 py-3 border-t border-line-subtle bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-100 flex flex-wrap items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <strong>Low stock:</strong>
                {lowStockDrugs.slice(0, 6).map((d) => (
                  <span key={d.id} className="chip chip-warn">{d.name} ({d.currentStock})</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* 2. WORKSPACE MODULE LAUNCHPAD (5 INTERACTIVE ENTERPRISE TILES)             */}
      {/* ========================================================================= */}
      {worklists.length > 0 ? (
        // A worklist leads this role's page, so the shortcuts shrink to one row of links
        <nav aria-label="Workspaces" className="flex flex-wrap items-center gap-2">
          <span className="type-heading-caps text-ink/75 mr-1">Workspaces</span>
          {workspaceModules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => (mod.tabKey === 'admin' ? onOpenAdmin?.() : onNavigateTab(mod.tabKey))}
                aria-label={`${mod.title}: ${mod.badge}`}
                className="min-h-11 px-3 bg-surface border border-line hover:bg-surface-strong text-ink text-xs font-bold rounded-none cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <IconComponent className="w-4 h-4 text-accent" aria-hidden="true" />
                {mod.title}
                <span className={`chip font-mono ${mod.badgeColor}`}>{mod.badge}</span>
              </button>
            );
          })}
        </nav>
      ) : (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="type-heading-caps text-ink/75 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            Choose a workspace
          </h3>
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
                className={`text-left w-full bg-surface border border-line p-4 rounded-none shadow-2xs hover:bg-surface-muted transition-colors cursor-pointer flex flex-col justify-between group gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
              >
                <span className="block space-y-2 w-full">
                  <span className="flex items-center justify-between">
                    <span className="p-2 bg-surface-muted border border-line-subtle group-hover:bg-surface-strong transition-colors">
                      <IconComponent className="w-5 h-5 text-accent" aria-hidden="true" />
                    </span>
                    <span className={`px-2 py-0.5 text-2xs font-bold font-mono uppercase tracking-wider border rounded-none ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </span>

                  <span className="block">
                    <span className="type-card-title text-ink group-hover:text-accent transition-colors block">
                      {mod.title}
                    </span>
                    <span className="text-xs text-ink/75 mt-1 line-clamp-2 leading-relaxed block">
                      {mod.subtitle}
                    </span>
                  </span>
                </span>

                <span className="pt-2 border-t border-line-subtle flex items-center justify-between text-xs font-bold text-accent group-hover:text-ink transition-colors w-full">
                  <span>{mod.actionText}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STATISTICAL KPI CARDS WITH SPARKLINES & SLA BADGES                     */}
      {/* ========================================================================= */}
      <KpiCards showKpi={showKpi} pharmacyQueue={pharmacyQueue} completedVisits={completedVisits} totalEncountersToday={totalEncountersToday} activeQueueCount={activeQueueCount} cashierQueue={cashierQueue} hasThroughput={hasThroughput} hourlyTrafficData={hourlyTrafficData} doctorQueue={doctorQueue} longestDoctorWait={longestDoctorWait} triageQueue={triageQueue} calculatedRevenue={calculatedRevenue} avgWaitMinutes={avgWaitMinutes} waitingTimes={waitingTimes} />

      {/* ========================================================================= */}
      {/* 4. CHARTS ROW 1: THROUGHPUT TREND & ICD DIAGNOSIS                          */}
      {/* ========================================================================= */}
      <FlowAndDiagnosisCharts showPanel={showPanel} hasThroughput={hasThroughput} throughputSummary={throughputSummary} hourlyTrafficData={hourlyTrafficData} icdSummary={icdSummary} icdBreakdownData={icdBreakdownData} icdTotal={icdTotal} />

      {/* ========================================================================= */}
      {/* 5. CHARTS ROW 2: PAYER MIX & PHARMACY TELEMETRY                           */}
      {/* ========================================================================= */}
      <PayerAndPharmacyCharts showPanel={showPanel} payerMixData={payerMixData} payerSummary={payerSummary} lowStockDrugs={lowStockDrugs} lowestStockDrugs={lowestStockDrugs} />

      {/* ========================================================================= */}
      {/* 6. CLINICAL INFORMATION & OPERATIONAL DIRECTORY                           */}
      {/* ========================================================================= */}
      <ClinicDirectory showPanel={showPanel} />

    </div>
  );
}
