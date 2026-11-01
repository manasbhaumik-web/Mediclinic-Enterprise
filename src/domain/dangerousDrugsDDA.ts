/**
 * Dangerous Drugs Act 1952 (Act 234) & Dangerous Drugs Regulations 1952 Safe Register
 * Enforcement: Bahagian Penguatkuasaan Farmasi (BPF), Kementerian Kesihatan Malaysia
 */

export type DDAControlSchedule = 'First Schedule (Dangerous Drugs)' | 'Psychotropic Substances';

export interface DDADrugItem {
  id: string; // e.g. "DDA-MOR-01"
  drugName: string; // e.g. "Morphine Sulfate 10mg/mL Injection"
  genericName: string;
  form: 'ampoule' | 'vial' | 'tablet' | 'patch';
  strength: string; // e.g. "10mg/1mL"
  schedule: DDAControlSchedule;
  safeCabinetLocation: string; // e.g. "Safe A - Bolted Floor Narcotic Locker"
  currentStock: number; // in basic units (ampoules/tablets)
  unit: string;
  minThreshold: number;
}

export type DDATransactionType =
  | 'INWARD_PURCHASE'
  | 'OUTWARD_PATIENT'
  | 'WASTAGE_DISCARD'
  | 'PHYSICAL_ADJUSTMENT';

export interface DDALedgerTransaction {
  id: string; // e.g. "DDA-TX-20261101-001"
  drugId: string;
  drugName: string;
  transactionType: DDATransactionType;
  timestamp: string; // ISO
  referenceNo: string; // Supplier Wholesaler Invoice or Patient Ticket/Encounter
  batchNo: string;
  expiryDate: string; // YYYY-MM-DD
  quantityIn: number;
  quantityOut: number;
  quantityWastage: number;
  runningBalance: number;
  patientName?: string;
  patientIc?: string;
  prescribingDoctorName: string;
  prescribingDoctorMMC: string;
  custodianStaffName: string;
  custodianStaffRole: string;
  dualWitnessStaffName?: string;
  dualWitnessStaffId?: string;
  reasonOrNotes: string;
}

export interface DDAPhysicalAuditRecord {
  id: string;
  drugId: string;
  drugName: string;
  auditDate: string; // YYYY-MM-DD
  theoreticalBalance: number;
  physicalCount: number;
  discrepancy: number; // physical - theoretical
  isDiscrepancy: boolean;
  investigationRequired: boolean;
  auditedByDoctor: string;
  auditedByPharmacist: string;
  notes: string;
}

export const DEFAULT_DDA_DRUGS: DDADrugItem[] = [
  {
    id: 'DDA-MOR-01',
    drugName: 'Morphine Sulfate 10mg/1mL Injection',
    genericName: 'Morphine Sulfate',
    form: 'ampoule',
    strength: '10mg/1mL',
    schedule: 'First Schedule (Dangerous Drugs)',
    safeCabinetLocation: 'DDA Safe 1 - Top Shelf Locked Box',
    currentStock: 25,
    unit: 'ampoules',
    minThreshold: 10,
  },
  {
    id: 'DDA-PET-01',
    drugName: 'Pethidine Hydrochloride 50mg/1mL Injection',
    genericName: 'Pethidine HCl',
    form: 'ampoule',
    strength: '50mg/1mL',
    schedule: 'First Schedule (Dangerous Drugs)',
    safeCabinetLocation: 'DDA Safe 1 - Top Shelf Locked Box',
    currentStock: 18,
    unit: 'ampoules',
    minThreshold: 8,
  },
  {
    id: 'DDA-FEN-01',
    drugName: 'Fentanyl Citrate 100mcg/2mL Injection',
    genericName: 'Fentanyl Citrate',
    form: 'ampoule',
    strength: '100mcg/2mL',
    schedule: 'First Schedule (Dangerous Drugs)',
    safeCabinetLocation: 'DDA Safe 1 - Middle Compartment',
    currentStock: 12,
    unit: 'ampoules',
    minThreshold: 5,
  },
  {
    id: 'DDA-KET-01',
    drugName: 'Ketamine HCl 50mg/mL (10mL) Injection',
    genericName: 'Ketamine Hydrochloride',
    form: 'vial',
    strength: '500mg/10mL',
    schedule: 'First Schedule (Dangerous Drugs)',
    safeCabinetLocation: 'DDA Safe 1 - Lower Shelf',
    currentStock: 6,
    unit: 'vials',
    minThreshold: 3,
  },
  {
    id: 'DDA-MID-01',
    drugName: 'Midazolam 5mg/5mL Injection',
    genericName: 'Midazolam',
    form: 'ampoule',
    strength: '5mg/5mL',
    schedule: 'Psychotropic Substances',
    safeCabinetLocation: 'DDA Safe 2 - Psychotropics Drawer',
    currentStock: 30,
    unit: 'ampoules',
    minThreshold: 10,
  },
];

