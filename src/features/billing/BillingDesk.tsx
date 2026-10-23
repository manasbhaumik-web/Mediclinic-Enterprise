import React, { useEffect, useMemo, useState } from 'react';
import { Visit, Language, TPAConfig } from '../../types';
import { TRANSLATIONS } from '../../data';
import type { PaymentInfo } from '../../domain/visitWorkflow';
import {
  EMPTY_BREAKDOWN, SettleResult, Settlement, buildInvoiceSnapshot, calculateBill, procedureFeeFor, round2,
} from '../../domain/billing';
import type { ReceiptSource } from '../../domain/receipt';
import { useReceiptPrinter } from '../../hooks/useReceipt';
import { useFinancials } from '../../context/FinancialContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuxiliary } from '../../context/AuxiliaryContext';
import StripeCheckout from './StripeCheckout';
import {
  CreditCard, ShieldCheck, DollarSign, Wallet, FileSpreadsheet, AlertTriangle, Loader2,
  ClipboardCheck, CheckCircle2, Plus, Percent, Trash2, Download, Printer,
} from 'lucide-react';
import { buttonProps, focusRing } from '../../lib/a11y';

interface BillingDeskProps {
  queue: Visit[];
  patientsMap: Record<string, any>;
  activeLanguage: Language;
  /** Records the payment and issues its receipt number. */
  onPaymentComplete: (visitId: string, paymentDetails: PaymentInfo) => Promise<SettleResult>;
}

type PayStage = 'cash' | 'ewallet' | 'card' | null;

/** Everything needed to record one payment and to show its receipt afterwards (the queue changes once it is saved). */
interface Attempt {
  visit: Visit;
  patient: any;
  settlement: Settlement;
  payInfo: PaymentInfo;
  amountPaid: number;
  panelCovered: number;
  tpaName?: string;
  change?: number;
  /** Filled in once the payment is saved. */
  receiptNo?: string;
  issuedAt?: string;
}

const rm = (n: number) => `RM${n.toFixed(2)}`;

