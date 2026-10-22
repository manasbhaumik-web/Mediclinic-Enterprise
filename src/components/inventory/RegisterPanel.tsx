import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDrugs, useInventoryActions, useRegister } from '../../hooks/useInventoryData';
import { controlClassLabel, reconcile } from '../../domain/inventory';
import { maskICNumber } from '../../utils/piiMasker';
import { Notice, errorMessage, fmtDate } from './shared';

const ENTRY_LABEL = { opening: 'Opening balance', receipt: 'Receipt', dispense: 'Dispensed', disposal: 'Disposal', internal_use: 'Used in clinic', adjustment: 'Correction' } as const;

/** The controlled-drug register: running balances, who the drug went to, who prescribed it, and the second signature. */
export default function RegisterPanel({ focusPending = false }: { focusPending?: boolean }) {
  const { user, showPII } = useAuth();
  const drugs = useDrugs();
  const register = useRegister();
  const api = useInventoryActions();
  const [drugId, setDrugId] = useState('');
  const [pendingOnly, setPendingOnly] = useState(focusPending);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const controlled = (drugs.data ?? []).filter((d) => d.registerRequired);
  const entries = (register.data ?? []).filter((e) => (!drugId || e.inventoryId === drugId) && (!pendingOnly || !e.signedBy));
  const name = new Map((drugs.data ?? []).map((d) => [d.id, d.name]));
  const latest = new Map<string, number>();
  for (const e of register.data ?? []) if (!latest.has(e.inventoryId)) latest.set(e.inventoryId, e.balanceAfter);   // entries arrive newest first
  const unsigned = (id: string) => (register.data ?? []).filter((e) => e.inventoryId === id && !e.signedBy).length;

  const sign = async (id: string) => {
    setMsg(null);
    try { await api.signEntry.mutateAsync({ entryId: id }); setMsg({ ok: true, text: 'Signed.' }); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  return (
    <div className="space-y-4">
      {(drugs.error || register.error) && <Notice ok={false}>Could not load the register. Has the v22 inventory migration been applied?</Notice>}
      {controlled.length === 0 && !drugs.isLoading && (
        <p className="text-xs text-muted bg-surface border border-line-subtle p-4">
          No drug is kept in the controlled register yet. An administrator can mark a drug as controlled when adding or editing it (Stock tab).
        </p>
      )}

      {controlled.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {controlled.map((d) => {
            const bal = latest.get(d.id) ?? 0;
            const problem = reconcile(bal, d.currentStock);
            return (
              <button key={d.id} type="button" onClick={() => setDrugId(drugId === d.id ? '' : d.id)}
                className={`text-left bg-surface border p-3 cursor-pointer ${drugId === d.id ? 'border-brand' : 'border-line-subtle'}`}>
                <div className="text-xs font-bold text-ink">{d.name}</div>
                <div className="text-2xs text-subtle">{controlClassLabel(d.controlClass)}</div>
                <div className="text-xl font-bold font-mono text-ink">{bal}<span className="text-2xs text-subtle font-medium"> in register</span></div>
                {unsigned(d.id) > 0 && <div className="chip-brand inline-block px-2 py-0.5 text-2xs">{unsigned(d.id)} awaiting signature</div>}
                {problem && <div className="chip-danger inline-block px-2 py-0.5 text-2xs">{problem}</div>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1 font-medium"><input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} /> Only entries awaiting a second signature</label>
        {drugId && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setDrugId('')}>Show all drugs</button>}
      </div>
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}

      <div className="bg-surface border border-line-subtle overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle">
              <th className="p-3">When</th><th className="p-3">Drug</th><th className="p-3">Entry</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Balance</th><th className="p-3">Patient / prescriber</th><th className="p-3">Done by</th><th className="p-3">Second signature</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-line-subtle align-top">
                <td className="p-3 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                <td className="p-3 font-bold text-ink">{name.get(e.inventoryId) ?? '?'}</td>
                <td className="p-3">{ENTRY_LABEL[e.entryType]}{e.reference && <div className="text-subtle">{e.reference}</div>}{e.reason && <div className="text-subtle max-w-[14rem]">{e.reason}</div>}</td>
                <td className={`p-3 text-right font-mono ${e.quantity < 0 ? 'text-rose-700' : ''}`}>{e.quantity > 0 ? `+${e.quantity}` : e.quantity}</td>
                <td className="p-3 text-right font-mono font-bold">{e.balanceAfter}</td>
                <td className="p-3">{e.patientName ? <>{e.patientName}<div className="font-mono text-subtle">{maskICNumber(e.patientIc, showPII)}</div></> : '–'}{e.prescriberName && <div className="text-subtle">Dr: {e.prescriberName}</div>}</td>
                <td className="p-3">{e.performedByName ?? '?'}</td>
                <td className="p-3">
                  {e.signedBy ? <span className="text-accent font-bold">{e.signedByName}<div className="font-medium text-subtle">{fmtDate(e.signedAt)}</div></span>
                    : e.performedBy === user?.id ? <span className="chip-brand px-2 py-0.5 text-2xs">Needs another person</span>
                      : <button type="button" className="btn-primary" disabled={api.signEntry.isPending} onClick={() => sign(e.id)}>Sign</button>}
                </td>
              </tr>
            ))}
            {entries.length === 0 && !register.isLoading && <tr><td className="p-6 text-center text-subtle" colSpan={8}>No register entries.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-2xs text-subtle leading-relaxed">
        The register is append-only: entries cannot be edited or removed, and a correction is a new entry. A dispensed controlled drug cannot leave the pharmacy until a different pharmacist or administrator has signed its entry.
        This is a working record; it is not an official poison book or controlled-drug register format, so confirm what your licence requires.
      </p>
    </div>
  );
}
