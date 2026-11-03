import React, { useState } from 'react';
import { Visit, PrescriptionItem, Language } from '../../types';
import { TRANSLATIONS } from '../../data';
import { 
  Users, User, CheckCircle, AlertCircle, FileText, Printer, CheckSquare, 
  Info, QrCode, ShieldCheck, HelpCircle, PackageOpen, ShieldAlert, Pill, Clock, Activity, CheckCircle2, ChevronRight, Sparkles, AlertTriangle, BookOpen, Lock, ThermometerSnowflake
} from 'lucide-react';
import BukuRacunRegister from './BukuRacunRegister';
import DangerousDrugsSafeRegister from './DangerousDrugsSafeRegister';
import ColdChainVaccineModal from '../operations/ColdChainVaccineModal';
import { isAntibioticDrug } from '../../domain/antibioticStewardship';
import { useInventory } from '../../context/InventoryContext';
import { useInventoryActions, useVisitRegister } from '../../hooks/useInventoryData';
import { DrugItem, allocateFefo, usableStock } from '../../domain/inventory';
import { errorMessage } from '../../components/ui/formHelpers';
import { buttonProps, focusRing } from '../../lib/a11y';
import { conflictsWithAllergy, recordedAllergies } from '../../domain/allergy';
import { PageHeading, StationTabs, StatStrip } from '../../components/ui/StationChrome';
import { formatWait } from '../../utils/waitTime';

interface DispensaryDashboardProps {
  queue: Visit[];
  allVisits?: Visit[];
  patientsMap: Record<string, any>;
  activeLanguage: Language;
  /** Resolves false when the hand-off to billing was not saved. */
  onDispenseSubmit: (visitId: string) => Promise<boolean> | void;
  pharmacistName?: string;
}

