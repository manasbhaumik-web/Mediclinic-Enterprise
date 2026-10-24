import React from 'react';
import { formatTicket } from '../../domain/ticket';
import type { SortRule, TriageDetails } from '../../utils/queueSorter';
import type { VitalSigns } from '../../types';
import { Pin, Stethoscope, Volume2, Copy } from 'lucide-react';
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
  userId?: string | null;
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

export default function NextPatientCard({
  userId = null,
  pinnedVisitIds,
  nextVisit,
  calledTimestampMap,
  stepIndex,
  nextPatient,
  heroTriage,
  renderAllergyBadge,
  activeConsultationVisitId,
  calledVisitId,
  handleStartConsultation,
  requestCallPatient,
  toggleDetails,
  expandedDetails,
  togglePinVisit,
  copyToClipboard,
  obj,
  heroWait,
  sortRule
}: NextPatientCardProps) {
  const hasAllergies = (nextPatient.drugAllergies?.length ?? 0) > 0;
  const stripeClass = hasAllergies 
    ? '' 
    : heroWait >= 20 
      ? '' 
      : '';

  return (
    <section aria-label="Next patient in line" className={`bg-surface border border-line ${stripeClass}`}>
      {/* Top Banner with Steps */}
      <div className="bg-surface-accent border-b border-line px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 font-mono">
            Next in line (#1)
          </span>
          {pinnedVisitIds[nextVisit.id] && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase px-2.5 py-1 flex items-center gap-1.5 font-mono">
              <Pin className="w-3 h-3 shrink-0" />
              <span>Pinned priority</span>
            </span>
          )}
          {calledTimestampMap[nextVisit.id] && (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1 font-mono tabular-nums">
              Called at {calledTimestampMap[nextVisit.id]}
            </span>
          )}
        </div>
    
        <ol className="flex items-center gap-2.5 text-xs font-semibold">
          {['Ready', 'Called', 'In consultation'].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <li aria-hidden="true" className="w-6 h-0.5 bg-line" />}
              <li className={`flex items-center gap-1.5 ${i === stepIndex ? 'text-accent font-bold' : 'text-muted'}`} aria-current={i === stepIndex ? 'step' : undefined}>
                <span className={`w-5 h-5 rounded-none text-2xs font-bold flex items-center justify-center font-mono tabular-nums ${
                  i === stepIndex ? 'bg-primary text-white' : i < stepIndex ? 'bg-surface-strong text-accent border border-primary' : 'border border-line text-muted'
                }`}>{i + 1}</span>
                <span>{label}</span>
              </li>
            </React.Fragment>
          ))}
        </ol>
      </div>
    
      <div className="p-6 space-y-5">
        {/* Row 1: Patient Details (Left) and Action Buttons (Right) */}
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 space-y-2.5">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-ink leading-tight flex items-baseline gap-2">
                {formatTicket(nextVisit.ticketNo) && (
                  <span className="font-mono tabular-nums text-accent">{formatTicket(nextVisit.ticketNo)}</span>
                )}
                <span>{nextPatient.fullName}</span>
              </h3>
              <p className="text-xs text-muted font-mono tabular-nums">
                ID {nextPatient.id} · <span className="font-sans">{nextPatient.gender}</span> · Born {nextPatient.dob}
              </p>
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
            {nextVisit.status === 'Consulting' && nextVisit.calledBy && nextVisit.calledBy !== userId ? (
              <span className="chip-info min-h-10 px-4 inline-flex items-center text-xs font-bold whitespace-nowrap font-mono">
                With {nextVisit.calledByName ?? 'another doctor'}{nextVisit.consultRoom ? `, ${nextVisit.consultRoom}` : ''}
              </span>
            ) : activeConsultationVisitId === nextVisit.id || calledVisitId === nextVisit.id ? (
              <button
                type="button"
                onClick={() => handleStartConsultation(nextVisit.id)}
                className="h-10 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Move to consultation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestCallPatient(nextVisit.id, nextPatient.fullName, 1)}
                aria-label={`Call patient ${nextPatient.fullName}`}
                className="h-10 px-5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Call patient</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleDetails(nextVisit.id)}
              aria-expanded={!!expandedDetails[nextVisit.id]}
              className="h-10 px-4 bg-surface text-accent border border-primary text-xs font-bold whitespace-nowrap hover:bg-surface-accent transition-colors cursor-pointer"
            >
              {expandedDetails[nextVisit.id] ? 'Hide details' : 'View details'}
            </button>
            <button
              type="button"
              onClick={(e) => togglePinVisit(nextVisit.id, e)}
              aria-pressed={!!pinnedVisitIds[nextVisit.id]}
              aria-label={`${pinnedVisitIds[nextVisit.id] ? 'Unpin' : 'Pin'} ${nextPatient.fullName}`}
              title="Toggle pin priority"
              className={`h-10 px-3.5 border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                pinnedVisitIds[nextVisit.id]
                  ? 'chip-warn'
                  : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{pinnedVisitIds[nextVisit.id] ? 'Pinned' : 'Pin'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => copyToClipboard(nextPatient.id, 'Patient ID', e)}
              aria-label={`Copy patient ID for ${nextPatient.fullName}`}
              title="Copy patient ID"
              className="h-10 px-3.5 bg-surface text-ink border border-line text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap hover:bg-surface-accent transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy ID</span>
            </button>
          </div>
        </div>
    
        {/* Row 2: Vitals & Complaint Tiles */}
        <div className={`grid grid-cols-2 gap-3 ${obj && obj.temperature > 0 ? 'lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]' : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'}`}>
          <div className="bg-surface-muted border border-line px-3.5 py-3 col-span-2 lg:col-span-1 min-w-0">
            <div className="text-2xs font-bold uppercase tracking-wider text-muted font-mono">Chief complaint</div>
            <div className="mt-1 text-sm font-bold text-ink">{getChiefComplaintLabel(nextVisit.soap?.subjective)}</div>
          </div>
          <div className={`px-3.5 py-3 border border-line ${heroWait >= 20 ? 'border-l-amber-500 chip-warn' : 'border-l-emerald-600 bg-surface-muted text-ink'}`}>
            <div className="text-2xs font-bold uppercase tracking-wider opacity-80 font-mono">Waiting</div>
            <div className="mt-1 text-sm font-bold font-mono tabular-nums">{heroWait} min</div>
          </div>
          {obj && obj.temperature > 0 && (
            <>
              <div className="bg-surface-muted border border-line px-3.5 py-3">
                <div className="text-2xs font-bold uppercase tracking-wider text-muted font-mono">Blood pressure</div>
                <div className="mt-1 text-sm font-bold text-ink font-mono tabular-nums">{obj.bpSystolic}/{obj.bpDiastolic} <span className="text-2xs font-medium text-muted font-sans">mmHg</span></div>
              </div>
              <div className={`px-3.5 py-3 border border-line ${obj.temperature >= 37.5 ? 'border-l-rose-600 chip-danger' : 'border-l-emerald-600 bg-surface-muted text-ink'}`}>
                <div className="text-2xs font-bold uppercase tracking-wider opacity-80 font-mono">Temperature</div>
                <div className="mt-1 text-sm font-bold font-mono tabular-nums">{obj.temperature}°C</div>
              </div>
              <div className="bg-surface-muted border border-line px-3.5 py-3">
                <div className="text-2xs font-bold uppercase tracking-wider text-muted font-mono">Heart rate</div>
                <div className="mt-1 text-sm font-bold text-ink font-mono tabular-nums">{obj.heartRate} <span className="text-2xs font-medium text-muted font-sans">bpm</span></div>
              </div>
            </>
          )}
        </div>
    
        {/* Row 3: Why This Patient is Next */}
        <div className="bg-surface-accent border border-line px-3.5 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-accent font-mono">{sortRule === 'urgency' ? 'Rank Rationale' : 'Queue Priority'}</span>
          <span className="text-xs text-ink font-medium">{getRankingRationale(nextPatient, nextVisit, 0, sortRule)}</span>
        </div>
      </div>
    
      {/* Expanded Clinical Details Drawer */}
      {expandedDetails[nextVisit.id] && (
        <div className="border-t border-line bg-surface-muted px-6 py-4 text-xs text-ink space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1 font-mono">Full clinical subjective note</strong>
              <p className="leading-relaxed">{nextVisit.soap?.subjective || 'No additional history provided.'}</p>
            </div>
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1 font-mono">Panel employer / coverage</strong>
              <p className="font-bold text-accent">{nextPatient.panelEmployer}</p>
            </div>
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1 font-mono">Address &amp; contact</strong>
              <p className="font-mono tabular-nums">{nextPatient.phone} · <span className="font-sans">{nextPatient.address}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-line flex-wrap">
            <button
              type="button"
              onClick={() => handleStartConsultation(nextVisit.id)}
              className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Start clinical diagnosis</span>
            </button>
            <button
              type="button"
              onClick={(e) => copyToClipboard(`${nextPatient.fullName} (${nextPatient.id})`, 'Patient Details', e)}
              className="h-9 px-4 bg-surface text-ink border border-line text-xs font-bold flex items-center gap-2 hover:bg-surface-accent cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy full record</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
