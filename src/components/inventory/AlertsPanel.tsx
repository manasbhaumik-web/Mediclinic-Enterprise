import React, { useState } from 'react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useDrugs, useInventorySettings, usePurchaseOrders, useRegister } from '../../hooks/useInventoryData';
import { StockAlert, buildAlerts, isOverdue, PO_STYLE } from '../../domain/inventory';
import { Notice, errorMessage, inputClass, todayStr } from './shared';

export interface OrderSeed { inventoryId: string; quantity: number }

const KIND_LABEL: Record<StockAlert['kind'], string> = {
  out_of_stock: 'Out of stock', low_stock: 'Low stock', expired_stock: 'Expired stock', near_expiry: 'Near expiry', no_expiry: 'No expiry date',
};
const SEVERITY_CLASS = { critical: 'chip-danger', warn: 'chip-warn', info: 'chip-info' } as const;

/** Alerts driven by each drug's reorder level and the near-expiry window, plus overdue orders and entries waiting for a signature. */
export default function AlertsPanel({ role, onStartPo, onOpenDrug, onOpenRegister }: {
  role: 'admin' | 'pharmacist'; onStartPo: (seed: OrderSeed[]) => void; onOpenDrug: (drugId: string) => void; onOpenRegister: () => void;
}) {
  const { user } = useAuth();
  const drugs = useDrugs();
  const orders = usePurchaseOrders();
  const register = useRegister();
  const { settings, save } = useInventorySettings();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<string>('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const today = todayStr();

  const nearDays = settings.data?.nearExpiryDays ?? 60;
  const alerts = buildAlerts(drugs.data ?? [], nearDays, today);
  const stockAlerts = alerts.filter((a) => a.kind === 'out_of_stock' || a.kind === 'low_stock');
  const batchAlerts = alerts.filter((a) => a.kind !== 'out_of_stock' && a.kind !== 'low_stock');
  const overdue = (orders.data ?? []).filter((o) => isOverdue(o, today));
  const unsigned = (register.data ?? []).filter((e) => !e.signedBy);
  const nameOf = new Map((drugs.data ?? []).map((d) => [d.id, d.name]));

  const toggle = (id: string) => { const n = new Set(picked); if (n.has(id)) n.delete(id); else n.add(id); setPicked(n); };
  const start = () => onStartPo(stockAlerts.filter((a) => picked.has(a.drugId)).map((a) => ({ inventoryId: a.drugId, quantity: a.suggestedOrder ?? 1 })));
  const saveDays = async () => {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 0) { setMsg({ ok: false, text: 'Enter a whole number of days.' }); return; }
    try { await save.mutateAsync(n); setMsg({ ok: true, text: 'Saved.' }); setDays(''); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const none = alerts.length === 0 && overdue.length === 0 && unsigned.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Stock alerts use each drug's reorder level. Batches are flagged when they expire within <b>{nearDays} days</b>.</span>
        {role === 'admin' && (
          <span className="flex items-center gap-2">
            <input className={`${inputClass} !w-24`} type="number" min="0" placeholder={String(nearDays)} value={days} onChange={(e) => setDays(e.target.value)} aria-label="Near-expiry window in days" />
            <Button variant="outline" size="sm" onClick={saveDays} disabled={!days || save.isPending}>Change window</Button>
          </span>
        )}
      </div>
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      {none && !drugs.isLoading && <p className="text-xs text-subtle bg-surface border border-line-subtle p-4">Nothing needs attention.</p>}

      {unsigned.length > 0 && (
        <section className="bg-teal-50 border border-teal-200 p-3 text-xs space-y-1">
          <div className="font-bold text-teal-900">{unsigned.length} controlled-drug entr{unsigned.length === 1 ? 'y is' : 'ies are'} waiting for a second signature</div>
          <p className="text-teal-900">{unsigned.filter((e) => e.performedBy !== user?.id).length} can be signed by you. <button type="button" className="font-bold underline cursor-pointer" onClick={onOpenRegister}>Open the register</button></p>
        </section>
      )}

      {stockAlerts.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="type-heading-caps text-ink">Reorder</h3>
            <Button size="sm" disabled={picked.size === 0} onClick={start}>Start a purchase order with {picked.size || 'selected'}</Button>
          </div>
          <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
            {stockAlerts.map((a) => (
              <label key={`${a.kind}-${a.drugId}`} className="flex items-center gap-3 px-3 py-2 text-xs cursor-pointer">
                <input type="checkbox" checked={picked.has(a.drugId)} onChange={() => toggle(a.drugId)} />
                <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${SEVERITY_CLASS[a.severity]}`}>{KIND_LABEL[a.kind]}</span>
                <span className="font-bold text-ink">{a.drugName}</span>
                <span className="text-subtle">{a.detail}</span>
                <span className="ml-auto font-mono text-muted">suggest {a.suggestedOrder}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {batchAlerts.length > 0 && (
        <section className="space-y-2">
          <h3 className="type-heading-caps text-ink">Batches</h3>
          <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
            {batchAlerts.map((a, i) => (
              <div key={`${a.batchId}-${i}`} className="flex items-center gap-3 px-3 py-2 text-xs">
                <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${SEVERITY_CLASS[a.severity]}`}>{KIND_LABEL[a.kind]}</span>
                <span className="font-bold text-ink">{a.drugName}</span>
                <span className="text-subtle">{a.detail}</span>
                <button type="button" className="ml-auto font-bold text-accent cursor-pointer" onClick={() => onOpenDrug(a.drugId)}>Open</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {overdue.length > 0 && (
        <section className="space-y-2">
          <h3 className="type-heading-caps text-ink">Overdue orders</h3>
          <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
            {overdue.map((o) => (
              <div key={o.id} className="px-3 py-2 text-xs"><b className="text-ink">{o.poNumber}</b> · {PO_STYLE[o.status].label} · expected {o.expectedDate} · {o.lines.map((l) => nameOf.get(l.inventoryId) ?? '?').join(', ')}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
