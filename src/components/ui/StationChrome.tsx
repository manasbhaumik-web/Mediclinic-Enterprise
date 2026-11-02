import React from 'react';

/** Date eyebrow, page title and an optional right-hand slot: the heading every station page opens with. */
export function PageHeading({ eyebrow, title, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{[date, eyebrow].filter(Boolean).join(' · ')}</p>
        <h3 className="mt-1 type-section-title text-ink font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export interface StationTab<T extends string> {
  id: T;
  label: string;
  count?: number;
  /** Colours the count amber when something is waiting. */
  alert?: boolean;
  title?: string;
}

/** One flat ruled strip of tabs. The active tab is filled with the primary colour. */
export function StationTabs<T extends string>({ tabs, active, onChange, label }: { tabs: StationTab<T>[]; active: T; onChange: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap bg-surface border border-line">
      {tabs.map((tab, i) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`station-tab-${tab.id}`}
            aria-selected={on}
            title={tab.title}
            onClick={() => onChange(tab.id)}
            className={`min-h-11 px-5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i > 0 ? 'border-l border-line' : ''} ${
              on ? 'bg-primary text-white font-bold' : 'text-muted hover:bg-surface-accent hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs font-bold tabular-nums ${
                  on ? 'bg-white/20 text-white' : tab.alert && tab.count > 0 ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-muted text-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface Stat {
  label: string;
  value: React.ReactNode;
  note?: string;
  tone?: 'default' | 'danger';
}

/** The ruled strip of figures under the page heading. */
export function StatStrip({ stats, label }: { stats: Stat[]; label: string }) {
  return (
    <section aria-label={label} className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] bg-surface border-l border-t border-line">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-5 border-r border-b border-line">
          <span className="text-xs font-medium text-muted block">{s.label}</span>
          <span className={`text-3xl font-bold tracking-tight tabular-nums block ${s.tone === 'danger' ? 'text-rose-600' : 'text-ink'}`}>{s.value}</span>
          {s.note && <span className="text-2xs text-muted block mt-0.5">{s.note}</span>}
        </div>
      ))}
    </section>
  );
}
