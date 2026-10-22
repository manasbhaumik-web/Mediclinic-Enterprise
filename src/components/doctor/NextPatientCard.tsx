import type { SortRule, TriageDetails } from '../../utils/queueSorter';
import type { VitalSigns } from '../../types';
import { Pin, Stethoscope, Volume2, Copy } from 'lucide-react';
import React from 'react';
import { getChiefComplaintLabel, getRankingRationale } from '../../utils/queueSorter';
import { Visit, Patient } from '../../types';

interface NextPatientCardProps {
  pinnedVisitIds: Record<string, boolean>;
  nextVisit: Visit;
  calledTimestampMap: Record<string, string>;
  stepIndex: 0 | 2 | 1;
  nextPatient: Patient;
  heroTriage: TriageDetails;
  renderAllergyBadge: (drugAllergies?: string[]) => React.JSX.Element;
  activeConsultationVisitId: string;
  calledVisitId: string;
  handleStartConsultation: (visitId: string) => void;
  requestCallPatient: (visitId: string, patientName: string, position: number) => void;
  toggleDetails: (visitId: string) => void;
  expandedDetails: Record<string, boolean>;
  togglePinVisit: (visitId: string, e?: React.MouseEvent<Element, MouseEvent>) => void;
  copyToClipboard: (text: string, label: string, e?: React.MouseEvent<Element, MouseEvent>) => void;
  obj: VitalSigns;
  heroWait: number;
  sortRule: SortRule;
}

