import React from 'react';
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

export default function QueueToolbar({
  queueSearchQuery,
  setQueueSearchQuery,
  setQueuePage,
  doctorQueue,
  patientsMap,
  setAcuityFilter,
  acuityFilter,
  setSortRule,
  sortRule
}: QueueToolbarProps) {
  return (
    <div className="bg-surface border border-line p-4 flex flex-wrap items-center gap-x-6 gap-y-3.5">
      {/* Search Input with Clear Button */}
      <div className="relative flex-1 basis-72 min-w-60">
        <label htmlFor="queue-search-input" className="sr-only">Search the queue</label>
        <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="queue-search-input"
          type="text"
          value={queueSearchQuery}
          onChange={(e) => { setQueueSearchQuery(e.target.value); setQueuePage(1); }}
          placeholder="Search patient name, IC/ID or complaint (Alt+F)..."
          className="w-full h-10 bg-surface text-ink text-xs pl-9 pr-9 border border-line focus:outline-none focus:border-brand placeholder:text-subtle font-medium"
        />
        {queueSearchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQueueSearchQuery(''); setQueuePage(1); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 text-subtle hover:text-ink text-sm font-bold flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    
      {/* Acuity / Triage Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xs font-bold uppercase tracking-wider text-muted font-mono">Filter</span>
        {([
          { id: 'all', label: 'All Patients', count: doctorQueue.length, warn: false },
          { id: 'high', label: 'High Acuity', count: doctorQueue.filter(v => (patientsMap[v.patientId]?.drugAllergies?.length || 0) > 0).length, warn: false },
          { id: 'sla', label: 'Over 20 min', count: doctorQueue.filter(v => (v.registeredTime ? Math.floor((Date.now() - v.registeredTime) / 60000) : 0) >= 20).length, warn: true },
        ] as const).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setAcuityFilter(f.id); setQueuePage(1); }}
            aria-pressed={acuityFilter === f.id}
            className={`h-10 px-3 text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
              acuityFilter === f.id
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-ink border-line hover:bg-surface-accent'
            }`}
          >
            <span>{f.label}</span>
            <span className={`text-2xs font-bold font-mono tabular-nums px-1.5 py-0.5 ${
              acuityFilter === f.id
                ? 'bg-white/20 text-white'
                : f.warn ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-surface-accent text-accent border border-line'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>
    
      {/* Sort Rule Group */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xs font-bold uppercase tracking-wider text-muted font-mono">Sort By</span>
        <div role="group" aria-label="Sort the queue by" className="flex border border-line bg-surface">
          {(['urgency', 'wait', 'arrival'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setSortRule(r); setQueuePage(1); }}
              aria-pressed={sortRule === r}
              className={`h-10 px-3.5 text-xs font-bold transition-colors cursor-pointer ${
                sortRule === r ? 'bg-primary text-white' : 'bg-surface text-ink hover:bg-surface-accent'
              }`}
            >
              {r === 'urgency' ? 'Urgency' : r === 'wait' ? 'Longest Wait' : 'Arrival'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
