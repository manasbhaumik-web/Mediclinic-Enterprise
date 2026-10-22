import React, { useEffect, useState } from 'react';
import { Building } from 'lucide-react';
import { ClinicProfile, useSettings } from '../context/SettingsContext';
import { Field, Notice, errorMessage, inputClass } from './inventory/shared';
import Button from './ui/Button';

/** Administrators edit who the clinic is. The header and its info popover read this; nothing is typed into the page. */
export default function ClinicProfileCard() {
  const { clinic, updateClinic } = useSettings();
  const [f, setF] = useState<ClinicProfile>(clinic);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(clinic), [clinic]);
  const set = (k: keyof ClinicProfile) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try { await updateClinic(f); setMsg({ ok: true, text: 'Saved.' }); } catch (err) { setMsg({ ok: false, text: errorMessage(err) }); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="bg-surface-accent border border-line p-5 space-y-3">
      <h3 className="type-card-title text-ink flex items-center gap-2"><Building className="w-4 h-4 text-accent" />Clinic profile</h3>
      <p className="text-xs text-slate-600">Shown in the header and its clinic-info popover. Leave a field blank to hide it. The licence expiry date drives the warning on the MOH Compliance page.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Clinic name"><input className={inputClass} value={f.name} onChange={set('name')} /></Field>
        <Field label="Branch"><input className={inputClass} value={f.branch} onChange={set('branch')} /></Field>
        <Field label="KKM licence no."><input className={inputClass} value={f.licenseNo} onChange={set('licenseNo')} /></Field>
        <Field label="Licence expires"><input type="date" className={inputClass} value={f.licenseExpiry} onChange={set('licenseExpiry')} /></Field>
        <Field label="Phone"><input className={inputClass} value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Emergency hotline"><input className={inputClass} value={f.emergencyPhone} onChange={set('emergencyPhone')} /></Field>
        <Field label="Address"><input className={inputClass} value={f.address} onChange={set('address')} /></Field>
      </div>
      {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
      <Button type="submit" size="sm" disabled={busy}>{busy ? 'Saving…' : 'Save clinic profile'}</Button>
    </form>
  );
}
