import React, { useMemo, useState } from 'react';
import {
  CreditCard, DollarSign, Search, FileText, CheckCircle, Clock,
  ShieldCheck, Plus, Activity, CheckCircle2, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { useFinancials, Transaction } from '../context/FinancialContext';
import { useSettings } from '../context/SettingsContext';
import { useBillingActions } from '../hooks/useBilling';
import { useReceiptPrinter } from '../hooks/useReceipt';
import { localDateKey } from '../domain/operations';

const rm = (n: number) => `RM ${n.toFixed(2)}`;

export default function BillingManagementModule() {
  const { transactions } = useFinancials();
  const { markClaimPaid } = useBillingActions();
  const printReceipt = useReceiptPrinter();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<'ledger' | 'claims'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');

  // Recording a panel's payment
  const [settling, setSettling] = useState<Transaction | null>(null);
  const [claimRef, setClaimRef] = useState('');
  const [receivedOn, setReceivedOn] = useState('');
  const [claimSaving, setClaimSaving] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const today = localDateKey(new Date());
  const monthKey = today.slice(0, 7);

  // This month's takings. A claim still waiting for the panel counts once it is paid.
  const monthTransactions = useMemo(
    () => transactions.filter((t) => localDateKey(new Date(t.date)).slice(0, 7) === monthKey),
    [transactions, monthKey],
  );
  const totalRevenue = monthTransactions
    .filter(t => t.status === 'Completed' || t.status === 'Claim Paid')
    .reduce((sum, t) => sum + t.paidAmount + t.panelClaimed, 0);

  const pendingClaimTrx = transactions.filter(t => t.status === 'Pending Claim');
  const pendingClaims = pendingClaimTrx.reduce((sum, t) => sum + t.panelClaimed, 0);

  const TAX_RATE = settings.billing.taxRate / 100;
  // An estimate: assumes everything this month was billed with SST included at the current rate.
  const taxIncluded = totalRevenue - (totalRevenue / (1 + TAX_RATE));

  const openSettle = (trx: Transaction) => {
    setSettling(trx);
    setClaimRef('');
    setReceivedOn(today);
    setClaimError(null);
  };
  const saveSettle = async () => {
    if (!settling) return;
    setClaimSaving(true);
    setClaimError(null);
    const error = await markClaimPaid(settling.id, claimRef, receivedOn);
    setClaimSaving(false);
    if (error) { setClaimError(error); return; }
    setSettling(null);
  };

  // Filtered lists
  const filteredLedger = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.visitId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.paymentReference ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.patientName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.receiptNo ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Every transaction with an amount owed by a panel, whichever way the patient paid their share.
  const claimsList = transactions.filter(t => t.panelClaimed > 0);
  const filteredClaims = claimsList.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.glNumber && t.glNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.claimReference && t.claimReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.patientName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.receiptNo ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fadeIn w-full space-y-6 pb-8">
      
      {/* 1. STRUCTURED PAGE HEADER BANNER */}
      <div className="bg-surface-accent text-ink p-5 rounded-none shadow-2xs border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-accent text-2xs font-bold px-2.5 py-0.5 rounded-none border border-brand/20 uppercase tracking-wider">
              Financial Revenue &amp; Claims
            </span>
            <span className="text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              SST {settings.billing.taxRate}%
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-accent" />
            Billing &amp; TPA Claims Management
          </h1>
          <p className="text-xs text-muted font-medium max-w-2xl leading-relaxed">
            Review payments taken at the cashier desk and record when each panel pays its claims.
          </p>
        </div>
        
      </div>

      {/* 2. TOP METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Revenue this month</span>
          <span className="text-xl font-bold font-mono text-ink block mt-0.5">{rm(totalRevenue)}</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Panel claims awaiting payment</span>
          <span className={`text-xl font-bold font-mono block mt-0.5 ${pendingClaims > 0 ? 'text-amber-600' : 'text-muted'}`}>
            {rm(pendingClaims)}
          </span>
          <span className="text-2xs text-subtle">{pendingClaimTrx.length} claim{pendingClaimTrx.length === 1 ? '' : 's'}</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">SST included (estimate)</span>
          <span className="text-xl font-bold font-mono text-accent block mt-0.5">{rm(taxIncluded)}</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-subtle tracking-wider block">Transactions this month</span>
          <span className="text-xl font-bold font-mono text-ink block mt-0.5">{monthTransactions.length}</span>
        </div>
      </div>

      {/* 3. SUB-TAB NAVIGATION BAR */}
      <div className="flex items-stretch gap-0 bg-surface-strong border-b border-line text-xs font-bold h-10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ledger' 
              ? 'bg-chrome text-white font-bold' 
              : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Transactions Ledger ({transactions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'claims' 
              ? 'bg-chrome text-white font-bold' 
              : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Panel claims ({claimsList.length})</span>
          {pendingClaimTrx.length > 0 && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold px-1.5 py-0.5 rounded-none ml-1">
              {pendingClaimTrx.length} Pending
            </span>
          )}
        </button>

      </div>

      {/* 4. LEDGER TAB VIEW */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Search Bar (Only when transactions exist) */}
          {transactions.length > 0 && (
            <div className="bg-surface-muted border border-line-subtle p-3.5 rounded-none shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search patient name, receipt no., GL or reference..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-surface border border-line-subtle text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand" 
                />
              </div>

              <div className="text-xs text-muted font-bold">
                Showing <strong className="text-accent font-mono">{filteredLedger.length}</strong> of {transactions.length} Transactions
              </div>
            </div>
          )}

          {/* 2-COLUMN ONBOARDING EMPTY STATE (When 0 transactions exist) */}
          {transactions.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
              
              {/* Left Hero Card */}
              <div className="lg:col-span-7 bg-surface border border-line-subtle p-8 rounded-none shadow-xs space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-none bg-surface-accent border border-line text-accent flex items-center justify-center shadow-md">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="type-section-title text-ink">Your financial ledger is empty</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Outpatient visit billing, co-payments, and corporate panel e-GL claims will automatically log to this ledger as patient consultations conclude.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-5 py-3 bg-surface-accent text-accent font-bold text-xs border border-line rounded-none flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Awaiting Patient Consultations</span>
                  </button>
                </div>
              </div>

              {/* Right Workflow Guide */}
              <div className="lg:col-span-5 bg-surface-muted border border-line-subtle p-6 rounded-none space-y-4 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="type-label text-accent flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    <span>Financial Billing Workflow</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                      <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong className="text-ink block font-bold">Patient Registration &amp; Panel Check</strong>
                        <span className="text-2xs text-muted">Scan MyKad to verify corporate panel eligibility.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                      <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-ink block font-bold">Consultation &amp; Prescription Billing</strong>
                        <span className="text-2xs text-muted">Dispensed medications and doctor fees auto-calculate.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                      <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-ink block font-bold">Cashless e-GL or Cash Settlement</strong>
                        <span className="text-2xs text-muted">Dispatch claim to TPA gateway or collect cash/card.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-line-subtle text-2xs text-accent font-bold flex items-center justify-between">
                  <span>SST 6% Compliant Billing Architecture</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

            </div>
          )}

          {/* SEARCH NO RESULTS STATE */}
          {transactions.length > 0 && filteredLedger.length === 0 && (
            <div className="bg-surface border border-line-subtle p-10 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="type-card-title text-ink">
                No financial transactions found matching &ldquo;{searchQuery}&rdquo;
              </h4>
              <p className="text-xs text-subtle">
                Try a patient name, receipt number, GL or reference.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Search Filter</span>
              </button>
            </div>
          )}

          {/* LEDGER TABLE (When transactions exist) */}
          {filteredLedger.length > 0 && (
            <div className="bg-surface border border-line-subtle rounded-none shadow-2xs overflow-x-auto animate-fadeIn">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
                  <tr>
                    <th className="px-6 py-3.5">Transaction Details</th>
                    <th className="px-6 py-3.5">Payment Method</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Total Amount</th>
                    <th className="px-6 py-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {filteredLedger.map((trx) => (
                    <tr key={trx.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-ink text-xs">{trx.patientName ?? 'Patient not recorded'}</p>
                        <p className="text-2xs text-subtle font-mono mt-0.5">
                          {trx.receiptNo ?? 'No receipt no. (older payment)'} • {new Date(trx.date).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-none text-2xs font-bold uppercase border ${
                          trx.paymentMethod === 'Cash' ? 'chip-ok' :
                          trx.paymentMethod === 'Panel' ? 'chip-info' :
                          'chip-info'
                        }`}>
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-2xs font-bold uppercase border px-2 py-0.5 ${
                          trx.status === 'Completed' || trx.status === 'Claim Paid' ? 'chip-ok' : 'chip-warn'
                        }`}>
                          {trx.status === 'Completed' || trx.status === 'Claim Paid' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          {trx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-ink">
                        <p className="text-xs font-bold">RM {(trx.paidAmount + trx.panelClaimed).toFixed(2)}</p>
                        {trx.panelClaimed > 0 && (
                          <p className="text-2xs text-accent font-normal">
                            (RM {trx.paidAmount.toFixed(2)} copay + RM {trx.panelClaimed.toFixed(2)} panel)
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => printReceipt(trx)}
                          className="text-accent font-bold text-2xs uppercase hover:underline cursor-pointer"
                          aria-label={`Reprint receipt for ${trx.patientName ?? 'patient'}`}
                        >
                          Reprint
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* 5. PANEL CLAIMS TAB VIEW */}
      {activeTab === 'claims' && (
        <div className="bg-surface border border-line-subtle rounded-none shadow-2xs overflow-hidden animate-fadeIn">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-surface-accent text-ink font-bold uppercase text-2xs tracking-wider border-b border-line">
              <tr>
                <th className="px-6 py-3.5">Claim Details</th>
                <th className="px-6 py-3.5">Patient / Visit</th>
                <th className="px-6 py-3.5">Amount Claimed</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-subtle">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-accent opacity-50" />
                    <p className="text-xs font-bold text-ink">No panel claims match your criteria.</p>
                  </td>
                </tr>
              ) : filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-ink flex items-center gap-2">
                      {claim.id}
                      {claim.status === 'Pending Claim' ? (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-2xs uppercase font-bold">Pending</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 text-2xs uppercase font-bold">Paid</span>
                      )}
                    </p>
                    <p className="text-2xs text-subtle mt-0.5 font-mono">
                      GL Ref: <span className="font-bold text-accent">{claim.glNumber || 'N/A'}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-ink font-bold">{claim.patientName ?? 'Patient not recorded'}</p>
                    <p className="text-2xs text-subtle font-mono">{claim.receiptNo ?? 'No receipt no.'}{claim.panelName ? ` · ${claim.panelName}` : ''}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-accent">
                    RM {claim.panelClaimed.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {claim.status === 'Pending Claim' ? (
                      <button 
                        type="button"
                        onClick={() => openSettle(claim)}
                        className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-none text-2xs font-bold uppercase transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Record payment</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-xs font-bold flex flex-col items-center gap-0.5">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Paid</span>
                        {(claim.claimReceivedOn || claim.claimReference) && (
                          <span className="text-2xs text-subtle font-mono font-normal">
                            {claim.claimReceivedOn ?? ''}{claim.claimReceivedOn && claim.claimReference ? ' · ' : ''}{claim.claimReference ?? ''}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD A PANEL PAYMENT */}
      {settling && (
        <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget && !claimSaving) setSettling(null); }}>
          <div role="dialog" aria-modal="true" aria-label="Record panel payment" className="bg-surface rounded-none shadow-2xl max-w-sm w-full border border-line p-6 space-y-4">
            <h3 className="type-heading-caps text-ink">Record panel payment</h3>
            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between"><span className="text-subtle">Claim</span><span>{settling.id}</span></div>
              <div className="flex justify-between"><span className="text-subtle">GL reference</span><span>{settling.glNumber ?? 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Amount claimed</span><strong className="text-accent">{rm(settling.panelClaimed)}</strong></div>
            </div>
            <p className="text-xs text-muted leading-relaxed">Record this only after the panel's payment has reached the clinic. Enter the reference from its remittance or statement.</p>
            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="claim-ref" className="block text-2xs font-bold text-subtle uppercase tracking-wider mb-1">Panel payment / statement reference</label>
                <input id="claim-ref" autoFocus type="text" value={claimRef} onChange={(e) => setClaimRef(e.target.value)} className="w-full border border-line px-3 py-2 text-sm font-mono rounded-none bg-white focus:ring-1 focus:ring-brand outline-none" />
              </div>
              <div>
                <label htmlFor="claim-date" className="block text-2xs font-bold text-subtle uppercase tracking-wider mb-1">Date received</label>
                <input id="claim-date" type="date" max={today} value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className="w-full border border-line px-3 py-2 text-sm rounded-none bg-white focus:ring-1 focus:ring-brand outline-none" />
              </div>
            </div>
            {claimError && <p role="alert" className="text-xs text-rose-700 font-medium">{claimError}</p>}
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setSettling(null)} disabled={claimSaving} className="px-3 py-2 border border-line text-muted rounded-none text-xs hover:bg-surface-strong cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void saveSettle()} disabled={claimSaving || !claimRef.trim() || !receivedOn} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                {claimSaving && <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin" aria-hidden="true" />}
                {claimSaving ? 'Saving…' : 'Record payment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
