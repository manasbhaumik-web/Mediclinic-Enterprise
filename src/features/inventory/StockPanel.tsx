import { forecastStockDepletion } from '../../domain/predictiveStock';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Bell, X } from 'lucide-react';
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
      {/* Search, retired toggle and the primary action */}
      <div className="bg-surface border border-line px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-[1_1_18rem] max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              className="w-full min-h-11 pl-10 pr-10 bg-surface border border-line text-ink placeholder:text-muted text-sm rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
              placeholder="Search name, generic or category"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search drugs"
              autoComplete="off"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-muted hover:text-ink cursor-pointer" aria-label="Clear search">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2.5 min-h-11 px-3 text-sm font-medium text-ink cursor-pointer select-none">
            <input type="checkbox" className="w-5 h-5 rounded-none accent-primary cursor-pointer" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
            Show retired
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onShowAlerts && (
            <button type="button" className="btn-secondary px-4 text-sm" onClick={onShowAlerts}>
              <Bell className="w-4 h-4 text-accent" aria-hidden="true" />
              Open alerts
              {summary.out + summary.low + summary.expiry > 0 && <span className="w-2 h-2 bg-rose-600" aria-label="Alerts waiting" />}
            </button>
          )}
          <button type="button" className="btn-primary px-5 text-sm" onClick={() => setMode({ kind: 'add' })}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add a drug
          </button>
        </div>
      </div>

      {/* Stock level filter */}
      <div className="flex flex-wrap border border-line bg-surface self-start w-fit max-w-full" role="group" aria-label="Stock levels">
        {([
          { id: 'all' as Filter, label: 'All drugs', count: activeDrugs.length },
          { id: 'out' as Filter, label: 'Out of stock', count: summary.out, alert: summary.out > 0 },
          { id: 'low' as Filter, label: 'Low stock', count: summary.low, alert: summary.low > 0 },
          { id: 'expiry' as Filter, label: 'Expired or near expiry', count: summary.expiry, alert: summary.expiry > 0 },
        ]).map((tab, i) => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setFilter(tab.id)}
              className={`min-h-11 px-4 text-sm inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i > 0 ? 'border-l border-line' : ''} ${
                isSelected ? 'bg-primary text-white font-bold' : 'text-muted font-semibold hover:bg-surface-strong hover:text-ink'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 text-xs font-bold tabular-nums ${isSelected ? 'bg-white/20 text-white' : tab.alert ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-muted text-muted'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {drugs.error && <Notice ok={false}>Could not load the stock list. Try again, or ask an administrator to check the inventory set-up.</Notice>}
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}

      <div className="bg-surface border border-line overflow-x-auto lg:overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted bg-surface-muted border-b border-line">
              <th className="px-4 py-3">Drug</th><th className="px-4 py-3 text-right">In stock</th><th className="px-4 py-3 text-right">Reorder at</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3">Flags</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th>
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
                      <div className="tabular-nums font-bold text-ink">{d.currentStock}</div>
                      {usable !== d.currentStock && <div className="text-muted" title="Part of the stock is expired">{usable} usable</div>}
                      {!retired && (
                        <div className="mt-1 ml-auto w-24 h-2 bg-surface-strong relative" role="img" aria-label={`${usable} in date against a reorder level of ${d.minThreshold}`}>
                          <div className={usable === 0 ? 'h-2 bg-rose-600' : usable <= d.minThreshold ? 'h-2 bg-amber-500' : 'h-2 bg-primary'} style={{ width: `${Math.min(100, Math.round((usable / Math.max(1, d.minThreshold * 3)) * 100))}%` }} />
                          <span className="absolute top-[-2px] bottom-[-2px] w-px bg-ink/60" style={{ left: '33.3%' }} aria-hidden="true" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">{d.minThreshold}</td>
                    <td className="p-3 text-right tabular-nums">RM{d.price.toFixed(2)}</td>
                    <td className="p-3 space-x-1 space-y-1">
                      {retired && <span className="chip-neutral text-xs px-2 py-0.5 font-bold">Retired</span>}
                      {!retired && has(d.id, 'out_of_stock') && <span className="chip-danger text-xs px-2 py-0.5 font-bold">Out of stock</span>}
                      {!retired && has(d.id, 'low_stock') && <span className="chip-warn text-xs px-2 py-0.5 font-bold">Low stock</span>}
                      {!retired && has(d.id, 'expired_stock') && <span className="chip-danger text-xs px-2 py-0.5 font-bold">Expired batch</span>}
                      {!retired && has(d.id, 'near_expiry') && <span className="chip-warn text-xs px-2 py-0.5 font-bold">Near expiry</span>}
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
                              Stock forecast: <span className="font-normal text-muted">{forecast.summary}</span>
                            </span>
                            <span className="text-2xs tabular-nums font-bold bg-surface-accent text-accent px-2 py-0.5 border border-line">
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
                                <td className="py-1 tabular-nums">{b.batchId}</td>
                                <td className={`py-1 ${isExpired(b, today) && b.stock > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}`}>{b.expiryDate ?? 'Unknown'}{isExpired(b, today) && b.stock > 0 ? ' (expired)' : ''}</td>
                                <td className="py-1 text-right tabular-nums">{b.stock}</td>
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
