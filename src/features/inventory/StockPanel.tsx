import { forecastStockDepletion } from '../../domain/predictiveStock';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Bell, AlertTriangle, XCircle, PackageCheck, Archive } from 'lucide-react';
import ActionMenu from '../../components/ui/ActionMenu';
import Pagination from '../../components/ui/Pagination';
import { useDrugs, useInventoryActions, useInventorySettings, useSuppliers } from '../../hooks/useInventoryData';
import { DrugItem, buildAlerts, controlClassLabel, isExpired, usableStock } from '../../domain/inventory';
import DrugForm from './DrugForm';
import { Dialog, Field, Notice, ReasonDialog, errorMessage, inputClass, todayStr } from './shared';

type Mode = { kind: 'edit' | 'receive' | 'adjust' | 'retire'; drug: DrugItem } | { kind: 'add' } | null;
type Filter = 'all' | 'out' | 'low' | 'expiry';

/** The drug catalogue and stock by batch. Every change goes through a database function, so nothing here edits stock directly. */
export default function StockPanel({ role, focusDrugId, onShowAlerts }: { role: 'admin' | 'pharmacist'; focusDrugId?: string | null; onShowAlerts?: () => void }) {
  const drugs = useDrugs();
  const { settings } = useInventorySettings();
  const api = useInventoryActions();
  const [q, setQ] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filter, showRetired]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const today = todayStr();

  useEffect(() => { if (focusDrugId) { setOpen(focusDrugId); setQ(''); } }, [focusDrugId]);

  const all = drugs.data ?? [];
  const { alertsByDrug, kindsByDrug } = useMemo(() => {
    const count = new Map<string, number>();
    const kinds = new Map<string, Set<string>>();
    for (const a of buildAlerts(all, settings.data?.nearExpiryDays ?? 60, today)) {
      count.set(a.drugId, (count.get(a.drugId) ?? 0) + 1);
      kinds.set(a.drugId, (kinds.get(a.drugId) ?? new Set()).add(a.kind));
    }
    return { alertsByDrug: count, kindsByDrug: kinds };
  }, [all, settings.data, today]);

  const activeDrugs = all.filter((d) => d.status === 'active');
  const has = (id: string, ...kinds: string[]) => kinds.some((k) => kindsByDrug.get(id)?.has(k));
  const summary = {
    out: activeDrugs.filter((d) => has(d.id, 'out_of_stock')).length,
    low: activeDrugs.filter((d) => has(d.id, 'low_stock')).length,
    expiry: activeDrugs.filter((d) => has(d.id, 'expired_stock', 'near_expiry')).length,
  };
  const matchesFilter = (d: DrugItem) =>
    filter === 'all' || (filter === 'out' && has(d.id, 'out_of_stock')) || (filter === 'low' && has(d.id, 'low_stock')) || (filter === 'expiry' && has(d.id, 'expired_stock', 'near_expiry'));

  const filteredRows = all.filter((d) => (showRetired || d.status === 'active') && matchesFilter(d) && (`${d.name} ${d.category} ${d.genericName ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  const startIndex = (currentPage - 1) * pageSize;
  const rows = filteredRows.slice(startIndex, startIndex + pageSize);

  const retire = async (d: DrugItem, reason: string) => {
    setMsg(null);
    try { await api.retireDrug.mutateAsync({ id: d.id, reason }); setMsg({ ok: true, text: `${d.name} retired.` }); setMode(null); }
    catch (e) { setMsg({ ok: false, text: errorMessage(e) }); setMode(null); }
  };
  const restore = async (d: DrugItem) => {
    setMsg(null);
    try { await api.restoreDrug.mutateAsync(d.id); setMsg({ ok: true, text: `${d.name} restored.` }); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div className="space-y-4">
      {/* REDESIGNED INVENTORY CONTROLS & FILTER BAR */}
      <div className="bg-surface border border-line rounded-none shadow-2xs divide-y divide-line">
        
        {/* Top Control Bar: Search input, retired toggle, and Primary Add Action */}
        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-surface">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Search Input with Prefix Icon & Integrated Clear */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                className="w-full h-10 pl-9 pr-8 bg-surface-accent border border-line text-ink placeholder:text-muted/70 text-xs font-medium rounded-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="Search name, generic, or category..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search drugs"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-mono px-1 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Show Retired Toggle Switch / Checkbox */}
            <label className="inline-flex items-center gap-2 h-10 px-3 bg-surface-muted/60 border border-line-subtle text-xs font-medium text-ink/80 cursor-pointer select-none hover:bg-surface-muted transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-none accent-primary cursor-pointer"
                checked={showRetired}
                onChange={(e) => setShowRetired(e.target.checked)}
              />
              <span className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-muted" />
                <span>Show retired</span>
              </span>
            </label>
          </div>

          {/* Action Buttons: Add a drug & Alerts */}
          <div className="flex items-center gap-2 shrink-0">
            {onShowAlerts && (
              <button
                type="button"
                className="h-10 px-3.5 bg-surface hover:bg-surface-accent text-accent border border-line font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                onClick={onShowAlerts}
              >
                <Bell className="w-3.5 h-3.5 text-accent" />
                <span>Open alerts</span>
                {summary.out + summary.low + summary.expiry > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5"></span>
                )}
              </button>
            )}

            <button
              type="button"
              className="btn-primary h-10 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-none cursor-pointer"
              onClick={() => setMode({ kind: 'add' })}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add a drug</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter Strip: Harmonized Category Chips */}
        <div className="px-3.5 py-2.5 bg-surface-muted/30 flex flex-wrap items-center gap-2" role="group" aria-label="Stock levels">
          {([
            { id: 'all' as Filter, label: 'All drugs', count: activeDrugs.length, icon: PackageCheck, activeStyle: 'bg-primary text-white border-primary' },
            { id: 'out' as Filter, label: 'Out of stock', count: summary.out, icon: XCircle, activeStyle: 'bg-rose-600 text-white border-rose-600', alert: summary.out > 0 },
            { id: 'low' as Filter, label: 'Low stock', count: summary.low, icon: AlertTriangle, activeStyle: 'bg-amber-600 text-white border-amber-600', alert: summary.low > 0 },
            { id: 'expiry' as Filter, label: 'Expired or near expiry', count: summary.expiry, icon: AlertTriangle, activeStyle: 'bg-amber-600 text-white border-amber-600', alert: summary.expiry > 0 },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setFilter(tab.id)}
                className={`h-8 px-3 text-xs font-medium border inline-flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${tab.activeStyle} font-bold shadow-xs`
                    : 'bg-surface text-ink/80 border-line hover:bg-surface-accent hover:border-line-strong hover:text-ink'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-muted'}`} />
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-2xs px-1.5 py-0.2 rounded-none font-bold tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                      : 'bg-surface-muted text-muted border border-line-subtle'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {drugs.error && <Notice ok={false}>Could not load the stock list. Try again, or ask an administrator to check the inventory set-up.</Notice>}
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}

      <div className="bg-surface border border-line overflow-x-auto lg:overflow-visible shadow-none">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">Drug</th><th className="p-3 text-right">In stock</th><th className="p-3 text-right">Reorder at</th><th className="p-3 text-right">Price</th><th className="p-3">Flags</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const usable = usableStock(d, today);
              const retired = d.status === 'retired';
              return (
                <React.Fragment key={d.id}>
                  <tr className={`border-b border-line-subtle align-top ${retired ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <button type="button" className="min-h-11 flex items-center gap-1.5 font-bold text-ink text-left cursor-pointer" aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>
                        {open === d.id ? <ChevronDown className="w-4 h-4 text-accent" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 text-accent" aria-hidden="true" />}
                        {d.name}
                      </button>
                      <div className="font-medium text-subtle pl-5">{d.category}{d.drugType ? ` · ${d.drugType}` : ''}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-mono font-bold text-ink">{d.currentStock}</div>
                      {usable !== d.currentStock && <div className="text-muted" title="Part of the stock is expired">{usable} usable</div>}
                      {!retired && (
                        <div className="mt-1 ml-auto w-24 h-2 bg-surface-strong relative" role="img" aria-label={`${usable} in date against a reorder level of ${d.minThreshold}`}>
                          <div className={usable === 0 ? 'h-2 bg-rose-600' : usable <= d.minThreshold ? 'h-2 bg-amber-500' : 'h-2 bg-primary'} style={{ width: `${Math.min(100, Math.round((usable / Math.max(1, d.minThreshold * 3)) * 100))}%` }} />
                          <span className="absolute top-[-2px] bottom-[-2px] w-px bg-ink/60" style={{ left: '33.3%' }} aria-hidden="true" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">{d.minThreshold}</td>
                    <td className="p-3 text-right font-mono">RM{d.price.toFixed(2)}</td>
                    <td className="p-3 space-x-1 space-y-1">
                      {retired && <span className="chip-neutral text-2xs px-2 py-0.5 uppercase">Retired</span>}
                      {!retired && has(d.id, 'out_of_stock') && <span className="chip-danger text-2xs px-2 py-0.5 uppercase">Out of stock</span>}
                      {!retired && has(d.id, 'low_stock') && <span className="chip-warn text-2xs px-2 py-0.5 uppercase">Low stock</span>}
                      {!retired && has(d.id, 'expired_stock') && <span className="chip-danger text-2xs px-2 py-0.5 uppercase">Expired batch</span>}
                      {!retired && has(d.id, 'near_expiry') && <span className="chip-warn text-2xs px-2 py-0.5 uppercase">Near expiry</span>}
                      {d.registerRequired && <span className="chip-info text-2xs px-2 py-0.5 uppercase" title={controlClassLabel(d.controlClass)}>Controlled</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {!retired ? (
                          <>
                            <button type="button" className="btn-primary" onClick={() => setMode({ kind: 'receive', drug: d })}>Receive</button>
                            <ActionMenu
                              label={`More actions for ${d.name}`}
                              items={[
                                ...(d.currentStock > 0 ? [{ label: 'Adjust stock', onSelect: () => setMode({ kind: 'adjust', drug: d }) }] : []),
                                { label: 'Edit details', onSelect: () => setMode({ kind: 'edit', drug: d }) },
                                { label: 'Retire drug', onSelect: () => setMode({ kind: 'retire', drug: d }) },
                              ]}
                            />
                          </>
                        ) : (
                          <button type="button" className="btn-secondary" onClick={() => restore(d)}>Restore</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {open === d.id && (
                    <tr><td colSpan={6} className="p-3 bg-surface-accent">
                      {retired && d.retireReason && <p className="text-xs text-muted mb-2">Retired: {d.retireReason}</p>}
                      {(() => {
                        const forecast = forecastStockDepletion({
                          id: d.id,
                          name: d.name,
                          currentStock: d.currentStock,
                          reorderLevel: d.minThreshold,
                        });
                        return (
                          <div className="mb-2 p-2.5 bg-surface border border-line flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-ink">
                              💡 AI Inventory Forecast: <span className="font-normal text-muted">{forecast.summary}</span>
                            </span>
                            <span className="text-2xs font-mono font-bold bg-surface-accent text-accent px-2 py-0.5 border border-line">
                              Optimal Reorder: +{forecast.suggestedReorderQty} units
                            </span>
                          </div>
                        );
                      })()}
                      {(d.batches ?? []).length === 0 ? <p className="text-xs text-subtle">No batches. Use Receive to add stock.</p> : (
                        <div className="w-full overflow-x-auto custom-scrollbar"><table className="w-full text-xs min-w-[320px]">
                          <thead><tr className="text-left text-2xs uppercase text-subtle"><th className="py-1">Batch</th><th className="py-1">Expiry</th><th className="py-1 text-right">Stock</th><th className="py-1 text-right">Received</th></tr></thead>
                          <tbody>
                            {[...(d.batches ?? [])].sort((a, b) => (a.expiryDate ?? '9999') < (b.expiryDate ?? '9999') ? -1 : 1).map((b) => (
                              <tr key={b.id} className="border-t border-line-subtle">
                                <td className="py-1 font-mono">{b.batchId}</td>
                                <td className={`py-1 ${isExpired(b, today) && b.stock > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}`}>{b.expiryDate ?? 'Unknown'}{isExpired(b, today) && b.stock > 0 ? ' (expired)' : ''}</td>
                                <td className="py-1 text-right font-mono">{b.stock}</td>
                                <td className="py-1 text-right text-subtle">{b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table></div>
                      )}
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {filteredRows.length === 0 && !drugs.isLoading && (
              <tr><td className="p-6 text-subtle text-center" colSpan={6}>
                {all.length === 0 ? 'No drugs yet. Add your first drug, then receive stock into it.' : 'Nothing matches that search.'}
              </td></tr>
            )}
          </tbody>
        </table>

        {/* 15 Records Per Page Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="drugs"
        />
      </div>

      {mode?.kind === 'add' && <DrugForm role={role} onClose={() => setMode(null)} />}
      {mode?.kind === 'edit' && <DrugForm drug={mode.drug} role={role} onClose={() => setMode(null)} />}
      {mode?.kind === 'retire' && (
        <ReasonDialog
          title={`Retire ${mode.drug.name}?`}
          message="It disappears from prescribing, but its history and any remaining stock record stay. You can restore it later."
          confirmLabel="Retire drug"
          busy={api.retireDrug.isPending}
          onConfirm={(reason) => retire(mode.drug, reason)}
          onClose={() => setMode(null)}
        />
      )}
      {mode?.kind === 'receive' && <ReceiveDialog drug={mode.drug} onClose={() => setMode(null)} />}
      {mode?.kind === 'adjust' && <AdjustDialog drug={mode.drug} onClose={() => setMode(null)} />}
    </div>
  );
}

function ReceiveDialog({ drug, onClose }: { drug: DrugItem; onClose: () => void }) {
  const api = useInventoryActions();
  const suppliers = useSuppliers();
  const [f, setF] = useState({ qty: '', batch: '', expiry: '', supplier: '', cost: '', notes: '' });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setErr(null);
    const qty = Number(f.qty);
    if (!Number.isInteger(qty) || qty <= 0) { setErr('Enter a whole quantity above zero.'); return; }
    try {
      await api.receiveStock.mutateAsync({ inventoryId: drug.id, quantity: qty, batchNumber: f.batch, expiry: f.expiry, supplierId: f.supplier || null, unitCost: f.cost === '' ? null : Number(f.cost), notes: f.notes });
      onClose();
    } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <Dialog title={`Receive stock: ${drug.name}`} onClose={onClose}>
      <p className="text-xs text-muted">Enter the batch number and expiry date exactly as printed on the pack. To receive against a purchase order, use Orders.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Quantity (${drug.unit})`}><input className={inputClass} type="number" min="1" value={f.qty} onChange={set('qty')} /></Field>
        <Field label="Batch number"><input className={inputClass} value={f.batch} onChange={set('batch')} /></Field>
        <Field label="Expiry date"><input className={inputClass} type="date" min={todayStr()} value={f.expiry} onChange={set('expiry')} /></Field>
        <Field label="Unit cost (RM)"><input className={inputClass} type="number" min="0" step="0.01" value={f.cost} onChange={set('cost')} /></Field>
        <Field label="Supplier (optional)">
          <select className={inputClass} value={f.supplier} onChange={set('supplier')}><option value="">None</option>{(suppliers.data ?? []).filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </Field>
        <Field label="Note (optional)"><input className={inputClass} value={f.notes} onChange={set('notes')} /></Field>
      </div>
      {drug.registerRequired && <p className="chip-brand block px-3 py-2 text-xs">This is a controlled drug. The receipt goes in the register and needs a second person's signature.</p>}
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save} disabled={api.receiveStock.isPending}>Receive</button></div>
    </Dialog>
  );
}

