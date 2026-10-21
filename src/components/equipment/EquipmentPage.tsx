import React, { useCallback, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import Button from '../ui/Button';
import { useEquipmentList, useEquipmentSettings } from '../../hooks/useEquipment';
import { AlertKind, EquipmentAlert, buildEquipmentAlerts } from '../../domain/equipment';
import { Notice, errorMessage, inputClass, todayStr } from '../inventory/shared';
import EquipmentRegister from './EquipmentRegister';
import EquipmentHistory from './EquipmentHistory';

type Tab = 'register' | 'alerts' | 'history';

const LABEL: Record<AlertKind, string> = {
  out_of_service: 'Out of service', needs_attention: 'Needs maintenance', service_overdue: 'Service overdue', service_soon: 'Service due soon',
  calibration_overdue: 'Calibration overdue', calibration_soon: 'Calibration due soon', cert_expired: 'Certificate expired', cert_soon: 'Certificate expiring',
  warranty_soon: 'Warranty ending', no_schedule: 'No service schedule',
};
const SEVERITY = { critical: 'bg-rose-100 text-rose-800 border-rose-300', warn: 'bg-amber-100 text-amber-800 border-amber-300', info: 'bg-sky-100 text-sky-800 border-sky-300' } as const;

function Alerts({ onOpen }: { onOpen: (id: string) => void }) {
  const list = useEquipmentList();
  const { settings, save } = useEquipmentSettings();
  const [days, setDays] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const soon = settings.data?.dueSoonDays ?? 30;
  const items = list.data ?? [];
  const alerts: EquipmentAlert[] = buildEquipmentAlerts(items, soon, todayStr());
  const name = new Map(items.map((e) => [e.id, `${e.name} (${e.assetTag})`]));
  const saveDays = async () => {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 0) { setMsg({ ok: false, text: 'Enter a whole number of days.' }); return; }
    try { await save.mutateAsync(n); setMsg({ ok: true, text: 'Saved.' }); setDays(''); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span>Alerts come from each device's own dates. “Due soon” means within <b>{soon} days</b>.</span>
        <span className="flex items-center gap-2">
          <input className={`${inputClass} !w-24`} type="number" min="0" placeholder={String(soon)} value={days} onChange={(e) => setDays(e.target.value)} aria-label="Due-soon window in days" />
          <Button variant="outline" size="sm" onClick={saveDays} disabled={!days || save.isPending}>Change window</Button>
        </span>
      </div>
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      {alerts.length === 0 && !list.isLoading && <p className="text-xs text-slate-500 bg-surface border border-line-subtle p-4">Nothing needs attention.</p>}
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {alerts.map((a, i) => (
          <div key={`${a.equipmentId}-${a.kind}-${i}`} className="px-3 py-2 flex flex-wrap items-center gap-3 text-xs">
            <span className={`text-2xs font-bold uppercase px-2 py-0.5 border ${SEVERITY[a.severity]}`}>{LABEL[a.kind]}</span>
            <button className="font-bold text-ink hover:underline cursor-pointer" onClick={() => onOpen(a.equipmentId)}>{name.get(a.equipmentId)}</button>
            <span className="text-slate-600">{a.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Equipment & Assets: the asset register, what is due or overdue, and the permanent history. Changes go through audited database functions. */
export default function EquipmentPage() {
  const [tab, setTab] = useState<Tab>('register');
  const [focus, setFocus] = useState<string | null>(null);
  const list = useEquipmentList();
  const { settings } = useEquipmentSettings();
  const alertCount = buildEquipmentAlerts(list.data ?? [], settings.data?.dueSoonDays ?? 30, todayStr()).filter((a) => a.severity !== 'info').length;
  const clearFocus = useCallback(() => setFocus(null), []);
  const tabClass = (t: Tab) => `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-slate-500 hover:text-ink'}`;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5"><Stethoscope className="w-6 h-6 text-accent" />Equipment &amp; Assets</h1>
        <p className="text-xs text-slate-600 font-medium max-w-3xl leading-relaxed">
          Each device has a full record. Service, calibration, inspection and repair are logged with who did them and the result, and they set the next due dates. Equipment is decommissioned, never deleted.
        </p>
      </div>
      <div role="tablist" className="flex flex-wrap border-b border-line-subtle">
        <button role="tab" aria-selected={tab === 'register'} className={tabClass('register')} onClick={() => setTab('register')}>Register</button>
        <button role="tab" aria-selected={tab === 'alerts'} className={tabClass('alerts')} onClick={() => setTab('alerts')}>
          Due &amp; alerts{alertCount > 0 && <span className="ml-1.5 text-2xs font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800">{alertCount}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'history'} className={tabClass('history')} onClick={() => setTab('history')}>History</button>
      </div>
      {tab === 'register' && <EquipmentRegister focusId={focus} onFocused={clearFocus} />}
      {tab === 'alerts' && <Alerts onOpen={(id) => { setFocus(id); setTab('register'); }} />}
      {tab === 'history' && <EquipmentHistory />}
    </div>
  );
}
