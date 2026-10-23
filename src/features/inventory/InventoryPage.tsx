import React, { useCallback, useState } from 'react';
import { useDrugs, useInventorySettings, useRegister } from '../../hooks/useInventoryData';
import { buildAlerts } from '../../domain/inventory';
import StockPanel from './StockPanel';
import AlertsPanel, { OrderSeed } from './AlertsPanel';
import OrdersPanel from './OrdersPanel';
import RegisterPanel from './RegisterPanel';
import InventoryHistory from './InventoryHistory';
import { todayStr } from './shared';

type Tab = 'stock' | 'alerts' | 'orders' | 'register' | 'history';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stock', label: 'Stock' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'orders', label: 'Orders & suppliers' },
  { id: 'register', label: 'Controlled register' },
  { id: 'history', label: 'History' },
];

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
  const counts: Partial<Record<Tab, { n: number; chip: string }>> = { alerts: { n: alertCount, chip: 'chip-warn' }, register: { n: unsigned, chip: 'chip-brand' } };

  // Arrow keys, Home and End move between tabs; only the selected tab is in the Tab order.
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    document.getElementById(`inv-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <p className="text-xs text-muted font-medium max-w-3xl leading-relaxed">
        Stock is held in batches and used soonest-expiry first. Dispensing takes the stock, writes the ledger and marks the prescription in one step, so the numbers cannot drift. Controlled drugs go in a register with a second signature.
      </p>
      <div role="tablist" aria-label="Inventory sections" className="flex flex-wrap border-b border-line-subtle" onKeyDown={onTabKey}>
        {TABS.map((t) => {
          const selected = tab === t.id;
          const c = counts[t.id];
          return (
            <button
              key={t.id}
              id={`inv-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`inv-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`min-h-11 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? 'border-primary text-accent' : 'border-transparent text-subtle hover:text-ink'}`}
            >
              {t.label}
              {c && c.n > 0 && <span className={`${c.chip} ml-1.5 text-2xs px-1.5 py-0.5`}>{c.n}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`inv-panel-${tab}`} aria-labelledby={`inv-tab-${tab}`}>
        {tab === 'stock' && <StockPanel role={role} focusDrugId={focusDrug} onShowAlerts={() => setTab('alerts')} />}
        {tab === 'alerts' && (
          <AlertsPanel role={role} onStartPo={(s) => { setSeed(s); setTab('orders'); }} onOpenDrug={(id) => { setFocusDrug(id); setTab('stock'); }} onOpenRegister={() => setTab('register')} />
        )}
        {tab === 'orders' && <OrdersPanel seed={seed} onSeedUsed={clearSeed} />}
        {tab === 'register' && <RegisterPanel focusPending={unsigned > 0} />}
        {tab === 'history' && <InventoryHistory />}
      </div>
    </div>
  );
}
