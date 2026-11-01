import React, { useEffect, useMemo, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import {
  Activity, AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Clock, PackageSearch,
  RefreshCw, Stethoscope, Users, ShieldAlert, Timer, Microscope, Siren, Lock, Radio, Thermometer, HeartPulse, Award, UserCheck
} from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import ClinicalIncidentModal from './ClinicalIncidentModal';
import ClinicThroughputModal from './ClinicThroughputModal';
import POCTQualityControlModal from './POCTQualityControlModal';
import EmergencySBARModal from './EmergencySBARModal';
import RadiationSafetyModal from './RadiationSafetyModal';
import ColdChainVaccineModal from './ColdChainVaccineModal';
import AEFIAndSharpsModal from './AEFIAndSharpsModal';
import CKAPSDossierModal from './CKAPSDossierModal';
import LocumDoctorModal from './LocumDoctorModal';
import RedCodeAlarmModal from './RedCodeAlarmModal';
import { useClinicData } from '../../hooks/useClinicData';
import { useDrugs, useInventorySettings, usePurchaseOrders } from '../../hooks/useInventoryData';
import { useEquipmentList, useEquipmentSettings } from '../../hooks/useEquipment';
import { buildAlerts } from '../../domain/inventory';
import { buildEquipmentAlerts } from '../../domain/equipment';
import {
  WAIT_TARGET_MINUTES, localDateKey, summarizeAppointments, summarizeFlow, summarizeOrders,
} from '../../domain/operations';

interface OperationsHubProps {
  /** Opens another Administration section (e.g. 'medicine', 'equipment'). */
  onOpenTab?: (tab: 'medicine' | 'equipment') => void;
}

const SEVERITY_STYLE = {
  critical: 'chip-danger',
  warn: 'chip-warn',
  info: 'bg-slate-50 text-muted border-line',
} as const;

const MAX_ATTENTION_ROWS = 5;

export default function OperationsHub({ onOpenTab }: OperationsHubProps) {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  // Re-evaluate waits and "today" once a minute without refetching.
  const [now, setNow] = useState(() => Date.now());
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isThroughputModalOpen, setIsThroughputModalOpen] = useState(false);
  const [isPOCTModalOpen, setIsPOCTModalOpen] = useState(false);
  const [isSBARModalOpen, setIsSBARModalOpen] = useState(false);
  const [isRadiationModalOpen, setIsRadiationModalOpen] = useState(false);
  const [isColdChainModalOpen, setIsColdChainModalOpen] = useState(false);
  const [isAefiModalOpen, setIsAefiModalOpen] = useState(false);
  const [isCkapsModalOpen, setIsCkapsModalOpen] = useState(false);
  const [isLocumModalOpen, setIsLocumModalOpen] = useState(false);
  const [isRedCodeModalOpen, setIsRedCodeModalOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const today = localDateKey(new Date(now));

  const clinic = useClinicData();
  const drugs = useDrugs();
  const orders = usePurchaseOrders();
  const equipment = useEquipmentList();
  const { settings: inventorySettings } = useInventorySettings();
  const { settings: equipmentSettings } = useEquipmentSettings();

  const flow = useMemo(() => summarizeFlow(clinic.visitsQueue, now), [clinic.visitsQueue, now]);
  const appts = useMemo(() => summarizeAppointments(clinic.appointments, today), [clinic.appointments, today]);
  const orderSummary = useMemo(() => summarizeOrders(orders.data ?? [], today), [orders.data, today]);

  const stockAlerts = useMemo(
    () => buildAlerts(drugs.data ?? [], inventorySettings.data?.nearExpiryDays ?? 60, today).filter((a) => a.severity !== 'info'),
    [drugs.data, inventorySettings.data, today],
  );
  const equipmentAlerts = useMemo(
    () => buildEquipmentAlerts(equipment.data ?? [], equipmentSettings.data?.dueSoonDays ?? 30, today).filter((a) => a.severity !== 'info'),
    [equipment.data, equipmentSettings.data, today],
  );
  const equipmentName = useMemo(() => new Map((equipment.data ?? []).map((e) => [e.id, e.name])), [equipment.data]);

  const critical = stockAlerts.filter((a) => a.severity === 'critical').length + equipmentAlerts.filter((a) => a.severity === 'critical').length;
  const loadError = clinic.syncError || drugs.error || orders.error || equipment.error;
  const minutes = (m: number | null) => (m === null ? '—' : `${m} min`);

  const flowStages = [
    { label: 'Triage', value: flow.triage },
    { label: 'Doctor', value: flow.doctor },
    { label: 'Pharmacy', value: flow.pharmacy },
    { label: 'Cashier', value: flow.cashier },
  ];
  const busiest = Math.max(1, ...flowStages.map((s) => s.value));

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-accent" aria-hidden="true" />
            Operations Overview
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Today's patient flow, appointments, stock and equipment, read from the clinic's live records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setNow(Date.now()); void queryClient.invalidateQueries(); }}
          disabled={isFetching}
          className="bg-surface hover:bg-surface-accent text-ink text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Some figures could not be loaded and may be incomplete. Use Refresh to try again.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsRedCodeModalOpen(true)}
          className="px-3.5 py-2 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 rounded-none flex items-center gap-2 cursor-pointer shadow-sm animate-pulse"
        >
          <Siren className="w-4 h-4 text-white" />
          <span>🚨 CODE RED RESUS ALARM</span>
        </button>
        <button
          type="button"
          onClick={() => setIsIncidentModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Clinical Incidents &amp; Near-Misses (CKAPS / OSHA)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsThroughputModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-accent border border-line rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Timer className="w-4 h-4 text-accent" />
          <span>Outpatient Turnaround Time (TAT) &amp; Bottleneck Monitor</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPOCTModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Microscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>POCT Device Quality Control (PHFSA § 38)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsSBARModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Siren className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>Emergency Hospital Transfers (SBAR)</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenTab ? onOpenTab('medicine') : undefined}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Lock className="w-4 h-4 text-rose-600" />
          <span>Dangerous Drugs Safe (DDA 1952)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsRadiationModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Radiation Safety &amp; X-Ray (Act 304)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsColdChainModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Thermometer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Cold Chain &amp; Vaccine Temp Log (+2°C to +8°C)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsAefiModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <HeartPulse className="w-4 h-4 text-rose-600" />
          <span>AEFI &amp; Sharps PEP (OSHA / BPKK)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsCkapsModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>CKAPS Form B Inspection Dossier (MOH Act 586)</span>
        </button>
        <button
          type="button"
          onClick={() => setIsLocumModalOpen(true)}
          className="px-3.5 py-2 text-xs font-bold bg-surface hover:bg-surface-accent text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 rounded-none flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Locum Doctor Shifts &amp; Indemnity (MMC)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Patients in clinic" value={String(flow.inClinic)} note={`${flow.waiting} waiting to be seen`} />
        <Kpi
          icon={Clock}
          label="Longest wait"
          value={minutes(flow.longestWaitMins)}
          note={flow.waiting ? `Average ${minutes(flow.avgWaitMins)} · target under ${WAIT_TARGET_MINUTES}` : 'Nobody waiting'}
          tone={flow.overTarget > 0 ? 'warn' : 'ok'}
          badge={flow.overTarget > 0 ? `${flow.overTarget} over target` : undefined}
        />
        <Kpi
          icon={CalendarDays}
          label="Today's appointments"
          value={String(appts.total)}
          note={`${appts.scheduled} still scheduled · ${appts.completed} completed`}
        />
        <Kpi
          icon={AlertTriangle}
          label="Critical alerts"
          value={String(critical)}
          note={`${stockAlerts.length} stock · ${equipmentAlerts.length} equipment need attention`}
          tone={critical > 0 ? 'bad' : 'ok'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Panel icon={Users} title="Patient flow">
            <div className="space-y-3">
              {flowStages.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-ink">{s.label}</span>
                    <span className="text-muted font-mono">{s.value}</span>
                  </div>
                  <ProgressBar value={(s.value / busiest) * 100} size="sm" label={`${s.label}: ${s.value} patients`} />
                </div>
              ))}
              {clinic.isSyncing && <p className="text-2xs text-subtle">Loading visits…</p>}
            </div>
          </Panel>

          <Panel icon={CalendarDays} title="Appointments today">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Stat label="Scheduled" value={appts.scheduled} />
              <Stat label="Completed" value={appts.completed} />
              <Stat label="No-show" value={appts.noShow} />
              <Stat label="Cancelled" value={appts.cancelled} />
            </dl>
            <p className="mt-3 text-xs text-muted">
              {appts.attendanceRate === null
                ? 'Attendance rate appears once an appointment is completed or marked no-show.'
                : `Attendance rate: ${appts.attendanceRate}% of concluded appointments were attended.`}
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            icon={PackageSearch}
            title="Stock needing attention"
            action={onOpenTab && <PanelLink label="Open Inventory" onClick={() => onOpenTab('medicine')} />}
          >
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted mb-3">
              <span>{orderSummary.open} open purchase order{orderSummary.open === 1 ? '' : 's'}</span>
              <span className={orderSummary.overdue ? 'text-rose-700 font-bold' : ''}>{orderSummary.overdue} overdue</span>
              <span>{orderSummary.drafts} draft{orderSummary.drafts === 1 ? '' : 's'}</span>
            </div>
            <AttentionList
              loading={drugs.isPending}
              empty="No low, out-of-stock or expiring items."
              rows={stockAlerts.map((a) => ({ key: `${a.drugId}-${a.kind}-${a.batchId ?? ''}`, severity: a.severity, title: a.drugName, detail: a.detail }))}
            />
          </Panel>

          <Panel
            icon={Stethoscope}
            title="Equipment needing attention"
            action={onOpenTab && <PanelLink label="Open Equipment" onClick={() => onOpenTab('equipment')} />}
          >
            <AttentionList
              loading={equipment.isPending}
              empty="No equipment is overdue or out of service."
              rows={equipmentAlerts.map((a) => ({ key: `${a.equipmentId}-${a.kind}`, severity: a.severity, title: equipmentName.get(a.equipmentId) ?? 'Equipment', detail: a.detail }))}
            />
          </Panel>
        </div>
      </div>

      <ClinicalIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />

      <ClinicThroughputModal
        isOpen={isThroughputModalOpen}
        onClose={() => setIsThroughputModalOpen(false)}
      />

      <POCTQualityControlModal
        isOpen={isPOCTModalOpen}
        onClose={() => setIsPOCTModalOpen(false)}
      />

      <EmergencySBARModal
        isOpen={isSBARModalOpen}
        onClose={() => setIsSBARModalOpen(false)}
      />

      <RadiationSafetyModal
        isOpen={isRadiationModalOpen}
        onClose={() => setIsRadiationModalOpen(false)}
      />

      <ColdChainVaccineModal
        isOpen={isColdChainModalOpen}
        onClose={() => setIsColdChainModalOpen(false)}
      />

      <AEFIAndSharpsModal
        isOpen={isAefiModalOpen}
        onClose={() => setIsAefiModalOpen(false)}
      />

      <CKAPSDossierModal
        isOpen={isCkapsModalOpen}
        onClose={() => setIsCkapsModalOpen(false)}
      />

      <LocumDoctorModal
        isOpen={isLocumModalOpen}
        onClose={() => setIsLocumModalOpen(false)}
      />

      <RedCodeAlarmModal
        isOpen={isRedCodeModalOpen}
        onClose={() => setIsRedCodeModalOpen(false)}
      />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, badge, tone = 'ok' }: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  label: string; value: string; note: string; badge?: string; tone?: 'ok' | 'warn' | 'bad';
}) {
  const badgeStyle = tone === 'bad' ? SEVERITY_STYLE.critical : SEVERITY_STYLE.warn;
  return (
    <div className="bg-surface rounded-none border border-line p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-subtle uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-teal-50 rounded-none text-accent"><Icon className="w-5 h-5" aria-hidden="true" /></div>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h3 className="type-metric text-ink">{value}</h3>
        {badge && <span className={`text-xs px-2 py-0.5 border font-medium ${badgeStyle}`}>{badge}</span>}
      </div>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, action, children }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-none border border-line shadow-2xs overflow-hidden">
      <div className="border-b border-teal-100 bg-surface p-4 flex items-center justify-between gap-3">
        <h2 className="type-card-title text-ink flex items-center gap-2"><Icon className="w-4 h-4 text-accent" aria-hidden="true" />{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const PanelLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer">
    {label}<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
  </button>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-surface border border-teal-100 p-3">
    <dt className="text-2xs text-subtle font-bold uppercase">{label}</dt>
    <dd className="type-metric text-ink mt-1">{value}</dd>
  </div>
);

function AttentionList({ rows, loading, empty }: {
  rows: { key: string; severity: keyof typeof SEVERITY_STYLE; title: string; detail: string }[];
  loading: boolean; empty: string;
}) {
  if (loading) return <p className="text-xs text-subtle">Loading…</p>;
  if (rows.length === 0) {
    return <p className="flex items-center gap-2 text-xs text-emerald-700 font-medium"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />{empty}</p>;
  }
  const shown = rows.slice(0, MAX_ATTENTION_ROWS);
  return (
    <ul className="space-y-2">
      {shown.map((r) => (
        <li key={r.key} className={`border p-2.5 text-xs ${SEVERITY_STYLE[r.severity]}`}>
          <p className="font-bold">{r.title}</p>
          <p className="mt-0.5">{r.detail}</p>
        </li>
      ))}
      {rows.length > shown.length && <li className="text-2xs text-subtle">+{rows.length - shown.length} more</li>}
    </ul>
  );
}
