import React, { useCallback, useMemo, useState } from 'react';
import { useDrugs, useInventorySettings, useRegister } from '../../hooks/useInventoryData';
import { buildAlerts } from '../../domain/inventory';
import StockPanel from './StockPanel';
import AlertsPanel, { OrderSeed } from './AlertsPanel';
import OrdersPanel from './OrdersPanel';
import RegisterPanel from './RegisterPanel';
import InventoryHistory from './InventoryHistory';
import { todayStr } from './shared';
import { PageHeading, StationTabs, StatStrip } from '../../components/ui/StationChrome';
import { Boxes, AlertTriangle, Truck, ShieldAlert, History } from 'lucide-react';

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

  // Keyboard navigation for accessible tabs
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    document.getElementById(`inv-tab-${TABS[next].id}`)?.focus();
  };

  const counts: Partial<Record<Tab, number>> = { alerts: alertCount, register: unsigned };

  return (
    <div className="animate-fadeIn w-full space-y-4 pb-8 font-sans">
      <PageHeading eyebrow={role === 'admin' ? 'Administrator' : 'Pharmacy'} title="Inventory and pharmacy" />

      <StationTabs<Tab>
        label="Inventory sections"
        idPrefix="inv-tab"
        active={tab}
        onChange={setTab}
        onKeyDown={onTabKey}
        tabs={TABS.map((t) => ({ id: t.id, label: t.label, title: t.tooltip, count: counts[t.id] && counts[t.id]! > 0 ? counts[t.id] : undefined, alert: true }))}
      />

      <StatStrip
        label="Inventory figures"
        stats={[
          { label: 'Formulary', value: activeDrugs.length, note: `Active drugs · ${totalStockUnits.toLocaleString()} units on hand` },
          { label: 'Need reordering', value: outOfStockCount + lowStockCount, tone: outOfStockCount > 0 ? 'danger' : 'default', note: `${outOfStockCount} out of stock · ${lowStockCount} low` },
          { label: 'Expiry watch', value: expiryAlertsCount, note: `Batches flagged · ${nearExpiryDays} day window` },
          { label: 'Controlled register', value: unsigned, tone: unsigned > 0 ? 'danger' : 'default', note: unsigned > 0 ? 'Entries waiting for a signature' : 'All entries signed' },
        ]}
      />

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
