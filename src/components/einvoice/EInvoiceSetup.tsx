import React, { useEffect, useState } from 'react';
import { PlugZap, Save } from 'lucide-react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { EInvoiceConfig, EInvoiceConnection, EMPTY_CONFIG, checkSetup } from '../../domain/einvoice';
import { useEInvoice } from '../../hooks/useEInvoice';

const inputClass =
  'w-full px-3 py-2 bg-surface border border-line-subtle rounded-none text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export default function EInvoiceSetup({ connection }: { connection: EInvoiceConnection | null }) {
  const api = useEInvoice();
  const [config, setConfig] = useState<EInvoiceConfig>(connection?.config ?? EMPTY_CONFIG);
  const [mode, setMode] = useState<'sandbox' | 'live'>(connection?.mode ?? 'sandbox');
  const [secret, setSecret] = useState('');
  const [confirmLive, setConfirmLive] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Pick up server-side changes (after a save or refresh) without losing what is typed.
  useEffect(() => {
    if (connection) { setConfig(connection.config); setMode(connection.mode); }
  }, [connection?.id]);

  const setSupplier = (key: keyof EInvoiceConfig['supplier'], value: string) =>
    setConfig((c) => ({ ...c, supplier: { ...c.supplier, [key]: value } }));
  const set = <K extends keyof EInvoiceConfig>(key: K, value: EInvoiceConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  const secretSet = !!connection?.secretSet || !!secret;
  const check = checkSetup(config, secretSet);
  const goingLive = mode === 'live' && connection?.mode !== 'live';

  const save = async () => {
    setNotice(null);
    try {
      await api.saveConfig.mutateAsync({ id: connection?.id, mode, config, secret: secret || undefined });
      setSecret('');
      setNotice({ ok: true, text: 'Saved.' });
    } catch (e) {
      setNotice({ ok: false, text: errorMessage(e) });
    }
  };

  const test = async () => {
    setNotice(null);
    try {
      const res = await api.action.mutateAsync({ action: 'test' });
      setNotice({ ok: !!res.ok, text: res.message ?? (res.ok ? 'Connected.' : 'Failed.') });
    } catch (e) {
      setNotice({ ok: false, text: errorMessage(e) });
    }
  };

  const toggle = async () => {
    if (!connection) return;
    setNotice(null);
    try {
      await api.setEnabled.mutateAsync({ id: connection.id, enabled: !connection.enabled });
    } catch (e) {
      setNotice({ ok: false, text: errorMessage(e) });
    }
  };

  const text = (id: string, label: string, key: keyof EInvoiceConfig['supplier'], opts: { required?: boolean; hint?: string; placeholder?: string } = {}) => (
    <FormField id={id} label={label} required={opts.required} hint={opts.hint}>
      {(p) => <input {...p} className={inputClass} value={(config.supplier[key] as string) ?? ''} placeholder={opts.placeholder} onChange={(e) => setSupplier(key, e.target.value)} />}
    </FormField>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <p role="note" className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2">
        This integration has not yet been validated against LHDN's pre-production environment. Use <b>Sandbox</b> first, submit sample invoices, and
        have your tax adviser confirm the settings below (TIN, MSIC code, tax category, and whether your invoices must be digitally signed) before going live.
      </p>

      <section className="bg-surface border border-line-subtle p-4 space-y-3">
        <h3 className="type-heading-caps text-ink">Business details (supplier)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {text('ei-name', 'Legal name', 'name', { required: true, hint: 'As registered with SSM / LHDN.' })}
          {text('ei-tin', 'Tax Identification Number (TIN)', 'tin', { required: true, placeholder: 'e.g. C12345678901' })}
          {text('ei-brn', 'Business registration number', 'brn', { required: true, hint: 'SSM number, or NRIC for sole proprietors.' })}
          {text('ei-sst', 'SST registration number', 'sstNo', { hint: 'Leave blank if not SST-registered.' })}
          {text('ei-msic', 'MSIC code', 'msicCode', { required: true, hint: '5 digits, e.g. 86201 for general medical practice.' })}
          {text('ei-msicdesc', 'MSIC description', 'msicDescription', { required: true })}
          {text('ei-addr1', 'Address line 1', 'address1', { required: true })}
          {text('ei-addr2', 'Address line 2', 'address2')}
          {text('ei-city', 'City', 'city', { required: true })}
          {text('ei-postcode', 'Postcode', 'postcode', { required: true })}
          {text('ei-state', 'State code', 'stateCode', { required: true, hint: 'LHDN state code 01 to 17 (e.g. 10 Selangor, 14 Kuala Lumpur).' })}
          {text('ei-phone', 'Phone', 'phone', { required: true })}
          {text('ei-email', 'Email', 'email')}
        </div>
      </section>

      <section className="bg-surface border border-line-subtle p-4 space-y-3">
        <h3 className="type-heading-caps text-ink">How invoices are issued</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <FormField id="ei-mode" label="Submission mode" hint="Consolidated: walk-in (general public) receipts are rolled up monthly. Panel invoices are always sent individually.">
            {(p) => (
              <select {...p} className={inputClass} value={config.submissionMode} onChange={(e) => set('submissionMode', e.target.value as EInvoiceConfig['submissionMode'])}>
                <option value="consolidated">Monthly consolidated (admin submits)</option>
                <option value="per_invoice">Each invoice, automatically</option>
              </select>
            )}
          </FormField>
          <FormField id="ei-tax" label="Tax category" hint="Confirm with your tax adviser whether your services are taxable.">
            {(p) => (
              <select {...p} className={inputClass} value={config.taxCategory} onChange={(e) => set('taxCategory', e.target.value as EInvoiceConfig['taxCategory'])}>
                <option value="06">Not applicable (no tax shown)</option>
                <option value="02">Service tax</option>
                <option value="01">Sales tax</option>
              </select>
            )}
          </FormField>
          <FormField id="ei-class" label="Item classification code" hint="022 = Others. Change only if advised.">
            {(p) => <input {...p} className={inputClass} value={config.classificationCode} onChange={(e) => set('classificationCode', e.target.value)} />}
          </FormField>
        </div>
      </section>

      <section className="bg-surface border border-line-subtle p-4 space-y-3">
        <h3 className="type-heading-caps text-ink">MyInvois connection</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <FormField id="ei-env" label="Environment">
            {(p) => (
              <select {...p} className={inputClass} value={mode} onChange={(e) => { setMode(e.target.value as 'sandbox' | 'live'); setConfirmLive(false); }}>
                <option value="sandbox">Sandbox (LHDN pre-production, test data)</option>
                <option value="live">Live (real submissions to LHDN)</option>
              </select>
            )}
          </FormField>
          <FormField id="ei-clientid" label="Client ID" required>
            {(p) => <input {...p} className={inputClass} value={config.clientId} onChange={(e) => set('clientId', e.target.value)} />}
          </FormField>
          <FormField id="ei-secret" label="Client secret" hint={connection?.secretSet ? 'A secret is stored. Leave blank to keep it.' : 'Stored on the server; it cannot be read back.'}>
            {(p) => <input {...p} type="password" autoComplete="off" className={inputClass} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={connection?.secretSet ? '••••••••' : ''} />}
          </FormField>
          <FormField id="ei-onbehalf" label="Intermediary: taxpayer TIN" hint="Only if you submit through an ERP/intermediary on the clinic's behalf.">
            {(p) => <input {...p} className={inputClass} value={config.intermediaryTin} onChange={(e) => set('intermediaryTin', e.target.value)} />}
          </FormField>
        </div>
        {goingLive && (
          <label className="flex items-start gap-2 text-xs text-ink bg-rose-50 border border-rose-300 p-3 cursor-pointer">
            <input type="checkbox" checked={confirmLive} onChange={(e) => setConfirmLive(e.target.checked)} className="mt-0.5" />
            <span>I understand live mode submits real invoices to LHDN, and that these settings have been confirmed with the clinic's tax adviser.</span>
          </label>
        )}
      </section>

      {!check.ok && (
        <div className="bg-surface border border-line-subtle p-3">
          <p className="text-xs font-bold text-ink mb-1">Needed before e-Invoicing can be switched on:</p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-0.5">{check.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      {notice && (
        <p role="status" className={`text-xs font-bold px-3 py-2 border ${notice.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>{notice.text}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button icon={<Save className="w-3.5 h-3.5" />} size="sm" disabled={api.saveConfig.isPending || (goingLive && !confirmLive)} onClick={save}>
          {api.saveConfig.isPending ? 'Saving…' : 'Save settings'}
        </Button>
        <Button variant="outline" size="sm" icon={<PlugZap className="w-3.5 h-3.5" />} disabled={!connection || api.action.isPending} onClick={test}>
          Test connection
        </Button>
        {connection && (
          <label className="flex items-center gap-1.5 text-xs font-bold text-ink ml-2 cursor-pointer" title={!connection.enabled && !check.ok ? 'Complete the setup first' : undefined}>
            <input type="checkbox" role="switch" checked={connection.enabled} disabled={(!connection.enabled && !check.ok) || api.setEnabled.isPending} onChange={toggle} />
            {connection.enabled ? 'e-Invoicing is ON' : 'e-Invoicing is OFF'}
          </label>
        )}
      </div>
      {!connection && <p className="text-2xs text-slate-500">Save the settings first; you can then test the connection and switch e-Invoicing on.</p>}
      <p className="text-2xs text-slate-500">While OFF, payments are not turned into e-invoices. Turning it ON starts recording an e-invoice for every settled payment.</p>
    </div>
  );
}
