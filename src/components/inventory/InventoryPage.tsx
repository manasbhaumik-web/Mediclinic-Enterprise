import React, { useCallback, useState } from 'react';
import { Pill } from 'lucide-react';
import { useDrugs, useInventorySettings, useRegister } from '../../hooks/useInventoryData';
import { buildAlerts } from '../../domain/inventory';
import StockPanel from './StockPanel';
import AlertsPanel, { OrderSeed } from './AlertsPanel';
import OrdersPanel from './OrdersPanel';
import RegisterPanel from './RegisterPanel';
import InventoryHistory from './InventoryHistory';
import { todayStr } from './shared';

type Tab = 'stock' | 'alerts' | 'orders' | 'register' | 'history';

/** Inventory & Pharmacy for pharmacists and administrators. Stock only changes through audited database functions. */
export default function InventoryPage({ role }: { role: 'admin' | 'pharmacist' }) {
  const [tab, setTab] = useState<Tab>('stock');
  const [focusDrug, setFocusDrug] = useState<string | null>(null);
  const [seed, setSeed] = useState<OrderSeed[] | null>(null);
  const drugs = useDrugs();
  const register = useRegister();
  const { settings } = useInventorySettings();

  const alertCount = buildAlerts(drugs.data ?? [], settings.data?.nearExpiryDays ?? 60, todayStr()).filter((a) => a.severity !== 'info').length;
  const unsigned = (register.data ?? []).filter((e) => !e.signedBy).length;
  const clearSeed = useCallback(() => setSeed(null), []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-subtle hover:text-ink'}`;
  const badge = (n: number, tone: string) => n > 0 && <span className={`ml-1.5 text-2xs font-bold px-1.5 py-0.5 ${tone}`}>{n}</span>;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5"><Pill className="w-6 h-6 text-accent" />Inventory &amp; Pharmacy</h1>
        <p className="text-xs text-muted font-medium max-w-3xl leading-relaxed">
          Stock is held in batches and used soonest-expiry first. Dispensing takes the stock, writes the ledger and marks the prescription in one step, so the numbers cannot drift. Controlled drugs go in a register with a second signature.
        </p>
      </div>
      <div role="tablist" className="flex flex-wrap border-b border-line-subtle">
        <button role="tab" aria-selected={tab === 'stock'} className={tabClass('stock')} onClick={() => setTab('stock')}>Stock</button>
        <button role="tab" aria-selected={tab === 'alerts'} className={tabClass('alerts')} onClick={() => setTab('alerts')}>Alerts{badge(alertCount, 'bg-amber-100 text-amber-800')}</button>
        <button role="tab" aria-selected={tab === 'orders'} className={tabClass('orders')} onClick={() => setTab('orders')}>Orders &amp; suppliers</button>
        <button role="tab" aria-selected={tab === 'register'} className={tabClass('register')} onClick={() => setTab('register')}>Controlled register{badge(unsigned, 'bg-teal-100 text-teal-800')}</button>
        <button role="tab" aria-selected={tab === 'history'} className={tabClass('history')} onClick={() => setTab('history')}>History</button>
      </div>

      {tab === 'stock' && <StockPanel role={role} focusDrugId={focusDrug} />}
      {tab === 'alerts' && (
        <AlertsPanel role={role} onStartPo={(s) => { setSeed(s); setTab('orders'); }} onOpenDrug={(id) => { setFocusDrug(id); setTab('stock'); }} onOpenRegister={() => setTab('register')} />
      )}
      {tab === 'orders' && <OrdersPanel seed={seed} onSeedUsed={clearSeed} />}
      {tab === 'register' && <RegisterPanel focusPending={unsigned > 0} />}
      {tab === 'history' && <InventoryHistory />}
    </div>
  );
}
