import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import PayrollRuns from './PayrollRuns';
import PayProfiles from './PayProfiles';
import PayrollRates from './PayrollRates';

type Tab = 'runs' | 'people' | 'rates';

/** Payroll console for administrators and HR. Administrators approve, pay and edit the statutory rates. */
export default function PayrollPage({ role, embedded = false }: { role: 'admin' | 'hr'; embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('runs');
  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-subtle hover:text-ink'}`;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      {!embedded && <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5">
          <Wallet className="w-6 h-6 text-accent" />
          Payroll
        </h1>
        <p className="text-xs text-muted font-medium max-w-3xl leading-relaxed">
          Run payroll month by month: prepare, review, approve, then pay. Contributions come from the rate tables, so a rate change is a data change, not a code change.
          {role === 'hr' ? ' HR prepares and submits runs; an administrator approves and pays.' : ''}
        </p>
      </div>}

      <div role="tablist" className="flex border-b border-line-subtle">
        <button role="tab" aria-selected={tab === 'runs'} className={tabClass('runs')} onClick={() => setTab('runs')}>Payroll runs</button>
        <button role="tab" aria-selected={tab === 'people'} className={tabClass('people')} onClick={() => setTab('people')}>Pay profiles</button>
        <button role="tab" aria-selected={tab === 'rates'} className={tabClass('rates')} onClick={() => setTab('rates')}>Statutory rates</button>
      </div>

      {tab === 'runs' && <PayrollRuns role={role} />}
      {tab === 'people' && <PayProfiles />}
      {tab === 'rates' && <PayrollRates role={role} />}
    </div>
  );
}
