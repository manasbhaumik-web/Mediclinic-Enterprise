/**
 * Corporate Panel & TPA Guarantee Letter (GL) Pre-Authorization & Outpatient Excess Engine
 * Protects clinic from corporate claim rejections, clawbacks, and uncollected patient excess.
 */

export interface TPAPanelProvider {
  id: string;
  name: string;
  defaultVisitCap: number; // Standard GP Consultation + Medication limit (e.g. RM 65)
  defaultCopayType: 'None' | 'Fixed' | 'Percentage';
  defaultCopayValue: number; // e.g. RM 5 fixed or 10%
  nonClaimableKeywords: string[];
}

export const KNOWN_TPA_PROVIDERS: TPAPanelProvider[] = [
  {
    id: 'micare',
    name: 'MiCare TPA',
    defaultVisitCap: 65.00,
    defaultCopayType: 'Fixed',
    defaultCopayValue: 5.00,
    nonClaimableKeywords: ['vitamin', 'supplement', 'lozenge', 'skincare', 'cosmetic', 'whitening']
  },
  {
    id: 'pmcare',
    name: 'PMCare Corporate',
    defaultVisitCap: 60.00,
    defaultCopayType: 'None',
    defaultCopayValue: 0,
    nonClaimableKeywords: ['vitamin', 'supplement', 'lozenge', 'acne', 'cream', 'moisturizer']
  },
  {
    id: 'healthmetrics',
    name: 'HealthMetrics Automated GL',
    defaultVisitCap: 75.00,
    defaultCopayType: 'Percentage',
    defaultCopayValue: 10.00, // 10% patient copay
    nonClaimableKeywords: ['supplement', 'tonic', 'herbal', 'vitamin', 'aesthetic']
  },
  {
    id: 'mediexpress',
    name: 'MediExpress TPA',
    defaultVisitCap: 60.00,
    defaultCopayType: 'None',
    defaultCopayValue: 0,
    nonClaimableKeywords: ['vitamin', 'supplement', 'sunscreen', 'cosmetic']
  },
  {
    id: 'aia',
    name: 'AIA Corporate Care',
    defaultVisitCap: 80.00,
    defaultCopayType: 'Fixed',
    defaultCopayValue: 10.00,
    nonClaimableKeywords: ['vitamin', 'supplement', 'slimming', 'cosmeceutical']
  }
];

export interface BillItem {
  id: string;
  name: string;
  category: 'Consultation' | 'Medication' | 'Procedure' | 'Lab' | 'Consumable';
  price: number;
}

export interface TPAClaimCalculationResult {
  totalBill: number;
  visitCap: number;
  claimableTotal: number;
  nonClaimableTotal: number;
  patientCopay: number;
  panelPayable: number;
  patientTotalDue: number; // nonClaimable + excess over cap + copay
  nonClaimableItems: BillItem[];
  claimableItems: BillItem[];
  excessOverCap: number;
}

export function isItemNonClaimable(itemName: string, tpaProvider: TPAPanelProvider): boolean {
  const lower = itemName.toLowerCase();
  return tpaProvider.nonClaimableKeywords.some(kw => lower.includes(kw));
}

