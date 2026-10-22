import React, { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import { useDrugs, useInventoryActions, useInventorySettings, useSuppliers } from '../../hooks/useInventoryData';
import { DrugItem, buildAlerts, controlClassLabel, isExpired, usableStock } from '../../domain/inventory';
import DrugForm from './DrugForm';
import { Dialog, Field, Notice, errorMessage, inputClass, todayStr } from './shared';

type Mode = { kind: 'edit' | 'receive' | 'adjust'; drug: DrugItem } | { kind: 'add' } | null;

/** The drug catalogue and stock by batch. Every change goes through a database function, so nothing here edits stock directly. */
export default function StockPanel({ role, focusDrugId }: { role: 'admin' | 'pharmacist'; focusDrugId?: string | null }) {
  const drugs = useDrugs();
  const { settings } = useInventorySettings();
  const api = useInventoryActions();
  const [q, setQ] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const today = todayStr();

  useEffect(() => { if (focusDrugId) { setOpen(focusDrugId); setQ(''); } }, [focusDrugId]);

  const all = drugs.data ?? [];
  const alertsByDrug = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of buildAlerts(all, settings.data?.nearExpiryDays ?? 60, today)) m.set(a.drugId, (m.get(a.drugId) ?? 0) + 1);
    return m;
  }, [all, settings.data, today]);

  const rows = all.filter((d) => (showRetired || d.status === 'active') && (`${d.name} ${d.category} ${d.genericName ?? ''}`.toLowerCase().includes(q.toLowerCase())));

  const retire = async (d: DrugItem) => {
    const reason = window.prompt(`Why is ${d.name} being retired? It disappears from prescribing but its history stays.`);
    if (!reason?.trim()) return;
    setMsg(null);
    try { await api.retireDrug.mutateAsync({ id: d.id, reason: reason.trim() }); setMsg({ ok: true, text: `${d.name} retired.` }); }
    catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };
  const restore = async (d: DrugItem) => {
    setMsg(null);
    try { await api.restoreDrug.mutateAsync(d.id); setMsg({ ok: true, text: `${d.name} restored.` }); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input className={`${inputClass} !w-72`} placeholder="Search name, generic or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search drugs" />
          <label className="flex items-center gap-1 text-xs font-medium"><input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} /> Show retired</label>
        </div>
        <Button size="sm" onClick={() => setMode({ kind: 'add' })}>Add a drug</Button>
      </div>

      {drugs.error && <Notice ok={false}>Could not load the catalogue. Has the v22 inventory migration been applied?</Notice>}
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
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
                      <button type="button" className="font-bold text-ink text-left cursor-pointer" onClick={() => setOpen(open === d.id ? null : d.id)}>{d.name}</button>
                      <div className="font-medium text-subtle">{d.category}{d.drugType ? ` · ${d.drugType}` : ''}</div>
                    </td>
                    <td className="p-3 text-right font-mono">{d.currentStock}{usable !== d.currentStock && <div className="text-amber-700" title="Part of the stock is expired">{usable} usable</div>}</td>
                    <td className="p-3 text-right font-mono">{d.minThreshold}</td>
                    <td className="p-3 text-right font-mono">RM{d.price.toFixed(2)}</td>
                    <td className="p-3 space-x-1">
                      {retired && <span className="text-2xs font-bold px-2 py-0.5 border uppercase bg-slate-100 text-muted border-slate-300">Retired</span>}
                      {d.registerRequired && <span className="text-2xs font-bold px-2 py-0.5 border uppercase chip-info" title={controlClassLabel(d.controlClass)}>Controlled</span>}
                      {!retired && (alertsByDrug.get(d.id) ?? 0) > 0 && <span className="text-2xs font-bold px-2 py-0.5 border uppercase chip-warn">{alertsByDrug.get(d.id)} alert{alertsByDrug.get(d.id) === 1 ? '' : 's'}</span>}
                    </td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      {!retired && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setMode({ kind: 'receive', drug: d })}>Receive</button>}
                      {!retired && d.currentStock > 0 && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setMode({ kind: 'adjust', drug: d })}>Adjust</button>}
                      {!retired && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setMode({ kind: 'edit', drug: d })}>Edit</button>}
                      {!retired ? <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => retire(d)}>Retire</button>
                        : <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => restore(d)}>Restore</button>}
                    </td>
                  </tr>
                  {open === d.id && (
                    <tr><td colSpan={6} className="p-3 bg-surface-accent">
                      {retired && d.retireReason && <p className="text-xs text-muted mb-2">Retired: {d.retireReason}</p>}
                      {(d.batches ?? []).length === 0 ? <p className="text-xs text-subtle">No batches. Use Receive to add stock.</p> : (
                        <table className="w-full text-xs">
                          <thead><tr className="text-left text-2xs uppercase text-subtle"><th className="py-1">Batch</th><th className="py-1">Expiry</th><th className="py-1 text-right">Stock</th><th className="py-1 text-right">Received</th></tr></thead>
                          <tbody>
                            {[...(d.batches ?? [])].sort((a, b) => (a.expiryDate ?? '9999') < (b.expiryDate ?? '9999') ? -1 : 1).map((b) => (
                              <tr key={b.id} className="border-t border-line-subtle">
                                <td className="py-1 font-mono">{b.batchId}</td>
                                <td className={`py-1 ${isExpired(b, today) && b.stock > 0 ? 'text-rose-700 font-bold' : ''}`}>{b.expiryDate ?? 'Unknown'}{isExpired(b, today) && b.stock > 0 ? ' (expired)' : ''}</td>
                                <td className="py-1 text-right font-mono">{b.stock}</td>
                                <td className="py-1 text-right text-subtle">{b.receivedAt ? new Date(b.receivedAt).toLocaleDateString() : ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && !drugs.isLoading && (
              <tr><td className="p-6 text-subtle text-center" colSpan={6}>
                {all.length === 0 ? 'No drugs yet. Add your first drug, then receive stock into it.' : 'Nothing matches that search.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {mode?.kind === 'add' && <DrugForm role={role} onClose={() => setMode(null)} />}
      {mode?.kind === 'edit' && <DrugForm drug={mode.drug} role={role} onClose={() => setMode(null)} />}
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
      {drug.registerRequired && <p className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-3 py-2">This is a controlled drug. The receipt goes in the register and needs a second person's signature.</p>}
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={api.receiveStock.isPending}>Receive</Button></div>
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
      {drug.registerRequired && <p className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-3 py-2">This is a controlled drug. The change goes in the register and needs a second person's signature.</p>}
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={api.adjustStock.isPending || !f.batch}>Record</Button></div>
    </Dialog>
  );
}