const ADJUST_LABELS = {
  dispose: 'Dispose (expired, damaged or recalled)',
  internal_use: 'Used in the clinic (not dispensed to a patient)',
  decrease: 'Stock count correction: fewer than recorded',
  increase: 'Stock count correction: more than recorded',
} as const;

function AdjustDialog({ drug, onClose }: { drug: DrugItem; onClose: () => void }) {
  const api = useInventoryActions();
  const batches = (drug.batches ?? []).filter((b) => b.stock > 0);
  const [f, setF] = useState({ batch: batches[0]?.id ?? '', type: 'dispose' as keyof typeof ADJUST_LABELS, qty: '', reason: '' });
  const [err, setErr] = useState<string | null>(null);
  const batch = batches.find((b) => b.id === f.batch);

  const save = async () => {
    setErr(null);
    const qty = Number(f.qty);
    if (!Number.isInteger(qty) || qty <= 0) { setErr('Enter a whole quantity above zero.'); return; }
    if (!f.reason.trim()) { setErr('A reason is required.'); return; }
    try { await api.adjustStock.mutateAsync({ batchId: f.batch, type: f.type, quantity: qty, reason: f.reason.trim() }); onClose(); }
    catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <Dialog title={`Adjust stock: ${drug.name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch">
          <select className={inputClass} value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })}>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.batchId}, {b.stock} left, exp {b.expiryDate ?? 'unknown'}</option>)}
          </select>
        </Field>
        <Field label="What happened">
          <select className={inputClass} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as keyof typeof ADJUST_LABELS })}>
            {Object.entries(ADJUST_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label={`Quantity${batch ? ` (up to ${batch.stock} for this batch)` : ''}`}><input className={inputClass} type="number" min="1" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
        <Field label="Reason (kept in the ledger)"><input className={inputClass} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Expired 2026-09, broken bottle" /></Field>
      </div>
      {drug.registerRequired && <p className="chip-brand block px-3 py-2 text-xs">This is a controlled drug. The change goes in the register and needs a second person's signature.</p>}
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save} disabled={api.adjustStock.isPending || !f.batch}>Record</button></div>
    </Dialog>
  );
}
