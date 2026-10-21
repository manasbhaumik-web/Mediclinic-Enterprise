import type { SortRule } from '../../utils/queueSorter';
import { getTriageDetails, getChiefComplaintLabel, getRankingRationale } from '../../utils/queueSorter';
import ActionMenu from '../ui/ActionMenu';
import { Pin, Copy, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { Visit, Patient } from '../../types';

interface WaitingPatientsListProps {
  currentPage: number;
  sortedQueue: Visit[];
  totalPages: number;
  sortRule: SortRule;
  remainingQueue: Visit[];
  nextVisit: Visit;
  patientsMap: Record<string, Patient>;
  activeConsultationVisitId: string;
  expandedDetails: Record<string, boolean>;
  startIndex: number;
  pinnedVisitIds: Record<string, boolean>;
  toggleDetails: (visitId: string) => void;
  renderAllergyBadge: (drugAllergies?: string[]) => React.JSX.Element;
  togglePinVisit: (visitId: string, e?: React.MouseEvent<Element, MouseEvent>) => void;
  copyToClipboard: (text: string, label: string, e?: React.MouseEvent<Element, MouseEvent>) => void;
  handleStartConsultation: (visitId: string) => void;
  requestCallPatient: (visitId: string, patientName: string, position: number) => void;
  entriesPerPage: number;
  setEntriesPerPage: (count: number) => void;
  setQueuePage: React.Dispatch<React.SetStateAction<number>>;
}

export default function WaitingPatientsList({ currentPage, sortedQueue, totalPages, sortRule, remainingQueue, nextVisit, patientsMap, activeConsultationVisitId, expandedDetails, startIndex, pinnedVisitIds, toggleDetails, renderAllergyBadge, togglePinVisit, copyToClipboard, handleStartConsultation, requestCallPatient, entriesPerPage, setEntriesPerPage, setQueuePage }: WaitingPatientsListProps) {
  return (
    <section aria-label="Waiting patients" className="bg-surface border border-line-subtle">
      <div className="px-5 py-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line-subtle">
        <h4 className="text-base font-bold text-ink">
          {currentPage === 1 ? 'Waiting after the next patient' : 'Patient queue list'}
        </h4>
        <span className="text-sm text-slate-600">
          {sortedQueue.length} total · Page {currentPage} of {totalPages}
        </span>
      </div>
    
      <div className="overflow-x-auto">
        <div role="table" aria-label="Waiting patients" className="md:min-w-[960px]">
          <div role="row" className="hidden md:grid grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_96px_208px] gap-4 items-center px-5 py-2.5 bg-surface-muted border-b border-line-subtle text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span role="columnheader">{sortRule === 'urgency' ? 'Rank' : 'Order'}</span>
            <span role="columnheader">Patient</span>
            <span role="columnheader">Complaint</span>
            <span role="columnheader">Why this position</span>
            <span role="columnheader">Waiting</span>
            <span role="columnheader" className="text-right">Actions</span>
          </div>
    
          {remainingQueue.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-600">
              {nextVisit ? 'No other patients are waiting.' : 'No patients match this filter.'}
            </div>
          )}
    
          {remainingQueue.map((visit, index) => {
            const pt = patientsMap[visit.patientId];
            if (!pt) return null;
            const isConsulting = activeConsultationVisitId === visit.id;
            const isExpanded = expandedDetails[visit.id];
            const globalRankIndex = currentPage === 1 ? index + 1 : startIndex + index;
            const queuePosition = globalRankIndex + 1;
            const triage = getTriageDetails(pt, visit);
            const waitMins = visit.registeredTime ? Math.floor((Date.now() - visit.registeredTime) / 60000) : 0;
            const isPinned = pinnedVisitIds[visit.id];
            const overSla = waitMins >= 20;
            const rankTint = triage.level === 'High'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : triage.level === 'Medium'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-surface-accent text-ink border-line-subtle';
    
            return (
              <div
                key={visit.id}
                role="rowgroup"
                className={`border-b border-line-subtle transition-colors ${
                  isConsulting ? 'bg-surface-accent' : isPinned ? 'bg-surface-muted' : 'bg-surface hover:bg-surface-muted'
                }`}
              >
                <div
                  role="row"
                  tabIndex={0}
                  onClick={() => toggleDetails(visit.id)}
                  aria-expanded={!!isExpanded}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleDetails(visit.id); } }}
                  className="grid grid-cols-1 md:grid-cols-[56px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,2fr)_96px_208px] gap-3 md:gap-4 items-center px-5 py-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <span role="cell" className={`w-10 h-10 border text-sm font-bold flex items-center justify-center ${rankTint}`}>
                    #{queuePosition}
                  </span>
    
                  <div role="cell" className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <h4 className="text-sm font-semibold text-ink">{pt.fullName}</h4>
                      <span className="text-xs text-slate-600">ID {pt.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {isPinned && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-bold uppercase px-2 py-0.5">Pinned</span>
                      )}
                      <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-0.5 ${triage.badgeBg}`}>
                        {triage.level}
                      </span>
                      {renderAllergyBadge(pt.drugAllergies)}
                    </div>
                  </div>
    
                  <span role="cell" className="text-sm font-medium text-accent min-w-0">
                    {getChiefComplaintLabel(visit.soap?.subjective)}
                  </span>
    
                  <span role="cell" className="text-xs leading-snug text-slate-600 min-w-0">
                    {getRankingRationale(pt, visit, globalRankIndex, sortRule)}
                  </span>
    
                  <div role="cell" className="flex flex-col items-start gap-1">
                    <span className={`text-sm font-bold px-2.5 py-1 border ${
                      overSla ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-surface-accent text-ink border-line-subtle'
                    }`}>
                      {waitMins} min
                    </span>
                    {overSla && <span className="text-2xs font-semibold text-amber-900">Over SLA</span>}
                  </div>
    
                  <div role="cell" className="flex items-center gap-2 md:justify-end" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu
                      label={`More actions for ${pt.fullName}`}
                      items={[
                        {
                          label: isPinned ? 'Unpin from top' : 'Pin to top',
                          icon: <Pin className="w-4 h-4" aria-hidden="true" />,
                          onSelect: (e) => togglePinVisit(visit.id, e),
                        },
                        {
                          label: 'Copy patient ID',
                          icon: <Copy className="w-4 h-4" aria-hidden="true" />,
                          onSelect: (e) => copyToClipboard(pt.id, 'Patient ID', e),
                        },
                      ]}
                    />
                    {isConsulting ? (
                      <button
                        type="button"
                        onClick={() => handleStartConsultation(visit.id)}
                        aria-label={`Resume consultation for ${pt.fullName}`}
                        className="h-11 px-4 bg-deep text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestCallPatient(visit.id, pt.fullName, queuePosition)}
                        aria-label={`Call patient ${pt.fullName}`}
                        className="h-11 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                      >
                        Call patient
                      </button>
                    )}
                  </div>
                </div>
    
                {isExpanded && (
                  <div role="row" className="mx-5 mb-4"><div role="cell" aria-colspan={6} className="border border-line-subtle bg-surface-muted p-4 text-sm text-ink space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Full reason / symptoms</strong>
                        <p className="leading-relaxed">{visit.soap?.subjective || 'General Medical Consultation'}</p>
                      </div>
                      <div>
                        <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Panel employer</strong>
                        <p className="font-semibold text-accent">{pt.panelEmployer}</p>
                      </div>
                      <div>
                        <strong className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Demographics &amp; contact</strong>
                        <p>{pt.gender}, {pt.dob} · {pt.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-line-subtle flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleStartConsultation(visit.id)}
                        className="h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Direct consultation draft</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(`${pt.fullName} (${pt.id})`, 'Patient Details', e)}
                        className="h-10 px-4 bg-surface text-ink border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-accent cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy record</span>
                      </button>
                    </div>
                  </div></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    
      {/* FOOTER: SHORTCUTS, PAGE SIZE, PAGINATION */}
      <div className="bg-surface-muted px-5 py-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">
            Showing {sortedQueue.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + entriesPerPage, sortedQueue.length)} of {sortedQueue.length}
          </span>
          <span className="hidden lg:inline text-slate-400">|</span>
          <span className="hidden lg:flex items-center gap-2">
            <span className="font-semibold">Shortcuts</span>
            {[['Alt+Q', 'Queue'], ['Alt+C', 'Consult'], ['Alt+F', 'Search'], ['Alt+R', 'Refresh']].map(([key, label]) => (
              <span key={key} className="border border-line bg-surface px-2 py-0.5 text-ink">
                <kbd className="font-sans font-semibold">{key}</kbd> {label}
              </span>
            ))}
          </span>
        </div>
    
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="flex items-center gap-2">
            <span className="font-semibold">Per page</span>
            <select
              value={entriesPerPage}
              onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setQueuePage(1); }}
              className="h-10 bg-surface text-ink border border-line px-2 text-sm focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </label>
    
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setQueuePage(prev => Math.max(1, prev - 1))}
            className={`h-10 px-3.5 text-sm font-semibold border flex items-center gap-1 transition-colors ${
              currentPage === 1
                ? 'bg-surface text-slate-400 border-line-subtle cursor-not-allowed'
                : 'bg-surface text-ink border-line hover:bg-surface-accent cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
    
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              aria-current={pageNum === currentPage ? 'page' : undefined}
              onClick={() => setQueuePage(pageNum)}
              className={`w-10 h-10 text-sm font-semibold border flex items-center justify-center transition-colors cursor-pointer ${
                pageNum === currentPage
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              {pageNum}
            </button>
          ))}
    
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setQueuePage(prev => Math.min(totalPages, prev + 1))}
            className={`h-10 px-3.5 text-sm font-semibold border flex items-center gap-1 transition-colors ${
              currentPage === totalPages
                ? 'bg-surface text-slate-400 border-line-subtle cursor-not-allowed'
                : 'bg-surface text-ink border-line hover:bg-surface-accent cursor-pointer'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