export default function NextPatientCard({ pinnedVisitIds, nextVisit, calledTimestampMap, stepIndex, nextPatient, heroTriage, renderAllergyBadge, activeConsultationVisitId, calledVisitId, handleStartConsultation, requestCallPatient, toggleDetails, expandedDetails, togglePinVisit, copyToClipboard, obj, heroWait, sortRule }: NextPatientCardProps) {
  return (
    <section aria-label="Next patient in line" className="bg-surface border border-line shadow-2xs">
      <div className="bg-surface-accent border-b border-line-subtle px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5">Next in line</span>
          {pinnedVisitIds[nextVisit.id] && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase px-2.5 py-1 flex items-center gap-1.5">
              <Pin className="w-3 h-3 shrink-0" />
              <span>Pinned priority</span>
            </span>
          )}
          {calledTimestampMap[nextVisit.id] && (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1">
              Called at {calledTimestampMap[nextVisit.id]}
            </span>
          )}
        </div>
    
        <ol className="flex items-center gap-2.5 text-sm font-semibold">
          {['Ready', 'Called', 'In consultation'].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <li aria-hidden="true" className="w-7 h-0.5 bg-line" />}
              <li className={`flex items-center gap-2 ${i === stepIndex ? 'text-accent' : 'text-muted'}`} aria-current={i === stepIndex ? 'step' : undefined}>
                <span className={`w-[22px] h-[22px] rounded-full text-xs font-bold flex items-center justify-center ${
                  i === stepIndex ? 'bg-primary text-white' : i < stepIndex ? 'bg-surface-strong text-accent' : 'border-2 border-line text-muted'
                }`}>{i + 1}</span>
                {label}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </div>
    
      <div className="p-6 space-y-5">
        {/* Row 1: who the patient is (left) and what to do next (right) */}
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 space-y-3">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-bold text-ink leading-tight">{nextPatient.fullName}</h3>
              <p className="text-sm text-muted">ID {nextPatient.id} · {nextPatient.gender} · Born {nextPatient.dob}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 flex items-center gap-1.5 ${heroTriage.badgeBg}`}>
                <heroTriage.icon className={`w-3.5 h-3.5 ${heroTriage.iconColor}`} />
                <span>Triage: {heroTriage.level}</span>
              </span>
              {renderAllergyBadge(nextPatient.drugAllergies)}
            </div>
          </div>
    
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            {activeConsultationVisitId === nextVisit.id || calledVisitId === nextVisit.id ? (
              <button
                type="button"
                onClick={() => handleStartConsultation(nextVisit.id)}
                className="h-11 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <Stethoscope className="w-[18px] h-[18px]" />
                <span>Move to consultation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestCallPatient(nextVisit.id, nextPatient.fullName, 1)}
                aria-label={`Call patient ${nextPatient.fullName}`}
                className="h-11 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <Volume2 className="w-[18px] h-[18px]" />
                <span>Call patient</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleDetails(nextVisit.id)}
              aria-expanded={!!expandedDetails[nextVisit.id]}
              className="h-11 px-4 bg-surface text-accent border border-primary text-sm font-semibold whitespace-nowrap hover:bg-surface-accent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              {expandedDetails[nextVisit.id] ? 'Hide details' : 'View details'}
            </button>
            <button
              type="button"
              onClick={(e) => togglePinVisit(nextVisit.id, e)}
              aria-pressed={!!pinnedVisitIds[nextVisit.id]}
              aria-label={`${pinnedVisitIds[nextVisit.id] ? 'Unpin' : 'Pin'} ${nextPatient.fullName}`}
              title="Toggle pin priority"
              className={`h-11 px-4 border text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                pinnedVisitIds[nextVisit.id]
                  ? 'chip-warn'
                  : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Pin className="w-4 h-4" />
              <span>{pinnedVisitIds[nextVisit.id] ? 'Pinned' : 'Pin'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => copyToClipboard(nextPatient.id, 'Patient ID', e)}
              aria-label={`Copy patient ID for ${nextPatient.fullName}`}
              title="Copy patient ID"
              className="h-11 px-4 bg-surface text-ink border border-line text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap hover:bg-surface-accent transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <Copy className="w-4 h-4" />
              <span>Copy ID</span>
            </button>
          </div>
        </div>
    
        {/* Row 2: key facts, equal-height tiles on one line (complaint gets the extra width) */}
        <div className={`grid grid-cols-2 gap-3 ${obj && obj.temperature > 0 ? 'lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]' : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'}`}>
          <div className="bg-surface-muted border border-line-subtle px-3.5 py-3 col-span-2 lg:col-span-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Chief complaint</div>
            <div className="mt-1 text-base font-semibold text-ink">{getChiefComplaintLabel(nextVisit.soap?.subjective)}</div>
          </div>
          <div className={`px-3.5 py-3 border ${heroWait >= 20 ? 'chip-warn' : 'bg-surface-muted border-line-subtle text-ink'}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Waiting</div>
            <div className="mt-1 text-base font-bold">{heroWait} min</div>
          </div>
          {obj && obj.temperature > 0 && (
            <>
              <div className="bg-surface-muted border border-line-subtle px-3.5 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">Blood pressure</div>
                <div className="mt-1 text-base font-semibold text-ink">{obj.bpSystolic}/{obj.bpDiastolic} <span className="text-xs font-medium text-muted">mmHg</span></div>
              </div>
              <div className={`px-3.5 py-3 border ${obj.temperature >= 37.5 ? 'chip-danger' : 'bg-surface-muted border-line-subtle text-ink'}`}>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Temperature</div>
                <div className="mt-1 text-base font-bold">{obj.temperature}°C</div>
              </div>
              <div className="bg-surface-muted border border-line-subtle px-3.5 py-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">Heart rate</div>
                <div className="mt-1 text-base font-semibold text-ink">{obj.heartRate} <span className="text-xs font-medium text-muted">bpm</span></div>
              </div>
            </>
          )}
        </div>
    
        {/* Row 3: why this patient is next */}
        <div className="bg-surface-accent px-3.5 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">{sortRule === 'urgency' ? 'Why ranked first' : 'Why next'}</span>
          <span className="text-sm text-ink">{getRankingRationale(nextPatient, nextVisit, 0, sortRule)}</span>
        </div>
      </div>
    
      {expandedDetails[nextVisit.id] && (
        <div className="border-t border-line-subtle bg-surface-muted px-6 py-4 text-sm text-ink space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Full clinical subjective note</strong>
              <p className="leading-relaxed">{nextVisit.soap?.subjective || 'No additional history provided.'}</p>
            </div>
            <div>
              <strong className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Panel employer / coverage</strong>
              <p className="font-semibold text-accent">{nextPatient.panelEmployer}</p>
            </div>
            <div>
              <strong className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Address &amp; contact</strong>
              <p>{nextPatient.phone} · {nextPatient.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-line-subtle flex-wrap">
            <button
              type="button"
              onClick={() => handleStartConsultation(nextVisit.id)}
              className="h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Start clinical diagnosis</span>
            </button>
            <button
              type="button"
              onClick={(e) => copyToClipboard(`${nextPatient.fullName} (${nextPatient.id})`, 'Patient Details', e)}
              className="h-10 px-4 bg-surface text-ink border border-line text-sm font-semibold flex items-center gap-2 hover:bg-surface-accent cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy full record</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
