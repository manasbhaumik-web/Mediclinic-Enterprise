import React, { useState } from 'react';
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

      {/* Header Banner */}
      <div className="bg-surface border border-line p-4 rounded-none flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-white rounded-none">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">
              Corporate Panel &amp; TPA Direct Settlement Hub
            </h2>
            <p className="text-xs text-muted">
              MiCare, PMCare, HealthMetrics, MediExpress, AIA Guarantee Letter (GL) Batch Reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2 px-3 bg-surface hover:bg-surface-accent border border-line text-xs font-bold text-ink flex items-center gap-1.5 rounded-none cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="py-2 px-3 bg-surface hover:bg-surface-accent border border-line text-xs font-bold text-ink flex items-center gap-1.5 rounded-none cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-accent" />
            <span>Export e-Claim JSON</span>
          </button>
          <button
            type="button"
            onClick={handleBatchSubmit}
            disabled={pendingCount === 0}
            className="py-2 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 rounded-none cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Batch Submit Pending ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-surface border border-line">
          <span className="text-2xs font-mono uppercase text-muted">Total Panel Billed</span>
          <p className="text-xl font-bold font-mono text-ink mt-1">RM {totalBilled.toFixed(2)}</p>
          <span className="text-3xs text-muted font-mono">{filteredClaims.length} active claims</span>
        </div>
        <div className="p-3.5 bg-surface border border-line">
          <span className="text-2xs font-mono uppercase text-muted">Pending Submission</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-3xs text-muted font-mono">Ready for daily portal batch</span>
        </div>
        <div className="p-3.5 bg-surface border border-line">
          <span className="text-2xs font-mono uppercase text-muted">Disputed / Short-Paid</span>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">{shortPaidCount}</p>
          <span className="text-3xs text-muted font-mono">Requires reconciliation / write-off</span>
        </div>
        <div className="p-3.5 bg-surface border border-line">
          <span className="text-2xs font-mono uppercase text-muted">Supported Insurers / TPAs</span>
          <p className="text-xl font-bold font-mono text-primary mt-1">{KNOWN_TPA_PROVIDERS.length}</p>
          <span className="text-3xs text-muted font-mono">Direct API / GL ready</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface border border-line p-3 rounded-none flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* TPA Providers Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedProvider('All')}
            className={`py-1.5 px-3 font-bold border transition-colors cursor-pointer ${
              selectedProvider === 'All' ? 'bg-primary text-white border-primary' : 'bg-surface border-line text-ink hover:bg-surface-accent'
            }`}
          >
            All TPAs ({claims.length})
          </button>
          {KNOWN_TPA_PROVIDERS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProvider(p.id)}
              className={`py-1.5 px-3 font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                selectedProvider === p.id ? 'bg-primary text-white border-primary' : 'bg-surface border-line text-ink hover:bg-surface-accent'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, IC, or GL #"
              className="pl-8 pr-3 py-1.5 border border-line bg-surface text-ink text-xs rounded-none w-52"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-line bg-surface text-ink text-xs font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Submission">Pending Submission</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Short-Paid">Short-Paid</option>
            <option value="Written-Off">Written-Off</option>
          </select>
        </div>
      </div>

      {/* Claims Master Table */}
      <div className="bg-surface border border-line rounded-none overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-line bg-surface-muted/40 text-2xs uppercase text-ink-muted font-mono">
              <th className="p-3">Claim Ref &amp; GL #</th>
              <th className="p-3">TPA &amp; Corporate Employer</th>
              <th className="p-3">Patient Particulars</th>
              <th className="p-3 text-right">Total Bill</th>
              <th className="p-3 text-right">Panel Billed</th>
              <th className="p-3 text-right">Remitted</th>
              <th className="p-3 text-right">Variance</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Reconciliation Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted">
                  No corporate claims match the active filters.
                </td>
              </tr>
            ) : (
              filteredClaims.map(claim => {
                const isShort = claim.status === 'Short-Paid';
                const isPending = claim.status === 'Pending Submission';
                const isApproved = claim.status === 'Approved';

                return (
                  <tr key={claim.id} className="border-b border-line/60 hover:bg-surface-accent">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-primary">{claim.id}</div>
                      <div className="text-2xs text-muted">{claim.glNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-ink">{claim.providerName}</div>
                      <div className="text-2xs text-muted">{claim.employerName}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-ink">{claim.patientName}</div>
                      <div className="text-2xs text-muted font-mono">{claim.patientIc}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-ink">
                      RM {claim.totalBillRM.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-primary">
                      RM {claim.panelBilledRM.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-ink">
                      {claim.remittedAmountRM !== undefined ? `RM ${claim.remittedAmountRM.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {claim.varianceAmountRM ? (
                        <span className="font-bold text-rose-600">-RM {claim.varianceAmountRM.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted">RM 0.00</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-2xs font-mono font-bold px-2 py-0.5 rounded-none ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        isShort ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {isShort ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReconcileClaim(claim);
                              setRemittedSumInput(claim.remittedAmountRM || claim.panelBilledRM);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-2xs font-bold rounded-none cursor-pointer"
                          >
                            Dispute Rationale
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkWrittenOff(claim.id)}
                            className="px-2 py-1 border border-line hover:bg-surface text-2xs text-ink rounded-none cursor-pointer"
                          >
                            Write Off
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReconcileClaim(claim);
                            setRemittedSumInput(claim.remittedAmountRM || claim.panelBilledRM);
                          }}
                          className="px-2 py-1 border border-line bg-surface hover:bg-surface-accent text-2xs font-bold text-ink rounded-none cursor-pointer"
                        >
                          Match Remittance
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
