import React, { useState, useEffect } from 'react';
import { Visit, Language, TPAConfig } from '../types';
import { TRANSLATIONS, TPA_LIST } from '../data';
import { useSettings } from '../context/SettingsContext';
import { 
  CreditCard, ShieldCheck, DollarSign, Wallet, FileSpreadsheet, ArrowRight,
  ClipboardCheck, CheckCircle2, QrCode, Sparkles
} from 'lucide-react';

interface BillingDeskProps {
  queue: Visit[];
  patientsMap: Record<string, any>;
  activeLanguage: Language;
  onPaymentComplete: (visitId: string, paymentDetails: {
    paymentMethod: 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel';
    paidAmount: number;
    panelClaimed: number;
    glNumber?: string;
  }) => void;
}

export default function BillingDesk({
  queue,
  patientsMap,
  activeLanguage,
  onPaymentComplete
}: BillingDeskProps) {
  const { settings } = useSettings();
  const t = TRANSLATIONS[activeLanguage];

  // Selected visit state
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(
    queue.length > 0 ? queue[0].id : null
  );

  // Panel settings state
  const [isPanelClaim, setIsPanelClaim] = useState(false);
  const [selectedTPA, setSelectedTPA] = useState<TPAConfig>(TPA_LIST[1]); // MiCare TPA default
  const [glReferenceNo, setGlReferenceNo] = useState('');
  const [isGlApproved, setIsGlApproved] = useState(false);

  // Checkout overlay triggers
  const [activePaymentMethod, setActivePaymentMethod] = useState<'Cash' | 'Credit Card' | 'e-Wallet' | null>(null);
  const [isTngOverlayOpen, setIsTngOverlayOpen] = useState(false);

  // Active visit calculation parameters
  const activeVisit = queue.find(v => v.id === selectedVisitId) || queue[0];
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;

  // Constants
  const CONSULTATION_FEE = settings.billing.consultationFee; // MYR
  const PROCEDURE_FEE = activeVisit?.soap?.plan?.requiresReferral ? settings.billing.procedureFee + 25 : settings.billing.procedureFee; // MYR
  const TAX_RATE = settings.billing.taxRate / 100;

  // Subtotals and dynamic totals
  const [billingBreakdown, setBillingBreakdown] = useState({
    medicationCost: 0,
    subtotal: 0,
    sstTax: 0,
    grandTotal: 0,
    panelPaid: 0,
    patientCopay: 0
  });

  const handleSelectVisit = (visitId: string) => {
    setSelectedVisitId(visitId);
    // Reset parameters
    setIsPanelClaim(false);
    setGlReferenceNo('');
    setIsGlApproved(false);
    setActivePaymentMethod(null);
  };

  // Recalculate bill balance upon select/change parameters
  useEffect(() => {
    if (!activeVisit) return;

    // Sum drug prescription metrics
    let medsCost = 0;
    if (activeVisit.soap?.plan?.prescription) {
      activeVisit.soap.plan.prescription.forEach(rx => {
        medsCost += (rx.pricePerUnit * rx.quantity);
      });
    }

    const sub = CONSULTATION_FEE + PROCEDURE_FEE + medsCost;
    const tax = sub * TAX_RATE; // SST
    const grand = sub + tax;

    let panelSponsorAmount = 0;
    let finalPatientShare = grand;

    if (isPanelClaim) {
      if (selectedTPA.name !== 'Self-Pay') {
        // Evaluate limit capping
        const cappedLimit = selectedTPA.coverageLimit;
        panelSponsorAmount = Math.min(grand, cappedLimit);

        // Evaluate Co-pay percentages if any
        if (selectedTPA.coPayRequired && selectedTPA.coPayPercentage) {
          const copayAmount = panelSponsorAmount * (selectedTPA.coPayPercentage / 100);
          panelSponsorAmount = panelSponsorAmount - copayAmount;
        }

        finalPatientShare = grand - panelSponsorAmount;
      }
    }

    setBillingBreakdown({
      medicationCost: medsCost,
      subtotal: sub,
      sstTax: tax,
      grandTotal: grand,
      panelPaid: panelSponsorAmount,
      patientCopay: finalPatientShare
    });

  }, [activeVisit, isPanelClaim, selectedTPA]);

  const triggerInstantGLApprove = () => {
    if (!glReferenceNo.trim()) {
      alert(activeLanguage === 'EN' ? 'Please enter a GL Reference Number first.' : 'Sila masukkan Nombor Rujukan GL terlebih dahulu.');
      return;
    }
    setIsGlApproved(true);
  };

  const executeSettleTransaction = (method: 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel') => {
    if (!selectedVisitId || !activeVisit) return;

    if (isPanelClaim && !isGlApproved) {
      alert(activeLanguage === 'EN' ? 'Third Party Guarantee Letter (GL) has not been verified. Please process approval.' : 'Surat Jaminan (GL) untuk tuntutan Panel belum disahkan. Sila teruskan kelulusan.');
      return;
    }

    const claimAmount = isPanelClaim ? billingBreakdown.panelPaid : 0;
    const paidSum = isPanelClaim ? billingBreakdown.patientCopay : billingBreakdown.grandTotal;

    onPaymentComplete(selectedVisitId, {
      paymentMethod: isPanelClaim && billingBreakdown.patientCopay === 0 ? 'Panel' : method,
      paidAmount: paidSum,
      panelClaimed: claimAmount,
      glNumber: isPanelClaim ? glReferenceNo : undefined
    });

    // Reset panel triggers
    setIsPanelClaim(false);
    setGlReferenceNo('');
    setIsGlApproved(false);
    setActivePaymentMethod(null);
    setSelectedVisitId(queue.length > 1 ? queue[1].id : null);
  };

  const handleTngSimulationStart = () => {
    setIsTngOverlayOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[480px]">
      
      {/* 1. BILLING QUEUES PATIENTS (Left Column - 35%) */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
        
        <div className="flex items-center gap-1.5 text-[#07B2B2] font-semibold text-xs border-b border-slate-200 pb-2 mb-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>{t.totalBilling}</span>
          <span className="bg-emerald-100 text-[#07B2B2] px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
            {queue.length} Pending
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-bounce-slow" />
            <p className="text-xs font-semibold text-slate-600">All Accounts Balanced</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Dispensed pharmacy tickets will queue here instantly for receipt generation.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((visit) => {
              const pt = patientsMap[visit.patientId];
              const isSelected = selectedVisitId === visit.id;
              if (!pt) return null;

              // Compute basic bill for preview
              let medCost = 0;
              visit.soap?.plan?.prescription?.forEach(rx => {
                medCost += rx.pricePerUnit * rx.quantity;
              });
              const previewGrand = (CONSULTATION_FEE + PROCEDURE_FEE + medCost) * (1 + TAX_RATE);

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
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">ID: {visit.id}</span>
                    <span className="text-slate-500 font-bold">RM{previewGrand.toFixed(2)}</span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 uppercase mt-1">
                    {pt.fullName}
                  </h5>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Panel: {pt.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : pt.panelEmployer}</span>
                    <span className="text-[#07B2B2] font-semibold">Invoice ready</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 2. LEDGER DETAILS & SPLITS (Right Column - 65%) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        
        {activePatient && activeVisit ? (
          <div className="space-y-4">
            
            {/* Header brief */}
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-bold text-[#07B2B2] uppercase tracking-wider block font-sans">
                  Klinik Malaysia Cashier Desk (Outpatient)
                </span>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-sans">
                  {activePatient.fullName}
                </h4>
                <p className="text-[10px] font-mono text-slate-400">IC Registration: {activePatient.icNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-mono text-xs">VISIT TICKET ID: {activeVisit.id}</span>
                <span className="text-[10px] text-slate-400 block">System PDPA Audited</span>
              </div>
            </div>

            {/* Bill Summary Table breakdown */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse" id="active-invoice-breakdown-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-3 py-1.5 font-bold">Billing Item Description</th>
                    <th className="px-3 py-1.5 text-right font-bold w-32">Total Price (MYR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 text-slate-700">
                    <td className="px-3 py-2">Consultation Fee (Primary APC Care)</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">RM{CONSULTATION_FEE.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-100 text-slate-700">
                    <td className="px-3 py-2">Clinical Procedures / Nursing Vitals Audit Fee</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">RM{PROCEDURE_FEE.toFixed(2)}</td>
                  </tr>
                  
                  {activeVisit.soap?.plan?.prescription?.length > 0 && (
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-2">
                        <span>Dispensed Medications & Pharmacy Compounding Charge</span>
                        <div className="text-[9px] text-slate-400 pl-2.5 mt-0.5">
                          {activeVisit.soap.plan.prescription.map((rx, i) => (
                            <div key={i}>• {rx.drugName} (Qty: {rx.quantity} @ RM{rx.pricePerUnit.toFixed(2)})</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium">
                        RM{billingBreakdown.medicationCost.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 font-mono text-[11px]">
                    <td className="px-3 py-1.5 text-right font-semibold">Subtotal:</td>
                    <td className="px-3 py-1.5 text-right font-bold">RM{billingBreakdown.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[10px]">
                    <td className="px-3 py-1.5 text-right font-semibold">Malaysian SST Service Tax ({settings.billing.taxRate}%):</td>
                    <td className="px-3 py-1.5 text-right font-semibold">RM{billingBreakdown.sstTax.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-cyan-50/50 font-bold text-slate-800 font-mono text-xs">
                    <td className="px-3 py-2 text-right text-[#07B2B2] font-bold">Invoice Grand Total:</td>
                    <td className="px-3 py-2 text-right text-[#07B2B2] font-bold">RM{billingBreakdown.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Panel claims integration toggle with dynamic divisions */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#07B2B2]" />
                  TPA Panel Claims Sponsorship Coverage
                </span>

                <button
                  type="button"
                  id="panel-claims-toggle"
                  onClick={() => {
                    setIsPanelClaim(!isPanelClaim);
                    // Autofill demo TPA according to user profile
                    const matchTPA = TPA_LIST.find(t => t.name.toLowerCase().includes(activePatient.panelEmployer.split(' ')[0].toLowerCase())) || TPA_LIST[1];
                    setSelectedTPA(matchTPA);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isPanelClaim
                      ? 'bg-[#07B2B2] text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isPanelClaim ? 'Panel claims active' : 'Switch to Panel claim'}
                </button>
              </div>

              {isPanelClaim && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/60 text-xs">
                  
                  {/* Select active Malaysian TPA partner */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                      Select TPAs Provider Partner
                    </label>
                    <select
                      id="tpa-select"
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-none font-medium text-slate-800"
                      value={selectedTPA.name}
                      onChange={(e) => {
                        const match = TPA_LIST.find(t => t.name === e.target.value) || TPA_LIST[0];
                        setSelectedTPA(match);
                      }}
                    >
                      {TPA_LIST.map((tpa) => (
                        <option key={tpa.name} value={tpa.name}>
                          {tpa.name} (Max coverage limit: RM{tpa.coverageLimit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* GL verify fields */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                      Guarantee Letter (GL) Ref Number
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        id="gl-ref-input"
                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 font-mono uppercase"
                        value={glReferenceNo}
                        onChange={(e) => {
                          setGlReferenceNo(e.target.value);
                          setIsGlApproved(false);
                        }}
                        placeholder="e.g. MIC-GL-10292"
                      />
                      <button
                        type="button"
                        id="verify-gl-btn"
                        onClick={triggerInstantGLApprove}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1 rounded text-xs transition-colors cursor-pointer"
                      >
                        Approve TPA GL
                      </button>
                    </div>

                    {isGlApproved && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                        ✓ GL Reference Authorized and approved.
                      </span>
                    )}
                  </div>

                </div>
              )}

              {/* Live breakdown of payment coverage split */}
              {isPanelClaim && (
                <div id="panel-split-breakdown" className="bg-cyan-50/50 p-3 rounded border border-[#07B2B2]/10 text-xs flex flex-row items-center justify-between text-[#07B2B2] font-medium leading-relaxed">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">TPA SPONSOR COVERAGE:</span>
                    <strong>RM{billingBreakdown.panelPaid.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">PATIENT COPAY (Settle now):</span>
                    <strong>RM{billingBreakdown.patientCopay.toFixed(2)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-mono">Co-Pay Status:</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                      {selectedTPA.coPayRequired ? `Co-pay ${selectedTPA.coPayPercentage}% applied` : '100% Sponsor Covered'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout buttons with responsive simulators */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Authorize payment methods:
              </label>

              <div id="payment-method-selector" className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  id="checkout-cash-btn"
                  onClick={() => executeSettleTransaction('Cash')}
                  className="bg-[#07B2B2]/90 hover:bg-[#07B2B2] hover:text-white border border-slate-200 text-white font-semibold rounded-lg p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs"
                >
                  <DollarSign className="w-5 h-5 text-white" />
                  <span>Settle Cash</span>
                </button>

                <button
                  type="button"
                  id="checkout-card-btn"
                  onClick={() => executeSettleTransaction('Credit Card')}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs"
                >
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span>Debit / Visa</span>
                </button>

                <button
                  type="button"
                  id="checkout-tng-btn"
                  onClick={handleTngSimulationStart}
                  className="bg-sky-50 border border-sky-300 hover:bg-sky-100 text-sky-800 font-semibold rounded-lg p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs"
                >
                  <Wallet className="w-5 h-5 text-sky-500" />
                  <span>Touch &apos;n Go</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
            <ClipboardCheck className="w-12 h-12 text-slate-200 mb-2 animate-pulse" />
            <p className="text-sm font-semibold">Select Patient in Billing Ledger</p>
            <p className="text-xs text-slate-400 mt-1">Dispensed medication invoices will load here to finalize cashier receipts.</p>
          </div>
        )}

        {/* MOH Regulatory Compliance Footer */}
        <div className="border-t border-slate-100 pt-3.5 mt-5 text-[9px] text-slate-400 leading-relaxed text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p id="compliance-note-footer">{t.complianceText}</p>
        </div>

      </div>

      {/* TOUCH N GO E-WALLET INTERACTIVE POPUP SCANNER */}
      {isTngOverlayOpen && activePatient && (
        <div id="tng-wallet-modal-overlay" className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scaleUp">
            
            {/* Header branding */}
            <div className="bg-[#0052a5] text-white p-4 text-center">
              <h4 className="font-extrabold text-sm tracking-tight uppercase flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Touch &apos;n Go PayNow Gateway
              </h4>
              <span className="text-[10px] text-blue-100 font-mono">PWA Integrated cashless API</span>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              <span className="text-xs text-slate-500 block">
                Scan transaction bar using your TnG mobile application:
              </span>

              {/* Simulated QR block */}
              <div className="w-36 h-36 bg-slate-50 border-2 border-slate-200 rounded mx-auto p-2 flex items-center justify-center animate-pulse">
                <QrCode className="w-full h-full text-zinc-800" strokeWidth={1} />
              </div>

              {/* Total amount formatted */}
              <div className="py-2.5 border-y border-slate-100 text-center font-mono">
                <span className="text-[10px] uppercase text-slate-400 block">Paying amount (Settle due):</span>
                <strong className="text-lg text-[#07B2B2]">
                  RM{billingBreakdown.patientCopay.toFixed(2)}
                </strong>
                <span className="text-[9px] text-[#0052a5] block mt-0.5">Reference: TNG-CLINIC-{activeVisit.id}</span>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed">
                Your payment will instantly balance the ledger upon verification authorization confirmation.
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsTngOverlayOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-100 cursor-pointer"
              >
                Go Back
              </button>
              
              <button
                type="button"
                id="tng-confirm-payment-btn"
                onClick={() => {
                  setIsTngOverlayOpen(false);
                  executeSettleTransaction('e-Wallet');
                }}
                className="bg-[#0052a5] text-white font-bold text-xs px-4 py-1.5 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Verify Scan Successful
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
