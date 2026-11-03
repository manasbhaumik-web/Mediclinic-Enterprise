import React, { useState, useMemo } from 'react';
import { Visit } from '../../types';
import { 
  DenominationBreakdown, 
  MALAYSIAN_DENOMINATIONS, 
  calculateDenominationTotal, 
  generateShiftReconciliation,
  exportZReportText,
  exportShiftCsv,
  ShiftReconciliationReport
} from '../../domain/cashDrawer';
import { 
  Calculator, 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Coins, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';

interface CashDrawerReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierName?: string;
  counterId?: string;
  visits?: Visit[];
  onConfirmShiftClose?: (report: ShiftReconciliationReport) => void;
}

export default function CashDrawerReconciliationModal({
  isOpen,
  onClose,
  cashierName = 'Front Desk Cashier',
  counterId = 'Counter 1',
  visits = [],
  onConfirmShiftClose
}: CashDrawerReconciliationModalProps) {
  const [openingFloat, setOpeningFloat] = useState<number>(300.00);
  const [breakdown, setBreakdown] = useState<DenominationBreakdown>({
    rm100: 0,
    rm50: 2,
    rm20: 5,
    rm10: 6,
    rm5: 6,
    rm1: 10,
    sen50: 0,
    sen20: 0,
    sen10: 0
  });
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate real-time reconciliation report
  const reconciliation = useMemo(() => {
    return generateShiftReconciliation(
      visits,
      openingFloat,
      breakdown,
      cashierName,
      counterId,
      notes
    );
  }, [visits, openingFloat, breakdown, cashierName, counterId, notes]);

  if (!isOpen) return null;

  const handleCountChange = (key: keyof DenominationBreakdown, val: string) => {
    const count = Math.max(0, parseInt(val) || 0);
    setBreakdown(prev => ({
      ...prev,
      [key]: count
    }));
  };

  const handlePrintZReport = () => {
    const text = exportZReportText(reconciliation);
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Daily Z-Report - ${reconciliation.shiftDate}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 11px; margin: 15px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            ${text}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleExportCsv = () => {
    const csv = exportShiftCsv(reconciliation);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Z_Report_${reconciliation.shiftDate}_${counterId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('✓ Z-Report Shift Reconciliation CSV downloaded.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFinalizeShift = () => {
    if (onConfirmShiftClose) {
      onConfirmShiftClose(reconciliation);
    }
    setToastMessage('✓ Shift cash count closed and locked in daily financial ledger.');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1500);
  };

  const isBalanced = reconciliation.status === 'Balanced';
  const isOver = reconciliation.status === 'Overage';
  const isShort = reconciliation.status === 'Shortage';

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="reconciliation-modal-title"
      className="fixed inset-0 z-50 bg-night-950/75 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="bg-surface border-2 border-line w-full max-w-4xl max-h-[92vh] flex flex-col rounded-none animate-scaleUp overflow-hidden">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-900 text-white px-4 py-2.5 border-b border-emerald-400 flex items-center gap-2 text-xs font-bold tabular-nums">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-surface-muted/60 border-b border-line px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-white flex items-center justify-center rounded-none">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="reconciliation-modal-title" className="text-sm font-bold text-ink ">
                  Cash Drawer Float Count &amp; Daily Z-Report
                </h3>
                <span className="tabular-nums text-2xs uppercase px-2 py-0.5 border border-line bg-surface font-bold text-accent">
                  Shift End Balancing
                </span>
              </div>
              <p className="text-xs text-muted">
                Physical denomination float audit &amp; electronic register variance balancing.
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1 text-muted hover:text-ink cursor-pointer transition-colors"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Shift Details & Opening Float Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-muted/30 border border-line p-3 text-xs">
            <div>
              <span className="text-2xs tabular-nums text-muted uppercase">Register Station:</span>
              <div className="font-bold tabular-nums text-ink">{counterId} (Main Cashier)</div>
            </div>
            <div>
              <span className="text-2xs tabular-nums text-muted uppercase">Active Cashier:</span>
              <div className="font-bold text-ink">{cashierName}</div>
            </div>
            <div>
              <label htmlFor="opening-float-input" className="text-2xs tabular-nums text-muted uppercase block">
                Opening Cash Float (RM):
              </label>
              <input
                id="opening-float-input"
                type="number"
                step="1"
                min="0"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full mt-0.5 px-2 py-1 bg-surface border border-line tabular-nums font-bold text-xs text-ink focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Physical Denomination Counter (7 Cols) */}
            <div className="lg:col-span-7 border border-line p-4 bg-surface space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-base font-semibold text-ink flex items-center gap-2">
                  <Coins className="w-4 h-4 text-accent" />
                  Physical Cash Count Breakdown
                </span>
                <span className="tabular-nums text-xs font-bold text-ink">
                  Total Counted: <span className="text-primary tabular-nums text-sm">RM {reconciliation.actualCashCounted.toFixed(2)}</span>
                </span>
              </div>

              {/* Denominations Table */}
              <div className="divide-y divide-line/60 border border-line/60">
                {MALAYSIAN_DENOMINATIONS.map(den => {
                  const count = breakdown[den.key] || 0;
                  const lineTotal = count * den.value;
                  return (
                    <div key={den.key} className="flex items-center justify-between px-3 py-1.5 hover:bg-surface-muted/40 transition-colors text-xs tabular-nums">
                      <div className="flex items-center gap-2 w-32">
                        <span className={`w-2 h-2 rounded-none ${den.type === 'note' ? 'bg-primary' : 'bg-amber-600'}`} />
                        <span className="font-bold text-ink">{den.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted text-2xs">Qty:</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={count === 0 ? '' : count}
                          placeholder="0"
                          onChange={(e) => handleCountChange(den.key, e.target.value)}
                          className="w-16 px-2 py-0.5 text-right bg-surface border border-line text-xs font-bold text-ink rounded-none focus:outline-none focus:border-brand"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-ink">
                        RM {lineTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Variance & Balancing Summary (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Summary Card */}
              <div className="border border-line bg-surface p-4 space-y-3">
                <span className="text-base font-semibold text-ink flex items-center gap-2 border-b border-line pb-2">
                  <DollarSign className="w-4 h-4 text-accent" />
                  Drawer Reconciliation Audit
                </span>

                <div className="space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Opening Cash Float:</span>
                    <span className="font-bold text-ink">RM {reconciliation.openingFloat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/40">
                    <span className="text-muted">Shift Cash Collections:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      +RM {reconciliation.totalCashCollected.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-surface-muted/50 px-2 font-bold text-ink border-b border-line">
                    <span>Expected in Drawer:</span>
                    <span>RM {reconciliation.expectedCashInDrawer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 bg-surface-muted/50 px-2 font-bold text-ink border-b border-line">
                    <span>Physical Cash Counted:</span>
                    <span className="text-primary">RM {reconciliation.actualCashCounted.toFixed(2)}</span>
                  </div>

                  {/* Variance Box */}
                  <div className={`p-3 border flex items-center justify-between ${
                    isBalanced 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200' 
                      : isOver 
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-900 dark:text-blue-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div>
                      <div className="text-2xs font-bold">Variance Status</div>
                      <div className="text-base font-bold">
                        {reconciliation.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xs font-bold">Difference</div>
                      <div className="text-lg font-bold">
                        {reconciliation.variance >= 0 ? '+' : ''}RM {reconciliation.variance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Non-Cash Breakdown */}
                <div className="pt-2 border-t border-line text-2xs tabular-nums space-y-1 text-muted">
                  <div className="flex justify-between">
                    <span>Credit / Debit Card:</span>
                    <span>RM {reconciliation.totalCardCollected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>e-Wallet / QR Pay:</span>
                    <span>RM {reconciliation.totalEWalletCollected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corporate Panel Claims:</span>
                    <span>RM {reconciliation.totalPanelInvoiced.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink pt-1 border-t border-line/40">
                    <span>Total Shift Revenue:</span>
                    <span>RM {reconciliation.totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Cashier Notes */}
              <div className="space-y-1.5">
                <label htmlFor="cashier-recon-notes" className="text-2xs tabular-nums text-muted uppercase font-bold block">
                  Reconciliation Notes / Variance Reason:
                </label>
                <textarea
                  id="cashier-recon-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Balanced exact float; RM 2 round-off adjustment."
                  className="w-full p-2 bg-surface border border-line text-xs text-ink rounded-none focus:outline-none focus:border-brand resize-none"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-surface-muted/60 border-t border-line px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintZReport}
              className="btn-secondary flex items-center gap-1.5 tabular-nums text-xs px-3 py-1.5 cursor-pointer"
              title="Print formal thermal paper Daily Z-Report slip"
            >
              <Printer className="w-4 h-4" />
              <span>Print Z-Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary flex items-center gap-1.5 tabular-nums text-xs px-3 py-1.5 cursor-pointer"
              title="Export shift audit figures to spreadsheet CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-1.5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalizeShift}
              className="btn-primary flex items-center gap-2 text-xs px-5 py-1.5 font-bold cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Close Shift &amp; Balance Drawer</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