/**
 * Calculates new running balance, preventing illegal negative dangerous drug balances.
 */
export function calculateRunningBalance(
  currentBalance: number,
  type: DDATransactionType,
  qtyIn: number,
  qtyOut: number,
  wastage: number
): { newBalance: number; isValid: boolean; error?: string } {
  if (qtyIn < 0 || qtyOut < 0 || wastage < 0) {
    return { newBalance: currentBalance, isValid: false, error: 'Quantities cannot be negative.' };
  }

  let newBal = currentBalance;
  if (type === 'INWARD_PURCHASE') {
    newBal = currentBalance + qtyIn;
  } else if (type === 'OUTWARD_PATIENT') {
    const totalDeduction = qtyOut + wastage;
    if (totalDeduction > currentBalance) {
      return {
        newBalance: currentBalance,
        isValid: false,
        error: `Insufficient safe stock. Requested ${totalDeduction} units, but only ${currentBalance} available in DDA safe.`,
      };
    }
    newBal = currentBalance - totalDeduction;
  } else if (type === 'WASTAGE_DISCARD') {
    if (wastage > currentBalance) {
      return {
        newBalance: currentBalance,
        isValid: false,
        error: `Wastage quantity (${wastage}) exceeds available safe balance (${currentBalance}).`,
      };
    }
    newBal = currentBalance - wastage;
  } else if (type === 'PHYSICAL_ADJUSTMENT') {
    newBal = qtyIn; // Direct reset to physical count upon authorized reconciliation
  }

  return { newBalance: newBal, isValid: true };
}

/**
 * Enforces Malaysian dual-authorization requirements for Dangerous Drugs safe withdrawals.
 * Requires both a licensed Medical Practitioner (Doctor with MMC) and a Pharmacist/Witness.
 */
export function validateDualAuthorization(params: {
  doctorName: string;
  doctorMMC: string;
  custodianName: string;
  dualWitnessName?: string;
}): { isValid: boolean; error?: string } {
  if (!params.doctorName.trim() || !params.doctorMMC.trim()) {
    return {
      isValid: false,
      error: 'Doctor authorization invalid. Doctor name and MMC Registration number are mandatory under DDA 1952 § 12.',
    };
  }

  if (!params.custodianName.trim()) {
    return {
      isValid: false,
      error: 'Dispensing pharmacist / custodian signature required.',
    };
  }

  if (params.dualWitnessName !== undefined && !params.dualWitnessName.trim()) {
    return {
      isValid: false,
      error: 'Witness name cannot be empty when dual-witness protocol is selected.',
    };
  }

  return { isValid: true };
}

/**
 * Evaluates physical count reconciliation against theoretical ledger balance.
 * Under DDA 1952 Reg 18, any negative discrepancy is a critical statutory loss alert.
 */
export function evaluatePhysicalDiscrepancy(
  theoreticalBalance: number,
  physicalCount: number
): {
  discrepancy: number;
  isDiscrepancy: boolean;
  severity: 'ok' | 'minor' | 'statutory_alert';
  message: string;
} {
  const discrepancy = physicalCount - theoreticalBalance;

  if (discrepancy === 0) {
    return {
      discrepancy: 0,
      isDiscrepancy: false,
      severity: 'ok',
      message: 'Physical stock matches theoretical ledger balance exactly. DDA Safe compliant.',
    };
  } else if (discrepancy < 0) {
    return {
      discrepancy,
      isDiscrepancy: true,
      severity: 'statutory_alert',
      message: `CRITICAL STATUTORY LOSS ALERT: Missing ${Math.abs(discrepancy)} units. Mandatory internal investigation and report to MOH Pharmacy Enforcement Division (DDA 1952 Reg 18).`,
    };
  } else {
    return {
      discrepancy,
      isDiscrepancy: true,
      severity: 'minor',
      message: `Surplus stock detected (+${discrepancy} units). Check for unrecorded supplier receipt or entry error.`,
    };
  }
}

/**
 * Exports DDA Safe Register to CSV formatted for MOH Pharmacy Enforcement Division inspection.
 */
