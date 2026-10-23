import React, { useState } from 'react';
import { useDrugs, useInventoryEvents, useMovements } from '../../hooks/useInventoryData';
import { MOVEMENT_LABEL } from '../../domain/inventory';
import { fmtDate, inputClass } from './shared';

/** The append-only ledger of every stock movement, and the log of catalogue, supplier and order changes. */
export default function InventoryHistory() {
  const [drugId, setDrugId] = useState('');
  const [view, setView] = useState<'stock' | 'changes'>('stock');
  const drugs = useDrugs();
  const moves = useMovements(drugId || null, 300);
  const events = useInventoryEvents();
  const name = new Map((drugs.data ?? []).map((d) => [d.id, d.name]));
  const tab = (t: typeof view) => `px-3 py-1.5 text-xs font-bold cursor-pointer ${view === t ? 'bg-primary text-white' : 'text-muted hover:bg-surface-accent'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex border border-line-subtle">
          <button role="tab" aria-selected={view === 'stock'} className={tab('stock')} onClick={() => setView('stock')}>Stock ledger</button>
          <button role="tab" aria-selected={view === 'changes'} className={tab('changes')} onClick={() => setView('changes')}>Changes</button>
        </div>
        {view === 'stock' && (
          <select className={`${inputClass} !w-72`} aria-label="Drug" value={drugId} onChange={(e) => setDrugId(e.target.value)}>
            <option value="">All drugs</option>{(drugs.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <span className="text-2xs text-subtle">Nothing here can be edited or deleted.</span>
      </div>

      {view === 'stock' ? (
        <div className="bg-surface border border-line-subtle overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle"><th className="p-3">When</th><th className="p-3">Drug</th><th className="p-3">What</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Balance</th><th className="p-3">Reason</th><th className="p-3">By</th></tr></thead>
            <tbody>
              {(moves.data ?? []).map((m) => (
                <tr key={m.id} className="border-b border-line-subtle">
                  <td className="p-3 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                  <td className="p-3 font-bold text-ink">{name.get(m.inventoryId) ?? '?'}</td>
                  <td className="p-3">{MOVEMENT_LABEL[m.type]}</td>
                  <td className={`p-3 text-right font-mono ${m.quantity < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="p-3 text-right font-mono">{m.balanceAfter}</td>
                  <td className="p-3 text-muted max-w-xs">{m.reason}</td>
                  <td className="p-3">{m.actorName ?? 'System'}</td>
                </tr>
              ))}
              {(moves.data ?? []).length === 0 && <tr><td className="p-6 text-center text-subtle" colSpan={7}>No stock movements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
          {(events.data ?? []).map((e) => (
            <div key={e.id} className="px-3 py-2 text-xs">
              <span className="font-mono text-subtle">{fmtDate(e.createdAt)}</span> · <b>{e.entity.replace(/_/g, ' ')}</b> · {e.action.replace(/_/g, ' ')}
              {e.entity === 'drug' && e.entityId && name.get(e.entityId) && <> · {name.get(e.entityId)}</>}
              {e.detail && <div className="text-subtle break-words">{Object.entries(e.detail).filter(([k, v]) => v !== null && v !== '' && k !== 'before' && k !== 'after' && k !== 'name').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ')}</div>}
            </div>
          ))}
          {(events.data ?? []).length === 0 && <p className="p-6 text-center text-xs text-subtle">No changes recorded yet.</p>}
        </div>
      )}
    </div>
  );
}
