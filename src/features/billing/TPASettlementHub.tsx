import React, { useState } from 'react';
import { StatStrip } from '../../components/ui/StationChrome';
import { 
  Building2, CheckCircle2, AlertTriangle, FileSpreadsheet, 
  FileCode, RefreshCw, Send, DollarSign, Search, Filter, 
  ChevronRight, ArrowUpRight, ShieldCheck, X, FileText 
} from 'lucide-react';
import { 
  TPAClaimRecord, 
  KNOWN_TPA_PROVIDERS, 
  reconcileTPARemittance, 
  exportTPAClaimsCSV, 
  exportTPAClaimsJSON 
} from '../../domain/tpaPanelClaims';

export const TPASettlementHub: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mock Active TPA Claims Pool
  const [claims, setClaims] = useState<TPAClaimRecord[]>([
    {
      id: 'CLM-2026-001',
      visitId: 'VISIT-981',
      patientId: 'PT-101',
      patientName: 'Ahmad bin Razali',
      patientIc: '880101-14-5521',
      employerName: 'Petronas Dagangan Bhd',
      providerId: 'micare',
      providerName: 'MiCare TPA',
      glNumber: 'GL-MICARE-2026-55210',
      visitDate: '2026-10-31',
      status: 'Submitted',
      totalBillRM: 95.00,
      panelBilledRM: 60.00,
      patientCopayRM: 5.00,
      patientExcessRM: 30.00,
      lineItems: [
        { id: '1', name: 'Standard GP Consultation', category: 'Consultation', billedAmountRM: 35.00, isCovered: true },
        { id: '2', name: 'Augmentin 625mg Tablet', category: 'Medication', billedAmountRM: 30.00, isCovered: true },
        { id: '3', name: 'Vitamin C 1000mg Effervescent', category: 'Medication', billedAmountRM: 30.00, isCovered: false }
      ]
    },
    {
      id: 'CLM-2026-002',
      visitId: 'VISIT-982',
      patientId: 'PT-102',
      patientName: 'Tan Wei Loon',
      patientIc: '920412-10-5819',
      employerName: 'Maxis Broadband Sdn Bhd',
      providerId: 'healthmetrics',
      providerName: 'HealthMetrics Automated GL',
      glNumber: 'GL-HM-2026-58190',
      visitDate: '2026-10-30',
      status: 'Short-Paid',
      totalBillRM: 85.00,
      panelBilledRM: 75.00,
      patientCopayRM: 7.50,
      patientExcessRM: 2.50,
      remittedAmountRM: 65.00,
      varianceAmountRM: 10.00,
      lineItems: [
        { id: '1', name: 'Extended Consultation', category: 'Consultation', billedAmountRM: 45.00, approvedAmountRM: 35.00, varianceReason: 'Consultation capped at contractual fee RM 35', isCovered: true },
        { id: '2', name: 'Nebulizer Therapy (Salbutamol)', category: 'Procedure', billedAmountRM: 40.00, approvedAmountRM: 40.00, isCovered: true }
      ]
    },
    {
      id: 'CLM-2026-003',
      visitId: 'VISIT-983',
      patientId: 'PT-103',
      patientName: 'Siti Nurhaliza binti Osman',
      patientIc: '951120-14-6632',
      employerName: 'Tenaga Nasional Berhad (TNB)',
      providerId: 'pmcare',
      providerName: 'PMCare Corporate',
      glNumber: 'GL-PMCARE-2026-66321',
      visitDate: '2026-10-31',
      status: 'Pending Submission',
      totalBillRM: 55.00,
      panelBilledRM: 55.00,
      patientCopayRM: 0.00,
      patientExcessRM: 0.00,
      lineItems: [
        { id: '1', name: 'Standard GP Consultation', category: 'Consultation', billedAmountRM: 35.00, isCovered: true },
        { id: '2', name: 'Paracetamol 500mg', category: 'Medication', billedAmountRM: 8.00, isCovered: true },
        { id: '3', name: 'Cetirizine 10mg', category: 'Medication', billedAmountRM: 12.00, isCovered: true }
      ]
    }
  ]);

  // Remittance Reconciliation Modal State
  const [reconcileClaim, setReconcileClaim] = useState<TPAClaimRecord | null>(null);
  const [remittedSumInput, setRemittedSumInput] = useState<number>(0);
  const [disputeNotesInput, setDisputeNotesInput] = useState<string>('');

  const filteredClaims = claims.filter(c => {
    const matchesProvider = selectedProvider === 'All' || c.providerId === selectedProvider;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientIc.includes(searchQuery) ||
      c.glNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesStatus && matchesSearch;
  });

  const totalBilled = filteredClaims.reduce((acc, c) => acc + c.panelBilledRM, 0);
  const pendingCount = claims.filter(c => c.status === 'Pending Submission').length;
  const shortPaidCount = claims.filter(c => c.status === 'Short-Paid').length;

  const handleExportCSV = () => {
    const csv = exportTPAClaimsCSV(filteredClaims);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TPA_Claims_Batch_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setToastMessage(`✓ Exported ${filteredClaims.length} claims to CSV.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportJSON = () => {
    const json = exportTPAClaimsJSON(filteredClaims);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TPA_eClaim_Portal_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setToastMessage(`✓ Exported e-Claim batch JSON for TPA API upload.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBatchSubmit = () => {
    setClaims(prev => prev.map(c => {
      if (c.status === 'Pending Submission') {
        return { ...c, status: 'Submitted', submittedAt: new Date().toISOString() };
      }
      return c;
    }));
    setToastMessage(`✓ All pending claims marked as Submitted to TPA portals.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyRemittance = () => {
    if (!reconcileClaim) return;
    const updated = reconcileTPARemittance(reconcileClaim, remittedSumInput);
    if (disputeNotesInput.trim()) {
      updated.disputeNotes = disputeNotesInput.trim();
    }
    setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
    setReconcileClaim(null);
    setToastMessage(`✓ Remittance reconciled for ${updated.glNumber}. Status: ${updated.status}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkWrittenOff = (claimId: string) => {
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'Written-Off', writeOffReason: 'Contractual discount adjustment accepted' } : c));
    setToastMessage('✓ Variance written off to contractual adjustments.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn pb-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] bg-emerald-900 text-white px-5 py-3 border border-emerald-400 rounded-none shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <StatStrip
        label="Claim figures"
        stats={[
          { label: 'Total panel billed', value: `RM ${totalBilled.toFixed(2)}`, note: `${filteredClaims.length} active claims` },
          { label: 'Pending submission', value: pendingCount, note: 'Ready for the daily portal batch' },
          { label: 'Disputed or short-paid', value: shortPaidCount, tone: shortPaidCount > 0 ? 'danger' : 'default', note: 'Needs reconciliation or write-off' },
          { label: 'Supported panels', value: KNOWN_TPA_PROVIDERS.length, note: 'Insurers and TPAs, GL ready' },
        ]}
      />

      <section aria-labelledby="tpa-hub-title" className="bg-surface border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div>
            <h2 id="tpa-hub-title" className="text-base font-bold text-ink">Corporate TPA settlement</h2>
            <p className="mt-0.5 text-xs text-muted">Batch guarantee letter claims, match remittances and chase short payments</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleExportCSV} className="btn-secondary px-4 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-accent" aria-hidden="true" />
              Export CSV
            </button>
            <button type="button" onClick={handleExportJSON} className="btn-secondary px-4 text-sm">
              <FileCode className="w-4 h-4 text-accent" aria-hidden="true" />
              Export e-Claim JSON
            </button>
            <button type="button" onClick={handleBatchSubmit} disabled={pendingCount === 0} className="btn-primary px-5 text-sm">
              <Send className="w-4 h-4" aria-hidden="true" />
              Submit pending batch ({pendingCount})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
          <div role="group" aria-label="Filter by panel" className="flex flex-wrap border border-line bg-surface">
            {[{ id: 'All', name: `All panels (${claims.length})` }, ...KNOWN_TPA_PROVIDERS.map((p) => ({ id: p.id, name: p.name }))].map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={selectedProvider === p.id}
                onClick={() => setSelectedProvider(p.id)}
                className={`min-h-11 px-4 text-sm whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${i > 0 ? 'border-l border-line' : ''} ${
                  selectedProvider === p.id ? 'bg-primary text-white font-bold' : 'text-muted font-semibold hover:bg-surface-strong hover:text-ink'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <label htmlFor="tpa-search" className="sr-only">Search claims</label>
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="tpa-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, IC or GL number"
                autoComplete="off"
                className="w-64 min-h-11 pl-10 pr-3 bg-surface border border-line text-sm text-ink placeholder:text-muted rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
              />
            </div>
            <label htmlFor="tpa-status" className="sr-only">Claim status</label>
            <select
              id="tpa-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-11 px-3 bg-surface border border-line text-sm text-ink rounded-none outline-none focus:border-brand focus:ring-2 focus:ring-accent"
            >
              <option value="All">All statuses</option>
              <option value="Pending Submission">Pending submission</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Short-Paid">Short-paid</option>
              <option value="Written-Off">Written off</option>
            </select>
          </div>
        </div>

        {/* Claims table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-xs font-semibold text-muted [&>th]:px-4 [&>th]:py-3 [&>th]:bg-surface-muted [&>th]:border-b [&>th]:border-line [&>th]:whitespace-nowrap">
                <th scope="col">Claim and GL no.</th>
                <th scope="col">TPA and employer</th>
                <th scope="col">Patient</th>
                <th scope="col" className="text-right">Total bill</th>
                <th scope="col" className="text-right">Panel billed</th>
                <th scope="col" className="text-right">Remitted</th>
                <th scope="col" className="text-right">Variance</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right sticky right-0 !bg-surface-muted">Action</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:px-4 [&>tr>td]:py-3.5 [&>tr>td]:bg-surface [&>tr>td]:border-b [&>tr>td]:border-line-subtle [&>tr>td]:align-top [&>tr:hover>td]:bg-surface-accent">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="!py-12 text-center text-sm text-muted">
                    No corporate claims match the active filters.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isShort = claim.status === 'Short-Paid';
                  const isPending = claim.status === 'Pending Submission';
                  const isApproved = claim.status === 'Approved';
                  const chip = isApproved ? 'chip-ok' : isShort ? 'chip-danger' : isPending ? 'chip-warn' : 'chip-info';
                  const open = () => {
                    setReconcileClaim(claim);
                    setRemittedSumInput(claim.remittedAmountRM || claim.panelBilledRM);
                  };

                  return (
                    <tr key={claim.id}>
                      <td>
                        <div className="font-bold text-accent tabular-nums">{claim.id}</div>
                        <div className="mt-0.5 text-xs text-muted tabular-nums">{claim.glNumber}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-ink">{claim.providerName}</div>
                        <div className="mt-0.5 text-xs text-muted">{claim.employerName}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-ink">{claim.patientName}</div>
                        <div className="mt-0.5 text-xs text-muted tabular-nums">{claim.patientIc}</div>
                      </td>
                      <td className="text-right tabular-nums text-ink">RM {claim.totalBillRM.toFixed(2)}</td>
                      <td className="text-right tabular-nums font-bold text-accent">RM {claim.panelBilledRM.toFixed(2)}</td>
                      <td className="text-right tabular-nums text-ink">
                        {claim.remittedAmountRM !== undefined ? `RM ${claim.remittedAmountRM.toFixed(2)}` : '—'}
                      </td>
                      <td className="text-right tabular-nums">
                        {claim.varianceAmountRM ? (
                          <span className="font-bold text-rose-700 dark:text-rose-300">-RM {claim.varianceAmountRM.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted">RM 0.00</span>
                        )}
                      </td>
                      <td>
                        <span className={`${chip} px-2.5 py-1 text-xs font-bold`}>{claim.status}</span>
                      </td>
                      <td className="text-right sticky right-0 whitespace-nowrap shadow-[-8px_0_8px_-8px_rgba(15,60,76,0.15)]">
                        {isShort ? (
                          <div className="inline-flex items-center gap-2">
                            <button type="button" onClick={open} className="btn-danger px-3 text-xs">Dispute rationale</button>
                            <button type="button" onClick={() => handleMarkWrittenOff(claim.id)} className="btn-secondary px-3 text-xs">Write off</button>
                          </div>
                        ) : (
                          <button type="button" onClick={open} className="btn-secondary px-3 text-xs">Match remittance</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-line text-xs text-muted">
          Showing {filteredClaims.length} of {claims.length} claims
        </div>
      </section>

      {/* Remittance & Line-Item Variance Modal */}
      {reconcileClaim && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface border border-line w-full max-w-2xl rounded-none shadow-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  TPA Remittance Matching: {reconcileClaim.glNumber}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setReconcileClaim(null)}
                className="text-muted hover:text-ink text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-surface-muted/30 p-2.5 border border-line text-2xs">
                <div><strong>Patient:</strong> {reconcileClaim.patientName} ({reconcileClaim.patientIc})</div>
                <div><strong>Employer:</strong> {reconcileClaim.employerName}</div>
                <div><strong>Provider:</strong> {reconcileClaim.providerName}</div>
                <div><strong>Panel Billed:</strong> RM {reconcileClaim.panelBilledRM.toFixed(2)}</div>
              </div>

              {/* Line-item breakdown */}
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-muted block mb-1.5">
                  Line-Item Claims Breakdown &amp; Variance
                </span>
                <div className="border border-line divide-y divide-line">
                  {reconcileClaim.lineItems.map((item, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between text-2xs">
                      <div>
                        <span className="font-bold text-ink">{item.name}</span>
                        {item.varianceReason && (
                          <div className="text-rose-600 font-mono mt-0.5">{item.varianceReason}</div>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        <div>Billed: RM {item.billedAmountRM.toFixed(2)}</div>
                        {item.approvedAmountRM !== undefined && (
                          <div className="text-emerald-700 font-bold">Approved: RM {item.approvedAmountRM.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-2xs font-bold uppercase text-muted mb-1">
                    Actual Remitted / Approved Amount (RM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={remittedSumInput}
                    onChange={(e) => setRemittedSumInput(Number(e.target.value))}
                    className="w-full p-2 border border-line bg-surface text-ink font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-muted mb-1">
                    Dispute Justification Rationale (If Short-Paid)
                  </label>
                  <input
                    type="text"
                    value={disputeNotesInput}
                    onChange={(e) => setDisputeNotesInput(e.target.value)}
                    placeholder="e.g. Special procedure approved by Dr on-call"
                    className="w-full p-2 border border-line bg-surface text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReconcileClaim(null)}
                className="px-3 py-1.5 border border-line text-xs font-bold text-ink hover:bg-surface-accent rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRemittance}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-none flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Remittance &amp; Reconcile</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
