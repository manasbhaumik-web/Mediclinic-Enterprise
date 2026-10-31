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