export function calculateTPAClaimSplit(
  items: BillItem[],
  tpaProvider: TPAPanelProvider,
  customCap?: number,
  customCopay?: { type: 'None' | 'Fixed' | 'Percentage'; value: number }
): TPAClaimCalculationResult {
  const cap = typeof customCap === 'number' ? customCap : tpaProvider.defaultVisitCap;
  const copayType = customCopay ? customCopay.type : tpaProvider.defaultCopayType;
  const copayValue = customCopay ? customCopay.value : tpaProvider.defaultCopayValue;

  let totalBill = 0;
  let claimableTotal = 0;
  let nonClaimableTotal = 0;
  const claimableItems: BillItem[] = [];
  const nonClaimableItems: BillItem[] = [];

  for (const item of items) {
    totalBill += item.price;
    if (isItemNonClaimable(item.name, tpaProvider)) {
      nonClaimableTotal += item.price;
      nonClaimableItems.push(item);
    } else {
      claimableTotal += item.price;
      claimableItems.push(item);
    }
  }

  // Calculate Copay on claimable portion
  let patientCopay = 0;
  if (copayType === 'Fixed') {
    patientCopay = Math.min(copayValue, claimableTotal);
  } else if (copayType === 'Percentage') {
    patientCopay = (claimableTotal * copayValue) / 100;
  }

  const claimableAfterCopay = Math.max(0, claimableTotal - patientCopay);

  // Apply Cap
  let panelPayable = 0;
  let excessOverCap = 0;

  if (claimableAfterCopay > cap) {
    panelPayable = cap;
    excessOverCap = claimableAfterCopay - cap;
  } else {
    panelPayable = claimableAfterCopay;
    excessOverCap = 0;
  }

  const patientTotalDue = nonClaimableTotal + patientCopay + excessOverCap;

  return {
    totalBill: Number(totalBill.toFixed(2)),
    visitCap: Number(cap.toFixed(2)),
    claimableTotal: Number(claimableTotal.toFixed(2)),
    nonClaimableTotal: Number(nonClaimableTotal.toFixed(2)),
    patientCopay: Number(patientCopay.toFixed(2)),
    panelPayable: Number(panelPayable.toFixed(2)),
    patientTotalDue: Number(patientTotalDue.toFixed(2)),
    nonClaimableItems,
    claimableItems,
    excessOverCap: Number(excessOverCap.toFixed(2))
  };
}

/**
 * ---------------------------------------------------------------------------
 * TPA Real-Time Policy Verification & GL Retrieval
 * ---------------------------------------------------------------------------
 */
export interface TPAPolicyVerificationResult {
  isEligible: boolean;
  glNumber: string;
  memberId: string;
  employerName: string;
  providerName: string;
  remainingAnnualLimitRM: number;
  perVisitCapRM: number;
  copayType: 'None' | 'Fixed' | 'Percentage';
  copayValue: number;
  policyExpiryDate: string;
  ineligibleReason?: string;
  nonCoveredCategories: string[];
}

export function verifyTPAPolicyEligibility(params: {
  patientIc: string;
  providerId: string;
  employerName?: string;
  memberId?: string;
}): TPAPolicyVerificationResult {
  const provider = KNOWN_TPA_PROVIDERS.find(p => p.id === params.providerId) || KNOWN_TPA_PROVIDERS[0];
  const employer = params.employerName || 'Petronas Dagangan Bhd';
  const cleanIc = params.patientIc.replace(/\D/g, '');

  // Deterministic mock verification based on IC
  const isExpired = cleanIc.endsWith('0000');
  if (isExpired) {
    return {
      isEligible: false,
      glNumber: '',
      memberId: params.memberId || `MEM-${cleanIc.slice(-6)}`,
      employerName: employer,
      providerName: provider.name,
      remainingAnnualLimitRM: 0,
      perVisitCapRM: provider.defaultVisitCap,
      copayType: provider.defaultCopayType,
      copayValue: provider.defaultCopayValue,
      policyExpiryDate: '2025-12-31',
      ineligibleReason: 'Policy expired on 31 Dec 2025. Corporate employer renewal pending.',
      nonCoveredCategories: provider.nonClaimableKeywords
    };
  }

  const hashNum = cleanIc.split('').reduce((acc, char) => acc + parseInt(char || '0', 10), 0);
  const remainingAnnual = 850.00 + (hashNum * 15);
  const glNum = `GL-${provider.id.toUpperCase()}-${new Date().getFullYear()}-${cleanIc.slice(-5)}`;

  return {
    isEligible: true,
    glNumber: glNum,
    memberId: params.memberId || `MEM-${cleanIc.slice(-6)}`,
    employerName: employer,
    providerName: provider.name,
    remainingAnnualLimitRM: Number(remainingAnnual.toFixed(2)),
    perVisitCapRM: provider.defaultVisitCap,
    copayType: provider.defaultCopayType,
    copayValue: provider.defaultCopayValue,
    policyExpiryDate: `${new Date().getFullYear() + 1}-12-31`,
    nonCoveredCategories: provider.nonClaimableKeywords
  };
}

/**
 * ---------------------------------------------------------------------------
 * TPA Claim Lifecycle & Line-Item Remittance Variance Engine
 * ---------------------------------------------------------------------------
 */
export type TPAClaimStatus = 
  | 'Pending Submission' 
  | 'Submitted' 
  | 'Approved' 
  | 'Short-Paid' 
  | 'Disputed' 
  | 'Remitted' 
  | 'Written-Off';

