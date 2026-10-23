import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { PayProfile, usePayProfiles } from '../../hooks/usePayroll';
import { PayItem } from '../../domain/payroll';
import { errorMessage, inputClass, myr } from './shared';

/** Salary, statutory numbers, bank details and recurring allowances/deductions for each person. */
export default function PayProfiles() {
  const api = usePayProfiles();
  const [openId, setOpenId] = useState<string | null>(null);
  const people = (api.profiles.data ?? []).filter((p) => p.status === 'Active');
  const items = api.items.data ?? [];

  return (
    <div className="space-y-3">
      {api.profiles.error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load pay profiles. Has the v20 payroll migration been applied?
        </p>
      )}
      <p className="text-xs text-muted">Only active staff are paid. Changes apply to runs prepared or recalculated afterwards; approved and paid runs never change.</p>
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {people.length === 0 && <p className="p-4 text-xs text-subtle">No active staff yet.</p>}
        {people.map((p) => {
          const missing = [!p.salaryBase && 'salary', !p.bankAccountNumber && 'bank account', !p.epfNumber && 'EPF no.'].filter(Boolean);
          return (
            <div key={p.id}>
              <button type="button" onClick={() => setOpenId(openId === p.id ? null : p.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-accent">
                <span>
                  <span className="text-sm font-bold text-ink">{p.name}</span>
                  <span className="text-xs text-subtle ml-2">{p.role}</span>
                </span>
                <span className="text-xs font-mono text-muted">
                  {myr(p.salaryBase)}
                  {missing.length > 0 && <span className="ml-3 text-amber-700 font-bold">Missing: {missing.join(', ')}</span>}
                </span>
              </button>
              {openId === p.id && <ProfileEditor profile={p} items={items.filter((i) => i.staffId === p.id)} api={api} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileEditor({ profile, items, api }: { profile: PayProfile; items: PayItem[]; api: ReturnType<typeof usePayProfiles> }) {
  const [f, setF] = useState({
    salaryBase: String(profile.salaryBase), citizenship: profile.citizenship, epfNumber: profile.epfNumber ?? '', socsoNumber: profile.socsoNumber ?? '',
    taxRef: profile.taxRef ?? '', bankName: profile.bankName ?? '', bankAccountHolder: profile.bankAccountHolder ?? '', bankAccountNumber: profile.bankAccountNumber ?? '',
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [item, setItem] = useState({ kind: 'allowance' as 'allowance' | 'deduction', label: '', amount: '', contributory: false });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    const salary = Number(f.salaryBase);
    if (!Number.isFinite(salary) || salary < 0) { setMsg({ ok: false, text: 'Salary must be a number, zero or more.' }); return; }
    try {
      await api.saveProfile.mutateAsync({
        id: profile.id, salaryBase: salary, citizenship: f.citizenship, epfNumber: f.epfNumber.trim() || null, socsoNumber: f.socsoNumber.trim() || null,
        taxRef: f.taxRef.trim() || null, bankName: f.bankName.trim() || null, bankAccountHolder: f.bankAccountHolder.trim() || null,
        bankAccountNumber: f.bankAccountNumber.replace(/\s/g, '') || null,
      });
      setMsg({ ok: true, text: 'Saved.' });
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const addItem = async () => {
    const amount = Number(item.amount);
    if (!item.label.trim() || !Number.isFinite(amount) || amount <= 0) { setMsg({ ok: false, text: 'Give the item a name and an amount above zero.' }); return; }
    try {
      await api.saveItem.mutateAsync({ staffId: profile.id, kind: item.kind, label: item.label.trim(), amount, contributory: item.kind === 'allowance' && item.contributory, active: true });
      setItem({ ...item, label: '', amount: '' });
      setMsg(null);
    } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const field = (label: string, k: keyof typeof f, type = 'text') => (
    <label className="block space-y-1">
      <span className="text-2xs font-bold uppercase tracking-wider text-subtle">{label}</span>
      <input className={inputClass} type={type} value={f[k]} onChange={set(k)} />
    </label>
  );

  return (
    <div className="px-4 pb-4 space-y-4 bg-surface-accent">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        {field('Monthly basic salary (RM)', 'salaryBase', 'number')}
        <label className="block space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-subtle">Citizenship</span>
          <select className={inputClass} value={f.citizenship} onChange={set('citizenship')}>
            <option value="citizen">Malaysian citizen</option>
            <option value="pr">Permanent resident</option>
            <option value="foreign">Foreign worker</option>
          </select>
        </label>
        {field('EPF number', 'epfNumber')}
        {field('SOCSO number', 'socsoNumber')}
        {field('Income tax reference', 'taxRef')}
        {field('Bank', 'bankName')}
        {field('Account holder', 'bankAccountHolder')}
        {field('Account number', 'bankAccountNumber')}
      </div>
      <Button size="sm" onClick={save} disabled={api.saveProfile.isPending}>Save profile</Button>

      <div className="space-y-2">
        <h4 className="type-heading-caps text-ink">Recurring allowances and deductions</h4>
        {items.length === 0 && <p className="text-xs text-subtle">None.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 text-xs bg-surface border border-line-subtle px-3 py-2">
            <span className="font-medium">
              {i.label} <span className="text-subtle">({i.kind}{i.contributory ? ', counts towards EPF/SOCSO/EIS' : ''})</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-mono">{myr(i.amount)}</span>
              <button type="button" className="text-rose-700 font-bold cursor-pointer" onClick={() => api.removeItem.mutate(i.id)}>Remove</button>
            </span>
          </div>
        ))}
        <div className="flex flex-wrap items-end gap-2">
          <select className={`${inputClass} !w-32`} value={item.kind} onChange={(e) => setItem({ ...item, kind: e.target.value as 'allowance' | 'deduction' })} aria-label="Kind">
            <option value="allowance">Allowance</option>
            <option value="deduction">Deduction</option>
          </select>
          <input className={`${inputClass} !w-48`} placeholder="Name, e.g. Transport" value={item.label} onChange={(e) => setItem({ ...item, label: e.target.value })} aria-label="Name" />
          <input className={`${inputClass} !w-28`} type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={(e) => setItem({ ...item, amount: e.target.value })} aria-label="Amount" />
          {item.kind === 'allowance' && (
            <label className="flex items-center gap-1 text-xs font-medium">
              <input type="checkbox" checked={item.contributory} onChange={(e) => setItem({ ...item, contributory: e.target.checked })} /> Counts for EPF/SOCSO/EIS
            </label>
          )}
          <Button variant="outline" size="sm" onClick={addItem} disabled={api.saveItem.isPending}>Add</Button>
        </div>
      </div>
      {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}
    </div>
  );
}
