/**
 * Mediclinic Enterprise Interoperability Engine Core Framework
 * Real-time Clinical Data Interchange, Blockchain Audit, TPA Gateway, LIS/RIS Ingestion, e-Prescribing & IoT Bridge
 */

import { convertVisitToFHIRBundle, validateFHIRPayload, FHIRBundleResource } from './hl7FhirEngine';
import { sanitizeClinicalTextForAI } from '../utils/piiMasker';

// ============================================================================
// 1. BLOCKCHAIN IMMUTABLE MEDICAL LEDGER NODE
// ============================================================================
export interface MedicalBlock {
  index: number;
  timestamp: string;
  previousHash: string;
  hash: string;
  data: {
    patientId: string;
    action: string;
    icdCode?: string;
    prescribedDrugs?: string[];
    piiAuditHash: string;
  };
  nonce: number;
}

class MedicalBlockchainLedger {
  private chain: MedicalBlock[] = [];

  constructor() {
    this.createGenesisBlock();
  }

  private calculateHash(index: number, previousHash: string, timestamp: string, dataStr: string, nonce: number): string {
    const str = `${index}-${previousHash}-${timestamp}-${dataStr}-${nonce}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  }

  private createGenesisBlock() {
    const genesisData = {
      patientId: 'SYS_GENESIS',
      action: 'MEDICLINIC_BLOCKCHAIN_GENESIS_NODE_INITIALIZED',
      piiAuditHash: '0x0000000000000000'
    };
    const timestamp = '2026-01-01T00:00:00.000Z';
    const hash = this.calculateHash(0, '0000000000000000', timestamp, JSON.stringify(genesisData), 42);
    this.chain.push({
      index: 0,
      timestamp,
      previousHash: '0000000000000000',
      hash,
      data: genesisData,
      nonce: 42
    });
  }

  public getLatestBlock(): MedicalBlock {
    return this.chain[this.chain.length - 1];
  }

  public recordAuditBlock(patientId: string, action: string, icdCode?: string, drugs?: string[]): MedicalBlock {
    const prevBlock = this.getLatestBlock();
    const index = prevBlock.index + 1;
    const timestamp = new Date().toISOString();
    const piiResult = sanitizeClinicalTextForAI(`${patientId} ${action}`);

    const blockData = {
      patientId,
      action,
      icdCode,
      prescribedDrugs: drugs || [],
      piiAuditHash: piiResult.auditHash
    };

    let nonce = 0;
    let hash = '';
    // Proof-of-Work simulation (find hash starting with '0x0')
    do {
      nonce++;
      hash = this.calculateHash(index, prevBlock.hash, timestamp, JSON.stringify(blockData), nonce);
    } while (!hash.startsWith('0x0') && nonce < 500);

    const newBlock: MedicalBlock = {
      index,
      timestamp,
      previousHash: prevBlock.hash,
      hash,
      data: blockData,
      nonce
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  public getChain(): MedicalBlock[] {
    return [...this.chain];
  }

  public verifyChainIntegrity(): { isValid: boolean; brokenBlockIndex?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return { isValid: false, brokenBlockIndex: i };
      }

      const recalculated = this.calculateHash(
        current.index,
        current.previousHash,
        current.timestamp,
        JSON.stringify(current.data),
        current.nonce
      );

      if (current.hash !== recalculated) {
        return { isValid: false, brokenBlockIndex: i };
      }
    }
    return { isValid: true };
  }
}

export const medicalBlockchain = new MedicalBlockchainLedger();

// ============================================================================
// 2. TPA / INSURANCE EDI-837 AUTO-PREAUTHORIZATION GATEWAY
// ============================================================================
export interface TPAClaimPreAuthRequest {
  policyNumber: string;
  providerCode: string;
  patientIc: string;
  diagnosisICD10: string;
  requestedAmount: number;
}

export interface TPAClaimPreAuthResponse {
  approved: boolean;
  preAuthRefNumber: string;
  approvedCoverageAmount: number;
  patientCoPayAmount: number;
  authorizationToken: string;
  rejectionReason?: string;
}

export function processTPAAutoPreAuth(req: TPAClaimPreAuthRequest): TPAClaimPreAuthResponse {
  if (!req.policyNumber || req.policyNumber.length < 5) {
    return {
      approved: false,
      preAuthRefNumber: 'N/A',
      approvedCoverageAmount: 0,
      patientCoPayAmount: req.requestedAmount,
      authorizationToken: 'ERR_INVALID_POLICY',
      rejectionReason: 'Invalid or inactive TPA insurance policy number.'
    };
  }

  // Calculate coverage split (85% coverage, 15% co-pay up to RM5,000 cap)
  const coverageRate = 0.85;
  const approvedCoverageAmount = Math.min(5000, Number((req.requestedAmount * coverageRate).toFixed(2)));
  const patientCoPayAmount = Number((req.requestedAmount - approvedCoverageAmount).toFixed(2));

  const timestamp = Date.now();
  const preAuthRefNumber = `TPA-MY-${Math.floor(100000 + Math.random() * 900000)}`;
  const authorizationToken = `AUTH_${req.policyNumber.slice(-4)}_${timestamp}`;

  return {
    approved: true,
    preAuthRefNumber,
    approvedCoverageAmount,
    patientCoPayAmount,
    authorizationToken
  };
}

// ============================================================================
// 3. LIS & RIS DIAGNOSTICS INGESTION ENGINE
// ============================================================================
export interface LabResultItem {
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  refRangeMin: number;
  refRangeMax: number;
  isPanicValue: boolean;
}

export interface LISReportIngest {
  labReportId: string;
  patientId: string;
  specimenType: string;
  testDate: string;
  results: LabResultItem[];
  hasPanicAlert: boolean;
}

export function parseAndIngestLISReport(rawLabData: {
  labReportId?: string;
  patientId: string;
  specimenType?: string;
  testResults: { testName: string; code: string; val: number; unit: string; min: number; max: number }[];
}): LISReportIngest {
  const labReportId = rawLabData.labReportId || `LAB-${Math.floor(100000 + Math.random() * 900000)}`;

  let hasPanic = false;
  const results: LabResultItem[] = rawLabData.testResults.map(r => {
    // Panic value criteria: e.g. Glucose > 15 mmol/L or Troponin > 0.04 ng/mL or Potassium < 2.8 or > 6.0
    const isPanic = (r.code === 'GLU' && r.val > 15) || 
                    (r.code === 'TROP' && r.val > 0.04) || 
                    (r.code === 'K' && (r.val < 2.8 || r.val > 6.0));
    
    if (isPanic) hasPanic = true;

    return {
      testCode: r.code,
      testName: r.testName,
      value: r.val,
      unit: r.unit,
      refRangeMin: r.min,
      refRangeMax: r.max,
      isPanicValue: isPanic
    };
  });

  return {
    labReportId,
    patientId: rawLabData.patientId,
    specimenType: rawLabData.specimenType || 'Venous Whole Blood',
    testDate: new Date().toISOString(),
    results,
    hasPanicAlert: hasPanic
  };
}

// ============================================================================
// 4. e-PRESCRIBING NETWORK & INTERACTION SCREENING ENGINE
// ============================================================================
export interface EPrescriptionPayload {
  rxId: string;
  patientId: string;
  prescriberMMLNo: string;
  medications: { drugName: string; dosage: string; frequency: string; durationDays: number }[];
  interactionAlerts: string[];
  dispenseStatus: 'SENT_TO_PHARMACY' | 'READY_FOR_PICKUP' | 'DISPENSED';
}

export function generateEPrescription(
  patientId: string,
  doctorMML: string,
  drugs: { drugName: string; dosage: string; frequency: string; durationDays: number }[]
): EPrescriptionPayload {
  const rxId = `RX-MY-${Math.floor(100000 + Math.random() * 900000)}`;
  const alerts: string[] = [];

  // Drug Interaction Screening
  const drugNames = drugs.map(d => d.drugName.toLowerCase());
  if (drugNames.some(d => d.includes('warfarin')) && drugNames.some(d => d.includes('aspirin'))) {
    alerts.push('HIGH RISK: Severe bleeding risk between Warfarin and Aspirin.');
  }
  if (drugNames.some(d => d.includes('amoxicillin')) && drugNames.some(d => d.includes('allopurinol'))) {
    alerts.push('MODERATE RISK: Increased incidence of skin rash when Amoxicillin combined with Allopurinol.');
  }

  // Record to Blockchain Ledger automatically
  medicalBlockchain.recordAuditBlock(patientId, 'E_PRESCRIPTION_ISSUED', undefined, drugs.map(d => d.drugName));

  return {
    rxId,
    patientId,
    prescriberMMLNo: doctorMML || 'MMC-84920',
    medications: drugs,
    interactionAlerts: alerts,
    dispenseStatus: 'SENT_TO_PHARMACY'
  };
}

// ============================================================================
// 5. IoT WEARABLES & BIOMETRIC HARDWARE BUS ENGINE
// ============================================================================
export interface BiometricStreamFrame {
  timestamp: string;
  heartRateBp: number;
  systolicBp: number;
  diastolicBp: number;
  spO2Percent: number;
  glucoseMmol: number;
  isAbnormalSpike: boolean;
}

export function parseBiometricHardwareFrame(rawFrame: {
  hr: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  glucose?: number;
}): BiometricStreamFrame {
  const isAbnormal = rawFrame.hr > 120 || rawFrame.hr < 50 || rawFrame.spo2 < 92 || rawFrame.systolic > 160;

  return {
    timestamp: new Date().toISOString(),
    heartRateBp: rawFrame.hr,
    systolicBp: rawFrame.systolic,
    diastolicBp: rawFrame.diastolic,
    spO2Percent: rawFrame.spo2,
    glucoseMmol: rawFrame.glucose || 5.6,
    isAbnormalSpike: isAbnormal
  };
}
