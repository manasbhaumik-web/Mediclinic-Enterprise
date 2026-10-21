import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { validateEndpoint } from '../../../supabase/functions/_shared/endpoint';
import { IMPLEMENTED_TYPES, IntegrationConnection, IntegrationType, TYPE_LABELS } from '../../domain/integrations';
import { ConnectionDraft } from '../../hooks/useIntegrations';

interface ConnectionFormProps {
  existing?: IntegrationConnection;
  saving: boolean;
  error: string | null;
  onSave: (draft: ConnectionDraft, secret?: string) => void;
  onClearSecret?: () => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-3 py-2 bg-surface border border-line-subtle rounded-none text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

export default function ConnectionForm({ existing, saving, error, onSave, onClearSecret, onClose }: ConnectionFormProps) {
  const [draft, setDraft] = useState<ConnectionDraft>({
    id: existing?.id,
    type: existing?.type ?? 'fhir',
    name: existing?.name ?? '',
    endpointUrl: existing?.endpointUrl ?? '',
    authType: existing?.authType ?? 'bearer',
    authHeaderName: existing?.authHeaderName ?? 'X-Api-Key',
    mode: existing?.mode ?? 'sandbox',
    sendNric: existing?.config.sendNric ?? false,
  });
  const [secret, setSecret] = useState('');
  const [confirmLive, setConfirmLive] = useState(false);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof ConnectionDraft>(key: K, value: ConnectionDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const endpoint = validateEndpoint(draft.endpointUrl);
  const endpointError = draft.endpointUrl.trim() && !endpoint.ok ? endpoint.reason : undefined;
  const nameError = touched && !draft.name.trim() ? 'Give the connection a name.' : undefined;
  const goingLive = draft.mode === 'live' && existing?.mode !== 'live';
  const implemented = IMPLEMENTED_TYPES.includes(draft.type);
  const canSave = !!draft.name.trim() && (!draft.endpointUrl.trim() || endpoint.ok) && (!goingLive || confirmLive);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    onSave({ ...draft, endpointUrl: endpoint.ok ? endpoint.url! : draft.endpointUrl }, secret || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="conn-form-title">
      <form onSubmit={submit} className="bg-surface border border-line-subtle shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line-subtle pb-3">
          <h3 id="conn-form-title" className="type-heading-caps text-ink">{existing ? 'Edit connection' : 'New connection'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-ink cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <FormField id="conn-name" label="Name" required error={nameError}>
          {(p) => <input {...p} className={inputClass} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Partner hospital FHIR" />}
        </FormField>

        <FormField id="conn-type" label="Type" hint={implemented ? undefined : 'Not implemented yet: you can record the connection, but it cannot be enabled.'}>
          {(p) => (
            <select {...p} className={inputClass} value={draft.type} disabled={!!existing} onChange={(e) => set('type', e.target.value as IntegrationType)}>
              {(Object.keys(TYPE_LABELS) as IntegrationType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}{IMPLEMENTED_TYPES.includes(t) ? '' : ' (not built yet)'}</option>
              ))}
            </select>
          )}
        </FormField>

        <FormField id="conn-endpoint" label="Endpoint (FHIR base URL)" error={endpointError} hint="https only. Internal and private addresses are blocked.">
          {(p) => <input {...p} className={inputClass} value={draft.endpointUrl} onChange={(e) => set('endpointUrl', e.target.value)} placeholder="https://fhir.partner.example/R4" />}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="conn-auth" label="Authentication">
            {(p) => (
              <select {...p} className={inputClass} value={draft.authType} onChange={(e) => set('authType', e.target.value as ConnectionDraft['authType'])}>
                <option value="none">None</option>
                <option value="bearer">Bearer token</option>
                <option value="basic">Basic (user:password)</option>
                <option value="api_key_header">API key header</option>
              </select>
            )}
          </FormField>
          {draft.authType === 'api_key_header' && (
            <FormField id="conn-header" label="Header name">
              {(p) => <input {...p} className={inputClass} value={draft.authHeaderName} onChange={(e) => set('authHeaderName', e.target.value)} />}
            </FormField>
          )}
        </div>

        {draft.authType !== 'none' && (
          <FormField id="conn-secret" label="Credential" hint={existing?.secretSet ? 'A credential is stored. Leave blank to keep it, or type a new one to replace it.' : 'Stored server-side. It cannot be read back after saving.'}>
            {(p) => (
              <div className="flex gap-2">
                <input {...p} type="password" autoComplete="off" className={inputClass} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={existing?.secretSet ? '••••••••' : ''} />
                {existing?.secretSet && onClearSecret && (
                  <Button type="button" variant="outline" size="sm" onClick={onClearSecret}>Clear</Button>
                )}
              </div>
            )}
          </FormField>
        )}

        <FormField id="conn-mode" label="Mode">
          {(p) => (
            <select {...p} className={inputClass} value={draft.mode} onChange={(e) => { set('mode', e.target.value as ConnectionDraft['mode']); setConfirmLive(false); }}>
              <option value="sandbox">Sandbox (test server, test data)</option>
              <option value="live">Live (production patient data)</option>
            </select>
          )}
        </FormField>

        {goingLive && (
          <label className="flex items-start gap-2 text-xs text-ink bg-amber-50 border border-amber-300 p-3 cursor-pointer">
            <input type="checkbox" checked={confirmLive} onChange={(e) => setConfirmLive(e.target.checked)} className="mt-0.5" />
            <span>I confirm this endpoint is approved to receive real patient data under the clinic's PDPA obligations.</span>
          </label>
        )}

        {draft.type === 'fhir' && (
          <label className="flex items-start gap-2 text-xs text-ink cursor-pointer">
            <input type="checkbox" checked={draft.sendNric} onChange={(e) => set('sendNric', e.target.checked)} className="mt-0.5" />
            <span>Include the patient's NRIC as an identifier. Leave off unless the receiving system needs it to match records.</span>
          </label>
        )}

        {error && <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-line-subtle">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving || !canSave}>{saving ? 'Saving…' : 'Save connection'}</Button>
        </div>
      </form>
    </div>
  );
}
