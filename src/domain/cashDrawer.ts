import { Visit } from '../types';

export interface DenominationBreakdown {
  rm100: number;
  rm50: number;
  rm20: number;
  rm10: number;
  rm5: number;
  rm1: number;
  sen50: number;
  sen20: number;
  sen10: number;
}

export interface ShiftReconciliationReport {
  shiftDate: string;
  cashierName: string;
  counterId: string;
  openingFloat: number;
  totalCashCollected: number;
  totalCardCollected: number;
  totalEWalletCollected: number;
  totalPanelInvoiced: number;
  totalRevenue: number;
  expectedCashInDrawer: number;
  actualCashCounted: number;
  variance: number;
  status: 'Balanced' | 'Overage' | 'Shortage';
  denominations: DenominationBreakdown;
  transactionCount: number;
  explanation?: string;
  closedAt: string;
}

export function calculateDenominationTotal(d: DenominationBreakdown): number {
  return (
    (d.rm100 || 0) * 100 +
    (d.rm50 || 0) * 50 +
    (d.rm20 || 0) * 20 +
    (d.rm10 || 0) * 10 +
    (d.rm5 || 0) * 5 +
    (d.rm1 || 0) * 1 +
    (d.sen50 || 0) * 0.50 +
    (d.sen20 || 0) * 0.20 +
    (d.sen10 || 0) * 0.10
  );
}

export function generateShiftReconciliation(
  visits: Visit[],
  openingFloat: number,
  denominations: DenominationBreakdown,
  cashierName: string,
  counterId: string = 'Counter 1',
  explanation?: string
): ShiftReconciliationReport {
  let cash = 0;
  let card = 0;
  let ewallet = 0;
  let panel = 0;
  let count = 0;

  for (const v of visits) {
    if (v.status === 'Paid') {
      count++;
      const method = v.paymentMethod;
      const patientPaid = v.paidAmount || 0;
      const panelClaim = v.panelClaimed || 0;

      if (panelClaim > 0) {
        panel += panelClaim;
      }

      if (method === 'Cash') {
        cash += patientPaid;
      } else if (method === 'Credit Card') {
        card += patientPaid;
      } else if (method === 'e-Wallet') {
        ewallet += patientPaid;
      } else if (method === 'Panel') {
        // purely panel payment
      } else {
        // default to cash if paidAmount > 0 and no method specified
        if (patientPaid > 0) cash += patientPaid;
      }
    }
  }

  const expectedCash = openingFloat + cash;
  const actualCash = calculateDenominationTotal(denominations);
  const variance = Math.round((actualCash - expectedCash) * 100) / 100;

  let status: 'Balanced' | 'Overage' | 'Shortage' = 'Balanced';
  if (variance > 0.05) status = 'Overage';
  else if (variance < -0.05) status = 'Shortage';

  return {
    shiftDate: new Date().toISOString().substring(0, 10),
    cashierName,
    counterId,
    openingFloat,
    totalCashCollected: cash,
    totalCardCollected: card,
    totalEWalletCollected: ewallet,
    totalPanelInvoiced: panel,
    totalRevenue: cash + card + ewallet + panel,
    expectedCashInDrawer: expectedCash,
    actualCashCounted: actualCash,
    variance,
    status,
    denominations,
    transactionCount: count,
    explanation,
    closedAt: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }),
  };
}

export const MALAYSIAN_DENOMINATIONS: { key: keyof DenominationBreakdown; label: string; value: number; type: 'note' | 'coin' }[] = [
  { key: 'rm100', label: 'RM 100 Note', value: 100, type: 'note' },
  { key: 'rm50', label: 'RM 50 Note', value: 50, type: 'note' },
  { key: 'rm20', label: 'RM 20 Note', value: 20, type: 'note' },
  { key: 'rm10', label: 'RM 10 Note', value: 10, type: 'note' },
  { key: 'rm5', label: 'RM 5 Note', value: 5, type: 'note' },
  { key: 'rm1', label: 'RM 1 Note', value: 1, type: 'note' },
  { key: 'sen50', label: '50 Sen Coin', value: 0.50, type: 'coin' },
  { key: 'sen20', label: '20 Sen Coin', value: 0.20, type: 'coin' },
  { key: 'sen10', label: '10 Sen Coin', value: 0.10, type: 'coin' },
];

export function exportZReportText(r: ShiftReconciliationReport): string {
  return [
    '========================================',
    '       MEDICLINIC ENTERPRISE',
    '      DAILY Z-REPORT / SHIFT END',
    '========================================',
    `Date & Time: ${r.shiftDate} ${r.closedAt}`,
    `Register/Counter: ${r.counterId}`,
    `Cashier: ${r.cashierName}`,
    '----------------------------------------',
    `Opening Float:          RM ${r.openingFloat.toFixed(2)}`,
    `Cash Collections:       RM ${r.totalCashCollected.toFixed(2)}`,
    `Credit/Debit Card:      RM ${r.totalCardCollected.toFixed(2)}`,
    `e-Wallet / QR Pay:      RM ${r.totalEWalletCollected.toFixed(2)}`,
    `Corporate Panel Claims: RM ${r.totalPanelInvoiced.toFixed(2)}`,
    '----------------------------------------',
    `TOTAL SHIFT REVENUE:    RM ${r.totalRevenue.toFixed(2)}`,
    `TRANSACTIONS COUNTED:   ${r.transactionCount}`,
    '========================================',
    'DRAWER RECONCILIATION:',
    `Expected Cash in Drawer: RM ${r.expectedCashInDrawer.toFixed(2)}`,
    `Physical Cash Counted:   RM ${r.actualCashCounted.toFixed(2)}`,
    `VARIANCE:               ${r.variance >= 0 ? '+' : ''}RM ${r.variance.toFixed(2)}`,
    `STATUS:                 ${r.status.toUpperCase()}`,
    r.explanation ? `Notes: ${r.explanation}` : '',
    '========================================',
    'Certified correct by Cashier & Supervisor',
    'Signature: ______________________________',
    '========================================',
  ].filter(Boolean).join('\n');
}

export function exportShiftCsv(r: ShiftReconciliationReport): string {
  const headers = ['Field', 'Value'];
  const rows = [
    ['Shift Date', r.shiftDate],
    ['Closed At', r.closedAt],
    ['Counter ID', r.counterId],
    ['Cashier Name', r.cashierName],
    ['Opening Float (RM)', r.openingFloat.toFixed(2)],
    ['Cash Collected (RM)', r.totalCashCollected.toFixed(2)],
    ['Card Collected (RM)', r.totalCardCollected.toFixed(2)],
    ['e-Wallet Collected (RM)', r.totalEWalletCollected.toFixed(2)],
    ['Panel Invoiced (RM)', r.totalPanelInvoiced.toFixed(2)],
    ['Total Revenue (RM)', r.totalRevenue.toFixed(2)],
    ['Expected Cash in Drawer (RM)', r.expectedCashInDrawer.toFixed(2)],
    ['Physical Cash Counted (RM)', r.actualCashCounted.toFixed(2)],
    ['Variance (RM)', r.variance.toFixed(2)],
    ['Variance Status', r.status],
    ['Transaction Count', r.transactionCount.toString()],
    ['Notes', r.explanation || ''],
  ];
  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
}
