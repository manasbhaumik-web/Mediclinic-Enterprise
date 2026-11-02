import React from 'react';
import { formatTicket } from '../../domain/ticket';
import type { SortRule, TriageDetails } from '../../utils/queueSorter';
import type { VitalSigns } from '../../types';
import { Pin, Stethoscope, Volume2, Copy } from 'lucide-react';
import { getChiefComplaintLabel, getRankingRationale } from '../../utils/queueSorter';
import { formatWait } from '../../utils/waitTime';
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
  const status = nextVisit.status === 'Consulting' && nextVisit.calledBy && nextVisit.calledBy !== userId
    ? 'other'
    : activeConsultationVisitId === nextVisit.id || calledVisitId === nextVisit.id ? 'called' : 'waiting';
  const initials = nextPatient.fullName.split(/\s+/).filter(Boolean).map((w, i, a) => (i === 0 || i === a.length - 1 ? w[0] : '')).join('').toUpperCase();
  const meta = [nextPatient.gender, nextPatient.dob ? `Born ${nextPatient.dob}` : null, formatTicket(nextVisit.ticketNo)].filter(Boolean).join(' · ');
  const vitals = obj && obj.temperature > 0 ? [
    { label: 'Temperature', value: `${obj.temperature}°C`, warn: obj.temperature >= 37.5 },
    { label: 'Heart rate', value: `${obj.heartRate} bpm`, warn: false },
    { label: 'Blood pressure', value: `${obj.bpSystolic}/${obj.bpDiastolic} mmHg`, warn: false },
  ] : [];

  return (
    <section aria-label="Next patient in line" className="flex flex-col">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
            Next in line
          </span>
          {pinnedVisitIds[nextVisit.id] && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-semibold">
              <Pin className="w-3 h-3 shrink-0" aria-hidden="true" />
              Pinned priority
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold tracking-tight leading-tight text-ink break-words">{nextPatient.fullName}</h3>
            <p className="mt-1 text-sm text-muted">{meta}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 inline-flex items-center gap-1.5 ${heroTriage.badgeBg}`}>
            <heroTriage.icon className={`w-3.5 h-3.5 ${heroTriage.iconColor}`} aria-hidden="true" />
            <span>Triage: {heroTriage.level}</span>
          </span>
          {renderAllergyBadge(nextPatient.drugAllergies)}
          <span className={`text-xs font-semibold px-2.5 py-1 tabular-nums ${heroWait >= 20 ? 'bg-amber-100 text-amber-900' : 'bg-surface-strong text-accent'}`}>
            Waiting {formatWait(heroWait)}
          </span>
        </div>

        <p className="text-sm text-ink">
          <span className="text-muted">Chief complaint: </span>
          <span className="font-semibold">{getChiefComplaintLabel(nextVisit.soap?.subjective)}</span>
        </p>

        {vitals.length > 0 && (
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-px bg-line border border-line">
            {vitals.map((v) => (
              <div key={v.label} className="bg-surface-muted px-3 py-2.5">
                <dt className="text-xs font-medium text-muted">{v.label}</dt>
                <dd className={`mt-0.5 text-sm font-bold tabular-nums ${v.warn ? 'text-rose-700 dark:text-rose-300' : 'text-ink'}`}>{v.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="text-xs text-muted">
          <span className="font-semibold text-accent">{sortRule === 'urgency' ? 'Rank rationale: ' : 'Queue priority: '}</span>
          {getRankingRationale(nextPatient, nextVisit, 0, sortRule)}
        </p>

        <div className="flex flex-col gap-2">
          {status === 'other' ? (
            <span className="chip-info min-h-12 px-4 inline-flex items-center text-sm font-semibold">
              With {nextVisit.calledByName ?? 'another doctor'}{nextVisit.consultRoom ? `, ${nextVisit.consultRoom}` : ''}
            </span>
          ) : status === 'called' ? (
            <button
              type="button"
              onClick={() => handleStartConsultation(nextVisit.id)}
              className="btn-primary min-h-12 px-6 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" aria-hidden="true" />
              <span>Move to consultation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => requestCallPatient(nextVisit.id, nextPatient.fullName, 1)}
              aria-label={`Call patient ${nextPatient.fullName}`}
              className="btn-primary min-h-12 px-6 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>Call patient</span>
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleDetails(nextVisit.id)}
              aria-expanded={!!expandedDetails[nextVisit.id]}
              className="btn-secondary flex-1 min-h-11 px-4 text-sm text-ink cursor-pointer"
            >
              {expandedDetails[nextVisit.id] ? 'Hide details' : 'View details'}
            </button>
            <button
              type="button"
              onClick={(e) => togglePinVisit(nextVisit.id, e)}
              aria-pressed={!!pinnedVisitIds[nextVisit.id]}
              aria-label={`${pinnedVisitIds[nextVisit.id] ? 'Unpin' : 'Pin'} ${nextPatient.fullName}`}
              className={`flex-1 min-h-11 px-4 border text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                pinnedVisitIds[nextVisit.id] ? 'chip-warn' : 'bg-surface text-ink border-line hover:bg-surface-accent'
              }`}
            >
              <Pin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{pinnedVisitIds[nextVisit.id] ? 'Pinned' : 'Pin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Clinical Details Drawer */}
      {expandedDetails[nextVisit.id] && (
        <div className="border-t border-line bg-surface-muted px-5 py-4 text-xs text-ink space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">Full clinical subjective note</strong>
              <p className="leading-relaxed">{nextVisit.soap?.subjective || 'No additional history provided.'}</p>
            </div>
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">Panel employer / coverage</strong>
              <p className="font-bold text-accent">{nextPatient.panelEmployer}</p>
            </div>
            <div>
              <strong className="block text-2xs font-bold uppercase tracking-wider text-muted mb-1">Address &amp; contact</strong>
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
