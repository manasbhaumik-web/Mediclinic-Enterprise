import { useColorTheme } from '../../hooks/useColorTheme';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ROLE_BANNER, bannerFor, getGreeting } from '../../domain/roleBanner';
import { TRANSLATIONS } from '../../data';
import { Visit, Patient, UserRole, Language } from '../../types';
import { getPersonaAvatar } from '../../utils/personaAvatars';
import { 
  Activity, Users, Stethoscope, Pill, CreditCard, Clock, 
  TrendingUp, ArrowUpRight, ShieldCheck, MapPin, Phone, Building2,
  Calendar, CheckCircle2, ChevronRight, AlertCircle, BarChart3, PieChart as PieChartIcon, Zap, LogIn, Download, Filter, FileText, ExternalLink, RefreshCw, LayoutDashboard, User
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

import ProgressBar from '../../components/ui/ProgressBar';
import LegendSwatch from '../../components/ui/LegendSwatch';
import { chartTheme } from '../../theme/chartTheme';
import { palette, seriesColors } from '../../theme/palette';
import { useInventory } from '../../context/InventoryContext';
import { useTelemetry } from '../../context/TelemetryContext';
import MicroSparkline from './MicroSparkline';
import type { KpiId, PanelId } from './types';
import KpiCards from './KpiCards';
import FlowAndDiagnosisCharts from './FlowAndDiagnosisCharts';
import PayerAndPharmacyCharts from './PayerAndPharmacyCharts';
import ClinicDirectory from './ClinicDirectory';
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
  onOpenAdmin,}: LandingDashboardProps) {
  useColorTheme(); // re-render when the colour theme changes so palette colours refresh
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.EN;
  const isBM = activeLanguage === 'BM';

  // Time Horizon & Filter State
  const [isExporting, setIsExporting] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'urgent' | 'panel'>('all');

  const { exportTelemetryJson, logAuditEvent } = useTelemetry();

  const handleExportTelemetry = () => {
    setIsExporting(true);
    logAuditEvent('telemetry.exported', { totalEncountersToday, activeQueueCount, revenue: calculatedRevenue });
    setTimeout(() => {
      setIsExporting(false);
      exportTelemetryJson('mediclinic-telemetry-metrics');
    }, 400);
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
      modules: ['admin'],
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
  const roleConfig = { ...bannerFor(held.length > 0 ? held : ['admin'], activeLanguage), modules: union((c) => c.modules), kpis: union((c) => c.kpis), panels: union((c) => c.panels) };
  // Role worklists: the visits this role must act on next, longest wait first
  type WorkKind = 'consult' | 'dispense' | 'registered' | 'triage' | 'billing';
  const byWait = (list: Visit[]) =>
    list.slice().sort((a, b) => (a.registeredTime ?? Infinity) - (b.registeredTime ?? Infinity)).slice(0, 6);
  const WORK_SECTIONS: Record<WorkKind, { title: string; subtitle: string; cta: string; rowCta: string; tab: string; empty: string }> = {
    consult: {
      title: isBM ? 'Pesakit seterusnya' : 'Next patients',
      subtitle: isBM ? 'Menunggu paling lama dahulu. Pesakit dalam perundingan dipaparkan mengikut giliran.' : 'Longest-waiting first. Patients already in consultation are shown at their queue position.',
      cta: t.openFullQueue || 'Open full queue',
      rowCta: t.goToQueue || 'Go to queue',
      tab: 'queue',
      empty: t.noPatientsWaiting || 'No patients waiting.'
    },
    dispense: {
      title: isBM ? 'Preskripsi untuk didispens' : 'Prescriptions to dispense',
      subtitle: isBM ? 'Menunggu paling lama dahulu.' : 'Longest-waiting first.',
      cta: t.openDispensary || 'Open dispensary',
      rowCta: t.dispense || 'Dispense',
      tab: 'dispensary',
      empty: isBM ? 'Tiada preskripsi menunggu.' : 'No prescriptions waiting.'
    },
    registered: {
      title: isBM ? 'Berdaftar, menunggu triaj' : 'Registered, waiting for triage',
      subtitle: isBM ? 'Pesakit yang didaftarkan belum diambil tanda vital.' : 'Patients you registered who have not had their readings taken yet.',
      cta: t.openRegistration || 'Open registration',
      rowCta: t.openRegistration || 'Open registration',
      tab: 'registration',
      empty: isBM ? 'Tiada sesiapa menunggu triaj.' : 'No one is waiting for triage.'
    },
    triage: {
      title: isBM ? 'Menunggu triaj' : 'Waiting for triage',
      subtitle: isBM ? 'Pesakit berdaftar yang masih memerlukan bacaan tanda vital.' : 'Registered patients who still need vitals taken.',
      cta: t.openTriage || 'Open triage',
      rowCta: t.takeVitals || 'Take vitals',
      tab: 'triage',
      empty: isBM ? 'Tiada pesakit menunggu triaj.' : 'No patients waiting for triage.'
    },
    billing: {
      title: isBM ? 'Menunggu pembayaran' : 'Awaiting payment',
      subtitle: isBM ? 'Lawatan selesai sedia untuk juruwang.' : 'Visits finished and ready for the cashier.',
      cta: t.openBilling || 'Open billing',
      rowCta: t.collectPayment || 'Collect payment',
      tab: 'billing',
      empty: isBM ? 'Tiada lawatan menunggu pembayaran.' : 'No visits waiting for payment.'
    },
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
    if (o.temperature >= 38 || o.heartRate > 110 || o.bpSystolic >= 160 || o.respiratoryRate > 24) return t.abnormalVitals || 'Abnormal vitals';
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
      title: isBM ? 'Pendaftaran Pesakit & Triaj' : 'Patient Registration & Triage',
      subtitle: isBM ? 'OCR Biometrik MyKad, Rekod Pesakit & Giliran Triaj' : 'Biometric MyKad OCR, Patient Records & Triage Queue',
      icon: Users,
      badge: `${patientsList.length} ${t.registered || 'Registered'}`,
      badgeColor: 'chip-brand',
      actionText: isBM ? 'Lancarkan Pendaftaran' : 'Launch Registration',
      tabKey: 'registration'
    },
    {
      id: 'consultation',
      title: isBM ? 'Sut Perundingan Doktor' : 'Doctor Consultation Suite',
      subtitle: isBM ? 'Nota Rekod SOAP EHR, Kod ICD-10 & Sistem Panggilan PA' : 'SOAP EHR Notes, ICD-10 Coding & Public PA Call System',
      icon: Stethoscope,
      badge: `${doctorQueue.length} ${t.waiting || 'Waiting'}`,
      badgeColor: doctorQueue.length > 0 ? WAITING_BADGE : NEUTRAL_BADGE,
      actionText: isBM ? 'Masuk Sut Doktor' : 'Enter Doctor Suite',
      tabKey: 'consultation'
    },
    {
      id: 'dispensary',
      title: isBM ? 'Sut Farmasi & Dispensari' : 'Pharmacy & Dispensary Suite',
      subtitle: isBM ? 'Pengeluaran e-Preskripsi, Kelompok FIFO & Pelabelan' : 'e-Prescription Fulfillment, FIFO Batch & Labeling',
      icon: Pill,
      badge: `${pharmacyQueue.length} ${isBM ? 'Pesanan Menunggu' : 'Pending Orders'}`,
      badgeColor: 'chip-info',
      actionText: isBM ? 'Buka Dispensari' : 'Open Dispensary',
      tabKey: 'dispensary'
    },
    {
      id: 'billing',
      title: isBM ? 'Kaunter Pengebilan & Juruwang' : 'Billing Desk & Cashier',
      subtitle: isBM ? 'Tuntutan e-GL Panel Korporat, Tunai/DuitNow QR & Resit' : 'Corporate Panel e-GL Claims, Cash/QR & Receipts',
      icon: CreditCard,
      badge: `${cashierQueue.length} ${isBM ? 'Lawatan Belum Dibayar' : 'Unpaid Visits'}`,
      badgeColor: 'chip-info',
      actionText: isBM ? 'Lancarkan Kaunter Juruwang' : 'Launch Cashier Desk',
      tabKey: 'billing'
    },
    {
      id: 'report',
      title: isBM ? 'Laporan Bulanan Saya' : 'My Monthly Report',
      subtitle: isBM ? 'Perundingan disahkan, pengebilan dan diagnosis bulanan anda' : 'Your signed-off consultations, billing and diagnoses for the month',
      icon: BarChart3,
      badge: isBM ? 'Bulan ini' : 'This month',
      badgeColor: NEUTRAL_BADGE,
      actionText: isBM ? 'Buka Laporan Bulanan' : 'Open Monthly Report',
      tabKey: 'reports'
    },
    {
      id: 'queue',
      title: isBM ? 'Giliran Pesakit Saya' : 'My Patient Queue',
      subtitle: isBM ? 'Pesakit menunggu perundingan, disusun mengikut keutamaan triaj' : 'Patients waiting for consultation, ordered by triage priority',
      icon: Users,
      badge: `${doctorQueue.length} ${t.waiting || 'Waiting'}`,
      badgeColor: doctorQueue.length > 0 ? WAITING_BADGE : NEUTRAL_BADGE,
      actionText: isBM ? 'Buka Giliran' : 'Open Queue',
      tabKey: 'queue'
    },
    {
      id: 'triage',
      title: isBM ? 'Stesen Triaj' : 'Triage Station',
      subtitle: isBM ? 'Pengambilan tanda vital dan penetapan keutamaan sebelum perundingan' : 'Vitals capture and priority assignment before consultation',
      icon: Activity,
      badge: `${triageQueue.length} ${isBM ? 'Dalam Triaj' : 'In Triage'}`,
      badgeColor: 'chip-brand',
      actionText: isBM ? 'Buka Triaj' : 'Open Triage',
      tabKey: 'triage'
    },
    {
      id: 'appointments',
      title: isBM ? 'Temu Janji' : 'Appointments',
      subtitle: isBM ? 'Tempahan, daftar masuk dan penjadualan pesakit luar' : 'Bookings, check-ins and walk-in scheduling',
      icon: Calendar,
      badge: isBM ? 'Jadual' : 'Schedule',
      badgeColor: 'chip-info',
      actionText: isBM ? 'Buka Temu Janji' : 'Open Appointments',
      tabKey: 'appointments'
    },
    {
      id: 'admin',
      title: isBM ? 'Konsol Pentadbiran & Operasi' : 'Administrative & Operations Console',
      subtitle: isBM ? 'Pengurusan Kakitangan, Audit Keselamatan, Pematuhan KKM & Integrasi' : 'Staff Management, Security Audit, MOH Compliance & Integrations',
      icon: ShieldCheck,
      badge: isBM ? 'Pentadbir' : 'Admin',
      badgeColor: 'chip-info',
      actionText: isBM ? 'Buka Konsol' : 'Open Console',
      tabKey: 'admin'
    },
  ].filter((m) => roleConfig.modules.includes(m.id));




  // The staff shell hosts this block as its page banner; on the public page there is no slot, so it renders inline.
  const headerBanner = (
    <div className="workspace-banner-bar">
      {/* Left: Clinician profile badge & greetings */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="workspace-banner-avatar">
          <img 
            src={getPersonaAvatar(userRole)} 
            alt={userName || 'Staff'} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="workspace-banner-title">
            {userRole ? `${getGreeting(undefined, activeLanguage)}, ${userName}` : (isBM ? 'Papan Pemuka Ruang Kerja MediClinic Enterprise' : 'MediClinic Enterprise Workspace Dashboard')}
          </h2>
          <span className="workspace-banner-pill">
            {userRole ? roleConfig.label : (t.clinicOverview || 'Clinic overview')}
          </span>
          <span className="workspace-banner-status">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t.allSystemsOperational || 'All systems operational'}
          </span>
        </div>
      </div>

      {/* Right: Telemetry Export Action & Session Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-chrome-deep border border-white/15 text-white rounded-none shadow-none font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-teal-200" />
          <span>{isBM ? 'Sesi:' : 'Session:'} <strong className="text-white font-bold">{isBM ? 'Aktif' : 'Active'}</strong></span>
        </div>
        <button
          type="button"
          onClick={handleExportTelemetry}
          disabled={isExporting}
          className="workspace-banner-btn"
        >
          <Download className={`w-3.5 h-3.5 text-teal-200 ${isExporting ? 'animate-bounce' : ''}`} />
          <span className="font-mono text-2xs uppercase tracking-wider font-bold">
            {isExporting ? (t.exporting || 'Exporting...') : (t.exportTelemetry || 'Export Telemetry')}
          </span>
        </button>

        {!userRole && (
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-4 py-1.5 rounded-none bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer font-mono uppercase tracking-wider"
          >
            <LogIn className="w-4 h-4" />
            <span>{t.staffPortal || 'Staff Portal'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-ink">

      {/* Top telemetry control bar for authenticated staff (page banner is permanently hosted by EnterpriseLayoutTemplate) */}
      {!userRole ? (
        <section className="workspace-banner-section" aria-label="Page banner">
          {headerBanner}
        </section>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-line px-4 py-3 rounded-none shadow-2xs">
          <div>
            <h3 className="type-section-title text-ink font-bold">
              {isBM ? 'Pusat Kawalan & Pemantauan Operasi' : 'Clinical Operations & Command Center'}
            </h3>
            <p className="text-xs text-muted font-medium">
              {isBM
                ? 'Pemantauan masa nyata aliran pesakit, telemetri fasiliti dan metrik prestasi klinikal.'
                : 'Real-time telemetry, queue throughput, and clinical performance overview.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportTelemetry}
              disabled={isExporting}
              className="btn-outline-primary text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 font-mono"
            >
              <Download className={`w-3.5 h-3.5 text-accent ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? (t.exporting || 'Exporting...') : (t.exportTelemetry || 'Export Telemetry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ROLE WORKLISTS: what this role needs to act on next */}
      {showPanel('worklist') && worklists.map(({ kind, visits }) => {
        const cfg = WORK_SECTIONS[kind];
        const KindIcon = kind === 'dispense' ? Pill : kind === 'billing' ? CreditCard : kind === 'triage' ? Activity : Stethoscope;
        return (
          <div key={kind} className="bg-surface border border-line rounded-none shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 border-b border-line bg-surface-muted/20">
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-surface-muted border border-line text-accent shrink-0 rounded-none">
                  <KindIcon className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="type-card-title text-ink font-bold">{cfg.title}</h3>
                    <span className="font-mono text-2xs uppercase tracking-wider font-bold px-2 py-0.5 border border-line bg-surface text-accent">
                      <strong className="tabular-nums text-ink">{visits.length}</strong> {t.inQueue || 'in queue'}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{cfg.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(cfg.tab)}
                className="min-h-8 px-3 bg-primary hover:bg-deep text-white text-xs font-mono uppercase font-bold tracking-wider rounded-none cursor-pointer flex items-center gap-1 border border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {cfg.cta}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {visits.length === 0 ? (
              <div className="p-4 text-xs text-muted font-mono flex items-center justify-center gap-2">
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
                  const itemLabel = items.length === 1 ? (t.item || 'item') : (t.items || 'items');
                  const detail =
                    kind === 'dispense' ? `${items.length} ${itemLabel}${v.soap?.plan?.pharmacyMemo ? ` · Memo: ${v.soap.plan.pharmacyMemo}` : ''}`
                    : kind === 'billing' ? `${t.outstanding || 'Outstanding'} RM ${outstanding.toFixed(2)}${patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? ` · ${t.panelText || 'Panel'}: ${patient.panelEmployer}` : ` · ${t.selfPayText || 'Self-pay'}`}`
                    : kind === 'triage' ? (patient?.panelEmployer && !/^none/i.test(patient.panelEmployer) ? `${t.panelText || 'Panel'}: ${patient.panelEmployer}` : (t.selfPayText || 'Self-pay'))
                    : (v.soap?.subjective || (isBM ? 'Tiada aduan dicatat' : 'No complaint recorded'));

                  return (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-surface hover:bg-surface-muted/50 transition-colors border-b border-line-subtle last:border-b-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 shrink-0 flex items-center justify-center bg-surface-muted border border-line text-ink font-mono tabular-nums text-2xs font-bold">{idx + 1}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-ink truncate">{patient?.fullName ?? `Visit ${v.id}`}</p>
                            {patient?.gender && (
                              <span className="text-2xs font-mono text-muted uppercase">({patient.gender})</span>
                            )}
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">{detail}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {allergies.length > 0 && kind !== 'billing' && (
                          <span className="border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono text-2xs uppercase tracking-wider font-bold px-2 py-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {t.allergy || 'Allergy'}: {allergies.join(', ')}
                          </span>
                        )}
                        {flag && (
                          <span className="border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-mono text-2xs uppercase tracking-wider font-bold px-2 py-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {flag}
                          </span>
                        )}
                        {v.status === 'Consulting' && (
                          <span className="border border-teal-300 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-mono text-2xs uppercase tracking-wider font-bold px-2 py-0.5">
                            {t.inConsultation || 'In consultation'}
                          </span>
                        )}
                        <span className={`font-mono text-xs font-bold px-2 py-1 border flex items-center gap-1.5 ${mins !== null && mins >= 20 ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'border-line bg-surface-accent text-accent'}`}>
                          <Clock className="w-3 h-3" /> {mins !== null ? `${mins} min` : (t.justIn || 'Just in')}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab(cfg.tab)}
                          className="min-h-7 px-2.5 bg-surface hover:bg-surface-accent text-accent hover:text-ink border border-line text-2xs font-bold font-mono uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          {cfg.rowCta}
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
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
                <strong>{t.lowStock || 'Low stock'}:</strong>
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
        <div className="bg-surface border border-line px-3 py-2 rounded-none shadow-none flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-2xs font-mono uppercase font-bold tracking-wider text-muted">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            <span>{t.clinicalWorkspaces || 'Clinical Workspaces'}</span>
          </div>
          <nav aria-label="Workspaces" className="flex flex-wrap items-center gap-2">
            {workspaceModules.map((mod) => {
              const IconComponent = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => (mod.tabKey === 'admin' ? onOpenAdmin?.() : onNavigateTab(mod.tabKey))}
                  aria-label={`${mod.title}: ${mod.badge}`}
                  className="px-2.5 py-1.5 bg-surface hover:bg-surface-muted text-ink border border-line text-xs font-bold rounded-none cursor-pointer flex items-center gap-2 transition-colors group shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <IconComponent className="w-4 h-4 text-accent group-hover:text-primary transition-colors" aria-hidden="true" />
                  <span>{mod.title}</span>
                  <span className={`px-1.5 py-0.2 text-2xs font-mono font-bold uppercase tracking-wider border rounded-none ${mod.badgeColor}`}>{mod.badge}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="type-heading-caps text-muted flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            Choose a workspace
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {workspaceModules.map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => (mod.tabKey === 'admin' ? onOpenAdmin?.() : onNavigateTab(mod.tabKey))}
                aria-label={`${mod.title}: ${mod.badge}. ${mod.actionText}`}
                className="text-left w-full bg-surface border border-line p-3 rounded-none shadow-none hover:bg-surface-muted transition-colors cursor-pointer flex flex-col justify-between group gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="block space-y-2 w-full">
                  <span className="flex items-center justify-between">
                    <span className="p-1.5 bg-surface-muted border border-line-subtle group-hover:bg-surface-strong transition-colors rounded-none">
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
                    <span className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed block">
                      {mod.subtitle}
                    </span>
                  </span>
                </span>

                <span className="pt-2 border-t border-line-subtle flex items-center justify-between text-xs font-bold text-accent group-hover:text-ink transition-colors w-full font-mono uppercase tracking-wider">
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
