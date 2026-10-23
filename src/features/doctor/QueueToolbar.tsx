import type { SortRule, AcuityFilter } from '../../utils/queueSorter';
import { Search } from 'lucide-react';
import { Visit, Patient } from '../../types';

interface QueueToolbarProps {
  queueSearchQuery: string;
  setQueueSearchQuery: (query: string) => void;
  setQueuePage: React.Dispatch<React.SetStateAction<number>>;
  doctorQueue: Visit[];
  patientsMap: Record<string, Patient>;
  setAcuityFilter: (filter: AcuityFilter) => void;
  acuityFilter: AcuityFilter;
  setSortRule: (rule: SortRule) => void;
  sortRule: SortRule;
}

export default function QueueToolbar({ queueSearchQuery, setQueueSearchQuery, setQueuePage, doctorQueue, patientsMap, setAcuityFilter, acuityFilter, setSortRule, sortRule }: QueueToolbarProps) {
  return (
    <div className="bg-surface border border-line-subtle p-4 flex flex-wrap items-center gap-x-7 gap-y-4">
      <div className="relative flex-1 basis-72 min-w-60">
        <label htmlFor="queue-search-input" className="sr-only">Search the queue</label>
        <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="queue-search-input"
          type="text"
          value={queueSearchQuery}
          onChange={(e) => { setQueueSearchQuery(e.target.value); setQueuePage(1); }}
          placeholder="Search by patient name, IC/ID or complaint (Alt+F)"
          className="w-full h-11 bg-surface text-ink text-sm pl-10 pr-9 border border-line focus:outline-none focus:border-brand placeholder:text-subtle"
        />
        {queueSearchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQueueSearchQuery(''); setQueuePage(1); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 text-subtle hover:text-ink text-base font-bold flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Show</span>
        {([
          { id: 'all', label: 'All', count: doctorQueue.length, warn: false },
          { id: 'high', label: 'High acuity', count: doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length, warn: false },
          { id: 'sla', label: 'Over 20 min', count: doctorQueue.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20).length, warn: true },
        ] as const).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setAcuityFilter(f.id); setQueuePage(1); }}
            aria-pressed={acuityFilter === f.id}
            className={`h-10 px-3.5 text-sm font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
              acuityFilter === f.id
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-ink border-line hover:bg-surface-accent'
            }`}
          >
            <span>{f.label}</span>
            <span className={`text-xs font-bold px-1.5 ${
              acuityFilter === f.id
                ? 'bg-white/20 text-white'
                : f.warn ? 'bg-amber-100 text-amber-900' : 'bg-surface-accent text-ink'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>
    
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Sort by</span>
        <div role="group" aria-label="Sort the queue by" className="flex border border-line bg-surface">
          {(['urgency', 'wait', 'arrival'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setSortRule(r); setQueuePage(1); }}
              aria-pressed={sortRule === r}
              className={`h-10 px-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                sortRule === r ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface-accent'
              }`}
            >
              {r === 'urgency' ? 'Urgency' : r === 'wait' ? 'Longest wait' : 'Arrival'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
