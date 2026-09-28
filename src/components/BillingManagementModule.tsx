import React, { useState } from 'react';
import { 
  CreditCard, DollarSign, Search, FileText, CheckCircle, Clock, 
  ShieldCheck, FileSpreadsheet, Plus, UploadCloud, RefreshCw, 
  Activity, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useFinancials } from '../context/FinancialContext';
import { useSettings } from '../context/SettingsContext';

export default function BillingManagementModule() {
  const { transactions, markClaimAsPaid } = useFinancials();
  const { settings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'ledger' | 'claims' | 'reconciliation'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-Reconciliation State
  const [isUploading, setIsUploading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationComplete, setReconciliationComplete] = useState(false);
  const [reconciledCount, setReconciledCount] = useState(0);

  // Calculate Metrics
  const totalRevenue = transactions
    .filter(t => t.status === 'Completed' || t.status === 'Claim Paid')
    .reduce((sum, t) => sum + t.paidAmount + t.panelClaimed, 0);

  const pendingClaims = transactions
    .filter(t => t.status === 'Pending Claim')
    .reduce((sum, t) => sum + t.panelClaimed, 0);

  const TAX_RATE = settings.billing.taxRate / 100;
  const taxLiability = totalRevenue - (totalRevenue / (1 + TAX_RATE));

  // Filtered lists
  const filteredLedger = transactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.visitId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const claimsList = transactions.filter(t => t.paymentMethod === 'Panel');
  const filteredClaims = claimsList.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.glNumber && t.glNumber.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <span className="flex items-center gap-1 text-2xs text-accent bg-teal-50 px-2 py-0.5 rounded-none border border-line font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              SST {settings.billing.taxRate}% Active
            </span>
          </div>
          <h1 className="type-page-title text-ink flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-accent" />
            Billing &amp; TPA Claims Management
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
            Oversee clinic revenue, TPA panel claims, payment reconciliation, and automated receipt generation.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="bg-white hover:bg-teal-50 text-deep text-xs font-bold px-3 py-2 rounded-none flex items-center gap-1.5 border border-line transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />
            <span>Export Financials</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">MTD Clinic Revenue</span>
          <span className="text-xl font-bold font-mono text-ink block mt-0.5">RM {totalRevenue.toFixed(2)}</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Pending TPA Claims</span>
          <span className={`text-xl font-bold font-mono block mt-0.5 ${pendingClaims > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            RM {pendingClaims.toFixed(2)}
          </span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Tax Liability (SST {settings.billing.taxRate}%)</span>
          <span className="text-xl font-bold font-mono text-accent block mt-0.5">RM {taxLiability.toFixed(2)}</span>
        </div>

        <div className="bg-surface-accent border border-line p-3.5 rounded-none shadow-2xs">
          <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block">Reconciliation Status</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-0.5">Fully Synced</span>
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
          <span>TPA Panel Claims ({claimsList.length})</span>
          {pendingClaims > 0 && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-2xs font-bold px-1.5 py-0.5 rounded-none ml-1">
              {transactions.filter(t => t.status === 'Pending Claim').length} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 h-full border-0 rounded-none transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reconciliation' 
              ? 'bg-chrome text-white font-bold' 
              : 'bg-transparent text-ink hover:bg-surface-strong font-bold'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Auto-Reconciliation</span>
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
                  placeholder="Search Trx ID, Patient ID, or GL Number..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-surface border border-line-subtle text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-brand" 
                />
              </div>

              <div className="text-xs text-slate-600 font-bold">
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
                    <p className="text-xs text-slate-600 leading-relaxed">
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
                        <span className="text-2xs text-slate-600">Scan MyKad to verify corporate panel eligibility.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                      <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">2</span>
                      <div>
                        <strong className="text-ink block font-bold">Consultation &amp; Prescription Billing</strong>
                        <span className="text-2xs text-slate-600">Dispensed medications and doctor fees auto-calculate.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 bg-surface border border-line-subtle">
                      <span className="w-5 h-5 bg-primary text-white font-mono font-bold text-2xs flex items-center justify-center shrink-0">3</span>
                      <div>
                        <strong className="text-ink block font-bold">Cashless e-GL or Cash Settlement</strong>
                        <span className="text-2xs text-slate-600">Dispatch claim to TPA gateway or collect cash/card.</span>
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
              <p className="text-xs text-slate-500">
                Try refining your Trx ID, Patient ID, or GL Number query.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-surface-accent hover:bg-surface-strong text-accent font-bold text-xs border border-line cursor-pointer inline-flex items-center gap-1.5"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {filteredLedger.map((trx) => (
                    <tr key={trx.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-ink text-xs">{trx.id}</p>
                        <p className="text-2xs text-slate-500 font-mono mt-0.5">
                          {new Date(trx.date).toLocaleString()} • Visit: {trx.visitId} • Pt: {trx.patientId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-none text-2xs font-bold uppercase border ${
                          trx.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          trx.paymentMethod === 'Panel' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                          'bg-indigo-100 text-indigo-800 border-indigo-300'
                        }`}>
                          {trx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-2xs font-bold uppercase border px-2 py-0.5 ${
                          trx.status === 'Completed' || trx.status === 'Claim Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* 5. TPA CLAIMS TAB VIEW */}
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
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
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
                    <p className="text-2xs text-slate-500 mt-0.5 font-mono">
                      GL Ref: <span className="font-bold text-accent">{claim.glNumber || 'N/A'}</span>
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-ink font-bold">Pt ID: {claim.patientId}</p>
                    <p className="text-2xs text-slate-500 font-mono">Visit: {claim.visitId}</p>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-accent">
                    RM {claim.panelClaimed.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {claim.status === 'Pending Claim' ? (
                      <button 
                        type="button"
                        onClick={() => markClaimAsPaid(claim.id)}
                        className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-none text-2xs font-bold uppercase transition-colors flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Mark as Paid</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 text-xs font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Reconciled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. AUTO-RECONCILIATION TAB VIEW */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-surface-muted border border-line-subtle p-6 rounded-none shadow-2xs space-y-2">
            <h3 className="type-card-title text-ink flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-accent" /> Automated TPA Statement Reconciliation
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Upload AIA, PMCare, or MiCare monthly settlement statements here. Our system will automatically match the statement against your pending claims and update the clinic ledger in seconds.
            </p>
          </div>

          {!reconciliationComplete ? (
            <div className="bg-surface border-2 border-dashed border-line-subtle p-12 text-center transition-all hover:border-brand hover:bg-surface-muted group">
              {isReconciling ? (
                <div className="space-y-4">
                  <RefreshCw className="w-10 h-10 text-accent mx-auto animate-spin" />
                  <h4 className="font-bold text-ink">Reconciling TPA Claims...</h4>
                  <p className="text-xs text-slate-500">Matching statement IDs against clinic ledger...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="type-card-title text-ink mb-1">Drag &amp; Drop TPA Statement Statement</h4>
                  <p className="text-xs text-slate-500 mb-5">Supports .CSV, .XLSX, and .PDF statement formats</p>
                  
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => {
                      setIsUploading(true);
                      setTimeout(() => {
                        setIsUploading(false);
                        setIsReconciling(true);
                        setTimeout(() => {
                          const pending = transactions.filter(t => t.status === 'Pending Claim');
                          setReconciledCount(pending.length);
                          pending.forEach(p => markClaimAsPaid(p.id));
                          setIsReconciling(false);
                          setReconciliationComplete(true);
                        }, 2500);
                      }, 1000);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-none font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    {isUploading ? 'Uploading...' : 'Browse & Reconcile Statement'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-surface border border-line-subtle rounded-none overflow-hidden shadow-2xs">
              <div className="bg-surface-accent p-8 text-center border-b border-line">
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
                <h3 className="type-section-title text-ink mb-1">Reconciliation Complete!</h3>
                <p className="text-xs text-slate-600">Successfully matched and paid {reconciledCount} claims.</p>
              </div>
              <div className="p-6 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setReconciliationComplete(false);
                    setReconciledCount(0);
                  }}
                  className="bg-surface-accent hover:bg-surface-strong text-accent border border-line px-6 py-2.5 rounded-none text-xs font-bold transition-colors cursor-pointer"
                >
                  Upload Another Statement
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
