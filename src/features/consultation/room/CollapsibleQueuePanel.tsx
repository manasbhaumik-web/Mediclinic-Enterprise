import React from 'react';
import { Visit, Patient } from '../../../types';
import { formatTicket } from '../../../domain/ticket';
import { calculatePatientAge } from '../../../domain/patientAge';
import { getChiefComplaintLabel } from '../../../utils/queueSorter';
import { Users, ChevronLeft, ChevronRight, AlertCircle, Clock, Stethoscope } from 'lucide-react';

interface CollapsibleQueuePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  queue: Visit[];
  patientsMap: Record<string, Patient>;
  activeVisitId?: string | null;
  onSelectVisit?: (visitId: string) => void;
  doctorName?: string;
}

export default function CollapsibleQueuePanel({
  isOpen,
  onToggle,
  queue,
  patientsMap,
  activeVisitId,
  onSelectVisit,
  doctorName = 'Consulting Medical Officer'
}: CollapsibleQueuePanelProps) {
  // Sort queue by Serial No (ticketNo ascending)
  const sortedQueue = React.useMemo(() => {
    return [...queue].sort((a, b) => (a.ticketNo || 0) - (b.ticketNo || 0));
  }, [queue]);

  if (!isOpen) {
    return (
      <aside
        id="leftCollapsedRail"
        onClick={onToggle}
        className="w-11 bg-surface-muted border-r border-line flex flex-col items-center py-3 justify-between shrink-0 cursor-pointer hover:bg-surface-accent transition-colors select-none"
        title="Click to expand Patient Queue"
        aria-label="Expand Patient Queue"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 text-primary hover:text-primary-hover focus:outline-hidden"
            aria-label="Expand Patient Queue"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="[writing-mode:vertical-rl] text-xs font-mono font-bold uppercase tracking-wider text-muted">
            Patient Queue ({sortedQueue.length})
          </span>
        </div>
        <span className="w-6 h-6 rounded-full bg-primary text-white text-2xs font-mono font-bold flex items-center justify-center">
          {sortedQueue.length}
        </span>
      </aside>
    );
  }

  return (
    <aside
      id="leftQueuePanel"
      className="w-72 lg:w-80 bg-surface-muted/30 border-r border-line flex flex-col shrink-0 select-none transition-all duration-200"
      aria-label="Patient Queue Sidebar"
    >
      {/* Panel Header */}
      <div className="p-3 bg-surface border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-ink">Patient Queue</span>
          <span className="px-1.5 py-0.5 bg-primary text-white text-2xs font-mono font-bold">
            {sortedQueue.length} Waiting
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 hover:bg-surface-accent text-muted hover:text-ink transition-colors cursor-pointer"
          title="Collapse Queue Panel"
          aria-label="Collapse Queue Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Sorting & Status Subheader */}
      <div className="px-3 py-1.5 bg-surface-muted border-b border-line text-2xs font-mono text-muted uppercase flex justify-between items-center">
        <span>Sort: Serial No (Asc)</span>
        <span>Acuity / Status</span>
      </div>

      {/* Queue Patient Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-line">
        {sortedQueue.length === 0 ? (
          <div className="p-6 text-center text-muted flex flex-col items-center justify-center space-y-2">
            <Users className="w-8 h-8 opacity-40 text-muted" />
            <span className="text-xs font-bold text-ink">No patients in queue</span>
            <span className="text-2xs text-subtle">Waiting for newly registered or triaged patients.</span>
          </div>
        ) : (
          sortedQueue.map((visit) => {
            const patient = patientsMap[visit.patientId];
            const isActive = visit.id === activeVisitId;
            const ticketText = formatTicket(visit.ticketNo);
            const ageDetails = patient?.dob ? calculatePatientAge(patient.dob) : null;
            const complaint = getChiefComplaintLabel(visit.soap?.subjective);

            // Acuity detection
            const isHighFever = (visit.soap?.objective?.temperature || 0) >= 38.5;
            const isHypertensionCrisis = (visit.soap?.objective?.bpSystolic || 0) >= 160;
            const isPriority = isHighFever || isHypertensionCrisis;

            return (
              <div
                key={visit.id}
                onClick={() => {
                  if (onSelectVisit && !isActive) {
                    onSelectVisit(visit.id);
                  }
                }}
                className={`p-3 transition-colors ${
                  isActive
                    ? 'bg-primary/10 border-l-4 border-primary'
                    : 'bg-surface hover:bg-surface-accent cursor-pointer border-l-4 border-transparent'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectVisit && !isActive) {
                    e.preventDefault();
                    onSelectVisit(visit.id);
                  }
                }}
              >
                {/* Serial / Ticket No & Badge */}
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={`font-bold ${isActive ? 'text-primary' : 'text-accent'}`}>
                    {ticketText}
                    {isActive && <span className="ml-1 text-2xs font-normal">● IN ROOM</span>}
                  </span>
                  
                  {isActive ? (
                    <span className="text-2xs px-1.5 py-0.5 bg-primary text-white font-bold">
                      Attending
                    </span>
                  ) : isPriority ? (
                    <span className="text-2xs px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Priority
                    </span>
                  ) : (
                    <span className="text-2xs px-1.5 py-0.5 bg-surface-muted text-muted font-bold border border-line">
                      Waiting
                    </span>
                  )}
                </div>

                {/* Patient Name */}
                <p className={`font-bold text-xs mt-1 truncate ${isActive ? 'text-primary' : 'text-ink'}`}>
                  {patient?.fullName || 'Walk-in Patient'}
                </p>

                {/* Demographics & Chief Complaint */}
                <div className="flex items-center gap-1 text-2xs text-muted mt-0.5 font-mono">
                  {ageDetails && <span>{ageDetails.displayAge}</span>}
                  {patient?.gender && <span>• {patient.gender}</span>}
                  {patient?.panelEmployer && patient.panelEmployer !== 'None (Self-Pay)' && (
                    <span className="text-accent font-bold">• {patient.panelEmployer}</span>
                  )}
                </div>

                <p className="text-2xs text-subtle truncate mt-1 italic">
                  {complaint}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Left Panel Footer */}
      <div className="p-2.5 bg-surface border-t border-line text-2xs text-muted flex justify-between items-center font-mono">
        <span className="truncate max-w-[170px]" title={doctorName}>
          Dr: {doctorName}
        </span>
        {onSelectVisit && sortedQueue.length > 0 && (
          <button
            type="button"
            onClick={() => {
              // Find next patient in sequence
              const nextVisit = sortedQueue.find(v => v.id !== activeVisitId);
              if (nextVisit) onSelectVisit(nextVisit.id);
            }}
            className="px-2 py-1 bg-primary text-white font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1"
            title="Call next patient in queue sequence"
          >
            <span>Next</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </aside>
  );
}
