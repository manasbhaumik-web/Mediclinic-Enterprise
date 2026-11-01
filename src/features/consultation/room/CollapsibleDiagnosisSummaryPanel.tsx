import React from 'react';
import { ICD10Code, PrescriptionItem, ClinicalProcedureItem } from '../../../types';
import { 
  ClipboardList, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertTriangle, FileText, Pill, Stethoscope, ArrowRight, Activity
} from 'lucide-react';

interface CollapsibleDiagnosisSummaryPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  subjective: string;
  vitals: {
    bpSystolic: number;
    bpDiastolic: number;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  };
  selectedICD: ICD10Code | null;
  clinicalNotes?: string;
  rxList: PrescriptionItem[];
  procedures?: ClinicalProcedureItem[];
  mcDays: number | '';
  mcReason?: string;
  mcGenerated: boolean;
  referralGenerated: boolean;
  referralDetails?: {
    hospital: string;
    department: string;
    reason: string;
  };
  labOrders?: string[];
  onReviewSignoff?: () => void;
}

export default function CollapsibleDiagnosisSummaryPanel({
  isOpen,
  onToggle,
  subjective,
  vitals,
  selectedICD,
  clinicalNotes,
  rxList,
  procedures = [],
  mcDays,
  mcReason,
  mcGenerated,
  referralGenerated,
  referralDetails,
  labOrders = [],
  onReviewSignoff
}: CollapsibleDiagnosisSummaryPanelProps) {
  // Financial estimate calculation
  const medsTotal = React.useMemo(() => {
    return rxList.reduce((acc, item) => acc + (item.pricePerUnit * item.quantity), 0);
  }, [rxList]);

  const procsTotal = React.useMemo(() => {
    return procedures.reduce((acc, item) => acc + (item.price || 0), 0);
  }, [procedures]);

  const grandTotal = medsTotal + procsTotal;

  // Objective alert status
  const hasFever = vitals.temperature >= 37.5;
  const hasHighBP = vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90;

  if (!isOpen) {
    return (
      <aside
        id="rightCollapsedRail"
        onClick={onToggle}
        className="w-11 bg-surface-muted border-l border-line flex flex-col items-center py-3 justify-between shrink-0 cursor-pointer hover:bg-surface-accent transition-colors select-none"
        title="Click to expand Current Diagnosis Summary"
        aria-label="Expand Diagnosis Summary"
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1 text-primary hover:text-primary-hover focus:outline-hidden"
            aria-label="Expand Diagnosis Summary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="[writing-mode:vertical-rl] text-xs font-mono font-bold uppercase tracking-wider text-muted">
            Diagnosis Session Summary
          </span>
        </div>
        <span className="w-6 h-6 rounded-full bg-primary text-white text-2xs font-mono font-bold flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      </aside>
    );
  }

  return (
    <aside
      id="rightSummaryPanel"
      className="w-80 bg-surface-muted/30 border-l border-line flex flex-col shrink-0 select-none transition-all duration-200"
      aria-label="Current Session Summary Sidebar"
    >
      {/* Panel Header */}
      <div className="p-3 bg-surface border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-ink">Session Summary</span>
          <span className="px-1.5 py-0.5 bg-primary text-white text-2xs font-mono font-bold">
            LIVE
          </span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 hover:bg-surface-accent text-muted hover:text-ink transition-colors cursor-pointer"
          title="Collapse Summary Panel"
          aria-label="Collapse Summary Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Subheader */}
      <div className="px-3 py-1.5 bg-surface-muted border-b border-line text-2xs font-mono text-muted uppercase flex justify-between items-center">
        <span>Real-Time Clinical Recap</span>
        <span>SOAP Audit</span>
      </div>

      {/* Scrollable Summary Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        
        {/* S Summary */}
        <div className="bg-surface border border-line p-2.5 space-y-1">
          <div className="flex justify-between items-center border-b border-line pb-1">
            <span className="font-bold text-primary font-mono text-2xs uppercase">
              Subjective (S)
            </span>
            <span className={`text-2xs font-bold font-mono ${subjective ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted'}`}>
              {subjective ? 'Captured' : 'Awaiting Input'}
            </span>
          </div>
          <p className="text-2xs text-muted line-clamp-3 italic pt-0.5">
            {subjective || 'No subjective complaints recorded yet.'}
          </p>
        </div>

        {/* O Summary */}
        <div className="bg-surface border border-line p-2.5 space-y-1">
          <div className="flex justify-between items-center border-b border-line pb-1">
            <span className="font-bold text-primary font-mono text-2xs uppercase">
              Objective Vitals (O)
            </span>
            {hasFever || hasHighBP ? (
              <span className="text-2xs text-rose-700 dark:text-rose-400 font-bold font-mono">
                {hasFever ? 'Pyrexia' : 'BP Alert'}
              </span>
            ) : (
              <span className="text-2xs text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                Normal
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 text-2xs font-mono pt-1 text-ink">
            <div>BP: <strong>{vitals.bpSystolic > 0 ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '—'}</strong></div>
            <div>HR: <strong>{vitals.heartRate > 0 ? `${vitals.heartRate} bpm` : '—'}</strong></div>
            <div>
              Temp: <strong className={hasFever ? 'text-rose-700 dark:text-rose-400 font-bold' : ''}>
                {vitals.temperature > 0 ? `${vitals.temperature} °C` : '—'}
              </strong>
            </div>
            <div>RR: <strong>{vitals.respiratoryRate > 0 ? `${vitals.respiratoryRate}/min` : '—'}</strong></div>
          </div>
        </div>

        {/* A Summary */}
        <div className="bg-surface border border-line p-2.5 space-y-1">
          <div className="flex justify-between items-center border-b border-line pb-1">
            <span className="font-bold text-primary font-mono text-2xs uppercase">
              Diagnosis (A)
            </span>
            <span className="text-2xs px-1 bg-surface-muted text-accent font-mono font-bold border border-line">
              ICD-10
            </span>
          </div>
          {selectedICD ? (
            <div className="pt-0.5">
              <span className="font-mono font-bold text-primary block text-xs">
                {selectedICD.code}
              </span>
              <p className="text-2xs text-ink font-medium leading-tight">
                {selectedICD.desc}
              </p>
            </div>
          ) : (
            <p className="text-2xs text-muted italic pt-0.5">
              Pending ICD-10 selection in Assessment tab.
            </p>
          )}
          {clinicalNotes && (
            <p className="text-2xs text-subtle italic border-t border-line/60 pt-1 mt-1 truncate">
              {clinicalNotes}
            </p>
          )}
        </div>

        {/* P Summary */}
        <div className="bg-surface border border-line p-2.5 space-y-1.5">
          <div className="flex justify-between items-center border-b border-line pb-1">
            <span className="font-bold text-primary font-mono text-2xs uppercase">
              Plan &amp; Orders (P)
            </span>
            <span className="text-2xs text-muted font-mono">
              {rxList.length} Rx
            </span>
          </div>

          {/* Rx Items */}
          {rxList.length > 0 ? (
            <ul className="text-2xs text-ink divide-y divide-line/50 font-mono">
              {rxList.map((rx, idx) => (
                <li key={rx.id || idx} className="py-1 flex justify-between items-center">
                  <span className="truncate pr-1">
                    {idx + 1}. {rx.drugName} ({rx.dosage})
                  </span>
                  <span className="text-muted shrink-0">Qty: {rx.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-2xs text-muted italic">No medications prescribed yet.</p>
          )}

          {/* Procedures */}
          {procedures.length > 0 && (
            <div className="border-t border-line pt-1 text-2xs font-mono">
              <span className="text-subtle block font-bold">Procedures ({procedures.length}):</span>
              <ul className="list-disc list-inside text-ink space-y-0.5">
                {procedures.map((p, idx) => (
                  <li key={p.id || idx} className="truncate">
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lab Orders */}
          {labOrders.length > 0 && (
            <div className="border-t border-line pt-1 text-2xs font-mono">
              <span className="text-subtle block font-bold">Labs Ordered ({labOrders.length}):</span>
              <p className="text-ink truncate">{labOrders.join(', ')}</p>
            </div>
          )}

          {/* Medical Certificate & Referral Details */}
          <div className="border-t border-line pt-1.5 space-y-1 text-2xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-muted">Medical Certificate (MC):</span>
              <strong className={mcGenerated ? 'text-primary font-bold' : 'text-ink'}>
                {mcDays ? `${mcDays} Day(s)${mcGenerated ? ' ✓' : ''}` : 'None'}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted">Hospital Referral:</span>
              <strong className={referralGenerated ? 'text-rose-700 dark:text-rose-400 font-bold' : 'text-ink'}>
                {referralGenerated ? (referralDetails?.hospital || 'Hospital ED') : 'None'}
              </strong>
            </div>
          </div>
        </div>

        {/* Financial Co-Pay Snapshot */}
        <div className="bg-surface-muted/60 border border-line p-2.5 space-y-1 font-mono text-2xs">
          <div className="flex justify-between text-muted">
            <span>Medications Subtotal:</span>
            <span>RM {medsTotal.toFixed(2)}</span>
          </div>
          {procsTotal > 0 && (
            <div className="flex justify-between text-muted">
              <span>Procedures Subtotal:</span>
              <span>RM {procsTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-ink border-t border-line pt-1 text-xs">
            <span>Estimated Total:</span>
            <span className="text-primary">RM {grandTotal.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* Footer CTA: Quick Review Sign-off */}
      {onReviewSignoff && (
        <div className="p-2.5 bg-surface border-t border-line">
          <button
            type="button"
            onClick={onReviewSignoff}
            className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Review &amp; Sign Off</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
}
