import React, { useState } from 'react';
import { Visit, PrescriptionItem, Language } from '../../types';
import { TRANSLATIONS } from '../../data';
import { 
  Users, User, CheckCircle, AlertCircle, FileText, Printer, CheckSquare, 
  Info, QrCode, ShieldCheck, HelpCircle, PackageOpen, ShieldAlert, Pill, Clock, Activity, CheckCircle2, ChevronRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useInventoryActions, useVisitRegister } from '../../hooks/useInventoryData';
import { DrugItem, allocateFefo, usableStock } from '../../domain/inventory';
import { errorMessage } from '../payroll/shared';
import { buttonProps, focusRing } from '../../lib/a11y';
import { conflictsWithAllergy, recordedAllergies } from '../../domain/allergy';

interface DispensaryDashboardProps {
  queue: Visit[];
  patientsMap: Record<string, any>;
  activeLanguage: Language;
  onDispenseSubmit: (visitId: string) => void;
  pharmacistName?: string;
}

export default function DispensaryDashboard({
  queue,
  patientsMap,
  activeLanguage,
  onDispenseSubmit,
  pharmacistName = "Pharm. Ahmad Razak"
}: DispensaryDashboardProps) {
  const t = TRANSLATIONS[activeLanguage];
  const { catalog } = useInventory();
  const inv = useInventoryActions();
  const today = new Date().toISOString().slice(0, 10);
  // For a prescription line that is not yet linked to a stock item, the pharmacist picks one.
  const [stockChoice, setStockChoice] = useState<Record<string, string>>({});
  const [dispenseError, setDispenseError] = useState<string | null>(null);

  // Active Selected Patient ID in pharmacy queue
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(
    queue.length > 0 ? queue[0].id : null
  );

  // Pharmacist Checklist State
  const [checklist, setChecklist] = useState({
    patientVerified: false,
    allergyCleared: false,
    dosageExplained: false
  });

  // Label Printing Preview Modal states
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedLabelRx, setSelectedLabelRx] = useState<PrescriptionItem | null>(null);

  // Skip/Out of Stock Toggle State
  const [skippedDrugs, setSkippedDrugs] = useState<Set<string>>(new Set());

  // Find the selected active visit
  const activeVisit = queue.find(v => v.id === selectedVisitId) || queue[0];
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;
  const visitRegister = useVisitRegister(activeVisit?.id);

  const cleanName = (n: string) => n.replace(/\s*\[OVERRIDDEN:.*\]$/, '').trim().toLowerCase();
  /** The stock item for a line: the one the doctor linked, the one the pharmacist chose, else an exact name match. */
  const stockFor = (rx: PrescriptionItem): DrugItem | undefined =>
    catalog.find((d) => d.id === (rx.inventoryId ?? stockChoice[rx.id])) ?? (rx.inventoryId ? undefined : catalog.find((d) => d.name.toLowerCase() === cleanName(rx.drugName)));
  const isDecided = (rx: PrescriptionItem) => !!rx.dispensedAt || !!rx.skipped;

  // The patient record keeps drug allergies in `drugAllergies`; this check once read a field that never exists, so it never fired.
  const patientAllergies = recordedAllergies(activePatient?.drugAllergies);
  const checkAllergyConflict = (drugName: string) => conflictsWithAllergy(drugName, patientAllergies);

  const hasUnskippedAllergies = activeVisit?.soap?.plan?.prescription?.some(rx =>
    !isDecided(rx) && !skippedDrugs.has(rx.id) && checkAllergyConflict(rx.drugName)
  );

  const handleSelectVisit = (id: string) => {
    setSelectedVisitId(id);
    // Reset checklists
    setChecklist({
      patientVerified: false,
      allergyCleared: false,
      dosageExplained: false
    });
    setSkippedDrugs(new Set());
    setStockChoice({});
    setDispenseError(null);
  };

  const handlePrintLabelClick = (rx: PrescriptionItem) => {
    setSelectedLabelRx(rx);
    setIsLabelModalOpen(true);
  };

  const rxLines = activeVisit?.soap?.plan?.prescription ?? [];
  const undecided = rxLines.filter((rx) => !isDecided(rx));
  const allDecided = rxLines.length > 0 && undecided.length === 0;
  const unsignedEntries = (visitRegister.data ?? []).filter((e) => !e.signedBy);

  /** Why a line cannot be dispensed yet, if it cannot. */
  const lineProblem = (rx: PrescriptionItem): string | null => {
    const item = stockFor(rx);
    if (!item) return 'Choose the stock item for this line, or skip it.';
    const usable = usableStock(item, today);
    if (usable < rx.quantity) return `Only ${usable} in date (${rx.quantity} needed). Skip it or restock first.`;
    return null;
  };
  const blocked = undecided.filter((rx) => !skippedDrugs.has(rx.id) && lineProblem(rx) !== null);

  const checksLeft = [checklist.patientVerified, checklist.allergyCleared, checklist.dosageExplained].filter((c) => !c).length;
  const dispenseHint = hasUnskippedAllergies
    ? 'Skip the drug with an allergy conflict before dispensing.'
    : blocked.length > 0
      ? `Resolve ${blocked.length} stock issue${blocked.length === 1 ? '' : 's'} above, or skip the line.`
      : checksLeft > 0
        ? `Tick the ${checksLeft} remaining safety check${checksLeft === 1 ? '' : 's'} to continue.`
        : '';

  const triggerDispensingSignoff = async () => {
    if (!selectedVisitId || !activeVisit) return;
    if (!checklist.patientVerified || !checklist.allergyCleared || !checklist.dosageExplained) {
      setDispenseError(activeLanguage === 'EN' ? 'Safety Checklist incomplete. Please manually verify all safety safeguards first.' : 'Senarai Semak Keselamatan belum lengkap. Sila sahkan semua langkah keselamatan terlebih dahulu.');
      return;
    }
    if (hasUnskippedAllergies) {
      setDispenseError(activeLanguage === 'EN' ? 'CRITICAL: Allergy conflict detected in active prescriptions. You must skip the conflicting drug or resolve the allergy before dispensing.' : 'KRITIKAL: Konflik alahan dikesan. Anda mesti melangkau ubat tersebut atau menyelesaikan alahan sebelum mendispens.');
      return;
    }
    setDispenseError(null);
    // One call does everything: it checks stock, takes it from the soonest-expiring batches, writes the ledger and marks each line.
    const lines = undecided.map((rx) =>
      skippedDrugs.has(rx.id)
        ? { prescription_id: rx.id, action: 'skip' as const, reason: checkAllergyConflict(rx.drugName) ? 'Allergy conflict' : 'Out of stock or not supplied' }
        : { prescription_id: rx.id, action: 'dispense' as const, inventory_id: stockFor(rx)?.id ?? null, quantity: rx.quantity },
    );
    try {
      const res = await inv.dispenseVisit.mutateAsync({ visitId: selectedVisitId, lines });
      if (res.pending_signatures > 0) return;               // wait for the second signature before the patient leaves the pharmacy
      onDispenseSubmit(selectedVisitId);
      setSelectedVisitId(null);
    } catch (e) {
      setDispenseError(errorMessage(e));
    }
  };

  const completeHandover = () => {
    if (!selectedVisitId) return;
    onDispenseSubmit(selectedVisitId);
    setSelectedVisitId(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans">

      {/* TOP CLINICAL PHARMACY COMMAND BANNER */}
      <div className="bg-surface border border-line rounded-none p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-none bg-surface-accent border border-line text-accent flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="type-section-title text-ink font-bold">
                {t.dispensary || 'Pharmacy & Dispensing Workstation'}
              </h2>
              <span className="font-mono text-2xs uppercase tracking-wider px-2 py-0.5 border border-teal-300/40 bg-surface-accent text-accent font-bold">
                FEFO Live Stock
              </span>
            </div>
            <p className="text-xs text-muted font-medium mt-0.5">
              Verify patient identities, double-check allergen cross-reactivities, and print compliant bilingual drug labels.
            </p>
          </div>
        </div>

        {/* Live Station Indicators */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted/60 border border-line font-mono text-xs text-ink">
            <Clock className="w-3.5 h-3.5 text-muted" />
            <span>Active Pharmacist: <strong className="text-ink font-bold">{pharmacistName}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-accent border border-line font-mono text-xs text-accent font-bold">
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span>Pending Rx: <strong className="text-ink">{queue.length}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* 1. DISPENSARY QUEUE LIST PANEL (Left Column - 35%) */}
      <div className="lg:col-span-4 bg-surface border border-line rounded-none shadow-2xs overflow-hidden flex flex-col">
        
        {/* Panel Header */}
        <div className="p-3.5 bg-surface-muted/40 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span id="dispensary-queue-title" className="text-xs font-bold text-ink uppercase tracking-wider">
              {t.dispensaryQueue || 'Dispensation Queue'}
            </span>
          </div>
          <span className={`font-mono text-2xs font-bold px-2 py-0.5 rounded-none border ${
            queue.length > 0 
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800' 
              : 'bg-surface text-muted border-line-subtle'
          }`}>
            {queue.length} {queue.length === 1 ? 'Patient' : 'Patients'}
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center bg-surface text-subtle flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 rounded-none bg-surface-muted border border-line-subtle flex items-center justify-center mb-3">
              <PackageOpen className="w-6 h-6 text-muted" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink">Dispensation Queue Empty</p>
            <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">
              Prescriptions validated and signed off in doctor consultation rooms flow into this queue automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line max-h-[500px] overflow-y-auto">
            {queue.map((visit, index) => {
              const pt = patientsMap[visit.patientId];
              const isSelected = selectedVisitId === visit.id || (!selectedVisitId && index === 0);
              if (!pt) return null;

              const medCount = visit.soap?.plan?.prescription?.length || 0;
              const hasAllergyAlert = pt.drugAllergies && pt.drugAllergies.length > 0;

              return (
                <div
                  key={visit.id}
                  {...buttonProps(() => handleSelectVisit(visit.id), isSelected)}
                  className={`p-3.5 transition-all text-left cursor-pointer ${focusRing} ${
                    isSelected 
                      ? 'bg-surface-accent border-l-4 border-l-accent border-r-0 border-y-0' 
                      : 'bg-surface hover:bg-surface-muted/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-2xs font-bold text-accent px-1.5 py-0.5 bg-surface border border-line">
                      RX-QUEUE #{index + 101}
                    </span>
                    <span className="text-2xs font-mono text-muted">{visit.date}</span>
                  </div>

                  <h5 className="text-xs font-bold text-ink truncate mt-1">
                    {pt.fullName}
                  </h5>

                  <p className="text-2xs font-mono text-muted mt-0.5">
                    NRIC: {pt.icNumber || 'Walk-in'}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-line-subtle text-2xs">
                    <span className="font-mono text-muted">
                      Items: <strong className="text-ink font-bold">{medCount} MEDS</strong>
                    </span>
                    {hasAllergyAlert ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3" /> Allergy Alert
                      </span>
                    ) : (
                      <span className="text-accent font-semibold flex items-center gap-1">
                        Awaiting dispense <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 2. DISPENSING DETAIL DETAILS (Right Column - 65%) */}
      <div className="lg:col-span-8 bg-surface border border-line rounded-none shadow-2xs p-4 sm:p-5 flex flex-col justify-between min-h-[480px]">
        {activePatient && activeVisit ? (
          <div className="space-y-4">
            
            {/* Header info bar */}
            <div className="border-b border-line-subtle pb-3 flex items-center justify-between">
              <div>
                <h4 id="dispenser-patient-banner" className="type-heading-caps text-strong">
                  {activePatient.fullName}
                </h4>
                <p className="text-xs text-subtle mt-0.5">
                  MyKad IC: <strong className="font-mono text-muted">{activePatient.icNumber}</strong> | Gender: {activePatient.gender}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Drug allergies">
                  {patientAllergies.length > 0 ? (
                    <>
                      <span className="chip-danger px-2 py-1 text-xs font-bold"><ShieldAlert className="w-4 h-4" aria-hidden="true" />Allergies</span>
                      {patientAllergies.map((al) => <span key={al} className="chip-danger px-2 py-1 text-xs font-bold">{al}</span>)}
                    </>
                  ) : (
                    <span className="chip-neutral px-2 py-1 text-xs font-bold">No known drug allergies</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="bg-primary/10 text-accent px-2.5 py-0.5 rounded-none text-2xs uppercase font-bold tracking-wider">
                  Pharmacopoeia Audit
                </span>
                <span className="text-xs text-subtle block mt-0.5">Doctor Case: {activeVisit.soap?.assessment?.icdCode}</span>
              </div>
            </div>

            {/* PHARMACY MEMO DISPLAY */}
            {activeVisit.soap?.plan?.pharmacyMemo && (
              <div className="chip-warn block p-3">
                <h5 className="type-label flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4" /> Doctor's Instructions
                </h5>
                <p className="text-sm leading-relaxed font-medium">
                  "{activeVisit.soap.plan.pharmacyMemo}"
                </p>
              </div>
            )}

            {/* Grid display for active prescriptions */}
            <div>
              <h5 className="type-label text-accent mb-2 font-sans flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {t.prescribedMeds}
              </h5>

              <div id="prescription-itemized-stack" className="space-y-3">
                {activeVisit.soap?.plan?.prescription?.length === 0 ? (
                  <div className="p-4 bg-surface text-subtle text-xs italic text-center rounded-none border">
                    No drugs compiled associated with this consultation visit.
                  </div>
                ) : (
                  activeVisit.soap.plan.prescription.map((rx: PrescriptionItem) => {
                    const decided = isDecided(rx);
                    const item = stockFor(rx);
                    const problem = decided ? null : lineProblem(rx);
                    const hasAllergy = checkAllergyConflict(rx.drugName);
                    const isSkipped = skippedDrugs.has(rx.id) || !!rx.skipped;
                    
                    return (
                      <div 
                        key={rx.id} 
                        className={`relative overflow-hidden p-3 rounded-none border flex flex-col md:flex-row items-stretch justify-between gap-3 text-xs transition-all ${
                          isSkipped 
                            ? 'bg-surface-strong border-line opacity-60 grayscale'
                            : hasAllergy 
                              ? 'bg-red-50 border-red-300 shadow-glow-danger ring-1 ring-red-300'
                              : 'bg-surface border-line-subtle'
                        }`}
                      >
                        
                        {/* Drug Name with dual BM/EN dosage translations */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h6 className="font-bold text-sm text-strong tracking-tight">{rx.drugName}</h6>
                            <span className="bg-surface-strong text-muted text-xs font-bold px-1.5 py-0.5 rounded-none uppercase tracking-wider">
                              Qty: {rx.quantity}
                            </span>
                          </div>

                          <div className="text-xs leading-relaxed border-l-2 border-line pl-2">
                            <p className="text-muted font-mono">
                              <strong>EN:</strong> {rx.dosage}
                            </p>
                            <p className="text-emerald-800 italic font-mono mt-0.5">
                              <strong>BM:</strong> {rx.dosageBM}
                            </p>
                          </div>
                          
                          <div className="pt-1 space-y-1.5">
                            {rx.dispensedAt ? (
                              <span className="chip-ok px-1.5 py-0.5 text-2xs uppercase">
                                Dispensed ({rx.dispensedQuantity ?? rx.quantity})
                              </span>
                            ) : rx.skipped ? (
                              <span className="chip-neutral px-1.5 py-0.5 text-2xs uppercase">
                                Skipped{rx.skipReason ? `: ${rx.skipReason}` : ''}
                              </span>
                            ) : (
                              <>
                                {!rx.inventoryId && (
                                  <select
                                    aria-label={`Stock item for ${rx.drugName}`}
                                    className="w-full min-h-11 px-2 text-xs border border-line-strong bg-surface text-ink"
                                    value={item?.id ?? ''}
                                    onChange={(e) => setStockChoice({ ...stockChoice, [rx.id]: e.target.value })}
                                  >
                                    <option value="">Choose the stock item…</option>
                                    {catalog.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                  </select>
                                )}
                                {item && !isSkipped && (() => {
                                  const plan = allocateFefo(item.batches ?? [], rx.quantity, today);
                                  return (
                                    <div className={`text-xs px-2 py-1 block ${plan.shortfall > 0 ? 'chip-danger' : 'chip-ok'}`}>
                                      {plan.shortfall > 0
                                        ? `Short by ${plan.shortfall}: ${usableStock(item, today)} in date.`
                                        : `From ${plan.allocations.map((a) => `batch ${a.batchNumber} (${a.quantity}, exp ${a.expiryDate ?? 'unknown'})`).join(' + ')}`}
                                    </div>
                                  );
                                })()}
                                {item?.registerRequired && !isSkipped && (
                                  <span className="chip-brand px-1.5 py-0.5 text-2xs uppercase">
                                    Controlled: needs a second signature
                                  </span>
                                )}
                                {problem && !isSkipped && <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">{problem}</div>}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Prints Sticker and controls */}
                        <div className="flex flex-col justify-center items-stretch shrink-0 pl-3 border-l border-line-subtle gap-2 w-44">
                          <button
                            type="button"
                            onClick={() => handlePrintLabelClick(rx)}
                            disabled={isSkipped}
                            className="btn-secondary"
                          >
                            <Printer className="w-4 h-4" aria-hidden="true" />
                            {t.printLabel}
                          </button>

                          <button
                            type="button"
                            disabled={decided}
                            onClick={() => {
                              const newSet = new Set(skippedDrugs);
                              if (isSkipped) newSet.delete(rx.id);
                              else newSet.add(rx.id);
                              setSkippedDrugs(newSet);
                            }}
                            className={isSkipped ? 'btn-secondary' : 'btn-secondary'}
                          >
                            {isSkipped ? 'Restore line' : 'Out of stock: skip'}
                          </button>
                        </div>

                        {/* ALLERGY HARD STOP OVERLAY */}
                        {hasAllergy && !isSkipped && (
                          <div className="absolute inset-0 bg-red-50/95 rounded-none flex flex-col items-center justify-center text-center p-4 backdrop-blur-[2px] z-10 animate-fadeIn border-2 border-red-200">
                            <ShieldAlert className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
                            <h4 className="type-heading-caps text-red-700 mb-1">Critical Allergy Conflict</h4>
                            <p className="text-red-600 text-xs max-w-[80%] leading-relaxed mb-3">
                              Patient has a registered allergy to components in <strong className="text-red-800">{rx.drugName}</strong>. Dispensing is locked.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const newSet = new Set(skippedDrugs);
                                newSet.add(rx.id);
                                setSkippedDrugs(newSet);
                              }}
                              className="btn-danger"
                            >
                              Skip This Medication
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pharmacist Safety validation inputs checklist */}
            <div className="bg-surface p-3.5 rounded-none border border-line space-y-2">
              <span className="text-2xs font-bold text-accent uppercase tracking-wider flex items-center gap-1 mb-1">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Dual-Verification Clinical Pharmacy Checks
              </span>

              <div id="pharmacy-safety-checker" className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-muted">
                <label className="flex items-start gap-2 min-h-11 bg-surface p-2.5 rounded-none border border-line-subtle cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-5 h-5 rounded-none border-line-strong accent-primary focus:ring-brand focus:ring-1"
                    checked={checklist.patientVerified}
                    onChange={(e) => setChecklist({ ...checklist, patientVerified: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-xs font-bold text-strong">Identify Patient ID</strong>
                    <span className="text-xs text-subtle">Match IC and Profile details</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 min-h-11 bg-surface p-2.5 rounded-none border border-line-subtle cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-5 h-5 rounded-none border-line-strong accent-primary focus:ring-brand focus:ring-1"
                    checked={checklist.allergyCleared}
                    onChange={(e) => setChecklist({ ...checklist, allergyCleared: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-xs font-bold text-strong">Check Allergen</strong>
                    <span className="text-xs text-subtle">Ensure absolutely zero drug conflicts</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 min-h-11 bg-surface p-2.5 rounded-none border border-line-subtle cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-5 h-5 rounded-none border-line-strong accent-primary focus:ring-brand focus:ring-1"
                    checked={checklist.dosageExplained}
                    onChange={(e) => setChecklist({ ...checklist, dosageExplained: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-xs font-bold text-strong">Dosage Advice EN/BM</strong>
                    <span className="text-xs text-subtle">Instructions explained in patient language</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Bar */}
            {dispenseError && (
              <p role="alert" className="chip-danger block px-3 py-2 text-xs font-bold whitespace-pre-line">{dispenseError}</p>
            )}

            {allDecided && unsignedEntries.length > 0 && (
              <div role="status" className="chip-brand block px-3 py-2 text-xs space-y-1">
                <div className="font-bold">Waiting for a second signature</div>
                <p>
                  {unsignedEntries.length} controlled-drug entr{unsignedEntries.length === 1 ? 'y needs' : 'ies need'} a signature from a different pharmacist or administrator before this patient can leave the pharmacy.
                  They can sign under Inventory &amp; Pharmacy &gt; Controlled register. This screen updates by itself.
                </p>
              </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-4 -mb-4 px-4 py-3 bg-surface border-t border-line shadow-bar-up flex flex-wrap items-center justify-between gap-3">
              <span id="dispense-hint" role="status" className={`text-xs max-w-xl ${!allDecided && dispenseHint ? 'font-bold text-ink' : 'text-muted italic'}`}>
                {allDecided
                  ? 'Stock has been taken and recorded.'
                  : dispenseHint || 'Confirming checks stock, takes it from the soonest-expiring batches and records it in one step.'}
              </span>
              {allDecided || rxLines.length === 0 ? (
                <button
                  type="button"
                  id="pharmacy-dispense-confirm-btn"
                  onClick={completeHandover}
                  disabled={unsignedEntries.length > 0}
                  className="btn-primary px-6"
                >
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  {unsignedEntries.length > 0 ? 'Waiting for signature' : 'Hand over & route to billing'}
                </button>
              ) : (
                <button
                  type="button"
                  id="pharmacy-dispense-confirm-btn"
                  aria-describedby="dispense-hint"
                  onClick={triggerDispensingSignoff}
                  disabled={!checklist.patientVerified || !checklist.allergyCleared || !checklist.dosageExplained || hasUnskippedAllergies || blocked.length > 0 || inv.dispenseVisit.isPending}
                  className={`${hasUnskippedAllergies ? 'btn-danger' : 'btn-primary'} px-6`}
                >
                  {hasUnskippedAllergies ? <ShieldAlert className="w-4 h-4" aria-hidden="true" /> : <CheckCircle className="w-4 h-4" aria-hidden="true" />}
                  {hasUnskippedAllergies ? 'Resolve conflicts' : blocked.length > 0 ? 'Resolve stock issues' : 'Dispense & route to billing'}
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[380px]">
            <div className="w-16 h-16 rounded-none bg-surface-accent border border-line flex items-center justify-center mb-4">
              <Pill className="w-8 h-8 text-accent" />
            </div>
            <h4 className="type-card-title text-ink font-bold">No Active Prescription Selected</h4>
            <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
              Select an encounter from the left dispensation queue to review dosage formulas, allocate FEFO batches, verify allergen clearances, and print pharmacy stickers.
            </p>
          </div>
        )}
      </div>

      {/* DRUG LABEL PRINTING PREVIEW MODAL */}
      {isLabelModalOpen && selectedLabelRx && activePatient && (
        <div id="drug-label-print-modal" role="dialog" aria-modal="true" aria-labelledby="drug-label-title" onKeyDown={(e) => { if (e.key === 'Escape') { setIsLabelModalOpen(false); setSelectedLabelRx(null); } }} className="fixed inset-0 bg-night-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-surface rounded-none shadow-none max-w-md w-full overflow-hidden border border-line">
            
            {/* Header */}
            <div className="bg-deep text-white px-5 py-3.5 flex items-center justify-between">
              <span id="drug-label-title" className="font-bold text-xs tracking-wider uppercase font-mono">Malaysian Sticker Pharmacist Label (4 x 2)</span>
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="text-white hover:text-slate-300 font-bold text-lg cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Close drug label preview"
              >
                &times;
              </button>
            </div>

            {/* Label design frame */}
            <div className="p-6">
              
              <div className="border-[3px] border-slate-300 p-4 bg-white text-black font-mono text-2xs leading-relaxed relative rounded-none">
                
                {/* Clinic details header */}
                <div className="border-b-2 border-slate-300 pb-1.5 text-center flex items-center justify-between">
                  <div className="text-left font-bold">
                    <p className="text-xs font-bold">MEDICLINIC ENTERPRISE</p>
                    <p className="text-2xs text-muted">No. 20 Jln Ampang, KL • Tel: 03-21664000</p>
                  </div>
                  <div className="text-right text-2xs">
                    <p>Date: {new Date().toLocaleDateString('ms-MY')}</p>
                    <p>Sticker No: {selectedLabelRx.id}</p>
                  </div>
                </div>

                {/* Patient identifiers */}
                <div className="py-2 border-b border-dashed border-slate-300">
                  <div className="grid grid-cols-2 gap-1.5 font-bold">
                    <p>Patient: <span className="underline uppercase">{activePatient.fullName}</span></p>
                    <p className="text-right">IC: {activePatient.icNumber}</p>
                  </div>
                </div>

                {/* Drug usage directions */}
                <div className="py-3">
                  <p className="font-bold text-xs text-teal-950 uppercase border border-slate-300 px-1.5 py-0.5 rounded-none w-fit mb-2 bg-primary/10">
                    {selectedLabelRx.drugName} (Qty: {selectedLabelRx.quantity} CAPS)
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex gap-1.5 items-start">
                      <span className="font-bold shrink-0 text-red-700 bg-red-100 rounded-none px-1 text-2xs uppercase">Directions</span>
                      <p className="font-bold text-xs leading-none text-red-800">{selectedLabelRx.frequency}</p>
                    </div>
                    
                    <p className="font-bold text-black border-l-2 border-slate-300 pl-1.5 my-1 text-2xs">
                      Take: {selectedLabelRx.dosage}
                    </p>
                    <p className="text-muted italic border-l-2 border-slate-300 pl-1.5 text-2xs">
                      Sila ambil: {selectedLabelRx.dosageBM}
                    </p>
                  </div>
                </div>

                {/* Footer labels with QR code placeholder */}
                <div className="border-t-2 border-slate-300 pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-2xs font-bold text-red-600">KEEP OUT OF REACH OF CHILDREN / JAUHKAN DARIPADA KANAK-KANAK</p>
                    <p className="text-2xs text-subtle mt-0.5">Dispensed under KKM Malaysia license regulations.</p>
                  </div>
                  <div className="w-12 h-12 border border-slate-300 flex items-center justify-center p-0.5 shrink-0 ml-1.5">
                    <QrCode className="w-full h-full text-black stroke-1" />
                  </div>
                </div>

              </div>

              <p className="text-2xs text-slate-400 mt-3 text-center">
                Printer emulation outputs to ZEBRA TT-402 labels systems.
              </p>
            </div>

            {/* Actions */}
            <div className="bg-surface-muted px-5 py-3 border-t border-line-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="btn-secondary"
              >
                Close Label Window
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="btn-primary"
              >
                <Printer className="w-3.5 h-3.5" />
                Execute Sticky Print Out
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}
