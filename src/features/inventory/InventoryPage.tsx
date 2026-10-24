import React, { useCallback, useMemo, useState } from 'react';
import { useDrugs, useInventorySettings, useRegister } from '../../hooks/useInventoryData';
import { buildAlerts } from '../../domain/inventory';
import StockPanel from './StockPanel';
import AlertsPanel, { OrderSeed } from './AlertsPanel';
import OrdersPanel from './OrdersPanel';
import RegisterPanel from './RegisterPanel';
import InventoryHistory from './InventoryHistory';
import { todayStr } from './shared';
import {
  Boxes, AlertTriangle, Truck, ShieldAlert, History,
  PackageCheck, Clock
} from 'lucide-react';

type Tab = 'stock' | 'alerts' | 'orders' | 'register' | 'history';

interface TabItem {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

const TABS: TabItem[] = [
  { id: 'stock', label: 'Stock & Formulary', icon: Boxes, tooltip: 'Stock Catalog: Pharmaceutical inventory on hand, unit costs, and reorder levels' },
  { id: 'alerts', label: 'Safety & Alerts', icon: AlertTriangle, tooltip: 'Inventory Alerts: Low stock warnings, expiring pharmaceutical batches, and shortages' },
  { id: 'orders', label: 'Orders & Suppliers', icon: Truck, tooltip: 'Purchase Orders: Supplier purchase orders, batch deliveries, and intake receiving' },
  { id: 'register', label: 'Controlled Register', icon: ShieldAlert, tooltip: 'Dangerous Drugs Register: Poison Act & DDA schedule register, pharmacist signatures' },
  { id: 'history', label: 'Audit Ledger', icon: History, tooltip: 'Stock Movement History: Full audit trail of dispensations, adjustments, and receipts' },
];

/** Inventory & Pharmacy for pharmacists and administrators. Stock only changes through audited database functions. */
export default function InventoryPage({ role }: { role: 'admin' | 'pharmacist' }) {
  const [tab, setTab] = useState<Tab>('stock');
  const [focusDrug, setFocusDrug] = useState<string | null>(null);
  const [seed, setSeed] = useState<OrderSeed[] | null>(null);
  const drugs = useDrugs();
  const register = useRegister();
  const { settings } = useInventorySettings();

  const nearExpiryDays = settings.data?.nearExpiryDays ?? 60;
  const today = todayStr();
  
  const allAlerts = useMemo(() => {
    return buildAlerts(drugs.data ?? [], nearExpiryDays, today);
  }, [drugs.data, nearExpiryDays, today]);

  const alertCount = allAlerts.filter((a) => a.severity !== 'info').length;
  const outOfStockCount = allAlerts.filter((a) => a.kind === 'out_of_stock').length;
  const lowStockCount = allAlerts.filter((a) => a.kind === 'low_stock').length;
  const expiryAlertsCount = allAlerts.filter((a) => a.kind === 'expired_stock' || a.kind === 'near_expiry').length;

  const unsignedEntries = (register.data ?? []).filter((e) => !e.signedBy);
  const unsigned = unsignedEntries.length;

  const activeDrugs = (drugs.data ?? []).filter((d) => d.status === 'active');
  const totalStockUnits = activeDrugs.reduce((sum, d) => sum + (d.currentStock || 0), 0);

  const clearSeed = useCallback(() => setSeed(null), []);

  const counts: Partial<Record<Tab, { n: number; chip: string }>> = {
    alerts: { n: alertCount, chip: outOfStockCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white' },
    register: { n: unsigned, chip: 'bg-primary text-white font-bold' },
  };

  // Keyboard navigation for accessible tabs
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    document.getElementById(`inv-tab-${TABS[next].id}`)?.focus();
  };

  return (
    <div className="animate-fadeIn w-full space-y-4 pb-8 font-sans">
      
      {/* PHARMACIST TELEMETRY & STATUS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1: Total SKUs & Units */}
        <div className="bg-surface border border-line p-3.5 flex flex-col justify-between shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Formulary Catalog</span>
            <PackageCheck className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink">{activeDrugs.length}</span>
            <span className="text-2xs text-muted font-sans">Active SKUs</span>
          </div>
          <div className="mt-1 text-2xs text-subtle font-mono flex items-center justify-between border-t border-line-subtle pt-1.5">
            <span>Units on hand</span>
            <span className="font-bold text-ink">{totalStockUnits.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: Reorder & Shortages */}
        <div className="bg-surface border border-line p-3.5 flex flex-col justify-between shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Reorder Level Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${outOfStockCount > 0 ? 'text-rose-600' : lowStockCount > 0 ? 'text-amber-500' : 'text-accent'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink">{outOfStockCount + lowStockCount}</span>
            <span className="text-2xs text-muted font-sans">Need procurement</span>
          </div>
          <div className="mt-1 text-2xs text-subtle font-mono flex items-center justify-between border-t border-line-subtle pt-1.5">
            <span className="text-rose-700 dark:text-rose-300 font-bold">{outOfStockCount} Out of stock</span>
            <span className="text-amber-700 dark:text-amber-300">{lowStockCount} Low stock</span>
          </div>
        </div>

        {/* Metric 3: FEFO Expiry Tracking */}
        <div className="bg-surface border border-line p-3.5 flex flex-col justify-between shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>FEFO Expiry Tracking</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink">{expiryAlertsCount}</span>
            <span className="text-2xs text-muted font-sans">Batches flagged</span>
          </div>
          <div className="mt-1 text-2xs text-subtle font-mono flex items-center justify-between border-t border-line-subtle pt-1.5">
            <span>Window threshold</span>
            <span className="font-bold text-ink">{nearExpiryDays} days</span>
          </div>
        </div>

        {/* Metric 4: Controlled Register (Poison Act) */}
        <div className="bg-surface border border-line p-3.5 flex flex-col justify-between shadow-none relative overflow-hidden">
          <div className="flex items-center justify-between text-2xs font-mono font-bold uppercase tracking-wider text-muted">
            <span>Controlled Register</span>
            <ShieldAlert className={`w-4 h-4 ${unsigned > 0 ? 'text-amber-600' : 'text-accent'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-ink">{unsigned}</span>
            <span className="text-2xs text-muted font-sans">Pending signatures</span>
          </div>
          <div className="mt-1 text-2xs text-subtle font-mono flex items-center justify-between border-t border-line-subtle pt-1.5">
            <span>Poison Act Compliance</span>
            <span className={`font-bold ${unsigned > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {unsigned > 0 ? 'Action required' : '100% Signed'}
            </span>
          </div>
        </div>

      </div>

      {/* SUB-NAVIGATION TOOLBAR */}
      <div 
        role="tablist" 
        aria-label="Inventory sections" 
        className="flex flex-wrap items-center gap-1.5 bg-surface border border-line p-1.5 shadow-none"
        onKeyDown={onTabKey}
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          const c = counts[t.id];
          const IconComponent = t.icon;
          return (
            <button
              key={t.id}
              id={`inv-tab-${t.id}`}
              title={t.tooltip}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`inv-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`min-h-10 px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                selected 
                  ? 'bg-primary text-white border-primary shadow-xs' 
                  : 'bg-surface text-ink border-line hover:bg-surface-accent text-muted hover:text-ink'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${selected ? 'text-white' : 'text-accent'}`} />
              <span>{t.label}</span>
              {c && c.n > 0 && (
                <span className={`text-2xs font-mono font-bold px-1.5 py-0.5 min-w-[18px] text-center ${c.chip}`}>
                  {c.n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE PANEL CONTENT */}
      <div role="tabpanel" id={`inv-panel-${tab}`} aria-labelledby={`inv-tab-${tab}`} className="animate-fadeIn">
        {tab === 'stock' && (
          <StockPanel 
            role={role} 
            focusDrugId={focusDrug} 
            onShowAlerts={() => setTab('alerts')} 
          />
        )}
        {tab === 'alerts' && (
          <AlertsPanel 
            role={role} 
            onStartPo={(s) => { setSeed(s); setTab('orders'); }} 
            onOpenDrug={(id) => { setFocusDrug(id); setTab('stock'); }} 
            onOpenRegister={() => setTab('register')} 
          />
        )}
        {tab === 'orders' && (
          <OrdersPanel seed={seed} onSeedUsed={clearSeed} />
        )}
        {tab === 'register' && (
          <RegisterPanel focusPending={unsigned > 0} />
        )}
        {tab === 'history' && (
          <InventoryHistory />
        )}
      </div>

    </div>
  );
}
