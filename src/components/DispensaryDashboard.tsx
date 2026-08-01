import React, { useState } from 'react';
import { Visit, PrescriptionItem, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { 
  Users, User, CheckCircle, AlertCircle, FileText, Printer, CheckSquare, 
  Info, QrCode, ShieldCheck, HelpCircle, PackageOpen, ShieldAlert, Pill
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

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
  const { dispenseDrug } = useInventory();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  const checkAllergyConflict = (drugName: string) => {
    if (!activePatient || !activePatient.allergies) return false;
    return activePatient.allergies.some((allergy: string) => {
      if (!allergy.trim() || allergy.toLowerCase() === 'none') return false;
      return drugName.toLowerCase().includes(allergy.toLowerCase());
    });
  };

  const hasUnskippedAllergies = activeVisit?.soap?.plan?.prescription?.some(rx => 
    !skippedDrugs.has(rx.id) && checkAllergyConflict(rx.drugName)
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
  };

  const handlePrintLabelClick = (rx: PrescriptionItem) => {
    setSelectedLabelRx(rx);
    setIsLabelModalOpen(true);
  };

  const triggerDispensingSignoff = () => {
    if (!selectedVisitId) return;
    if (!checklist.patientVerified || !checklist.allergyCleared || !checklist.dosageExplained) {
      alert(activeLanguage === 'EN' ? 'Safety Checklist incomplete. Please manually verify all safety safeguards first.' : 'Senarai Semak Keselamatan belum lengkap. Sila sahkan semua langkah keselamatan terlebih dahulu.');
      return;
    }

    if (hasUnskippedAllergies) {
      alert(activeLanguage === 'EN' ? 'CRITICAL: Allergy conflict detected in active prescriptions. You must skip the conflicting drug or resolve the allergy before dispensing.' : 'KRITIKAL: Konflik alahan dikesan. Anda mesti melangkau ubat tersebut atau menyelesaikan alahan sebelum mendispens.');
      return;
    }

    // Deduct stock for all prescribed drugs in this visit
    if (activeVisit?.soap?.plan?.prescription) {
      activeVisit.soap.plan.prescription.forEach(rx => {
        if (!skippedDrugs.has(rx.id)) {
          const qty = rx.quantity || 1;
          dispenseDrug(rx.drugName, qty);
        }
      });
    }

    onDispenseSubmit(selectedVisitId);
    setSelectedVisitId(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Clean Enterprise Greetings Banner */}
      <div className="enterprise-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#0D9488]">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-[#0D9488]" />
            <span>{getGreeting()}, {pharmacistName}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pending prescriptions are awaiting dispensation. Verify patient details, labels, and dosage safety.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* 1. DISPENSARY QUEUE LIST PANEL (Left Column - 35%) */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
        
        <div className="flex items-center gap-1.5 text-[#07B2B2] font-semibold text-xs border-b border-slate-200 pb-2 mb-1.5">
          <Users className="w-4 h-4 text-emerald-600" />
          <span id="dispensary-queue-title">{t.dispensaryQueue}</span>
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
            {queue.length} Patients
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200/60 p-8 text-center text-slate-400">
            <PackageOpen className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse opacity-80" />
            <p className="text-sm font-semibold text-slate-600">Dispensation Queue Empty</p>
            <p className="text-xs text-slate-400 mt-0.5">Approved medications from SOAP rooms flow here automatically.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((visit, index) => {
              const pt = patientsMap[visit.patientId];
              const isSelected = selectedVisitId === visit.id || (!selectedVisitId && index === 0);
              if (!pt) return null;

              return (
                <div
                  key={visit.id}
                  onClick={() => handleSelectVisit(visit.id)}
                  className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer hover:border-cyan-500 bg-white ${
                    isSelected 
                      ? 'border-[#07B2B2] ring-1 ring-[#07B2B2]/60 shadow-xs' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded font-bold">
                      RX-QUEUE #{index + 101}
                    </span>
                    <span className="text-slate-400 font-mono">{visit.date}</span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-800 uppercase mt-1.5 truncate">
                    {pt.fullName}
                  </h5>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-mono">
                      Rx Meds: <strong className="text-slate-700">{visit.soap?.plan?.prescription?.length || 0} ITEMS</strong>
                    </span>
                    <span className="text-emerald-700 font-medium">Awaiting Dispense</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 2. DISPENSING DETAIL DETAILS (Right Column - 65%) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between min-h-[440px]">
        {activePatient && activeVisit ? (
          <div className="space-y-4">
            
            {/* Header info bar */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 id="dispenser-patient-banner" className="text-slate-800 font-bold text-sm uppercase tracking-tight">
                  {activePatient.fullName}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  MyKad IC: <strong className="font-mono text-slate-500">{activePatient.icNumber}</strong> | Gender: {activePatient.gender}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-[#07B2B2]/10 text-[#07B2B2] px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                  Pharmacopoeia Audit
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">Doctor Case: {activeVisit.soap?.assessment?.icdCode}</span>
              </div>
            </div>

            {/* PHARMACY MEMO DISPLAY */}
            {activeVisit.soap?.plan?.pharmacyMemo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h5 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4" /> Doctor's Instructions
                </h5>
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  "{activeVisit.soap.plan.pharmacyMemo}"
                </p>
              </div>
            )}

            {/* Grid display for active prescriptions */}
            <div>
              <h5 className="text-xs font-bold uppercase text-[#07B2B2] mb-2 font-sans flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {t.prescribedMeds}
              </h5>

              <div id="prescription-itemized-stack" className="space-y-3">
                {activeVisit.soap?.plan?.prescription?.length === 0 ? (
                  <div className="p-4 bg-slate-50 text-slate-500 text-xs italic text-center rounded border">
                    No drugs compiled associated with this consultation visit.
                  </div>
                ) : (
                  activeVisit.soap.plan.prescription.map((rx: PrescriptionItem) => {
                    // Check if expiry contains warnings (simulated using months to determine danger)
                    // If months remaining is near (derived mock check: random calculation based on date)
                    const isExpiryAmber = rx.drugName.includes('Ibuprofen') || rx.drugName.includes('Amlodipine');
                    const hasAllergy = checkAllergyConflict(rx.drugName);
                    const isSkipped = skippedDrugs.has(rx.id);
                    
                    return (
                      <div 
                        key={rx.id} 
                        className={`p-3 rounded-lg border flex flex-col md:flex-row items-stretch justify-between gap-3 text-xs transition-all ${
                          isSkipped 
                            ? 'bg-slate-100 border-slate-200 opacity-60 grayscale'
                            : hasAllergy 
                              ? 'bg-red-50 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-300'
                              : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        
                        {/* Drug Name with dual BM/EN dosage translations */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h6 className="font-bold text-sm text-slate-800 tracking-tight">{rx.drugName}</h6>
                            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Qty: {rx.quantity}
                            </span>
                          </div>

                          <div className="text-xs leading-relaxed border-l-2 border-slate-200 pl-2">
                            <p className="text-slate-600 font-mono">
                              <strong>EN:</strong> {rx.dosage}
                            </p>
                            <p className="text-emerald-800 italic font-mono mt-0.5">
                              <strong>BM:</strong> {rx.dosageBM}
                            </p>
                          </div>
                          
                          <div className="pt-1">
                            {isExpiryAmber ? (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                                Low Stock Expiry Warning (&lt; 3 months)
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border border-emerald-100">
                                Batch Safe (Exp: {rx.expiryDate})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Prints Sticker and controls */}
                        <div className="flex flex-col justify-center items-end shrink-0 pl-3 border-l border-slate-100 space-y-2 w-32">
                          <button
                            type="button"
                            onClick={() => handlePrintLabelClick(rx)}
                            disabled={isSkipped}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-[#07B2B2] disabled:opacity-50 text-xs px-3 py-1.5 rounded font-semibold flex items-center justify-center gap-1.5 transition-colors w-full shadow-sm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {t.printLabel}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newSet = new Set(skippedDrugs);
                              if (isSkipped) newSet.delete(rx.id);
                              else newSet.add(rx.id);
                              setSkippedDrugs(newSet);
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-bold w-full transition-colors border shadow-sm ${
                              isSkipped 
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isSkipped ? 'RESTORE (OOS)' : 'SKIP (OOS)'}
                          </button>
                        </div>
                        
                        {/* ALLERGY HARD STOP OVERLAY */}
                        {hasAllergy && !isSkipped && (
                          <div className="absolute inset-0 bg-red-50/95 rounded-lg flex flex-col items-center justify-center text-center p-4 backdrop-blur-[2px] z-10 animate-fadeIn border-2 border-red-200">
                            <ShieldAlert className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
                            <h4 className="text-red-700 font-bold uppercase tracking-widest text-sm mb-1">Critical Allergy Conflict</h4>
                            <p className="text-red-600 text-xs max-w-[80%] leading-relaxed mb-3">
                              Patient has a registered allergy to components in <strong className="text-red-800">{rx.drugName}</strong>. Dispensing is locked.
                            </p>
                            <button
                              onClick={() => {
                                const newSet = new Set(skippedDrugs);
                                newSet.add(rx.id);
                                setSkippedDrugs(newSet);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white shadow shadow-red-500/20 px-4 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer"
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
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-cyan-600/10 space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Dual-Verification Clinical Pharmacy Checks
              </span>

              <div id="pharmacy-safety-checker" className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-slate-700">
                <label className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    checked={checklist.patientVerified}
                    onChange={(e) => setChecklist({ ...checklist, patientVerified: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-[11px] font-bold text-slate-800">Identify Patient ID</strong>
                    <span className="text-[9px] text-slate-400">Match IC and Profile details</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    checked={checklist.allergyCleared}
                    onChange={(e) => setChecklist({ ...checklist, allergyCleared: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-[11px] font-bold text-slate-800">Check Allergen</strong>
                    <span className="text-[9px] text-slate-400">Ensure absolutely zero drug conflicts</span>
                  </div>
                </label>

                <label className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-1"
                    checked={checklist.dosageExplained}
                    onChange={(e) => setChecklist({ ...checklist, dosageExplained: e.target.checked })}
                  />
                  <div>
                    <strong className="block text-[11px] font-bold text-slate-800">Dosage Advice EN/BM</strong>
                    <span className="text-[9px] text-slate-400">Instructions explained in patient language</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 italic">
                * Confirming will log medication deductions in clinic stock count.
              </span>
              <button
                type="button"
                id="pharmacy-dispense-confirm-btn"
                onClick={triggerDispensingSignoff}
                disabled={!checklist.patientVerified || !checklist.allergyCleared || !checklist.dosageExplained || hasUnskippedAllergies}
                className={`text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  hasUnskippedAllergies ? 'bg-red-600 hover:bg-red-700' : 'bg-[#07B2B2] hover:bg-[#058A8A]'
                }`}
              >
                {hasUnskippedAllergies ? <ShieldAlert className="w-4 h-4 text-white" /> : <CheckCircle className="w-4 h-4 text-white" />}
                {hasUnskippedAllergies ? 'Resolve Conflicts' : 'Dispense & Route to Billing'}
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <Users className="w-12 h-12 text-slate-200 mb-2 animate-pulse" />
            <p className="text-sm font-semibold">Select Patient in Pharmacy Queue</p>
            <p className="text-xs text-slate-400 mt-1">Currently awaiting formulation approvals from clinical consultations rooms.</p>
          </div>
        )}
      </div>

      {/* DRUG LABEL PRINTING PREVIEW MODAL */}
      {isLabelModalOpen && selectedLabelRx && activePatient && (
        <div id="drug-label-print-modal" className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase font-mono">Malaysian Sticker Pharmacist Label (4 x 2)</span>
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="text-white hover:text-slate-300 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Label design frame */}
            <div className="p-6">
              
              <div className="border-[3px] border-black p-4 bg-white text-black font-mono text-[11px] leading-relaxed relative rounded">
                
                {/* Clinic details header */}
                <div className="border-b-2 border-black pb-1.5 text-center flex items-center justify-between">
                  <div className="text-left font-bold">
                    <p className="text-xs">KLINIK MALAYSIA ENTERPRISE</p>
                    <p className="text-[8px] text-slate-600">No. 20 Jln Ampang, KL • Tel: 03-21664000</p>
                  </div>
                  <div className="text-right text-[8px]">
                    <p>Date: {new Date().toLocaleDateString('ms-MY')}</p>
                    <p>Sticker No: {selectedLabelRx.id}</p>
                  </div>
                </div>

                {/* Patient identifiers */}
                <div className="py-2 border-b border-dashed border-black">
                  <div className="grid grid-cols-2 gap-1.5 font-bold">
                    <p>Patient: <span className="underline uppercase">{activePatient.fullName}</span></p>
                    <p className="text-right">IC: {activePatient.icNumber}</p>
                  </div>
                </div>

                {/* Drug usage directions */}
                <div className="py-3">
                  <p className="font-bold text-xs text-indigo-950 uppercase border border-black px-1.5 py-0.5 rounded w-fit mb-2 bg-[#07B2B2]/10">
                    {selectedLabelRx.drugName} (Qty: {selectedLabelRx.quantity} CAPS)
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex gap-1.5 items-start">
                      <span className="font-bold shrink-0 text-red-700 bg-red-100 rounded px-1 text-[8px] uppercase">Directions</span>
                      <p className="font-bold text-xs leading-none text-red-800">{selectedLabelRx.frequency}</p>
                    </div>
                    
                    <p className="font-bold text-black border-l-2 border-black pl-1.5 my-1 text-[11px]">
                      Take: {selectedLabelRx.dosage}
                    </p>
                    <p className="text-slate-600 italic border-l-2 border-slate-300 pl-1.5 text-[10px]">
                      Sila ambil: {selectedLabelRx.dosageBM}
                    </p>
                  </div>
                </div>

                {/* Footer labels with QR code placeholder */}
                <div className="border-t-2 border-black pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-bold text-red-600">KEEP OUT OF REACH OF CHILDREN / JAUHKAN DARIPADA KANAK-KANAK</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Dispensed under KKM Malaysia license regulations.</p>
                  </div>
                  <div className="w-12 h-12 border border-slate-300 flex items-center justify-center p-0.5 shrink-0 ml-1.5">
                    <QrCode className="w-full h-full text-black stroke-1" />
                  </div>
                </div>

              </div>

              <p className="text-[10px] text-slate-400 mt-3 text-center">
                Printer emulation outputs to ZEBRA TT-402 labels systems.
              </p>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Label Window
              </button>
              
              <button
                type="button"
                onClick={() => {
                  alert("Label formatted successfully. Sent to thermal label printer queue.");
                  setIsLabelModalOpen(false);
                  setSelectedLabelRx(null);
                }}
                className="bg-black text-white px-5 py-1.5 rounded text-xs font-semibold hover:bg-slate-850 transition-colors flex items-center gap-1.5 cursor-pointer"
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