export default function DispensaryDashboard({
  queue,
  allVisits,
  patientsMap,
  activeLanguage,
  onDispenseSubmit,
  pharmacistName = "Pharm. Ahmad Razak"
}: DispensaryDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dispensing' | 'buku-racun' | 'dda-safe'>('dispensing');
  const [isColdChainModalOpen, setIsColdChainModalOpen] = useState(false);
  const t = TRANSLATIONS[activeLanguage];
  const { catalog, inventory } = useInventory();
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
      const handed = await onDispenseSubmit(selectedVisitId);
      if (handed === false) {
        setDispenseError('The medicines were dispensed and stock was updated, but the patient could not be handed to billing. Press the button again to retry the hand-off.');
        return;
      }
      setSelectedVisitId(null);
    } catch (e) {
      setDispenseError(errorMessage(e));
    }
  };

  const completeHandover = async () => {
    if (!selectedVisitId) return;
    const handed = await onDispenseSubmit(selectedVisitId);
    if (handed === false) {
      setDispenseError('The patient could not be handed to billing. Check the connection and try again.');
      return;
    }
    setSelectedVisitId(null);
  };

  const waits = queue.map((v) => (v.registeredTime ? Math.max(0, Math.floor((Date.now() - v.registeredTime) / 60000)) : 0));
  const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
  const maxWait = waits.length ? Math.max(...waits) : 0;
  const overSla = waits.filter((m) => m >= 20).length;
  const lowStockCount = inventory.filter((d) => d.currentStock <= d.minThreshold).length;
  const initialsOf = (name: string) => {
    const words = name.split(/\s+/).filter(Boolean);
    return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] ?? '').toUpperCase();
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans">

      <PageHeading eyebrow={pharmacistName} title={t.dispensary || 'Dispensary'} />

      <StationTabs<'dispensing' | 'buku-racun' | 'dda-safe' | 'cold-chain'>
        label="Dispensary sections"
        active={activeSubTab}
        onChange={(id) => (id === 'cold-chain' ? setIsColdChainModalOpen(true) : setActiveSubTab(id))}
        tabs={[
          { id: 'dispensing', label: 'Dispensing console', count: queue.length, alert: true },
          { id: 'buku-racun', label: 'Buku Racun', title: 'KKM Poison Book, Section 24' },
          { id: 'dda-safe', label: 'Dangerous drugs safe', title: 'Dangerous Drugs Act 1952 (Act 234)' },
          { id: 'cold-chain', label: 'Vaccine cold chain', title: 'Check and log dispensary medication and vaccine refrigerator temperatures (2°C to 8°C)' },
        ]}
      />

      <StatStrip
        label="Dispensary figures"
        stats={[
          { label: 'To dispense', value: queue.length, note: 'Signed off by the doctor' },
          { label: 'Wait time (avg / max)', value: `${formatWait(avgWait)} / ${formatWait(maxWait)}`, note: overSla > 0 ? `${overSla} over the 20 min target` : 'Within target' },
          { label: 'Awaiting signature', value: unsignedEntries.length, note: 'Controlled-drug entries for this patient' },
          { label: 'Low stock lines', value: lowStockCount, tone: lowStockCount > 0 ? 'danger' : 'default', note: 'At or below reorder level' },
        ]}
      />

      {activeSubTab === 'buku-racun' ? (
        <BukuRacunRegister
          visits={allVisits || queue}
          patientsMap={patientsMap}
        />
      ) : activeSubTab === 'dda-safe' ? (
        <DangerousDrugsSafeRegister currentStaffName={pharmacistName} />
      ) : (
      <section className="flex flex-wrap bg-surface border border-line">

        {/* DISPENSING DETAIL: the patient in focus */}
        <article className="flex-[999_1_38rem] min-w-0 p-5 sm:p-7 flex flex-col gap-6" aria-label="Dispensing">
          {activePatient && activeVisit ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
                  Dispensing now
                </span>
                <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">
                  RX #{queue.findIndex((v) => v.id === activeVisit.id) + 101}{activeVisit.soap?.assessment?.icdCode ? ` · Diagnosis ${activeVisit.soap.assessment.icdCode}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
                  {initialsOf(activePatient.fullName)}
                </div>
                <div className="min-w-0">
                  <h2 id="dispenser-patient-banner" className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{activePatient.fullName}</h2>
                  <p className="mt-1 text-sm text-muted">{activePatient.gender} · IC {activePatient.icNumber || 'Walk-in'}</p>
                </div>
              </div>

              <div aria-label="Drug allergies">
                {patientAllergies.length > 0 ? (
                  <div role="alert" className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm leading-snug">
                      <strong>Drug allergy:</strong> {patientAllergies.join(', ')}.{hasUnskippedAllergies ? ' A prescribed line conflicts with this allergy and is locked below.' : ''}
                    </p>
                  </div>
                ) : (
                  <p className="inline-flex items-center gap-2 text-sm text-muted">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    No known drug allergies
                  </p>
                )}
              </div>

              {activeVisit.soap?.plan?.pharmacyMemo && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100">
                  <p className="text-xs font-bold">Doctor's instructions</p>
                  <p className="mt-1 text-sm leading-relaxed">{activeVisit.soap.plan.pharmacyMemo}</p>
                </div>
              )}

              {/* Prescribed medicines */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-3">
                  <h3 className="text-xs font-bold text-accent tracking-wide">{t.prescribedMeds}</h3>
                  <span className="text-xs text-muted">{rxLines.length} {rxLines.length === 1 ? 'line' : 'lines'}</span>
                </div>

                <ul id="prescription-itemized-stack" className="border border-line flex flex-col">
                  {rxLines.length === 0 ? (
                    <li className="p-6 text-sm text-muted text-center">No drugs were prescribed in this consultation.</li>
                  ) : (
                    rxLines.map((rx: PrescriptionItem) => {
                      const decided = isDecided(rx);
                      const item = stockFor(rx);
                      const problem = decided ? null : lineProblem(rx);
                      const hasAllergy = checkAllergyConflict(rx.drugName);
                      const isSkipped = skippedDrugs.has(rx.id) || !!rx.skipped;
                      const locked = hasAllergy && !isSkipped;

                      return (
                        <li key={rx.id} className={`flex flex-wrap gap-4 p-4 border-b border-line-subtle last:border-b-0 ${isSkipped ? 'bg-surface-muted opacity-70' : locked ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-surface'}`}>
                          <div className="flex-[1_1_20rem] min-w-0 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-ink">{rx.drugName}</span>
                              <span className="px-2 py-0.5 bg-surface-strong text-accent text-xs font-bold">Qty {rx.quantity}</span>
                              {locked && <span className="chip-danger px-2 py-0.5 text-xs font-bold">Allergy conflict</span>}
                              {isAntibioticDrug(rx.drugName) && <span className="chip-warn px-2 py-0.5 text-xs font-bold">MOH NAG antimicrobial (AWaRe)</span>}
                              {item?.registerRequired && !isSkipped && <span className="chip-brand px-2 py-0.5 text-xs font-bold">Controlled: needs a second signature</span>}
                            </div>

                            <p className="text-sm text-muted leading-relaxed">
                              <strong className="text-ink">EN</strong> {rx.dosage}<br />
                              <strong className="text-ink">BM</strong> {rx.dosageBM}
                            </p>

                            {rx.dispensedAt ? (
                              <span className="chip-ok self-start px-2 py-0.5 text-xs">Dispensed ({rx.dispensedQuantity ?? rx.quantity})</span>
                            ) : rx.skipped ? (
                              <span className="chip-neutral self-start px-2 py-0.5 text-xs">Skipped{rx.skipReason ? `: ${rx.skipReason}` : ''}</span>
                            ) : (
                              <>
                                {!rx.inventoryId && (
                                  <select
                                    aria-label={`Stock item for ${rx.drugName}`}
                                    className="w-full min-h-11 px-2 text-sm border border-line-strong bg-surface text-ink"
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
                                    <p className={`text-xs font-semibold ${plan.shortfall > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                                      {plan.shortfall > 0
                                        ? `Short by ${plan.shortfall}: ${usableStock(item, today)} in date.`
                                        : `From ${plan.allocations.map((a) => `batch ${a.batchNumber} (${a.quantity}, exp ${a.expiryDate ?? 'unknown'})`).join(' + ')}`}
                                    </p>
                                  );
                                })()}
                                {problem && !isSkipped && <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">{problem}</p>}
                                {locked && <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Locked. Skip this line or ask the doctor for an alternative.</p>}
                              </>
                            )}
                          </div>

                          <div className="flex-[0_0_11rem] flex flex-col gap-2 justify-center max-sm:flex-[1_1_100%]">
                            <button type="button" onClick={() => handlePrintLabelClick(rx)} disabled={isSkipped} className="btn-secondary">
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
                              className="btn-secondary"
                            >
                              {isSkipped ? 'Restore line' : locked ? 'Skip this line' : 'Out of stock: skip'}
                            </button>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              {/* Dual-verification checks */}
              <fieldset className="min-w-0">
                <legend className="pb-3 text-xs font-bold text-accent tracking-wide">Dual-verification pharmacy checks</legend>
                <div id="pharmacy-safety-checker" className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-px bg-line border border-line">
                  {([
                    { key: 'patientVerified', title: 'Identify patient ID', note: 'Match IC and profile details' },
                    { key: 'allergyCleared', title: 'Check allergen', note: 'Zero drug conflicts' },
                    { key: 'dosageExplained', title: 'Dosage advice EN/BM', note: 'Explained in the patient language' },
                  ] as const).map((c) => (
                    <label key={c.key} className="flex items-start gap-3 min-h-11 px-4 py-3 bg-surface-muted cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-5 h-5 rounded-none accent-primary"
                        checked={checklist[c.key]}
                        onChange={(e) => setChecklist({ ...checklist, [c.key]: e.target.checked })}
                      />
                      <span>
                        <strong className="block text-sm font-bold text-ink">{c.title}</strong>
                        <span className="block text-xs text-muted mt-0.5">{c.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {dispenseError && (
                <p role="alert" className="chip-danger block px-4 py-3 text-sm font-semibold whitespace-pre-line">{dispenseError}</p>
              )}

              {allDecided && unsignedEntries.length > 0 && (
                <div role="status" className="px-4 py-3 bg-surface-accent border border-line text-sm leading-relaxed text-ink">
                  <strong>Waiting for a second signature.</strong>{' '}
                  {unsignedEntries.length} controlled-drug entr{unsignedEntries.length === 1 ? 'y needs' : 'ies need'} a signature from a different pharmacist or administrator before this patient can leave the pharmacy.
                  They can sign under Inventory &amp; Pharmacy &gt; Controlled register. This screen updates by itself.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-line">
                <span id="dispense-hint" role="status" className={`text-xs max-w-xl leading-relaxed ${!allDecided && dispenseHint ? 'font-bold text-ink' : 'text-muted'}`}>
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
                    className="btn-primary min-h-12 px-6 text-sm"
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
                    className={`${hasUnskippedAllergies ? 'btn-danger' : 'btn-primary'} min-h-12 px-6 text-sm`}
                  >
                    {hasUnskippedAllergies ? <ShieldAlert className="w-4 h-4" aria-hidden="true" /> : <CheckCircle className="w-4 h-4" aria-hidden="true" />}
                    {hasUnskippedAllergies ? 'Resolve conflicts' : blocked.length > 0 ? 'Resolve stock issues' : 'Dispense & route to billing'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[24rem] flex flex-col items-center justify-center text-center">
              <Pill className="w-10 h-10 text-accent opacity-40 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">No active prescription selected</p>
              <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
                Prescriptions signed off in the consultation rooms appear in the queue. Select one to review dosage, allocate batches, verify allergies and print labels.
              </p>
            </div>
          )}
        </article>

        {/* DISPENSATION QUEUE */}
        <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="dispensary-queue-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 id="dispensary-queue-title" className="text-base font-bold text-ink">{t.dispensaryQueue || 'Dispensation queue'}</h2>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">{queue.length} waiting</span>
          </div>
          {queue.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Dispensation queue empty. Prescriptions signed off in the consultation rooms flow in here automatically.</p>
          ) : (
            <ol className="flex flex-col">
              {queue.map((visit, index) => {
                const pt = patientsMap[visit.patientId];
                if (!pt) return null;
                const isSelected = selectedVisitId === visit.id || (!selectedVisitId && index === 0);
                const medCount = visit.soap?.plan?.prescription?.length || 0;
                const hasAllergyAlert = recordedAllergies(pt.drugAllergies).length > 0;
                const mins = visit.registeredTime ? Math.max(0, Math.floor((Date.now() - visit.registeredTime) / 60000)) : null;
                const long = mins !== null && mins >= 20;
                return (
                  <li key={visit.id} className="border-b border-line-subtle">
                    <button
                      type="button"
                      onClick={() => handleSelectVisit(visit.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors hover:bg-surface-accent ${focusRing} ${
                        isSelected ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : long ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <span className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pt.fullName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{pt.fullName}</span>
                        <span className={`block text-xs truncate ${hasAllergyAlert ? 'text-rose-700 dark:text-rose-300 font-semibold' : 'text-muted'}`}>
                          {medCount} {medCount === 1 ? 'item' : 'items'} · {hasAllergyAlert ? 'Allergy alert' : 'Awaiting dispense'}
                        </span>
                      </span>
                      <span className={`shrink-0 px-2.5 py-1 text-xs font-bold tabular-nums ${long ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-surface-strong text-accent'}`}>
                        {mins !== null ? formatWait(mins) : 'Just in'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </section>
      )}

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
                    <p className="text-xs font-bold">Mediclinic Enterprise</p>
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

      <ColdChainVaccineModal
        isOpen={isColdChainModalOpen}
        onClose={() => setIsColdChainModalOpen(false)}
      />
    </div>
  );
}
