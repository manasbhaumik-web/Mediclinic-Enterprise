import React, { useState } from 'react';
import { AlertTriangle, FlaskConical, ScanLine } from 'lucide-react';
import { STATUS_LABEL, type Investigation } from '../../../domain/investigations';
import type { MoveResult } from '../../../hooks/useInvestigations';

interface ResultsListProps {
  investigations: Investigation[];
  /** The visit the doctor is in, so its results are shown first and apart from earlier ones. */
  currentVisitId?: string;
  loadError?: boolean;
  /** Present for a doctor: marks a result as read. */
  onReview?: (id: string) => Promise<MoveResult>;
}

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Lab and imaging results for the patient in the room: this visit's orders first, then earlier ones. */
export default function ResultsList({ investigations, currentVisitId, loadError = false, onReview }: ResultsListProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const review = async (id: string) => {
    if (!onReview) return;
    setBusy(id);
    setError('');
    const result = await onReview(id);
    setBusy(null);
    if ('error' in result) setError(result.error);
  };

  if (loadError) {
    return (
      <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm">Results could not be loaded. Do not assume there are none; check the connection and reopen the patient.</p>
      </div>
    );
  }
  if (investigations.length === 0) {
    return (
      <div className="py-6 text-center flex flex-col items-center justify-center">
        <FlaskConical className="w-8 h-8 text-accent opacity-50 mb-2" aria-hidden="true" />
        <span className="text-sm text-ink font-semibold">No lab or imaging orders</span>
        <span className="text-xs text-subtle mt-0.5">Tests ordered for this patient, and their results, appear here.</span>
      </div>
    );
  }

  const thisVisit = investigations.filter((i) => i.visitId === currentVisitId);
  const earlier = investigations.filter((i) => i.visitId !== currentVisitId);

  const row = (i: Investigation) => {
    const waiting = i.status === 'Ordered' || i.status === 'Collected';
    const value = [i.resultValue, i.resultUnit].filter(Boolean).join(' ');
    return (
      <li key={i.id} className="py-3 border-b border-line-subtle">
        <div className="flex items-start justify-between gap-2">
          <p className="flex flex-wrap items-center gap-1.5 text-sm min-w-0">
            {i.kind === 'imaging' ? <ScanLine className="w-4 h-4 text-accent shrink-0" aria-label="Imaging" /> : <FlaskConical className="w-4 h-4 text-accent shrink-0" aria-label="Lab test" />}
            <strong className="text-ink">{i.name}</strong>
            {i.urgency === 'urgent' && waiting && <span className="px-1.5 py-0.5 text-2xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">Urgent</span>}
            {i.abnormal && !waiting && <span className="px-1.5 py-0.5 text-2xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">Abnormal</span>}
          </p>
          <span className="text-2xs text-subtle shrink-0">{STATUS_LABEL[i.status].en}</span>
        </div>
        {waiting ? (
          <p className="mt-1 text-xs text-muted">Awaiting result · ordered {when(i.orderedAt)}</p>
        ) : (
          <div className="mt-1 text-sm">
            {value && (
              <p className="tabular-nums">
                <strong className={i.abnormal ? 'text-rose-700 dark:text-rose-300' : 'text-ink'}>{value}</strong>
                {i.referenceRange && <span className="text-muted text-xs"> · range {i.referenceRange}</span>}
              </p>
            )}
            {i.resultNotes && <p className="text-xs text-muted whitespace-pre-wrap">{i.resultNotes}</p>}
            <p className="text-2xs text-subtle mt-0.5">{when(i.resultedAt)}{i.reviewedAt ? ` · reviewed ${when(i.reviewedAt)}` : ''}</p>
          </div>
        )}
        {onReview && i.status === 'Resulted' && (
          <button
            type="button"
            disabled={busy === i.id}
            onClick={() => review(i.id)}
            className="mt-2 min-h-9 px-3 text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Mark as reviewed
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
      {thisVisit.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted uppercase tracking-wide">This visit</h4>
          <ul>{thisVisit.map(row)}</ul>
        </div>
      )}
      {earlier.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted uppercase tracking-wide">Earlier visits</h4>
          <ul>{earlier.map(row)}</ul>
        </div>
      )}
    </div>
  );
}
