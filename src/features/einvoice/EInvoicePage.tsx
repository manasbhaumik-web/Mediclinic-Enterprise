import React, { useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import EInvoiceSetup from './EInvoiceSetup';
import EInvoiceInvoices from './EInvoiceInvoices';
import { useEInvoice } from '../../hooks/useEInvoice';

type Tab = 'invoices' | 'setup';

/** Admin-only LHDN MyInvois console: set up the connection, then review and submit e-invoices. */
export default function EInvoicePage() {
  const { connection } = useEInvoice();
  const conn = connection.data ?? null;
  const [tab, setTab] = useState<Tab>('setup');

  // Land on the invoice list once the connection exists.
  useEffect(() => { if (conn) setTab((t) => (t === 'setup' && conn.enabled ? 'invoices' : t)); }, [conn?.id, conn?.enabled]);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-subtle hover:text-ink'}`;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-accent" />
            e-Invoice (LHDN MyInvois)
          </h1>
          {conn && (
            <span className={`text-2xs font-bold px-2 py-0.5 border uppercase ${conn.enabled ? 'chip-ok' : 'chip-neutral'}`}>
              {conn.enabled ? `ON · ${conn.mode}` : 'OFF'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted font-medium max-w-3xl leading-relaxed">
          Turn settled payments into e-invoices and submit them to LHDN. Only administrators can see or change this. Nothing is sent until you switch it on and submit.
        </p>
      </div>

      <div role="tablist" className="flex border-b border-line-subtle">
        <button role="tab" aria-selected={tab === 'invoices'} className={tabClass('invoices')} onClick={() => setTab('invoices')} disabled={!conn}>E-invoices</button>
        <button role="tab" aria-selected={tab === 'setup'} className={tabClass('setup')} onClick={() => setTab('setup')}>Setup</button>
      </div>

      {connection.error && (
        <p role="alert" className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2">
          Could not load the e-Invoice settings. Has the v17 e-Invoice migration been applied?
        </p>
      )}

      {tab === 'setup' || !conn ? <EInvoiceSetup connection={conn} /> : <EInvoiceInvoices connection={conn} />}
    </div>
  );
}
