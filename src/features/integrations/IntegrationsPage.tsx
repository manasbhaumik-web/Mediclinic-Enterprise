import React, { Suspense, useState } from 'react';
import { Network } from 'lucide-react';
import ConnectionsPanel from './ConnectionsPanel';
import GlobalSpinner from '../../components/ui/GlobalSpinner';

const IntegrationsPlayground = React.lazy(() => import('./IntegrationsHub'));

type Tab = 'connections' | 'playground';

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>('connections');

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${tab === t ? 'border-primary text-accent' : 'border-transparent text-subtle hover:text-ink'}`;

  return (
    <div className="animate-fadeIn w-full space-y-5 pb-8">
      <div className="bg-surface-accent border border-line p-5 space-y-1">
        <h1 className="type-page-title text-ink flex items-center gap-2.5">
          <Network className="w-6 h-6 text-accent" />
          Integrations
        </h1>
        <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
          Connect the clinic to external systems. Messages are queued, sent from the server with retries, and every attempt is logged.
        </p>
      </div>

      <div role="tablist" className="flex border-b border-line-subtle">
        <button role="tab" aria-selected={tab === 'connections'} className={tabClass('connections')} onClick={() => setTab('connections')}>Connections</button>
        <button role="tab" aria-selected={tab === 'playground'} className={tabClass('playground')} onClick={() => setTab('playground')}>Playground (sample data)</button>
      </div>

      {tab === 'connections' ? (
        <ConnectionsPanel />
      ) : (
        <div className="space-y-4">
          <p role="note" className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-2">
            Playground: runs on built-in sample data in your browser. Nothing here is sent to any external system, and the statuses and figures are illustrative.
          </p>
          <Suspense fallback={<GlobalSpinner />}>
            <IntegrationsPlayground />
          </Suspense>
        </div>
      )}
    </div>
  );
}
