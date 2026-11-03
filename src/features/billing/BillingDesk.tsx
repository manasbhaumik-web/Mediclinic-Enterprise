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
  ClipboardCheck, CheckCircle2, Plus, Percent, Trash2, Download, Printer, Building2, FileCheck2, X,
} from 'lucide-react';
import { buttonProps, focusRing } from '../../lib/a11y';
import CashDrawerReconciliationModal from './CashDrawerReconciliationModal';
import { Calculator } from 'lucide-react';
import { TPASettlementHub } from './TPASettlementHub';
import EInvoicePage from '../einvoice/EInvoicePage';
import { verifyTPAPolicyEligibility } from '../../domain/tpaPanelClaims';
import { PageHeading, StationTabs, StatStrip } from '../../components/ui/StationChrome';

interface BillingDeskProps {
  queue: Visit[];
  allVisits?: Visit[];
  cashierName?: string;
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
const initialsOf = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.[0] ?? '').toUpperCase();
};

export default function BillingDesk({ queue, allVisits, cashierName, patientsMap, activeLanguage, onPaymentComplete }: BillingDeskProps) {
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [isEInvoiceModalOpen, setIsEInvoiceModalOpen] = useState(false);
  const { settings } = useSettings();
  const { tpaList } = useAuxiliary();
  const t = TRANSLATIONS[activeLanguage];
  const printReceipt = useReceiptPrinter();
  const { transactions } = useFinancials();

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(queue.length > 0 ? queue[0].id : null);

  // Panel claim
  const [billingTab, setBillingTab] = useState<'pos' | 'tpa-hub'>('pos');
  const [isPanelClaim, setIsPanelClaim] = useState(false);
  const [selectedTPA, setSelectedTPA] = useState<TPAConfig | null>(null);
  const [glReferenceNo, setGlReferenceNo] = useState('');
  const [tpaVerificationInfo, setTpaVerificationInfo] = useState<string | null>(null);

  const handleAutoVerifyGL = () => {
    if (!activePatient) return;
    const providerId = (selectedTPA?.name || 'micare').toLowerCase().includes('pmcare') ? 'pmcare'
      : (selectedTPA?.name || '').toLowerCase().includes('healthmetrics') ? 'healthmetrics'
      : (selectedTPA?.name || '').toLowerCase().includes('mediexpress') ? 'mediexpress'
      : (selectedTPA?.name || '').toLowerCase().includes('aia') ? 'aia'
      : 'micare';

    const check = verifyTPAPolicyEligibility({
      patientIc: activePatient.icNumber,
      providerId,
      employerName: activePatient.panelEmployer || 'Petronas'
    });

    if (check.isEligible) {
      setGlReferenceNo(check.glNumber);
      setTpaVerificationInfo(`✓ Policy Active: ${check.providerName} • GL #${check.glNumber} • Annual Bal: RM ${check.remainingAnnualLimitRM.toFixed(2)} • Visit Cap: RM ${check.perVisitCapRM.toFixed(2)}`);
    } else {
      setTpaVerificationInfo(`⚠ Ineligible: ${check.ineligibleReason}`);
    }
  };

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

  // Standard charges only; adjustments and panel cover apply once the visit is open.
  const estimateFor = (visit: Visit) => calculateBill({
    consultationFee: CONSULTATION_FEE,
    procedureFee: procedureFeeFor(settings.billing.procedureFee, visit.soap?.plan?.requiresReferral),
    prescription: visit.soap?.plan?.prescription ?? [],
    customItems: [],
    discount: { type: 'fixed', value: 0 },
    taxRate: TAX_RATE,
  }).grandTotal;
  const queueEstimate = queue.reduce((sum, v) => sum + estimateFor(v), 0);

  return (
    <div className="space-y-4 font-sans">
      <PageHeading eyebrow={cashierName ?? 'Cashier counter'} title="Billing and panel claims">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEInvoiceModalOpen(true)}
            className="btn-secondary min-h-11 px-4 text-sm"
            title="View LHDN MyInvois Submission Status & e-Invoice Verification"
          >
            <FileCheck2 className="w-4 h-4 text-accent" aria-hidden="true" />
            LHDN MyInvois console
          </button>
          <button
            type="button"
            onClick={() => setIsReconModalOpen(true)}
            className="btn-primary min-h-11 px-4 text-sm"
            title="Audit cash drawer float, count physical denominations, and print Malaysian Daily Z-Report"
          >
            <Calculator className="w-4 h-4" aria-hidden="true" />
            Close shift and Z-report
          </button>
        </div>
      </PageHeading>

      <StationTabs<'pos' | 'tpa-hub'>
        label="Billing sections"
        active={billingTab}
        onChange={setBillingTab}
        tabs={[
          { id: 'pos', label: 'Cashier invoicing', count: queue.length, alert: true },
          { id: 'tpa-hub', label: 'Panel claims and remittance' },
        ]}
      />

      {billingTab === 'tpa-hub' ? (
        <TPASettlementHub />
      ) : (
        <>
      <StatStrip
        label="Billing figures"
        stats={[
          { label: 'Awaiting payment', value: queue.length, note: 'Dispensed visits ready to bill' },
          { label: 'Estimated to collect', value: rm(queueEstimate), note: 'Standard charges, before panel cover' },
          { label: 'Receipts on file', value: transactions.length, note: 'Recent payments, for reprinting' },
        ]}
      />

      {unrecorded && !saving && stage === null && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-rose-50 border border-rose-300 text-rose-900 text-sm dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>A card payment of {rm(unrecorded.amountPaid)} was charged but not recorded</strong> for {unrecorded.patient.fullName}
              {unrecorded.settlement.reference ? ` (ref ${unrecorded.settlement.reference})` : ''}. Do not charge the card again.
              {saveError ? ` ${saveError}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => void record(unrecorded)} className="btn-danger shrink-0 px-4 text-sm">Record it now</button>
        </div>
      )}

      <section className="flex flex-wrap bg-surface border border-line">

        {/* BILL: the visit in focus */}
        <article className="flex-[999_1_38rem] min-w-0 p-5 sm:p-7 flex flex-col gap-6" aria-label="Invoice">
          {activePatient && activeVisit ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  <span className="w-2 h-2 bg-emerald-600" aria-hidden="true" />
                  Billing now
                </span>
                <span className="px-3 py-1 bg-surface-strong text-accent text-xs font-semibold">Visit {activeVisit.id}</span>
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 w-14 h-14 bg-surface-strong text-accent flex items-center justify-center text-xl font-bold" aria-hidden="true">
                  {initialsOf(activePatient.fullName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight leading-tight text-ink break-words">{activePatient.fullName}</h2>
                  <p className="mt-1 text-sm text-muted">
                    IC {activePatient.icNumber} · {activePatient.panelEmployer === 'None (Self-Pay)' ? 'Self-pay' : activePatient.panelEmployer}
                    {activeVisit.soap?.assessment?.icdCode ? ` · Diagnosis ${activeVisit.soap.assessment.icdCode}` : ''}
                  </p>
                </div>
              </div>

              {/* Invoice */}
              <div className="border border-line overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm border-collapse" id="active-invoice-breakdown-table">
                  <thead>
                    <tr className="bg-surface-muted border-b border-line text-xs font-semibold text-muted">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-right w-36">Amount (MYR)</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-line-subtle [&>tr>td]:align-top">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Consultation fee</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{rm(CONSULTATION_FEE)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Clinical procedures and nursing</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{rm(PROCEDURE_FEE)}</td>
                    </tr>
                    {prescription.length > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink">Dispensed medications</span>
                          <ul className="mt-1 text-xs text-muted space-y-0.5">
                            {prescription.map((rx, i) => (
                              <li key={i}>{rx.drugName} (qty {rx.quantity} at {rm(rx.pricePerUnit)})</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{rm(billingBreakdown.medicationCost)}</td>
                      </tr>
                    )}
                    {customLineItems.length > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink">Additional charges</span>
                          <ul className="mt-1 text-xs text-muted space-y-1">
                            {customLineItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span>{item.description} ({rm(item.amount)})</span>
                                <button
                                  type="button"
                                  onClick={() => setCustomLineItems(customLineItems.filter((_, idx) => idx !== i))}
                                  className="w-9 h-9 -my-2 flex items-center justify-center text-rose-700 hover:bg-rose-50 cursor-pointer"
                                  aria-label={`Remove charge: ${item.description}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{rm(billingBreakdown.customItemsTotal)}</td>
                      </tr>
                    )}
                    {billingBreakdown.discountAmount > 0 && (
                      <tr className="text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-200">
                        <td className="px-4 py-3 font-semibold">Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'fixed amount'})</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold">-{rm(billingBreakdown.discountAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-surface-muted text-muted">
                      <td className="px-4 py-2.5 text-right">Subtotal</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{rm(billingBreakdown.subtotal)}</td>
                    </tr>
                    <tr className="bg-surface-muted text-muted">
                      <td className="px-4 py-2.5 text-right">SST ({settings.billing.taxRate}%)</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{rm(billingBreakdown.sstTax)}</td>
                    </tr>
                    <tr className="bg-surface-strong text-accent font-bold">
                      <td className="px-4 py-3 text-right !border-b-0">Invoice grand total</td>
                      <td className="px-4 py-3 text-right tabular-nums !border-b-0">{rm(billingBreakdown.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
                <fieldset className="min-w-0 p-4 border border-line bg-surface-muted">
                  <legend className="px-1.5 text-xs font-bold text-accent">Add charge</legend>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" aria-label="Charge description" placeholder="Description" value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="flex-[1_1_8rem] min-h-11 px-3 text-sm bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent" />
                    <input type="number" min="0" step="0.01" aria-label="Charge amount in RM" placeholder="RM" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="flex-[0_0_5.5rem] min-h-11 px-3 text-sm tabular-nums bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent" />
                    <button type="button" onClick={() => {
                      const amt = parseFloat(customAmount);
                      if (customDesc.trim() && !isNaN(amt) && amt > 0) {
                        setCustomLineItems([...customLineItems, { description: customDesc.trim(), amount: amt }]);
                        setCustomDesc('');
                        setCustomAmount('');
                      }
                    }} className="btn-secondary px-4 text-sm">Add</button>
                  </div>
                </fieldset>

                <fieldset className="min-w-0 p-4 border border-line bg-surface-muted">
                  <legend className="px-1.5 text-xs font-bold text-accent">Discount</legend>
                  <div className="flex flex-wrap gap-2">
                    <select aria-label="Discount type" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')} className="flex-[0_0_7rem] min-h-11 px-2 text-sm bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent">
                      <option value="fixed">Fixed RM</option>
                      <option value="percentage">Percent</option>
                    </select>
                    <input type="number" min="0" step="0.01" aria-label="Discount value" placeholder="Value" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="flex-[1_1_6rem] min-h-11 px-3 text-sm tabular-nums bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent" />
                    <button type="button" onClick={() => {
                      const val = parseFloat(discountInput);
                      if (!isNaN(val) && val >= 0) setDiscount({ type: discountType, value: val });
                    }} className="btn-secondary px-4 text-sm">Apply</button>
                  </div>
                </fieldset>
              </div>

              {/* Panel claim */}
              <div className="border border-line">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 bg-surface-muted border-b border-line">
                  <div>
                    <p className="text-sm font-bold text-ink">Panel / TPA claim</p>
                    <p className="text-xs text-muted">
                      {isPanelClaim && selectedTPA
                        ? `${selectedTPA.name} covers up to ${rm(selectedTPA.coverageLimit)}${selectedTPA.coPayRequired ? ` with a ${selectedTPA.coPayPercentage ?? 0}% co-pay` : ''}.`
                        : 'Claim part of this bill from a corporate panel or insurer.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    id="panel-claims-toggle"
                    onClick={togglePanelClaim}
                    disabled={tpaList.length === 0}
                    title={tpaList.length === 0 ? 'No panels are set up' : undefined}
                    aria-pressed={isPanelClaim}
                    className={`min-h-11 px-4 text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isPanelClaim ? 'bg-primary text-white' : 'btn-secondary'}`}
                  >
                    {isPanelClaim ? 'Panel claim on' : 'Claim from a panel'}
                  </button>
                </div>

                {isPanelClaim && (
                  <>
                    <div className="p-4 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
                      <div>
                        <label htmlFor="tpa-select" className="block text-xs font-semibold text-ink mb-1.5">Panel</label>
                        <select
                          id="tpa-select"
                          className="w-full min-h-11 px-3 text-sm bg-surface border border-line rounded-none text-ink outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                          value={selectedTPA?.name || ''}
                          onChange={(e) => setSelectedTPA(tpaList.find((x) => x.name === e.target.value) ?? null)}
                        >
                          {tpaList.map((tpa) => (
                            <option key={tpa.name} value={tpa.name}>{tpa.name} (limit {rm(tpa.coverageLimit)})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="gl-ref-input" className="block text-xs font-semibold text-ink mb-1.5">Guarantee letter (GL) reference</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="gl-ref-input"
                            className="flex-1 min-w-0 min-h-11 px-3 text-sm tabular-nums uppercase bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
                            value={glReferenceNo}
                            onChange={(e) => setGlReferenceNo(e.target.value)}
                            placeholder="e.g. MIC-GL-10292"
                            aria-describedby="gl-note"
                          />
                          <button type="button" onClick={handleAutoVerifyGL} className="btn-secondary shrink-0 px-4 text-sm">Verify</button>
                        </div>
                        {tpaVerificationInfo ? (
                          <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">{tpaVerificationInfo}</p>
                        ) : (
                          <p id="gl-note" className="mt-1 text-xs text-muted">Copy it from the panel letter, or choose Verify to check with the panel.</p>
                        )}
                      </div>
                    </div>

                    <dl id="panel-split-breakdown" className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-px bg-line border-t border-line">
                      <div className="bg-surface-strong px-4 py-3">
                        <dt className="text-xs text-muted">To claim from panel</dt>
                        <dd className="mt-0.5 text-lg font-bold tabular-nums text-accent">{rm(claimAmount)}</dd>
                      </div>
                      <div className="bg-surface-strong px-4 py-3">
                        <dt className="text-xs text-muted">Patient pays now</dt>
                        <dd className="mt-0.5 text-lg font-bold tabular-nums text-accent">{rm(dueNow)}</dd>
                      </div>
                      <div className="bg-surface-strong px-4 py-3">
                        <dt className="text-xs text-muted">Co-pay</dt>
                        <dd className="mt-0.5 text-lg font-bold text-accent">{selectedTPA?.coPayRequired ? `${selectedTPA.coPayPercentage ?? 0}% applied` : 'None'}</dd>
                      </div>
                    </dl>

                    <ul className="px-4 py-3 text-sm space-y-1 border-t border-line" aria-label="Panel claim checklist">
                      <li className={glMissing ? 'text-amber-800 dark:text-amber-300 font-bold' : 'text-emerald-800 dark:text-emerald-300'}>{glMissing ? 'Enter the GL reference to continue.' : 'GL reference entered.'}</li>
                      <li className={activeVisit.soap?.assessment?.icdCode ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300 font-bold'}>
                        {activeVisit.soap?.assessment?.icdCode ? `Diagnosis recorded (${activeVisit.soap.assessment.icdCode}).` : 'No diagnosis code on this visit; panels usually require one.'}
                      </li>
                    </ul>
                  </>
                )}
              </div>

              {/* Take payment */}
              <div>
                {panelOnly ? (
                  <button
                    type="button"
                    onClick={confirmPanelOnly}
                    disabled={payBlocked}
                    className="btn-primary w-full min-h-14 px-4 text-sm"
                  >
                    <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
                    Record panel claim (nothing to collect from the patient)
                  </button>
                ) : (
                  <>
                    <p className="pb-3 text-xs font-bold text-accent tracking-wide">Take payment of {rm(dueNow)}</p>
                    <div id="payment-method-selector" className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
                      <button
                        type="button"
                        id="checkout-cash-btn"
                        onClick={() => { setSaveError(null); setCashReceived(''); setStage('cash'); }}
                        disabled={payBlocked}
                        className="min-h-[4.5rem] bg-primary hover:bg-primary-hover text-white text-sm font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      >
                        <DollarSign className="w-5 h-5" aria-hidden="true" />
                        Cash
                      </button>
                      <button
                        type="button"
                        id="checkout-card-btn"
                        onClick={() => { setSaveError(null); setStage('card'); }}
                        disabled={payBlocked || dueNow < 2}
                        title={dueNow < 2 ? 'Card payments start at RM2.00' : undefined}
                        className="min-h-[4.5rem] bg-surface hover:bg-surface-strong border border-line text-ink text-sm font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <CreditCard className="w-5 h-5 text-accent" aria-hidden="true" />
                        Debit / credit card
                      </button>
                      <button
                        type="button"
                        id="checkout-ewallet-btn"
                        onClick={() => { setSaveError(null); setWalletRef(''); setStage('ewallet'); }}
                        disabled={payBlocked}
                        className="min-h-[4.5rem] bg-surface hover:bg-surface-strong border border-line text-ink text-sm font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <Wallet className="w-5 h-5 text-accent" aria-hidden="true" />
                        e-Wallet / bank transfer
                      </button>
                    </div>
                  </>
                )}
                {saveError && stage === null && !unrecorded && (
                  <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300 font-medium">{saveError}</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[20rem] flex flex-col items-center justify-center text-center">
              <ClipboardCheck className="w-10 h-10 text-accent opacity-40 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">Select a patient in the billing queue</p>
              <p className="text-xs text-muted mt-1">Dispensed visits appear here to be billed.</p>
            </div>
          )}

          <p id="compliance-note-footer" className="mt-auto pt-4 border-t border-line text-xs text-muted leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            {t.complianceText}
          </p>
        </article>

        {/* QUEUE and recent receipts */}
        <aside className="flex-[1_1_20rem] min-w-0 border-t lg:border-t-0 lg:border-l border-line flex flex-col" aria-labelledby="billing-queue-title">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 id="billing-queue-title" className="text-base font-bold text-ink">{t.totalBilling || 'Awaiting payment'}</h2>
            <span className="px-2.5 py-1 bg-surface-muted text-muted text-xs font-semibold">{queue.length} pending</span>
            <div role="status" aria-live="polite" className="sr-only">
              {queue.length} patient{queue.length === 1 ? '' : 's'} in cashier billing queue
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">All accounts balanced</p>
              <p className="text-xs text-muted mt-1">Dispensed pharmacy tickets will queue here for billing.</p>
            </div>
          ) : (
            <ol className="max-h-[26rem] overflow-y-auto">
              {queue.map((visit) => {
                const pt = patientsMap[visit.patientId];
                const isSelected = activeVisit?.id === visit.id;
                if (!pt) return null;
                return (
                  <li key={visit.id} className="border-b border-line-subtle">
                    <button
                      type="button"
                      onClick={() => handleSelectVisit(visit.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors hover:bg-surface-accent ${focusRing} ${isSelected ? 'bg-surface-accent shadow-[inset_3px_0_0_var(--color-primary)]' : ''}`}
                    >
                      <span className="shrink-0 w-9 h-9 bg-surface-strong text-accent flex items-center justify-center text-xs font-bold" aria-hidden="true">{initialsOf(pt.fullName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{pt.fullName}</span>
                        <span className="block text-xs text-muted truncate">{pt.panelEmployer === 'None (Self-Pay)' ? 'Self-pay' : pt.panelEmployer}</span>
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-accent">Est. {rm(estimateFor(visit))}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-auto">
            <h3 className="px-5 pt-4 pb-2 text-sm font-bold text-ink border-t border-line">Recent receipts</h3>
            {transactions.length === 0 ? (
              <p className="px-5 pb-4 text-xs text-muted">No payments recorded yet.</p>
            ) : (
              <ul>
                {transactions.slice(0, 6).map((trx) => (
                  <li key={trx.id} className="flex items-center justify-between gap-3 px-5 py-2.5 border-t border-line-subtle">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{trx.patientName ?? 'Patient'}</p>
                      <p className="text-xs text-muted tabular-nums">{trx.receiptNo ?? 'Older payment'} · {rm(trx.paidAmount + trx.panelClaimed)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => printReceipt({ ...trx, visitId: trx.visitId, paymentReference: trx.paymentReference })}
                      className="btn-secondary shrink-0 px-3 text-xs"
                      aria-label={`Reprint receipt for ${trx.patientName ?? 'patient'}`}
                    >
                      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                      Reprint
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

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
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-baseline px-4 py-3 bg-surface-strong"><span className="text-muted">Amount due</span><strong className="text-accent text-2xl tabular-nums">{rm(dueNow)}</strong></div>
            <div>
              <label htmlFor="cash-received" className="block text-xs font-semibold text-ink mb-1.5">Cash received (RM)</label>
              <input id="cash-received" autoFocus type="number" min="0" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmCash(); }} className="w-full min-h-12 px-3 text-lg font-semibold tabular-nums bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent" />
            </div>
            <div className="flex justify-between items-baseline">
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
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-baseline px-4 py-3 bg-surface-strong"><span className="text-muted">Amount due</span><strong className="text-accent text-2xl tabular-nums">{rm(dueNow)}</strong></div>
            <p className="text-muted leading-relaxed">Check that {rm(dueNow)} has arrived in the clinic's e-wallet or bank account, then enter the transaction reference. This system does not verify the payment.</p>
            <div>
              <label htmlFor="wallet-ref" className="block text-xs font-semibold text-ink mb-1.5">Transaction reference</label>
              <input id="wallet-ref" autoFocus type="text" value={walletRef} onChange={(e) => setWalletRef(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmWallet(); }} className="w-full min-h-12 px-3 text-base tabular-nums bg-surface border border-line rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent" />
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
          <p className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />Saving the payment. Please wait.</p>
        </Dialog>
      )}

      {/* RECEIPT: shown only once the payment is saved */}
      {receipt && (
        <Dialog title="Payment recorded" onClose={() => setReceipt(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7 text-emerald-600" aria-hidden="true" /></div>
            <p className="text-sm text-subtle">Recorded as {receipt.settlement.paymentMethod === 'Panel' ? 'a panel claim' : receipt.settlement.paymentMethod}.</p>
            {receipt.receiptNo && <p className="text-2xl font-bold tabular-nums text-ink">{receipt.receiptNo}</p>}
            <div className="bg-surface-muted p-4 border border-line text-left space-y-2 tabular-nums text-sm">
              <div className="flex justify-between"><span className="text-subtle">Patient:</span><span className="font-bold text-muted">{receipt.patient.fullName}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Visit ID:</span><span className="text-muted">{receipt.visit.id}</span></div>
              <div className="flex justify-between border-t border-line pt-2 mt-2"><span className="text-subtle">Amount paid:</span><span className="font-bold text-accent text-sm">{rm(receipt.amountPaid)}</span></div>
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
              <button type="button" onClick={() => printReceipt(receiptSource(receipt))} className="btn-secondary flex-1 min-h-12 px-4 text-sm">
                <Download className="w-4 h-4" aria-hidden="true" /> Download again
              </button>
              <button type="button" onClick={() => setReceipt(null)} autoFocus className="btn-primary flex-1 min-h-12 px-4 text-sm">Done</button>
            </div>
          </div>
        </Dialog>
      )}
        </>
      )}

      {isEInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/70 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="einvoice-console-title" className="bg-canvas border border-line w-full max-w-5xl max-h-[92vh] flex flex-col rounded-none overflow-hidden text-ink">
            <div className="px-5 py-3 bg-surface border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-accent" />
                <h3 id="einvoice-console-title" className="text-lg font-bold tracking-tight text-ink">LHDN MyInvois e-Invoice console</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEInvoiceModalOpen(false)}
                className="w-11 h-11 flex items-center justify-center hover:bg-surface-strong text-ink cursor-pointer"
                aria-label="Close e-Invoice console"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <EInvoicePage />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dialog({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: React.ReactNode }) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 bg-night-950/70 flex items-center justify-center z-50 p-4 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-surface rounded-none max-w-md w-full border border-line p-6 space-y-5">
        <h3 className="text-xl font-bold tracking-tight text-ink">{title}</h3>
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
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-line">
        <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary min-h-12 px-5 text-sm">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy || confirmDisabled} className="btn-primary min-h-12 px-6 text-sm">
          {busy && <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />}
          {busy ? 'Saving…' : confirmLabel}
        </button>
      </div>
    </>
  );
}
