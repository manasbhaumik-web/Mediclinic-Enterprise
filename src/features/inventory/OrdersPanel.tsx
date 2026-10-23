import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { useDrugs, useInventoryActions, usePurchaseOrders, useSuppliers } from '../../hooks/useInventoryData';
import { PO_STYLE, PurchaseOrder, Supplier, isOverdue, poProgress, poTotal } from '../../domain/inventory';
import { Dialog, Field, Notice, ReasonDialog, errorMessage, inputClass, myr, todayStr, toneClass } from './shared';
import type { OrderSeed } from './AlertsPanel';

type Sub = 'orders' | 'suppliers';

/** Suppliers and purchase orders, with goods received against batches. */
export default function OrdersPanel({ seed, onSeedUsed }: { seed: OrderSeed[] | null; onSeedUsed: () => void }) {
  const [sub, setSub] = useState<Sub>('orders');
  const tab = (t: Sub) => `px-3 py-1.5 text-xs font-bold cursor-pointer ${sub === t ? 'bg-primary text-white' : 'text-muted hover:bg-surface-accent'}`;
  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex border border-line-subtle">
        <button role="tab" aria-selected={sub === 'orders'} className={tab('orders')} onClick={() => setSub('orders')}>Purchase orders</button>
        <button role="tab" aria-selected={sub === 'suppliers'} className={tab('suppliers')} onClick={() => setSub('suppliers')}>Suppliers</button>
      </div>
      {sub === 'orders' ? <Orders seed={seed} onSeedUsed={onSeedUsed} /> : <Suppliers />}
    </div>
  );
}