export default function BillingDesk({ queue, patientsMap, activeLanguage, onPaymentComplete }: BillingDeskProps) {
  const { settings } = useSettings();
  const { tpaList } = useAuxiliary();
  const t = TRANSLATIONS[activeLanguage];
  const printReceipt = useReceiptPrinter();
  const { transactions } = useFinancials();

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(queue.length > 0 ? queue[0].id : null);

  // Panel claim
  const [isPanelClaim, setIsPanelClaim] = useState(false);
  const [selectedTPA, setSelectedTPA] = useState<TPAConfig | null>(null);
  const [glReferenceNo, setGlReferenceNo] = useState('');

  // Taking a payment
  const [stage, setStage] = useState<PayStage>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [walletRef, setWalletRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** A card that was charged but whose payment could not be recorded. It stays until recorded. */
  const [unrecorded, setUnrecorded] = useState<Attempt | null>(null);
  const [receipt, setReceipt] = useState<Attempt | null>(null);

  // Adjustments
  const [customLineItems, setCustomLineItems] = useState<{ description: string; amount: number }[]>([]);
  const [customDesc, setCustomDesc] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [discount, setDiscount] = useState<{ type: 'fixed' | 'percentage'; value: number }>({ type: 'fixed', value: 0 });
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');

  const activeVisit = queue.find((v) => v.id === selectedVisitId) || queue[0];
  const activePatient = activeVisit ? patientsMap[activeVisit.patientId] : null;

  const CONSULTATION_FEE = settings.billing.consultationFee;
  const PROCEDURE_FEE = procedureFeeFor(settings.billing.procedureFee, activeVisit?.soap?.plan?.requiresReferral);
  const TAX_RATE = settings.billing.taxRate / 100;
  const prescription = activeVisit?.soap?.plan?.prescription ?? [];
  const panelInUse = isPanelClaim ? selectedTPA : null;

  const billingInput = {
    consultationFee: CONSULTATION_FEE,
    procedureFee: PROCEDURE_FEE,
    prescription,
    customItems: customLineItems,
    discount,
    taxRate: TAX_RATE,
    panel: panelInUse,
  };
  const billingBreakdown = useMemo(
    () => (activeVisit ? calculateBill(billingInput) : EMPTY_BREAKDOWN),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeVisit, CONSULTATION_FEE, PROCEDURE_FEE, TAX_RATE, customLineItems, discount, panelInUse],
  );

  const dueNow = round2(isPanelClaim ? billingBreakdown.patientCopay : billingBreakdown.grandTotal);
  const claimAmount = round2(isPanelClaim ? billingBreakdown.panelPaid : 0);
  const panelOnly = isPanelClaim && dueNow === 0;
  const glMissing = isPanelClaim && !glReferenceNo.trim();
  const payBlocked = !activeVisit || saving || (isPanelClaim && (!selectedTPA || glMissing));

  // Close the open payment dialog with Escape, unless a save is in progress.
  useEffect(() => {
    if (!stage || stage === 'card' || saving) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setStage(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, saving]);

  const resetForm = () => {
    setIsPanelClaim(false);
    setGlReferenceNo('');
    setStage(null);
    setCashReceived('');
    setWalletRef('');
    setCustomLineItems([]);
    setDiscount({ type: 'fixed', value: 0 });
    setCustomDesc('');
    setCustomAmount('');
    setDiscountInput('');
    setSelectedVisitId(null);
  };

  const handleSelectVisit = (visitId: string) => {
    setSelectedVisitId(visitId);
    setIsPanelClaim(false);
    setSelectedTPA(tpaList[0] ?? null);
    setGlReferenceNo('');
    setStage(null);
    setCustomLineItems([]);
    setDiscount({ type: 'fixed', value: 0 });
    setCustomDesc('');
    setCustomAmount('');
    setDiscountInput('');
  };

  const togglePanelClaim = () => {
    const next = !isPanelClaim;
    setIsPanelClaim(next);
    if (next && activePatient) {
      const firstWord = String(activePatient.panelEmployer ?? '').split(' ')[0].toLowerCase();
      const match = (firstWord && tpaList.find((x) => x.name.toLowerCase().includes(firstWord))) || tpaList[0] || null;
      setSelectedTPA(match);
    }
  };

  const receiptSource = (a: Attempt): ReceiptSource => ({
    receiptNo: a.receiptNo ?? null,
    date: a.issuedAt ?? new Date().toISOString(),
    patientName: a.patient.fullName,
    visitId: a.visit.id,
    paymentMethod: a.settlement.paymentMethod,
    paymentReference: a.settlement.reference,
    paidAmount: a.amountPaid,
    panelClaimed: a.panelCovered,
    glNumber: a.settlement.glNumber,
    panelName: a.tpaName,
    bill: a.settlement.bill,
  });

  /** Saves the payment. Only a saved payment shows the receipt; a failure stays on screen with its reason. */
  const record = async (attempt: Attempt) => {
    setSaving(true);
    setSaveError(null);
    const result = await onPaymentComplete(attempt.visit.id, attempt.payInfo);
    setSaving(false);
    if ('error' in result) {
      setSaveError(result.error);
      if (attempt.settlement.paymentMethod === 'Credit Card') setUnrecorded(attempt);
      return;
    }
    const saved: Attempt = { ...attempt, receiptNo: result.receiptNo, issuedAt: new Date().toISOString() };
    setUnrecorded(null);
    resetForm();
    setReceipt(saved);
    printReceipt(receiptSource(saved));
  };

  const buildAttempt = (method: Settlement['paymentMethod'], extra: { reference?: string; change?: number } = {}): Attempt | null => {
    if (!activeVisit || !activePatient) return null;
    // The bill as charged: kept with the payment for receipts and for e-invoicing (an admin controls submission to LHDN).
    const invoice = buildInvoiceSnapshot(
      { ...billingInput, panel: panelInUse },
      billingBreakdown,
      prescription.map((rx) => rx.drugName),
    );
    const settlement: Settlement = {
      paymentMethod: method,
      paidAmount: dueNow,
      panelClaimed: claimAmount,
      glNumber: isPanelClaim ? glReferenceNo.trim() : undefined,
      reference: extra.reference,
      bill: invoice,
      panelName: isPanelClaim ? selectedTPA?.name : undefined,
    };
    const payInfo: PaymentInfo = {
      ...settlement,
      invoice,
      eInvoiceBuyer: isPanelClaim && selectedTPA ? { type: 'business', name: selectedTPA.name } : { type: 'general_public' },
    };
    return { visit: activeVisit, patient: activePatient, settlement, payInfo, amountPaid: dueNow, panelCovered: claimAmount, tpaName: isPanelClaim ? selectedTPA?.name : undefined, change: extra.change };
  };

  const cashReceivedNum = parseFloat(cashReceived);
  const cashChange = Number.isFinite(cashReceivedNum) ? round2(cashReceivedNum - dueNow) : null;

  const confirmCash = () => {
    if (cashChange === null || cashChange < 0) return;
    const a = buildAttempt('Cash', { change: cashChange });
    if (a) void record(a);
  };
  const confirmWallet = () => {
    if (!walletRef.trim()) return;
    const a = buildAttempt('e-Wallet', { reference: walletRef.trim() });
    if (a) void record(a);
  };
  const confirmPanelOnly = () => {
    const a = buildAttempt('Panel');
    if (a) void record(a);
  };
  const onCardCharged = (reference: string) => {
    setStage(null);
    const a = buildAttempt('Credit Card', { reference });
    if (a) void record(a);
  };

  const closeDialogs = () => { if (!saving) { setStage(null); setSaveError(null); } };

  return (
    <div className="space-y-4">
      {unrecorded && !saving && stage === null && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>A card payment of {rm(unrecorded.amountPaid)} was charged but not recorded</strong> for {unrecorded.patient.fullName}
              {unrecorded.settlement.reference ? ` (ref ${unrecorded.settlement.reference})` : ''}. Do not charge the card again.
              {saveError ? ` ${saveError}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => void record(unrecorded)} className="shrink-0 bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-none cursor-pointer">Record it now</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[480px]">

        {/* 1. QUEUE */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-none p-4 space-y-4">
          <div className="flex items-center gap-1.5 text-accent font-semibold text-xs border-b border-slate-200 pb-2 mb-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>{t.totalBilling}</span>
            <span className="bg-emerald-100 text-accent px-2 py-0.5 rounded-full text-2xs font-mono font-bold">{queue.length} Pending</span>
          </div>

          {queue.length === 0 ? (
            <div className="bg-white rounded-none border border-slate-200 p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold text-muted">All Accounts Balanced</p>
              <p className="text-2xs text-slate-400 mt-0.5">Dispensed pharmacy tickets will queue here for billing.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {queue.map((visit) => {
                const pt = patientsMap[visit.patientId];
                const isSelected = activeVisit?.id === visit.id;
                if (!pt) return null;

                // Standard charges only; adjustments and panel cover apply once the visit is open.
                const estimate = calculateBill({
                  consultationFee: CONSULTATION_FEE,
                  procedureFee: procedureFeeFor(settings.billing.procedureFee, visit.soap?.plan?.requiresReferral),
                  prescription: visit.soap?.plan?.prescription ?? [],
                  customItems: [],
                  discount: { type: 'fixed', value: 0 },
                  taxRate: TAX_RATE,
                }).grandTotal;

                return (
                  <div
                    key={visit.id}
                    {...buttonProps(() => handleSelectVisit(visit.id), isSelected)}
                    className={`p-2.5 rounded-none border transition-colors text-left cursor-pointer ${focusRing} hover:bg-teal-50/50 bg-white ${isSelected ? 'border-brand bg-teal-50/40 shadow-xs' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between text-2xs font-mono">
                      <span className="text-slate-400">ID: {visit.id}</span>
                      <span className="text-subtle font-bold">Est. {rm(estimate)}</span>
                    </div>
                    <h5 className="type-label text-strong mt-1">{pt.fullName}</h5>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-2xs text-slate-400">
                      <span>Panel: {pt.panelEmployer === 'None (Self-Pay)' ? 'Self-Pay' : pt.panelEmployer}</span>
                      <span className="text-accent font-semibold">Ready to bill</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent receipts, for reprinting */}
          <div className="pt-3 border-t border-slate-200">
            <h5 className="type-label text-muted mb-2 flex items-center gap-1"><Printer className="w-3 h-3" aria-hidden="true" /> Recent receipts</h5>
            {transactions.length === 0 ? (
              <p className="text-2xs text-slate-400">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {transactions.slice(0, 6).map((trx) => (
                  <li key={trx.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 px-2.5 py-1.5 text-2xs">
                    <div className="min-w-0">
                      <p className="font-bold text-muted truncate">{trx.patientName ?? 'Patient'}</p>
                      <p className="font-mono text-slate-400">{trx.receiptNo ?? 'Older payment'} · {rm(trx.paidAmount + trx.panelClaimed)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => printReceipt({ ...trx, visitId: trx.visitId, paymentReference: trx.paymentReference })}
                      className="shrink-0 font-bold text-accent hover:underline cursor-pointer"
                      aria-label={`Reprint receipt for ${trx.patientName ?? 'patient'}`}
                    >
                      Reprint
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 2. BILL */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-none p-4 flex flex-col justify-between">
          {activePatient && activeVisit ? (
            <div className="space-y-4">

              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-2xs font-bold text-accent uppercase tracking-wider block font-sans">Cashier desk (outpatient)</span>
                  <h4 className="type-heading-caps text-strong font-sans">{activePatient.fullName}</h4>
                  <p className="text-2xs font-mono text-slate-400">IC Registration: {activePatient.icNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-subtle font-mono text-xs">VISIT TICKET ID: {activeVisit.id}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-none overflow-hidden">
                <table className="w-full text-left text-xs border-collapse" id="active-invoice-breakdown-table">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-2xs text-subtle uppercase tracking-wider font-semibold">
                      <th className="px-3 py-1.5 font-bold">Billing Item Description</th>
                      <th className="px-3 py-1.5 text-right font-bold w-32">Total Price (MYR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-muted">
                      <td className="px-3 py-2">Consultation fee</td>
                      <td className="px-3 py-2 text-right font-mono font-medium">{rm(CONSULTATION_FEE)}</td>
                    </tr>
                    <tr className="border-b border-slate-100 text-muted">
                      <td className="px-3 py-2">Clinical procedures / nursing</td>
                      <td className="px-3 py-2 text-right font-mono font-medium">{rm(PROCEDURE_FEE)}</td>
                    </tr>

                    {prescription.length > 0 && (
                      <tr className="border-b border-slate-100 text-muted">
                        <td className="px-3 py-2">
                          <span>Dispensed medications</span>
                          <div className="text-2xs text-slate-400 pl-2.5 mt-0.5">
                            {prescription.map((rx, i) => (
                              <div key={i}>• {rx.drugName} (Qty: {rx.quantity} @ {rm(rx.pricePerUnit)})</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">{rm(billingBreakdown.medicationCost)}</td>
                      </tr>
                    )}

                    {customLineItems.length > 0 && (
                      <tr className="border-b border-slate-100 text-muted">
                        <td className="px-3 py-2">
                          <span>Additional charges</span>
                          <div className="text-2xs text-slate-400 pl-2.5 mt-0.5 space-y-1">
                            {customLineItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span>• {item.description} ({rm(item.amount)})</span>
                                <button
                                  type="button"
                                  onClick={() => setCustomLineItems(customLineItems.filter((_, idx) => idx !== i))}
                                  className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                  aria-label={`Remove charge: ${item.description}`}
                                >
                                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium">{rm(billingBreakdown.customItemsTotal)}</td>
                      </tr>
                    )}

                    {billingBreakdown.discountAmount > 0 && (
                      <tr className="border-b border-slate-100 text-red-600 bg-red-50/50">
                        <td className="px-3 py-2 font-semibold">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'fixed amount'})</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">-{rm(billingBreakdown.discountAmount)}</td>
                      </tr>
                    )}

                    <tr className="border-b border-slate-200 bg-slate-50 font-medium text-muted font-mono text-2xs">
                      <td className="px-3 py-1.5 text-right font-semibold">Subtotal:</td>
                      <td className="px-3 py-1.5 text-right font-bold">{rm(billingBreakdown.subtotal)}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50 text-muted font-mono text-2xs">
                      <td className="px-3 py-1.5 text-right font-semibold">SST ({settings.billing.taxRate}%):</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{rm(billingBreakdown.sstTax)}</td>
                    </tr>
                    <tr className="bg-teal-50/50 font-bold text-strong font-mono text-xs">
                      <td className="px-3 py-2 text-right text-accent font-bold">Invoice Grand Total:</td>
                      <td className="px-3 py-2 text-right text-accent font-bold">{rm(billingBreakdown.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 p-3 rounded-none border border-slate-200">
                  <h5 className="type-label text-muted mb-2 flex items-center gap-1"><Plus className="w-3 h-3" aria-hidden="true" /> Add charge</h5>
                  <div className="flex gap-2">
                    <input type="text" aria-label="Charge description" placeholder="Description" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="flex-1 text-xs border border-slate-300 px-2 py-1.5 rounded-none focus:ring-1 focus:ring-brand outline-none" />
                    <input type="number" min="0" step="0.01" aria-label="Charge amount in RM" placeholder="RM" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="w-20 text-xs border border-slate-300 px-2 py-1.5 rounded-none focus:ring-1 focus:ring-brand outline-none font-mono" />
                    <button type="button" onClick={() => {
                      const amt = parseFloat(customAmount);
                      if (customDesc.trim() && !isNaN(amt) && amt > 0) {
                        setCustomLineItems([...customLineItems, { description: customDesc.trim(), amount: amt }]);
                        setCustomDesc('');
                        setCustomAmount('');
                      }
                    }} className="bg-primary text-white px-2 py-1.5 rounded-none text-xs font-bold hover:bg-primary-hover cursor-pointer">Add</button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-none border border-slate-200">
                  <h5 className="type-label text-muted mb-2 flex items-center gap-1"><Percent className="w-3 h-3" aria-hidden="true" /> Discount</h5>
                  <div className="flex gap-2">
                    <select aria-label="Discount type" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')} className="text-xs border border-slate-300 px-2 py-1.5 rounded-none focus:ring-1 focus:ring-brand outline-none bg-white">
                      <option value="fixed">Fixed RM</option>
                      <option value="percentage">%</option>
                    </select>
                    <input type="number" min="0" step="0.01" aria-label="Discount value" placeholder="Value" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="flex-1 text-xs border border-slate-300 px-2 py-1.5 rounded-none focus:ring-1 focus:ring-brand outline-none font-mono" />
                    <button type="button" onClick={() => {
                      const val = parseFloat(discountInput);
                      if (!isNaN(val) && val >= 0) setDiscount({ type: discountType, value: val });
                    }} className="bg-slate-600 text-white px-2 py-1.5 rounded-none text-xs font-bold hover:bg-slate-700 cursor-pointer">Apply</button>
                  </div>
                </div>
              </div>

              {/* Panel claim */}
              <div className="bg-slate-50 p-3.5 rounded-none border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted uppercase tracking-tight flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-accent" aria-hidden="true" />
                    Panel / TPA claim
                  </span>
                  <button
                    type="button"
                    id="panel-claims-toggle"
                    onClick={togglePanelClaim}
                    disabled={tpaList.length === 0}
                    title={tpaList.length === 0 ? 'No panels are set up' : undefined}
                    aria-pressed={isPanelClaim}
                    className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isPanelClaim ? 'bg-primary text-white' : 'bg-white border border-slate-300 text-muted hover:bg-slate-100'}`}
                  >
                    {isPanelClaim ? 'Panel claim on' : 'Claim from a panel'}
                  </button>
                </div>

                {isPanelClaim && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="space-y-1">
                        <label htmlFor="tpa-select" className="block text-2xs text-subtle font-bold uppercase tracking-wider">Panel</label>
                        <select
                          id="tpa-select"
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-none focus:ring-1 focus:ring-teal-600 focus:outline-none font-medium text-strong"
                          value={selectedTPA?.name || ''}
                          onChange={(e) => setSelectedTPA(tpaList.find((x) => x.name === e.target.value) ?? null)}
                        >
                          {tpaList.map((tpa) => (
                            <option key={tpa.name} value={tpa.name}>{tpa.name} (limit {rm(tpa.coverageLimit)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="gl-ref-input" className="block text-2xs text-subtle font-bold uppercase tracking-wider">Guarantee letter (GL) reference</label>
                        <input
                          type="text"
                          id="gl-ref-input"
                          className="w-full text-xs border border-slate-300 rounded-none px-2 py-1.5 font-mono uppercase"
                          value={glReferenceNo}
                          onChange={(e) => setGlReferenceNo(e.target.value)}
                          placeholder="e.g. MIC-GL-10292"
                          aria-describedby="gl-note"
                        />
                        <p id="gl-note" className="text-2xs text-subtle">Copy it from the panel's letter. This system does not check it with the panel.</p>
                      </div>
                    </div>

                    <div id="panel-split-breakdown" className="bg-teal-50/50 p-3 rounded-none border border-brand/10 text-xs flex flex-row flex-wrap gap-3 items-center justify-between text-accent font-medium leading-relaxed">
                      <div>
                        <span className="text-2xs uppercase text-subtle block font-mono">To claim from panel:</span>
                        <strong>{rm(claimAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-2xs uppercase text-subtle block font-mono">Patient pays now:</span>
                        <strong>{rm(dueNow)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-2xs uppercase text-subtle block font-mono">Co-pay:</span>
                        <span className="text-2xs font-bold uppercase">
                          {selectedTPA?.coPayRequired ? `${selectedTPA.coPayPercentage ?? 0}% applied` : 'None'}
                        </span>
                      </div>
                    </div>

                    <ul className="text-xs space-y-1" aria-label="Panel claim checklist">
                      <li className={glMissing ? 'text-amber-800 font-bold' : 'text-emerald-700'}>{glMissing ? '• Enter the GL reference to continue.' : '✓ GL reference entered.'}</li>
                      <li className={activeVisit.soap?.assessment?.icdCode ? 'text-emerald-700' : 'text-amber-800 font-bold'}>
                        {activeVisit.soap?.assessment?.icdCode ? `✓ Diagnosis recorded (${activeVisit.soap.assessment.icdCode}).` : '• No diagnosis code on this visit; panels usually require one.'}
                      </li>
                    </ul>
                  </>
                )}
              </div>

              {/* Take payment */}
              <div className="space-y-2">
                {panelOnly ? (
                  <button
                    type="button"
                    onClick={confirmPanelOnly}
                    disabled={payBlocked}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-none p-3 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                    <span>Record panel claim (nothing to collect from the patient)</span>
                  </button>
                ) : (
                  <>
                    <p className="block text-2xs font-bold text-subtle uppercase tracking-wider">Take payment of {rm(dueNow)}</p>
                    <div id="payment-method-selector" className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        id="checkout-cash-btn"
                        onClick={() => { setSaveError(null); setCashReceived(''); setStage('cash'); }}
                        disabled={payBlocked}
                        className="bg-primary/90 hover:bg-primary border border-slate-200 text-white font-semibold rounded-none p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DollarSign className="w-5 h-5 text-white" aria-hidden="true" />
                        <span>Cash</span>
                      </button>

                      <button
                        type="button"
                        id="checkout-card-btn"
                        onClick={() => { setSaveError(null); setStage('card'); }}
                        disabled={payBlocked || dueNow < 2}
                        title={dueNow < 2 ? 'Card payments start at RM2.00' : undefined}
                        className="bg-white hover:bg-slate-50 border border-slate-300 text-muted font-semibold rounded-none p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-5 h-5 text-teal-600" aria-hidden="true" />
                        <span>Debit / Credit card</span>
                      </button>

                      <button
                        type="button"
                        id="checkout-ewallet-btn"
                        onClick={() => { setSaveError(null); setWalletRef(''); setStage('ewallet'); }}
                        disabled={payBlocked}
                        className="bg-sky-50 border border-sky-300 hover:bg-sky-100 text-sky-800 font-semibold rounded-none p-3 text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Wallet className="w-5 h-5 text-sky-500" aria-hidden="true" />
                        <span>e-Wallet / bank transfer</span>
                      </button>
                    </div>
                  </>
                )}
                {saveError && stage === null && !unrecorded && (
                  <p role="alert" className="text-xs text-rose-700 font-medium">{saveError}</p>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
              <ClipboardCheck className="w-12 h-12 text-slate-200 mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold">Select a patient in the billing queue</p>
              <p className="text-xs text-slate-400 mt-1">Dispensed visits appear here to be billed.</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3.5 mt-5 text-2xs text-slate-400 leading-relaxed text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <p id="compliance-note-footer">{t.complianceText}</p>
          </div>
        </div>
      </div>

      {/* CARD */}
      {stage === 'card' && activePatient && activeVisit && !saving && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <StripeCheckout
            amount={dueNow}
            invoiceId={`INV-${activeVisit.id}`}
            onCancel={() => setStage(null)}
            onSuccess={onCardCharged}
          />
        </div>
      )}

      {/* CASH */}
      {stage === 'cash' && activeVisit && (
        <Dialog title="Cash payment" onClose={closeDialogs} busy={saving}>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-mono"><span className="text-subtle">Amount due</span><strong className="text-accent text-sm">{rm(dueNow)}</strong></div>
            <div>
              <label htmlFor="cash-received" className="block text-2xs font-bold text-subtle uppercase tracking-wider mb-1">Cash received (RM)</label>
              <input id="cash-received" autoFocus type="number" min="0" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmCash(); }} className="w-full border border-slate-300 px-3 py-2 text-sm font-mono rounded-none focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-subtle">Change to give</span>
              <strong className={cashChange !== null && cashChange < 0 ? 'text-rose-700' : 'text-ink'}>
                {cashChange === null ? '—' : cashChange < 0 ? `Short by ${rm(-cashChange)}` : rm(cashChange)}
              </strong>
            </div>
            <DialogActions
              busy={saving}
              error={saveError}
              confirmLabel="Record payment"
              confirmDisabled={cashChange === null || cashChange < 0}
              onConfirm={confirmCash}
              onCancel={closeDialogs}
            />
          </div>
        </Dialog>
      )}

      {/* E-WALLET / BANK TRANSFER */}
      {stage === 'ewallet' && activeVisit && (
        <Dialog title="e-Wallet / bank transfer" onClose={closeDialogs} busy={saving}>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-mono"><span className="text-subtle">Amount due</span><strong className="text-accent text-sm">{rm(dueNow)}</strong></div>
            <p className="text-muted leading-relaxed">Check that {rm(dueNow)} has arrived in the clinic's e-wallet or bank account, then enter the transaction reference. This system does not verify the payment.</p>
            <div>
              <label htmlFor="wallet-ref" className="block text-2xs font-bold text-subtle uppercase tracking-wider mb-1">Transaction reference</label>
              <input id="wallet-ref" autoFocus type="text" value={walletRef} onChange={(e) => setWalletRef(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmWallet(); }} className="w-full border border-slate-300 px-3 py-2 text-sm font-mono rounded-none focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <DialogActions
              busy={saving}
              error={saveError}
              confirmLabel="Record payment"
              confirmDisabled={!walletRef.trim()}
              onConfirm={confirmWallet}
              onCancel={closeDialogs}
            />
          </div>
        </Dialog>
      )}

      {/* SAVING A CARD PAYMENT */}
      {saving && stage === null && (
        <Dialog title="Recording payment" busy onClose={() => {}}>
          <p className="flex items-center gap-2 text-xs text-muted"><Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />Saving the payment. Please wait.</p>
        </Dialog>
      )}

      {/* RECEIPT: shown only once the payment is saved */}
      {receipt && (
        <Dialog title="Payment recorded" onClose={() => setReceipt(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7 text-emerald-600" aria-hidden="true" /></div>
            <p className="text-sm text-subtle">Recorded as {receipt.settlement.paymentMethod === 'Panel' ? 'a panel claim' : receipt.settlement.paymentMethod}.</p>
            {receipt.receiptNo && <p className="font-mono text-lg font-bold text-ink">{receipt.receiptNo}</p>}
            <div className="bg-slate-50 p-4 border border-slate-100 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between"><span className="text-subtle">Patient:</span><span className="font-bold text-muted">{receipt.patient.fullName}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Visit ID:</span><span className="text-muted">{receipt.visit.id}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2"><span className="text-subtle">Amount paid:</span><span className="font-bold text-accent text-sm">{rm(receipt.amountPaid)}</span></div>
              {receipt.change !== undefined && receipt.change > 0 && (
                <div className="flex justify-between"><span className="text-subtle">Change given:</span><span className="text-muted">{rm(receipt.change)}</span></div>
              )}
              {receipt.panelCovered > 0 && (
                <div className="flex justify-between text-blue-700 font-semibold pt-1"><span>To claim from {receipt.tpaName ?? 'panel'}:</span><span>{rm(receipt.panelCovered)}</span></div>
              )}
              {receipt.settlement.reference && (
                <div className="flex justify-between"><span className="text-subtle">Reference:</span><span className="text-muted truncate max-w-[12rem]">{receipt.settlement.reference}</span></div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => printReceipt(receiptSource(receipt))} className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-muted font-bold px-4 py-2.5 rounded-none flex items-center justify-center gap-2 cursor-pointer text-xs">
                <Download className="w-4 h-4" aria-hidden="true" /> Download again
              </button>
              <button type="button" onClick={() => setReceipt(null)} autoFocus className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-none cursor-pointer text-xs">Done</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-none shadow-2xl max-w-sm w-full border border-slate-200 p-6 space-y-4">
        <h3 className="type-heading-caps text-strong">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DialogActions({ busy, error, confirmLabel, confirmDisabled, onConfirm, onCancel }: {
  busy: boolean; error: string | null; confirmLabel: string; confirmDisabled: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <>
      {error && <p role="alert" className="text-xs text-rose-700 font-medium">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={busy} className="px-3 py-2 border border-slate-200 text-muted rounded-none text-xs hover:bg-slate-100 cursor-pointer disabled:opacity-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy || confirmDisabled} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
          {busy && <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" aria-hidden="true" />}
          {busy ? 'Saving…' : confirmLabel}
        </button>
      </div>
    </>
  );
}
