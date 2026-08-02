import React, { useState, useEffect } from 'react';
import { Visit, Language, TPAConfig } from '../types';
import { TRANSLATIONS } from '../data';
import { useSettings } from '../context/SettingsContext';
import { useAuxiliary } from '../context/AuxiliaryContext';
import { QRCodeSVG } from 'qrcode.react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import StripeCheckout from './StripeCheckout';
import { 
  CreditCard, ShieldCheck, DollarSign, Wallet, FileSpreadsheet,
  ClipboardCheck, CheckCircle2, QrCode, FileCheck, FileText, Plus, Percent, Trash2
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
  const { tpaList } = useAuxiliary();
  const t = TRANSLATIONS[activeLanguage];

  // Selected visit state
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(
    queue.length > 0 ? queue[0].id : null
  );

  // Panel settings state
  const [isPanelClaim, setIsPanelClaim] = useState(false);
  const [selectedTPA, setSelectedTPA] = useState<TPAConfig | null>(null);
  const [glReferenceNo, setGlReferenceNo] = useState('');
  const [isGlApproved, setIsGlApproved] = useState(false);

  // Checkout overlay triggers
  const [activePaymentMethod, setActivePaymentMethod] = useState<'Cash' | 'Credit Card' | 'e-Wallet' | null>(null);
  const [isTngOverlayOpen, setIsTngOverlayOpen] = useState(false);
  const [isStripeOverlayOpen, setIsStripeOverlayOpen] = useState(false);
  const [receiptWindowData, setReceiptWindowData] = useState<{
    method: 'Cash' | 'Credit Card' | 'e-Wallet' | 'Panel';
  } | null>(null);

  // Dynamic adjustments
  const [customLineItems, setCustomLineItems] = useState<{ description: string; amount: number }[]>([]);
  const [customDesc, setCustomDesc] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  
  const [discount, setDiscount] = useState<{ type: 'fixed' | 'percentage', value: number }>({ type: 'fixed', value: 0 });
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');

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
    customItemsTotal: 0,
    discountAmount: 0,
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
    const defaultTpa = tpaList.length > 0 ? tpaList[1] || tpaList[0] : null;
    setSelectedTPA(defaultTpa);
    setGlReferenceNo('');
    setIsGlApproved(false);
    setActivePaymentMethod(null);
    setCustomLineItems([]);
    setDiscount({ type: 'fixed', value: 0 });
    setCustomDesc('');
    setCustomAmount('');
    setDiscountInput('');
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

    const totalCustomItems = customLineItems.reduce((acc, item) => acc + item.amount, 0);
    const preDiscountSub = CONSULTATION_FEE + PROCEDURE_FEE + medsCost + totalCustomItems;
    
    let discountAmountValue = 0;
    if (discount.type === 'fixed') {
      discountAmountValue = discount.value;
    } else {
      discountAmountValue = preDiscountSub * (discount.value / 100);
    }
    
    const sub = Math.max(0, preDiscountSub - discountAmountValue);
    const tax = sub * TAX_RATE; // SST
    const grand = sub + tax;

    let panelPaid = 0;
    let patientCopay = grand;

    if (isPanelClaim && selectedTPA) {
        if (grand <= selectedTPA.coverageLimit) {
          panelPaid = grand;
          patientCopay = 0;
        } else {
          panelPaid = selectedTPA.coverageLimit;
          patientCopay = grand - selectedTPA.coverageLimit;
        }

        if (selectedTPA.coPayRequired && selectedTPA.coPayPercentage) {
          const copayAmount = (grand * selectedTPA.coPayPercentage) / 100;
          patientCopay += copayAmount;
          panelPaid -= copayAmount;
        }
    }

    setBillingBreakdown({
      medicationCost: medsCost,
      customItemsTotal: totalCustomItems,
      discountAmount: discountAmountValue,
      subtotal: sub,
      sstTax: tax,
      grandTotal: grand,
      panelPaid: panelPaid,
      patientCopay: patientCopay
    });

  }, [activeVisit, isPanelClaim, selectedTPA, customLineItems, discount]);

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

    // Generate Invoice PDF
    try {
      // Recreate the activeVisit with the proper grandTotal, as state is dynamic
      const visitForPdf = { ...activeVisit, totalBill: billingBreakdown.grandTotal, paymentMethod: method };
      generateInvoicePDF(activePatient, visitForPdf as Visit, isPanelClaim);
    } catch (err) {
      console.error("PDF Generation failed", err);
    }

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

  const handleStripeCheckoutStart = () => {
    setIsStripeOverlayOpen(true);
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
                  
                  {customLineItems.length > 0 && (
                    <tr className="border-b border-slate-100 text-slate-700">
                      <td className="px-3 py-2">
                        <span>Ad-Hoc Charges & Services</span>
                        <div className="text-[9px] text-slate-400 pl-2.5 mt-0.5 space-y-1">
                          {customLineItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span>• {item.description} (RM{item.amount.toFixed(2)})</span>
                              <button 
                                onClick={() => setCustomLineItems(customLineItems.filter((_, idx) => idx !== i))}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Remove charge"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium">
                        RM{billingBreakdown.customItemsTotal.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {billingBreakdown.discountAmount > 0 && (
                    <tr className="border-b border-slate-100 text-red-600 bg-red-50/50">
                      <td className="px-3 py-2 font-semibold">
                        Manual Discount Applied ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed Amount'})
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        -RM{billingBreakdown.discountAmount.toFixed(2)}
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

            {/* Manual Adjustments Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Ad-Hoc Charge</h5>
                <div className="flex gap-2">
                  <input type="text" placeholder="Description" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="flex-1 text-xs border border-slate-300 px-2 py-1.5 rounded focus:ring-1 focus:ring-[#07B2B2] outline-none" />
                  <input type="number" placeholder="RM" value={customAmount} onChange={e => setCustomAmount(e.target.value)} className="w-20 text-xs border border-slate-300 px-2 py-1.5 rounded focus:ring-1 focus:ring-[#07B2B2] outline-none font-mono" />
                  <button onClick={() => {
                    const amt = parseFloat(customAmount);
                    if (customDesc && !isNaN(amt) && amt > 0) {
                      setCustomLineItems([...customLineItems, { description: customDesc, amount: amt }]);
                      setCustomDesc('');
                      setCustomAmount('');
                    }
                  }} className="bg-[#07B2B2] text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-[#058A8A] cursor-pointer">Add</button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h5 className="text-[10px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1"><Percent className="w-3 h-3" /> Apply Discount</h5>
                <div className="flex gap-2">
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')} className="text-xs border border-slate-300 px-2 py-1.5 rounded focus:ring-1 focus:ring-[#07B2B2] outline-none bg-white">
                    <option value="fixed">Fixed RM</option>
                    <option value="percentage">%</option>
                  </select>
                  <input type="number" placeholder="Value" value={discountInput} onChange={e => setDiscountInput(e.target.value)} className="flex-1 text-xs border border-slate-300 px-2 py-1.5 rounded focus:ring-1 focus:ring-[#07B2B2] outline-none font-mono" />
                  <button onClick={() => {
                    const val = parseFloat(discountInput);
                    if (!isNaN(val) && val >= 0) {
                      setDiscount({ type: discountType, value: val });
                    }
                  }} className="bg-slate-600 text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-slate-700 cursor-pointer">Apply</button>
                </div>
              </div>
            </div>

            {/* AI Billing Compliance Scan */}
            <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-lg flex items-start gap-3 mt-4 mb-4">
              <div className="bg-indigo-100 p-2 rounded shrink-0">
                <FileCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">AI Compliance Assistant</h4>
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Claim
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  ICD-10 diagnosis <strong>({activeVisit.soap?.assessment?.icdCode || 'N/A'})</strong> justifies the dispensing of <strong>{activeVisit.soap?.plan?.prescription?.length || 0}</strong> medication(s). No unbundling or upcoding errors detected. Highly probable instant TPA approval.
                </p>
              </div>
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
                    const matchTPA = tpaList.find(t => t.name.toLowerCase().includes(activePatient.panelEmployer.split(' ')[0].toLowerCase())) || tpaList[0];
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
                      value={selectedTPA?.name || ''}
                      onChange={(e) => {
                        const match = tpaList.find(t => t.name === e.target.value) || tpaList[0];
                        setSelectedTPA(match);
                      }}
                    >
                      {tpaList.map((tpa) => (
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
                      {selectedTPA?.coPayRequired ? `Co-pay ${selectedTPA.coPayPercentage}% applied` : '100% Sponsor Covered'}
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
                  onClick={() => setReceiptWindowData({ method: 'Cash' })}
                  className="bg-[#07B2B2]/90 hover:bg-[#07B2B2] hover:text-white border border-slate-200 text-white font-semibold rounded-lg p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs"
                >
                  <DollarSign className="w-5 h-5 text-white" />
                  <span>Settle Cash</span>
                </button>

                <button
                  type="button"
                  id="checkout-card-btn"
                  onClick={handleStripeCheckoutStart}
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
                  <span>Bank QR Code</span>
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
      {isStripeOverlayOpen && activePatient && activeVisit && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <StripeCheckout
            amount={isPanelClaim ? billingBreakdown.patientCopay : billingBreakdown.grandTotal}
            invoiceId={`INV-${activeVisit.id}`}
            onCancel={() => setIsStripeOverlayOpen(false)}
            onSuccess={() => {
              setIsStripeOverlayOpen(false);
              setReceiptWindowData({ method: 'Credit Card' });
            }}
          />
        </div>
      )}

      {isTngOverlayOpen && activePatient && (
        <div id="tng-wallet-modal-overlay" className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scaleUp">
            
            {/* Header branding */}
            <div className="bg-[#0052a5] text-white p-4 text-center">
              <h4 className="font-extrabold text-sm tracking-tight uppercase flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-300" />
                Bank QR Payment Gateway
              </h4>
              <span className="text-[10px] text-blue-100 font-mono">DuitNow / Bank QR API</span>
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              <span className="text-xs text-slate-500 block">
                Scan transaction QR using your Mobile Banking application:
              </span>

              {/* Dynamic QR block */}
              <div className="w-40 h-40 bg-white border-2 border-slate-200 rounded mx-auto p-2 flex items-center justify-center">
                <QRCodeSVG 
                  value={`duitnow://pay?amount=${billingBreakdown.patientCopay.toFixed(2)}&ref=TNG-CLINIC-${activeVisit.id}`}
                  size={140}
                  level={"M"}
                  includeMargin={false}
                />
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
                  setReceiptWindowData({ method: 'e-Wallet' });
                }}
                className="bg-[#0052a5] text-white font-bold text-xs px-4 py-1.5 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Verify Scan Successful
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECEIPT WINDOW MODAL */}
      {receiptWindowData && activePatient && activeVisit && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-scaleUp p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Payment Successful</h3>
            <p className="text-sm text-slate-500">Transaction completed via {receiptWindowData.method}</p>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-700">{activePatient.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Visit ID:</span>
                <span className="text-slate-700">{activeVisit.id}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-[#07B2B2] text-sm">RM{(isPanelClaim ? billingBreakdown.patientCopay : billingBreakdown.grandTotal).toFixed(2)}</span>
              </div>
              {isPanelClaim && selectedTPA && (
                <div className="flex justify-between items-center text-xs text-blue-700 font-semibold pt-1">
                  <span>Panel Covered ({selectedTPA.name}):</span>
                  <span>-RM{billingBreakdown.panelPaid.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  executeSettleTransaction(receiptWindowData.method);
                  setReceiptWindowData(null);
                }}
                className="flex-1 bg-[#07B2B2] hover:bg-[#058A8A] text-white font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardCheck className="w-5 h-5" />
                Print Receipt
              </button>
            </div>

            {/* Add Medical Certificate and Referral buttons */}
            {(activeVisit.soap?.plan?.mcDays > 0 || activeVisit.soap?.plan?.requiresReferral) && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 mt-1">
                {activeVisit.soap?.plan?.mcDays > 0 && (
                  <button onClick={() => alert('MC PDF generation simulated...')} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs">
                    <FileText className="w-4 h-4 text-emerald-600" /> Print Medical Certificate ({activeVisit.soap.plan.mcDays} Days)
                  </button>
                )}
                {activeVisit.soap?.plan?.requiresReferral && (
                  <button onClick={() => alert('Referral PDF generation simulated...')} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs">
                    <FileText className="w-4 h-4 text-blue-600" /> Print Referral Letter
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
