import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';
import { PageHeading, StatStrip } from '../../components/ui/StationChrome';
import { searchPatientsForAudit, useClinicalAudit } from '../../hooks/useClinicalAudit';
import {
  ACTION_LABEL, ENTITY_LABEL, PAGE_SIZE, auditCsv, describeEntry, type AuditAction, type AuditFilters,
} from '../../domain/clinicalAudit';

const fieldClass = 'min-h-11 w-full px-3 border border-line bg-surface text-ink text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const buttonClass = 'min-h-11 px-4 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';
const quietButton = `${buttonClass} border border-line bg-surface text-ink hover:bg-surface-accent`;

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });

export default function ClinicalAuditAdmin() {
  const [filters, setFilters] = useState<AuditFilters>({ action: '' });
  const [page, setPage] = useState(0);
  const [patientText, setPatientText] = useState('');
  const [matches, setMatches] = useState<{ id: string; name: string; ic: string }[]>([]);
  const [patientLabel, setPatientLabel] = useState('');
  const audit = useClinicalAudit(filters, page);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => { void searchPatientsForAudit(patientText).then((m) => live && setMatches(m)); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [patientText]);

  const set = (patch: Partial<AuditFilters>) => { setFilters((f) => ({ ...f, ...patch })); setPage(0); };
  const staffName = (id?: string) => (id ? audit.staffNames[id] ?? 'Unknown user' : 'System');
  const patientName = (id?: string) => (id ? audit.patientNames[id] ?? 'Unknown patient' : '');
  const pages = Math.max(1, Math.ceil(audit.total / PAGE_SIZE));
  const filtered = !!(filters.patientId || filters.actor || filters.action || filters.entity || filters.from || filters.to);

  const download = () => {
    const blob = new Blob([auditCsv(audit.entries, staffName, patientName)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-data-audit-page-${page + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-strong">
      <PageHeading title="Patient data audit" eyebrow="Who opened or changed patient records">
        <button type="button" className={quietButton} disabled={audit.entries.length === 0} onClick={download}><Download className="w-4 h-4" aria-hidden="true" />Download this page (CSV)</button>
      </PageHeading>

      <StatStrip
        label="Audit figures, last 24 hours"
        stats={[
          { label: 'Entries (24 h)', value: audit.summary?.events ?? '—' },
          { label: 'Records opened', value: audit.summary?.views ?? '—' },
          { label: 'Changes', value: audit.summary?.changes ?? '—', note: 'Created, changed or removed' },
          { label: 'Staff active', value: audit.summary?.staff ?? '—' },
        ]}
      />

      <p className="text-sm text-muted bg-surface border border-line p-4">
        Every create, change or removal of a patient, visit, consultation note, prescription, lab or imaging order and device result is recorded, along with each time a patient's record is opened.
        The trail shows <strong className="text-ink">who, when, what and which fields</strong>, never the clinical values. It cannot be edited or deleted by anyone, including administrators. Times are Malaysia time.
      </p>

      <section aria-label="Filters" className="bg-surface border border-line p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-muted" htmlFor="au-patient">Patient (name or IC)</label>
          {filters.patientId ? (
            <div className="mt-1 min-h-11 px-3 border border-line bg-surface-accent flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">{patientLabel}</span>
              <button type="button" aria-label="Clear patient" className="min-h-8 min-w-8 inline-flex items-center justify-center cursor-pointer" onClick={() => { set({ patientId: undefined }); setPatientText(''); setPatientLabel(''); }}><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
              <input id="au-patient" className={`${fieldClass} mt-1`} value={patientText} onChange={(e) => setPatientText(e.target.value)} placeholder="Type at least 2 characters" autoComplete="off" />
              {matches.length > 0 && patientText.trim().length >= 2 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 bg-surface border border-line shadow-lg max-h-56 overflow-auto">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-surface-accent cursor-pointer" onClick={() => { set({ patientId: m.id }); setPatientLabel(`${m.name}${m.ic ? ` · ${m.ic}` : ''}`); setMatches([]); }}>
                        <strong className="text-ink">{m.name}</strong> <span className="text-muted">{m.ic}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <label className="text-xs font-medium text-muted" htmlFor="au-actor">Staff member
          <select id="au-actor" className={`${fieldClass} mt-1`} value={filters.actor ?? ''} onChange={(e) => set({ actor: e.target.value || undefined })}>
            <option value="">Everyone</option>
            {Object.entries(audit.staffNames).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted" htmlFor="au-action">What happened
          <select id="au-action" className={`${fieldClass} mt-1`} value={filters.action ?? ''} onChange={(e) => set({ action: e.target.value as AuditAction | '' })}>
            <option value="">Anything</option>
            {(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted" htmlFor="au-entity">Kind of record
          <select id="au-entity" className={`${fieldClass} mt-1`} value={filters.entity ?? ''} onChange={(e) => set({ entity: e.target.value || undefined })}>
            <option value="">All</option>
            {Object.entries(ENTITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted" htmlFor="au-from">From
          <input id="au-from" type="date" className={`${fieldClass} mt-1`} value={filters.from ?? ''} onChange={(e) => set({ from: e.target.value || undefined })} />
        </label>
        <label className="text-xs font-medium text-muted" htmlFor="au-to">To
          <input id="au-to" type="date" className={`${fieldClass} mt-1`} value={filters.to ?? ''} onChange={(e) => set({ to: e.target.value || undefined })} />
        </label>
        {filtered && (
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="button" className={quietButton} onClick={() => { setFilters({ action: '' }); setPage(0); setPatientText(''); setPatientLabel(''); }}>Clear all filters</button>
          </div>
        )}
      </section>

      {audit.loadError && (
        <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">{audit.loadError}</p>
        </div>
      )}

      <section aria-label="Audit entries" className="bg-surface border border-line">
        <div className="px-5 py-3 border-b border-line flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-bold text-ink tabular-nums">{audit.total.toLocaleString('en-GB')} entr{audit.total === 1 ? 'y' : 'ies'}{filtered ? ' match the filters' : ''}</span>
          <span className="text-muted tabular-nums">Page {page + 1} of {pages}</span>
        </div>
        {audit.entries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">{audit.isLoading ? 'Loading…' : filtered ? 'Nothing matches these filters.' : 'Nothing has been recorded yet.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {audit.entries.map((e) => (
              <li key={e.id} className="px-5 py-3 text-sm grid gap-1 sm:grid-cols-[13rem_1fr]">
                <span className="text-muted tabular-nums">{when(e.at)}</span>
                <div className="min-w-0">
                  <p><strong className="text-ink">{staffName(e.actor)}</strong> <span className="text-subtle text-xs">{e.actorRoles.join(', ')}</span></p>
                  <p className="text-muted">{describeEntry(e)}{e.patientId ? <> · <span className="text-ink">{patientName(e.patientId)}</span></> : null}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-3 border-t border-line flex gap-2">
          <button type="button" className={quietButton} disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Newer</button>
          <button type="button" className={quietButton} disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Older</button>
        </div>
      </section>
    </div>
  );
}
