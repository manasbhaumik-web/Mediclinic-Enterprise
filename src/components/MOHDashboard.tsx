import React, { useEffect, useMemo, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Building, CheckCircle2, ChevronRight, ClipboardCheck, FileText, Info, RefreshCw, ShieldCheck, Stethoscope,
} from 'lucide-react';
import { useCompliance } from '../hooks/useCompliance';
import { useEquipmentList, useEquipmentSettings } from '../hooks/useEquipment';
import { useSettings } from '../context/SettingsContext';
import { INVENTORY_KEY } from '../context/InventoryContext';
import { dueState } from '../domain/equipment';
import { LicenceState, licenceStatus } from '../domain/compliance';
import { localDateKey } from '../domain/operations';

interface MOHDashboardProps {
  /** Opens another Administration section. */
  onOpenTab?: (tab: 'settings' | 'equipment' | 'medicine') => void;
}

const PERIODS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 365, label: 'Last 12 months' },
] as const;

type Tone = 'ok' | 'warn' | 'bad' | 'idle';
const TONE_STYLE: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  bad: 'bg-rose-50 text-rose-800 border-rose-200',
  idle: 'bg-slate-50 text-slate-700 border-line',
};

const LICENCE_TONE: Record<LicenceState, Tone> = { none: 'idle', ok: 'ok', soon: 'warn', expired: 'bad' };

const longDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MOHDashboard({ onOpenTab }: MOHDashboardProps) {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ predicate: (q) => q.queryKey[0] === 'compliance' || q.queryKey[0] === INVENTORY_KEY[0] }) > 0;
  const { clinic } = useSettings();

  const [periodDays, setPeriodDays] = useState<number>(90);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 3_600_000);
    return () => clearInterval(id);
  }, []);
  const today = localDateKey(new Date(now));
  const from = localDateKey(new Date(now - periodDays * 86_400_000));

  const c = useCompliance(from, today, now);
  const equipment = useEquipmentList();
  const { settings: equipmentSettings } = useEquipmentSettings();
  const soonDays = equipmentSettings.data?.dueSoonDays ?? 30;

  const licence = licenceStatus(clinic.licenseExpiry, today);

  const certificates = useMemo(() => {
    const rank = { overdue: 0, soon: 1, none: 2, ok: 3 } as const;
    return (equipment.data ?? [])
      .filter((e) => e.status !== 'Decommissioned')
      .map((e) => ({
        id: e.id, name: e.name, assetTag: e.assetTag, certRef: e.safetyCertRef, certExpiry: e.safetyCertExpiry,
        cert: dueState(e.safetyCertExpiry, today, soonDays),
        calibration: e.calibrationRequired ? dueState(e.nextCalibrationDue, today, soonDays) : null,
        nextCalibrationDue: e.nextCalibrationDue,
      }))
      .sort((a, b) => rank[a.cert] - rank[b.cert] || a.name.localeCompare(b.name));
  }, [equipment.data, today, soonDays]);
  const certsNotRecorded = certificates.filter((e) => e.cert === 'none').length;
  const certsNeedingAttention = certificates.filter((e) => e.cert === 'overdue' || e.cert === 'soon' || e.calibration === 'overdue').length;

  const coding = c.coding;
  const recordableCount = c.recordable.total - c.recordable.uncovered.length;
  const periodLabel = PERIODS.find((p) => p.days === periodDays)?.label.toLowerCase() ?? '';

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-accent" aria-hidden="true" />
            Regulatory Compliance
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            The clinic's licence, notifiable-disease cases, how complete the records are, and equipment certificates, all read from the clinic's own data.
            This page does not send anything to the Ministry of Health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="compliance-period" className="sr-only">Period</label>
          <select
            id="compliance-period"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="text-xs font-bold border border-line bg-white px-2 py-2 rounded-none cursor-pointer"
          >
            {PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => {
              setNow(Date.now());
              void queryClient.invalidateQueries({ queryKey: ['compliance'] });
              void queryClient.invalidateQueries({ queryKey: INVENTORY_KEY });
              void queryClient.invalidateQueries({ queryKey: ['equipment'] });
            }}
            disabled={isFetching}
            className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center justify-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${isFetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {c.hasError && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          Some figures could not be loaded and may be incomplete. Use Refresh to try again.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Clinic licence"
          value={licence.state === 'none' ? 'Not recorded' : licence.state === 'expired' ? 'Expired' : `${licence.days} days left`}
          note={clinic.licenseExpiry ? `Expires ${longDate(clinic.licenseExpiry)}` : 'Add the expiry date in Settings'}
          tone={LICENCE_TONE[licence.state]}
        />
        <Kpi
          label="Notifiable cases"
          value={c.isPending ? '…' : String(c.cases.totalCases)}
          note={`Recorded ${periodLabel}`}
          tone={c.cases.totalCases > 0 ? 'warn' : 'ok'}
        />
        <Kpi
          label="Diagnosis coded"
          value={coding?.percent === null || coding === null ? '—' : `${coding.percent}%`}
          note={coding ? `${coding.coded} of ${coding.consulted} finished consultations` : 'Loading…'}
          tone={coding && coding.percent !== null && coding.percent < 100 ? 'warn' : 'ok'}
        />
        <Kpi
          label="Equipment certificates"
          value={equipment.isPending ? '…' : String(certsNeedingAttention)}
          note={`Expired, expiring soon or calibration overdue${certsNotRecorded ? `; ${certsNotRecorded} with no certificate recorded` : ''}`}
          tone={certsNeedingAttention > 0 ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Panel icon={Building} title="Clinic licence" action={onOpenTab && <PanelLink label="Edit in Settings" onClick={() => onOpenTab('settings')} />}>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-slate-500">Clinic</dt><dd className="font-semibold text-ink">{clinic.name || '—'}{clinic.branch ? `, ${clinic.branch}` : ''}</dd>
              <dt className="text-slate-500">KKM licence no.</dt><dd className="font-mono text-ink">{clinic.licenseNo || 'Not recorded'}</dd>
              <dt className="text-slate-500">Licence expires</dt><dd className="font-semibold text-ink">{clinic.licenseExpiry ? longDate(clinic.licenseExpiry) : 'Not recorded'}</dd>
            </dl>
            <p className={`mt-3 text-xs border px-3 py-2 ${TONE_STYLE[LICENCE_TONE[licence.state]]}`}>
              {licence.state === 'none' && 'No expiry date is recorded, so this page cannot warn before the licence lapses.'}
              {licence.state === 'ok' && `The licence is valid for another ${licence.days} days.`}
              {licence.state === 'soon' && `The licence expires in ${licence.days} day${licence.days === 1 ? '' : 's'}. Check that renewal is under way.`}
              {licence.state === 'expired' && `The licence expired ${-(licence.days ?? 0)} day${licence.days === -1 ? '' : 's'} ago.`}
            </p>
          </Panel>

          <Panel icon={ClipboardCheck} title="Record completeness">
            <ul className="space-y-2.5 text-xs">
              <Check
                tone={!coding || coding.percent === null ? 'idle' : coding.missing === 0 ? 'ok' : 'warn'}
                title="Diagnosis codes on finished consultations"
                detail={!coding ? 'Loading…' : coding.consulted === 0 ? `No consultations finished ${periodLabel}.` : coding.missing === 0 ? `All ${coding.consulted} have a diagnosis code.` : `${coding.missing} of ${coding.consulted} have no diagnosis code, so they cannot appear in disease counts.`}
              />
              <Check
                tone={c.unsigned.unsigned === 0 ? 'ok' : 'bad'}
                title="Controlled-drug entries awaiting a second signature"
                detail={c.unsigned.unsigned === 0 ? (c.registerEntries === 0 ? 'No controlled-drug entries have been recorded.' : `None among the latest ${c.registerEntries} register entries.`) : `${c.unsigned.unsigned} waiting; the oldest for ${c.unsigned.oldestDays} day${c.unsigned.oldestDays === 1 ? '' : 's'}.`}
                action={c.unsigned.unsigned > 0 && onOpenTab ? <PanelLink label="Open Inventory" onClick={() => onOpenTab('medicine')} /> : undefined}
              />
              <Check
                tone={c.notifiableTotal === 0 ? 'idle' : c.recordable.uncovered.length === 0 ? 'ok' : 'warn'}
                title="Notifiable conditions a doctor can record"
                detail={c.notifiableTotal === 0 ? 'No notifiable list is set up.' : `${recordableCount} of ${c.recordable.total} can be chosen as a diagnosis.${c.recordable.uncovered.length ? ' The rest have no matching code in the diagnosis list.' : ''}`}
              />
            </ul>
            {c.recordable.uncovered.length > 0 && (
              <p className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 leading-relaxed">
                <strong>Cannot be recorded yet:</strong> {c.recordable.uncovered.join(', ')}. Cases of these will always read zero below until their diagnosis codes are added to the catalog.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel icon={FileText} title={`Notifiable cases, ${periodLabel}`}>
            {c.isPending ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : c.weekly.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-emerald-700 font-medium"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />No notifiable cases recorded in this period.</p>
            ) : (
              <>
                <ul className="mb-3 space-y-1 text-xs">
                  {c.cases.byCondition.map((r) => (
                    <li key={r.condition} className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-ink">{r.condition}</span><span className="font-mono">{r.cases} case{r.cases === 1 ? '' : 's'}</span></li>
                  ))}
                </ul>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-ink uppercase border-b border-line font-bold">
                      <tr><th scope="col" className="py-2 pr-3">Week of</th><th scope="col" className="py-2 pr-3">Condition</th><th scope="col" className="py-2 pr-3">Code</th><th scope="col" className="py-2 text-right">Cases</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {c.weekly.map((r) => (
                        <tr key={`${r.weekStart}-${r.icdCode}`}>
                          <td className="py-2 pr-3 font-mono">{longDate(r.weekStart)}</td>
                          <td className="py-2 pr-3">{r.condition}</td>
                          <td className="py-2 pr-3 font-mono">{r.icdCode}</td>
                          <td className="py-2 text-right font-mono font-bold">{r.cases}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <p className="mt-3 flex items-start gap-2 text-2xs text-slate-500 leading-relaxed">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
              <span>Counts come from the diagnosis on each visit, matched to a notifiable-conditions list that started from the Act 342 schedule and must be checked against the current Ministry list. The app does not record whether, when or by whom a case was reported, and does not file reports.</span>
            </p>
          </Panel>

          <Panel icon={Stethoscope} title="Equipment safety certificates" action={onOpenTab && <PanelLink label="Open Equipment" onClick={() => onOpenTab('equipment')} />}>
            {equipment.isPending ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : certificates.length === 0 ? (
              <p className="text-xs text-slate-600">No equipment is registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-ink uppercase border-b border-line font-bold">
                    <tr><th scope="col" className="py-2 pr-3">Equipment</th><th scope="col" className="py-2 pr-3">Safety certificate</th><th scope="col" className="py-2">Calibration</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.map((e) => (
                      <tr key={e.id}>
                        <th scope="row" className="py-2 pr-3 font-semibold text-ink">{e.name}<span className="block font-mono font-normal text-2xs text-slate-500">{e.assetTag}</span></th>
                        <td className="py-2 pr-3">
                          <Badge tone={e.cert === 'overdue' ? 'bad' : e.cert === 'soon' ? 'warn' : e.cert === 'ok' ? 'ok' : 'idle'}>
                            {e.cert === 'overdue' ? 'Expired' : e.cert === 'soon' ? 'Expires soon' : e.cert === 'ok' ? 'Valid' : 'Not recorded'}
                          </Badge>
                          {e.certExpiry && <span className="block font-mono text-2xs text-slate-500 mt-0.5">{e.certRef ? `${e.certRef} · ` : ''}{longDate(e.certExpiry)}</span>}
                        </td>
                        <td className="py-2">
                          {e.calibration === null ? <span className="text-slate-400">Not required</span> : (
                            <>
                              <Badge tone={e.calibration === 'overdue' ? 'bad' : e.calibration === 'soon' ? 'warn' : e.calibration === 'ok' ? 'ok' : 'idle'}>
                                {e.calibration === 'overdue' ? 'Overdue' : e.calibration === 'soon' ? 'Due soon' : e.calibration === 'ok' ? 'Up to date' : 'Never recorded'}
                              </Badge>
                              {e.nextCalibrationDue && <span className="block font-mono text-2xs text-slate-500 mt-0.5">{longDate(e.nextCalibrationDue)}</span>}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone }: { label: string; value: string; note: string; tone: Tone }) {
  const color = tone === 'bad' ? 'text-rose-700' : tone === 'warn' ? 'text-amber-700' : 'text-ink';
  return (
    <div className="bg-surface-accent rounded-none border border-line p-4 shadow-2xs">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <h3 className={`type-metric mt-2 ${color}`}>{value}</h3>
      <p className="mt-2 text-xs text-slate-600">{note}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, action, children }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-surface-accent rounded-none border border-line shadow-2xs overflow-hidden">
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

const Badge = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className={`inline-block px-2 py-0.5 border text-2xs font-bold uppercase tracking-wider ${TONE_STYLE[tone]}`}>{children}</span>
);

function Check({ tone, title, detail, action }: { tone: Tone; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <li className={`border p-2.5 flex items-start justify-between gap-3 ${TONE_STYLE[tone]}`}>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5">{detail}</p>
      </div>
      {action}
    </li>
  );
}
