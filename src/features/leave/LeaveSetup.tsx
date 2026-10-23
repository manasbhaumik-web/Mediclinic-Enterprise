import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { useLeaveActions, useLeaveReference } from '../../hooks/useLeave';
import { DEFAULT_SETTINGS, LeaveRuleRow, WEEKDAYS, describeEntitlement } from '../../domain/leave';
import { errorMessage, inputClass } from '../payroll/shared';

type RuleRowT = LeaveRuleRow & { note: string | null };
const EXAMPLE = '{"type":"service_tiers","tiers":[{"minYears":0,"days":8},{"minYears":2,"days":12},{"minYears":5,"days":16}]}';

function eligibilityText(r: LeaveRuleRow): string {
  const e = r.eligibility ?? {};
  const parts: string[] = [];
  if (e.genders?.length) parts.push(e.genders.join('/'));
  if (e.minServiceMonths !== undefined) parts.push(`${e.minServiceMonths}+ months service`);
  return parts.length ? parts.join(', ') : 'Everyone';
}

/** Working week, leave types, entitlement rules and public holidays. Administrators edit rules; HR also manages public holidays. */
export default function LeaveSetup({ role }: { role: 'admin' | 'hr' }) {
  const admin = role === 'admin';
  const { types, settings, holidays, rules } = useLeaveReference();
  const api = useLeaveActions();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Partial<RuleRowT> | null>(null);
  const attempt = async (fn: () => Promise<unknown>, ok?: string) => {
    setMsg(null);
    try { await fn(); if (ok) setMsg({ ok: true, text: ok }); } catch (e) { setMsg({ ok: false, text: errorMessage(e) }); }
  };

  const unverified = (rules.data ?? []).filter((r) => r.active && !r.verified).length;
  const typeName = new Map((types.data ?? []).map((t) => [t.code, t.name]));

  return (
    <div className="space-y-6">
      {(rules.error || types.error) && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">Could not load the leave setup. Has the v21 leave migration been applied?</p>}
      {msg && <p role="status" className={`text-xs font-bold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}

      <section className="space-y-2">
        <h3 className="type-heading-caps text-ink">Entitlement rules</h3>
        <div role="status" className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2 leading-relaxed">
          The starting rules follow the Employment Act 1955 minimums as amended from 2023, entered from public guidance. They are <b>not verified</b> against the statute or your company policy.
          Check each rule and mark it Verified. {unverified > 0 && <>Currently <b>{unverified}</b> active rule{unverified === 1 ? ' is' : 's are'} unverified; requests still work but show a warning.</>}
          {' '}The Act's minimums may not cover every employee (for example, higher earners) and your contracts may grant more: add or edit rules to match.
        </div>
        {admin && <div><Button size="sm" onClick={() => setEditing({ leaveType: 'annual', label: '', effectiveFrom: new Date().toISOString().slice(0, 10), priority: 0, eligibility: {}, active: true })}>Add rule</Button></div>}
        <div className="bg-surface border border-line-subtle overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-2xs uppercase tracking-wider text-subtle border-b border-line-subtle"><th className="p-3">Leave type</th><th className="p-3">Entitlement</th><th className="p-3">Applies to</th><th className="p-3">From</th><th className="p-3">Status</th>{admin && <th className="p-3" />}</tr></thead>
            <tbody>
              {(rules.data ?? []).map((r) => (
                <tr key={r.id} className={`border-b border-line-subtle ${r.active ? '' : 'opacity-50'}`}>
                  <td className="p-3 font-bold text-ink">{typeName.get(r.leaveType) ?? r.leaveType}<div className="font-medium text-subtle">{r.label}</div></td>
                  <td className="p-3">{describeEntitlement(r.config)}</td>
                  <td className="p-3">{eligibilityText(r)}</td>
                  <td className="p-3 font-mono">{r.effectiveFrom}</td>
                  <td className="p-3"><span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${r.verified ? 'chip-ok' : 'chip-warn'}`}>{r.verified ? 'Verified' : 'Unverified'}</span>{!r.active && <span className="ml-2 text-subtle">off</span>}</td>
                  {admin && (
                    <td className="p-3 space-x-3 whitespace-nowrap">
                      <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => setEditing(r)}>Edit</button>
                      <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => attempt(() => api.patchRule.mutateAsync({ id: r.id, verified: !r.verified }))}>{r.verified ? 'Unverify' : 'Mark verified'}</button>
                      <button type="button" className="font-bold text-muted cursor-pointer" onClick={() => attempt(() => api.patchRule.mutateAsync({ id: r.id, active: !r.active }))}>{r.active ? 'Turn off' : 'Turn on'}</button>
                    </td>
                  )}
                </tr>
              ))}
              {(rules.data ?? []).length === 0 && <tr><td className="p-4 text-subtle" colSpan={6}>No rules yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <WorkingWeek admin={admin} value={settings.data ?? DEFAULT_SETTINGS} attempt={attempt} />
      <Holidays holidays={holidays.data ?? []} attempt={attempt} />
      <Types admin={admin} attempt={attempt} />
      {editing && <RuleEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

type Attempt = (fn: () => Promise<unknown>, ok?: string) => Promise<void>;

function WorkingWeek({ admin, value, attempt }: { admin: boolean; value: typeof DEFAULT_SETTINGS; attempt: Attempt }) {
  const api = useLeaveActions();
  const [s, setS] = useState(value);
  useEffect(() => setS(value), [value]);
  const toggle = (n: number) => setS({ ...s, workDays: s.workDays.includes(n) ? s.workDays.filter((x) => x !== n) : [...s.workDays, n].sort() });
  return (
    <section className="space-y-2">
      <h3 className="type-heading-caps text-ink">Working week and clock-in</h3>
      <div className="bg-surface border border-line-subtle p-4 space-y-3">
        <div className="flex flex-wrap gap-4 text-xs font-medium">
          {WEEKDAYS.map((d) => <label key={d.n} className="flex items-center gap-1"><input type="checkbox" disabled={!admin} checked={s.workDays.includes(d.n)} onChange={() => toggle(d.n)} /> {d.label}</label>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Work starts</span><input className={inputClass} type="time" disabled={!admin} value={s.workStart} onChange={(e) => setS({ ...s, workStart: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Grace (minutes)</span><input className={inputClass} type="number" min="0" disabled={!admin} value={s.lateGraceMinutes} onChange={(e) => setS({ ...s, lateGraceMinutes: Number(e.target.value) || 0 })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Time zone</span><input className={inputClass} disabled={!admin} value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Employees may file back (days)</span><input className={inputClass} type="number" min="0" disabled={!admin} value={s.backdateDays} onChange={(e) => setS({ ...s, backdateDays: Number(e.target.value) || 0 })} /></label>
        </div>
        <p className="text-2xs text-subtle">Leave is counted in working days (the days ticked above, minus public holidays). Keep this consistent with the working days per month used in payroll, because unpaid leave is deducted at the daily rate from that.</p>
        {admin && <Button size="sm" disabled={api.saveSettings.isPending || s.workDays.length === 0} onClick={() => attempt(() => api.saveSettings.mutateAsync(s), 'Saved.')}>Save</Button>}
      </div>
    </section>
  );
}

function Holidays({ holidays, attempt }: { holidays: { id: string; date: string; name: string }[]; attempt: Attempt }) {
  const api = useLeaveActions();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const year = new Date().getFullYear();
  return (
    <section className="space-y-2">
      <h3 className="type-heading-caps text-ink">Public holidays</h3>
      <p className="text-xs text-muted">Public holidays are not counted as leave or working days. The dates change every year, so none are pre-loaded: enter the gazetted holidays for {year} and {year + 1}. {holidays.length === 0 && <b className="text-amber-800">None entered yet.</b>}</p>
      <div className="flex flex-wrap items-end gap-2">
        <input className={`${inputClass} !w-44`} type="date" aria-label="Holiday date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className={`${inputClass} !w-64`} placeholder="Name, e.g. Deepavali" aria-label="Holiday name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="outline" size="sm" disabled={!date || !name.trim() || api.saveHoliday.isPending} onClick={() => attempt(async () => { await api.saveHoliday.mutateAsync({ date, name: name.trim() }); setDate(''); setName(''); })}>Add</Button>
      </div>
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {holidays.map((h) => (
          <div key={h.id} className="flex items-center justify-between px-3 py-2 text-xs"><span><span className="font-mono">{h.date}</span> · {h.name}</span>
            <button type="button" className="text-rose-700 font-bold cursor-pointer" onClick={() => attempt(() => api.deleteHoliday.mutateAsync(h.id))}>Remove</button></div>
        ))}
      </div>
    </section>
  );
}

function Types({ admin, attempt }: { admin: boolean; attempt: Attempt }) {
  const { types } = useLeaveReference();
  const api = useLeaveActions();
  const [f, setF] = useState({ code: '', name: '', paid: true, balanceLimited: true });
  return (
    <section className="space-y-2">
      <h3 className="type-heading-caps text-ink">Leave types</h3>
      <div className="bg-surface border border-line-subtle divide-y divide-line-subtle">
        {(types.data ?? []).map((t) => (
          <div key={t.code} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
            <span className={t.active ? '' : 'opacity-50'}><b className="text-ink">{t.name}</b> <span className="text-subtle">({t.code}) · {t.paid ? 'paid' : 'unpaid, deducted in payroll'} · {t.balanceLimited ? 'limited by entitlement' : 'no limit'}</span></span>
            {admin && <button type="button" className="font-bold text-accent cursor-pointer" onClick={() => attempt(() => api.saveType.mutateAsync({ ...t, active: !t.active }))}>{t.active ? 'Turn off' : 'Turn on'}</button>}
          </div>
        ))}
      </div>
      {admin && (
        <div className="flex flex-wrap items-end gap-2">
          <input className={`${inputClass} !w-36`} placeholder="code (e.g. study)" aria-label="Code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} />
          <input className={`${inputClass} !w-48`} placeholder="Name" aria-label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })} /> Paid</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={f.balanceLimited} onChange={(e) => setF({ ...f, balanceLimited: e.target.checked })} /> Limited by an entitlement rule</label>
          <Button variant="outline" size="sm" disabled={!/^[a-z][a-z0-9_]{1,30}$/.test(f.code) || !f.name.trim()} onClick={() => attempt(async () => { await api.saveType.mutateAsync({ ...f, name: f.name.trim(), active: true, sortOrder: (types.data?.length ?? 0) + 1, isNew: true }); setF({ code: '', name: '', paid: true, balanceLimited: true }); })}>Add type</Button>
        </div>
      )}
    </section>
  );
}

function RuleEditor({ initial, onClose }: { initial: Partial<RuleRowT>; onClose: () => void }) {
  const api = useLeaveActions();
  const { types } = useLeaveReference();
  const e = initial.eligibility ?? {};
  const [f, setF] = useState({
    leaveType: initial.leaveType ?? 'annual', label: initial.label ?? '', effectiveFrom: initial.effectiveFrom ?? '', priority: String(initial.priority ?? 0),
    male: !!e.genders?.map((g) => g.toLowerCase()).includes('male'), female: !!e.genders?.map((g) => g.toLowerCase()).includes('female'),
    minServiceMonths: e.minServiceMonths === undefined ? '' : String(e.minServiceMonths),
    config: initial.config ? JSON.stringify(initial.config, null, 2) : EXAMPLE, note: initial.note ?? '',
  });
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    let config: LeaveRuleRow['config'];
    try { config = JSON.parse(f.config); } catch { setErr('The rule is not valid JSON.'); return; }
    const t = (config as { type?: string }).type;
    if (t === 'fixed' && !(typeof (config as { days?: unknown }).days === 'number')) { setErr('A fixed rule needs "days".'); return; }
    if (t === 'service_tiers' && !Array.isArray((config as { tiers?: unknown }).tiers)) { setErr('A service_tiers rule needs a "tiers" list.'); return; }
    if (!['fixed', 'service_tiers', 'unlimited'].includes(t ?? '')) { setErr('The rule needs a "type" of fixed, service_tiers or unlimited.'); return; }
    if (!f.label.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(f.effectiveFrom)) { setErr('Give the rule a name and a start date (YYYY-MM-DD).'); return; }
    const eligibility: LeaveRuleRow['eligibility'] = {};
    const genders = [f.male && 'male', f.female && 'female'].filter(Boolean) as string[];
    if (genders.length === 1) eligibility.genders = genders;
    if (f.minServiceMonths !== '') eligibility.minServiceMonths = Number(f.minServiceMonths);
    try {
      await api.saveRule.mutateAsync({ id: initial.id, leaveType: f.leaveType, label: f.label.trim(), effectiveFrom: f.effectiveFrom, priority: Number(f.priority) || 0, eligibility, config, active: initial.active ?? true, note: f.note.trim() || null });
      onClose();
    } catch (x) { setErr(errorMessage(x)); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit entitlement rule" className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface border border-line w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-3">
        <h3 className="type-heading-caps text-ink">{initial.id ? 'Edit rule' : 'Add rule'}</h3>
        {initial.id && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2">Saving a change marks this rule Unverified until you verify it again.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Leave type</span>
            <select className={inputClass} value={f.leaveType} onChange={(ev) => setF({ ...f, leaveType: ev.target.value })}>{(types.data ?? []).filter((t) => t.balanceLimited).map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}</select></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Name</span><input className={inputClass} value={f.label} onChange={(ev) => setF({ ...f, label: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Effective from</span><input className={inputClass} type="date" value={f.effectiveFrom} onChange={(ev) => setF({ ...f, effectiveFrom: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Priority (higher wins)</span><input className={inputClass} type="number" value={f.priority} onChange={(ev) => setF({ ...f, priority: ev.target.value })} /></label>
          <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Minimum months of service</span><input className={inputClass} type="number" min="0" value={f.minServiceMonths} onChange={(ev) => setF({ ...f, minServiceMonths: ev.target.value })} /></label>
          <div className="flex items-end gap-4 text-xs font-medium pb-2">
            <label className="flex items-center gap-1"><input type="checkbox" checked={f.female} onChange={(ev) => setF({ ...f, female: ev.target.checked })} /> Female</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={f.male} onChange={(ev) => setF({ ...f, male: ev.target.checked })} /> Male</label>
            <span className="text-subtle">(both or neither = everyone)</span>
          </div>
        </div>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Entitlement (JSON)</span>
          <textarea className={`${inputClass} font-mono h-36`} spellCheck={false} value={f.config} onChange={(ev) => setF({ ...f, config: ev.target.value })} /></label>
        <p className="text-2xs text-subtle leading-relaxed">
          Examples: <code>{'{"type":"fixed","days":60}'}</code>; <code>{EXAMPLE}</code>; <code>{'{"type":"unlimited"}'}</code>. Add <code>"prorate":true</code> to scale the first calendar year by months employed.
          Service is measured at 1 January of the leave year.
        </p>
        <label className="block space-y-1"><span className="text-2xs font-bold uppercase text-subtle">Source / note</span><input className={inputClass} value={f.note} onChange={(ev) => setF({ ...f, note: ev.target.value })} /></label>
        {err && <p role="alert" className="text-xs font-bold text-rose-700">{err}</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={save} disabled={api.saveRule.isPending}>Save</Button></div>
      </div>
    </div>
  );
}