export function exportDDALedgerCsv(transactions: DDALedgerTransaction[]): string {
  const headers = [
    'Transaction ID',
    'Date Time',
    'Drug Name',
    'Type',
    'Ref / Invoice / Ticket',
    'Batch No',
    'Expiry Date',
    'Qty In',
    'Qty Out',
    'Wastage',
    'Running Balance',
    'Patient Name',
    'Patient IC',
    'Prescribing Doctor (MMC)',
    'Custodian',
    'Witness',
    'Clinical Reason / Notes',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.timestamp,
    `"${t.drugName}"`,
    t.transactionType,
    t.referenceNo,
    t.batchNo,
    t.expiryDate,
    t.quantityIn,
    t.quantityOut,
    t.quantityWastage,
    t.runningBalance,
    `"${t.patientName || ''}"`,
    `"${t.patientIc || ''}"`,
    `"Dr. ${t.prescribingDoctorName} (${t.prescribingDoctorMMC})"`,
    `"${t.custodianStaffName} (${t.custodianStaffRole})"`,
    `"${t.dualWitnessStaffName || ''}"`,
    `"${t.reasonOrNotes.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export const INITIAL_DDA_TRANSACTIONS: DDALedgerTransaction[] = [
  {
    id: 'DDA-TX-20261101-001',
    drugId: 'DDA-MOR-01',
    drugName: 'Morphine Sulfate 10mg/1mL Injection',
    transactionType: 'INWARD_PURCHASE',
    timestamp: '2026-10-25T11:00:00.000Z',
    referenceNo: 'INV-DKSH-99201',
    batchNo: 'BAT-MOR-2026A',
    expiryDate: '2028-06-30',
    quantityIn: 30,
    quantityOut: 0,
    quantityWastage: 0,
    runningBalance: 30,
    prescribingDoctorName: 'Dr. Sarah Farhana',
    prescribingDoctorMMC: 'MMC-58291',
    custodianStaffName: 'Pharm. Ahmad Razak',
    custodianStaffRole: 'pharmacist',
    dualWitnessStaffName: 'Dr. Sarah Farhana',
    dualWitnessStaffId: 'STF-DOC-01',
    reasonOrNotes: 'Received from DKSH Malaysia Wholesale via Poison Wholesale License. Seals intact.',
  },
  {
    id: 'DDA-TX-20261101-002',
    drugId: 'DDA-MOR-01',
    drugName: 'Morphine Sulfate 10mg/1mL Injection',
    transactionType: 'OUTWARD_PATIENT',
    timestamp: '2026-10-28T14:30:00.000Z',
    referenceNo: 'ENC-20261028-102',
    batchNo: 'BAT-MOR-2026A',
    expiryDate: '2028-06-30',
    quantityIn: 0,
    quantityOut: 1,
    quantityWastage: 0,
    runningBalance: 29,
    patientName: 'En. Kamal bin Hassan',
    patientIc: '780312-14-5541',
    prescribingDoctorName: 'Dr. Sarah Farhana',
    prescribingDoctorMMC: 'MMC-58291',
    custodianStaffName: 'Pharm. Ahmad Razak',
    custodianStaffRole: 'pharmacist',
    dualWitnessStaffName: 'Staff Nurse Aisyah',
    dualWitnessStaffId: 'STF-CA-01',
    reasonOrNotes: 'Acute renal colic with severe excruciating pain (NRS 9/10). IV Morphine 5mg stat administered with 5mg residual discarded.',
  },
  {
    id: 'DDA-TX-20261101-003',
    drugId: 'DDA-PET-01',
    drugName: 'Pethidine Hydrochloride 50mg/1mL Injection',
    transactionType: 'INWARD_PURCHASE',
    timestamp: '2026-10-20T09:15:00.000Z',
    referenceNo: 'INV-ZUELIG-44810',
    batchNo: 'BAT-PET-2026X',
    expiryDate: '2028-04-30',
    quantityIn: 20,
    quantityOut: 0,
    quantityWastage: 0,
    runningBalance: 20,
    prescribingDoctorName: 'Dr. Sarah Farhana',
    prescribingDoctorMMC: 'MMC-58291',
    custodianStaffName: 'Pharm. Ahmad Razak',
    custodianStaffRole: 'pharmacist',
    dualWitnessStaffName: 'Dr. Sarah Farhana',
    dualWitnessStaffId: 'STF-DOC-01',
    reasonOrNotes: 'Delivered by Zuelig Pharma. Temperature log verified 25C.',
  },
  {
    id: 'DDA-TX-20261101-004',
    drugId: 'DDA-PET-01',
    drugName: 'Pethidine Hydrochloride 50mg/1mL Injection',
    transactionType: 'OUTWARD_PATIENT',
    timestamp: '2026-10-30T16:45:00.000Z',
    referenceNo: 'ENC-20261030-304',
    batchNo: 'BAT-PET-2026X',
    expiryDate: '2028-04-30',
    quantityIn: 0,
    quantityOut: 2,
    quantityWastage: 0,
    runningBalance: 18,
    patientName: 'Puan Halimah binti Sulaiman',
    patientIc: '550921-10-6622',
    prescribingDoctorName: 'Dr. Sarah Farhana',
    prescribingDoctorMMC: 'MMC-58291',
    custodianStaffName: 'Pharm. Ahmad Razak',
    custodianStaffRole: 'pharmacist',
    dualWitnessStaffName: 'Clinic Assistant Zarith',
    dualWitnessStaffId: 'STF-CA-02',
    reasonOrNotes: 'Post-trauma fracture stabilization analgesia prior to ambulance transfer.',
  },
];