export interface TPAClaimLineItem {
  id: string;
  name: string;
  category: string;
  billedAmountRM: number;
  approvedAmountRM?: number;
  varianceReason?: string;
  isCovered: boolean;
}

export interface TPAClaimRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  employerName: string;
  providerId: string;
  providerName: string;
  glNumber: string;
  visitDate: string;
  submittedAt?: string;
  status: TPAClaimStatus;
  lineItems: TPAClaimLineItem[];
  totalBillRM: number;
  panelBilledRM: number;
  patientCopayRM: number;
  patientExcessRM: number;
  remittedAmountRM?: number;
  varianceAmountRM?: number;
  disputeNotes?: string;
  writeOffReason?: string;
}

export function createTPAClaimRecord(params: {
  visitId: string;
  patientId: string;
  patientName: string;
  patientIc: string;
  employerName: string;
  providerId: string;
  glNumber: string;
  items: BillItem[];
}): TPAClaimRecord {
  const provider = KNOWN_TPA_PROVIDERS.find(p => p.id === params.providerId) || KNOWN_TPA_PROVIDERS[0];
  const split = calculateTPAClaimSplit(params.items, provider);

  const lineItems: TPAClaimLineItem[] = params.items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    billedAmountRM: item.price,
    isCovered: !isItemNonClaimable(item.name, provider)
  }));

  return {
    id: `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    visitId: params.visitId,
    patientId: params.patientId,
    patientName: params.patientName,
    patientIc: params.patientIc,
    employerName: params.employerName,
    providerId: provider.id,
    providerName: provider.name,
    glNumber: params.glNumber,
    visitDate: new Date().toISOString().split('T')[0],
    status: 'Pending Submission',
    lineItems,
    totalBillRM: split.totalBill,
    panelBilledRM: split.panelPayable,
    patientCopayRM: split.patientCopay,
    patientExcessRM: split.excessOverCap + split.nonClaimableTotal
  };
}

export function reconcileTPARemittance(
  claim: TPAClaimRecord,
  remittedTotal: number,
  remittedLines?: { itemName: string; approvedAmount: number; disputeReason?: string }[]
): TPAClaimRecord {
  const variance = Number((claim.panelBilledRM - remittedTotal).toFixed(2));
  const isFullSettlement = Math.abs(variance) <= 0.01;

  let updatedLines = [...claim.lineItems];
  if (remittedLines && remittedLines.length > 0) {
    updatedLines = claim.lineItems.map(item => {
      const match = remittedLines.find(r => r.itemName.toLowerCase() === item.name.toLowerCase());
      if (match) {
        return {
          ...item,
          approvedAmountRM: match.approvedAmount,
          varianceReason: match.disputeReason
        };
      }
      return item;
    });
  }

  return {
    ...claim,
    remittedAmountRM: remittedTotal,
    varianceAmountRM: variance,
    lineItems: updatedLines,
    status: isFullSettlement ? 'Approved' : 'Short-Paid'
  };
}

/**
 * ---------------------------------------------------------------------------
 * TPA Batch e-Claim Exporter (CSV / JSON)
 * ---------------------------------------------------------------------------
 */
export function exportTPAClaimsCSV(claims: TPAClaimRecord[]): string {
  const headers = [
    'Claim_ID',
    'GL_Reference',
    'TPA_Provider',
    'Employer',
    'Patient_Name',
    'NRIC_Passport',
    'Visit_Date',
    'Total_Bill_RM',
    'Panel_Billed_RM',
    'Patient_Excess_RM',
    'Status'
  ].join(',');

  const rows = claims.map(c => [
    c.id,
    c.glNumber,
    `"${c.providerName}"`,
    `"${c.employerName}"`,
    `"${c.patientName}"`,
    c.patientIc,
    c.visitDate,
    c.totalBillRM.toFixed(2),
    c.panelBilledRM.toFixed(2),
    c.patientExcessRM.toFixed(2),
    c.status
  ].join(','));

  return [headers, ...rows].join('\n');
}

export function exportTPAClaimsJSON(claims: TPAClaimRecord[]): string {
  return JSON.stringify(
    {
      exportTimestamp: new Date().toISOString(),
      claimsCount: claims.length,
      totalBilledAmount: claims.reduce((sum, c) => sum + c.panelBilledRM, 0),
      batchClaims: claims
    },
    null,
    2
  );
}