function Orders({ seed, onSeedUsed }: { seed: OrderSeed[] | null; onSeedUsed: () => void }) {
  const orders = usePurchaseOrders();
  const suppliers = useSuppliers();
  const drugs = useDrugs();
  const api = useInventoryActions();
  const [form, setForm] = useState<{ po?: PurchaseOrder; seed?: OrderSeed[] } | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null);
  const today = todayStr();
  const supplier = new Map((suppliers.data ?? []).map((s) => [s.id, s.name]));
  const drugName = new Map((drugs.data ?? []).map((d) => [d.id, d.name]));

  useEffect(() => { if (seed && seed.length) { setForm({ seed }); onSeedUsed(); } }, [seed, onSeedUsed]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };
  const cancel = (o: PurchaseOrder) => setCancelling(o);

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setForm({})}>New purchase order</Button></div>
      {orders.error && <Notice ok={false}>Could not load purchase orders. Try again, or ask an administrator to check the inventory set-up.</Notice>}
      {cancelling && (
        <ReasonDialog
          title={`Cancel ${cancelling.poNumber}?`}
          message="The order is marked cancelled and no more stock can be received against it."
          confirmLabel="Cancel order"
          onConfirm={(reason) => { const o = cancelling; setCancelling(null); void act(() => api.setPoStatus.mutateAsync({ id: o.id, status: 'cancelled', reason }), `${o.poNumber} cancelled.`); }}
          onClose={() => setCancelling(null)}
        />
      )}
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle"><th className="p-3">Order</th><th className="p-3">Supplier</th><th className="p-3">Status</th><th className="p-3">Expected</th><th className="p-3 text-right">Received</th><th className="p-3 text-right">Value</th><th className="p-3" /></tr></thead>
          <tbody>
            {(orders.data ?? []).map((o) => {
              const st = PO_STYLE[o.status];
              const pr = poProgress(o.lines);
              return (
                <React.Fragment key={o.id}>
                  <tr className="border-b border-line-subtle">
                    <td className="p-3 font-bold text-ink"><button type="button" className="cursor-pointer" onClick={() => setOpen(open === o.id ? null : o.id)}>{o.poNumber}</button></td>
                    <td className="p-3">{supplier.get(o.supplierId) ?? '?'}</td>
                    <td className="p-3"><span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${toneClass[st.tone]}`}>{st.label}</span>{isOverdue(o, today) && <span className="chip-danger ml-2 px-2 py-0.5 text-2xs uppercase">Overdue</span>}</td>
                    <td className="p-3 font-mono">{o.expectedDate ?? '–'}</td>
                    <td className="p-3 text-right font-mono">{pr.received}/{pr.ordered} ({pr.percent}%)</td>
                    <td className="p-3 text-right font-mono">{poTotal(o.lines) ? myr(poTotal(o.lines)) : '–'}</td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      {o.status === 'draft' && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setForm({ po: o })}>Edit</button>}
                      {o.status === 'draft' && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => act(() => api.setPoStatus.mutateAsync({ id: o.id, status: 'ordered' }), `${o.poNumber} marked as ordered.`)}>Mark ordered</button>}
                      {(o.status === 'ordered' || o.status === 'partially_received') && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setReceiving(o)}>Receive goods</button>}
                      {(o.status === 'draft' || o.status === 'ordered') && <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => cancel(o)}>Cancel</button>}
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr><td colSpan={7} className="p-3 bg-surface-accent">
                      {o.notes && <p className="text-xs text-muted mb-1">{o.notes}</p>}
                      {o.cancelReason && <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">Cancelled: {o.cancelReason}</p>}
                      <ul className="text-xs space-y-0.5">{o.lines.map((l) => <li key={l.id}>{drugName.get(l.inventoryId) ?? '?'}: ordered {l.quantityOrdered}, received {l.quantityReceived}{l.unitCost !== null ? ` @ ${myr(l.unitCost)}` : ''}</li>)}</ul>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {(orders.data ?? []).length === 0 && <tr><td className="p-6 text-center text-subtle" colSpan={7}>No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {form && <PoForm po={form.po} seed={form.seed} onClose={() => setForm(null)} />}
      {receiving && <ReceiveGoods po={receiving} onClose={() => setReceiving(null)} />}
    </div>
  );
}

function PoForm({ po, seed, onClose }: { po?: PurchaseOrder; seed?: OrderSeed[]; onClose: () => void }) {
  const suppliers = useSuppliers();
  const drugs = useDrugs();
  const api = useInventoryActions();
  type Line = { inventoryId: string; qty: string; cost: string };
  const [supplierId, setSupplierId] = useState(po?.supplierId ?? '');
  const [expected, setExpected] = useState(po?.expectedDate ?? '');
  const [notes, setNotes] = useState(po?.notes ?? '');
  const [lines, setLines] = useState<Line[]>(
    po ? po.lines.map((l) => ({ inventoryId: l.inventoryId, qty: String(l.quantityOrdered), cost: l.unitCost === null ? '' : String(l.unitCost) }))
      : (seed ?? []).map((s) => ({ inventoryId: s.inventoryId, qty: String(s.quantity), cost: '' })),
  );
  const [err, setErr] = useState<string | null>(null);
  const active = (drugs.data ?? []).filter((d) => d.status === 'active');
  const upd = (i: number, patch: Partial<Line>) => setLines(lines.map((l, n) => (n === i ? { ...l, ...patch } : l)));

  const save = async () => {
    setErr(null);
    try {
      await api.savePo.mutateAsync({
        id: po?.id ?? null, supplierId, expected: expected || null, notes,
        lines: lines.filter((l) => l.inventoryId).map((l) => ({ inventory_id: l.inventoryId, quantity: Number(l.qty), unit_cost: l.cost === '' ? null : Number(l.cost) })),
      });
      onClose();
    } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <Dialog title={po ? `Edit ${po.poNumber}` : 'New purchase order'} onClose={onClose} wide>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Supplier"><select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Choose…</option>{(suppliers.data ?? []).filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Expected delivery"><input className={inputClass} type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
        <Field label="Note"><input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
      {(suppliers.data ?? []).length === 0 && <p className="chip-warn block px-3 py-2 text-xs">Add a supplier first (Suppliers tab).</p>}
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select className={`${inputClass} !w-72`} aria-label="Drug" value={l.inventoryId} onChange={(e) => upd(i, { inventoryId: e.target.value })}><option value="">Choose a drug…</option>{active.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <input className={`${inputClass} !w-24`} type="number" min="1" aria-label="Quantity" placeholder="Qty" value={l.qty} onChange={(e) => upd(i, { qty: e.target.value })} />
            <input className={`${inputClass} !w-28`} type="number" min="0" step="0.01" aria-label="Unit cost" placeholder="Unit cost" value={l.cost} onChange={(e) => upd(i, { cost: e.target.value })} />
            <button type="button" className="btn-secondary" onClick={() => setLines(lines.filter((_, n) => n !== i))}>Remove</button>
          </div>
        ))}
        <button type="button" className="text-xs font-bold text-accent cursor-pointer" onClick={() => setLines([...lines, { inventoryId: '', qty: '', cost: '' }])}>+ Add item</button>
      </div>
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={api.savePo.isPending || !supplierId}>Save as draft</Button></div>
    </Dialog>
  );
}

function ReceiveGoods({ po, onClose }: { po: PurchaseOrder; onClose: () => void }) {
  const drugs = useDrugs();
  const api = useInventoryActions();
  const name = new Map((drugs.data ?? []).map((d) => [d.id, d.name]));
  type Row = { qty: string; batch: string; expiry: string };
  const open = po.lines.filter((l) => l.quantityReceived < l.quantityOrdered);
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(open.map((l) => [l.id, { qty: String(l.quantityOrdered - l.quantityReceived), batch: '', expiry: '' }])));
  const [err, setErr] = useState<string | null>(null);
  const upd = (id: string, patch: Partial<Row>) => setRows({ ...rows, [id]: { ...rows[id], ...patch } });

  const save = async () => {
    setErr(null);
    const lines = open.filter((l) => Number(rows[l.id].qty) > 0).map((l) => ({ line_id: l.id, quantity: Number(rows[l.id].qty), batch_number: rows[l.id].batch, expiry_date: rows[l.id].expiry }));
    try { await api.receivePo.mutateAsync({ id: po.id, lines }); onClose(); } catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <Dialog title={`Receive goods: ${po.poNumber}`} onClose={onClose} wide>
      <p className="text-xs text-muted">Enter what actually arrived, with the batch number and expiry date from each pack. Leave a quantity at 0 for items that did not arrive.</p>
      {open.map((l) => (
        <div key={l.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border-b border-line-subtle pb-2">
          <div className="text-xs font-bold text-ink md:col-span-1">{name.get(l.inventoryId) ?? '?'}<div className="font-medium text-subtle">{l.quantityOrdered - l.quantityReceived} outstanding</div></div>
          <Field label="Quantity"><input className={inputClass} type="number" min="0" value={rows[l.id].qty} onChange={(e) => upd(l.id, { qty: e.target.value })} /></Field>
          <Field label="Batch number"><input className={inputClass} value={rows[l.id].batch} onChange={(e) => upd(l.id, { batch: e.target.value })} /></Field>
          <Field label="Expiry date"><input className={inputClass} type="date" min={todayStr()} value={rows[l.id].expiry} onChange={(e) => upd(l.id, { expiry: e.target.value })} /></Field>
        </div>
      ))}
      {err && <Notice ok={false}>{err}</Notice>}
      <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={api.receivePo.isPending}>Receive into stock</Button></div>
    </Dialog>
  );
}

function Suppliers() {
  const suppliers = useSuppliers();
  const api = useInventoryActions();
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ name: '', contactName: '', phone: '', email: '', address: '', notes: '' });

  const startEdit = (s: Partial<Supplier>) => {
    setEditing(s);
    setF({ name: s.name ?? '', contactName: s.contactName ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', notes: s.notes ?? '' });
  };
  const save = async () => {
    setMsg(null);
    if (!f.name.trim()) { setMsg({ ok: false, text: 'Enter the supplier name.' }); return; }
    try { await api.saveSupplier.mutateAsync({ id: editing?.id, ...f, active: editing?.active ?? true }); setEditing(null); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };
  const toggle = (s: Supplier) => api.saveSupplier.mutateAsync({ id: s.id, name: s.name, contactName: s.contactName ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', notes: s.notes ?? '', active: !s.active }).catch((e) => setMsg({ ok: false, text: errorMessage(e) }));

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => startEdit({})}>Add a supplier</Button></div>
      {suppliers.error && <Notice ok={false}>Could not load suppliers. Has the v22 inventory migration been applied?</Notice>}
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {(suppliers.data ?? []).map((s) => (
          <div key={s.id} className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs ${s.active ? '' : 'opacity-50'}`}>
            <span><b className="text-ink">{s.name}</b> <span className="text-subtle">{[s.contactName, s.phone, s.email].filter(Boolean).join(' · ')}</span></span>
            <span className="space-x-3"><button type="button" className="font-bold text-accent cursor-pointer" onClick={() => startEdit(s)}>Edit</button><button type="button" className="font-bold text-muted cursor-pointer" onClick={() => toggle(s)}>{s.active ? 'Deactivate' : 'Reactivate'}</button></span>
          </div>
        ))}
        {(suppliers.data ?? []).length === 0 && <p className="p-6 text-center text-xs text-subtle">No suppliers yet.</p>}
      </div>
      {editing && (
        <Dialog title={editing.id ? 'Edit supplier' : 'Add a supplier'} onClose={() => setEditing(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Contact person"><input className={inputClass} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          <Field label="Address"><input className={inputClass} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Notes"><input className={inputClass} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          {msg && !msg.ok && <Notice ok={false}>{msg.text}</Notice>}
          <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button><Button size="sm" onClick={save} disabled={api.saveSupplier.isPending}>Save</Button></div>
        </Dialog>
      )}
    </div>
  );
}
