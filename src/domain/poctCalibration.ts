/**
 * Point-of-Care Testing (POCT) & Equipment Quality Control Engine
 * Statutory Compliance: PHFSA 1998 (Act 586) § 38 & CKAPS Standards
 */

export type POCTDeviceType = 'glucometer' | 'hba1c' | 'urine_analyzer' | 'dengue_rapid' | 'lipid_profile';

export interface QCLevelTarget {
  min: number;
  max: number;
  unit: string;
}

export interface POCTDevice {
  id: string; // e.g. "POCT-GLUC-01"
  name: string; // e.g. "Accu-Chek Instant"
  type: POCTDeviceType;
  serialNumber: string;
  location: string; // e.g. "Bilik Rawatan (Treatment Room)"
  reagentLotNumber: string;
  reagentExpiryDate: string; // YYYY-MM-DD
  reagentOpenedAt: string | null; // YYYY-MM-DD
  openVialShelfLifeDays: number; // e.g. 90 days for glucose test strips
  qcSchedule: 'daily' | 'weekly';
  level1Target: QCLevelTarget; // Normal control
  level2Target: QCLevelTarget; // High / Abnormal control
}

export interface QCLevelResult {
  level: 1 | 2;
  controlLot: string;
  measuredValue: number;
  unit: string;
  targetMin: number;
  targetMax: number;
  status: 'pass' | 'fail';
  deviation: number;
}

export interface POCTCalibrationRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: POCTDeviceType;
  testedAt: string; // ISO
  operatorStaffId: string;
  operatorStaffName: string;
  level1: QCLevelResult;
  level2: QCLevelResult;
  overallStatus: 'pass' | 'fail';
  reagentLotVerified: boolean;
  notes?: string;
}

export const DEFAULT_POCT_DEVICES: POCTDevice[] = [
  {
    id: 'POCT-GLUC-01',
    name: 'Accu-Chek Instant Glucometer',
    type: 'glucometer',
    serialNumber: 'AC-9842103',
    location: 'Bilik Rawatan (Treatment Room)',
    reagentLotNumber: 'LOT-GLUC-2026B',
    reagentExpiryDate: '2027-04-30',
    reagentOpenedAt: '2026-10-01',
    openVialShelfLifeDays: 90,
    qcSchedule: 'daily',
    level1Target: { min: 2.2, max: 3.8, unit: 'mmol/L' }, // Normal control
    level2Target: { min: 14.5, max: 19.8, unit: 'mmol/L' }, // High control
  },
  {
    id: 'POCT-HBA1C-01',
    name: 'Siemens DCA Vantage HbA1c Analyzer',
    type: 'hba1c',
    serialNumber: 'DCA-44219',
    location: 'Bilik Rawatan / Mini-Lab',
    reagentLotNumber: 'LOT-A1C-8812',
    reagentExpiryDate: '2027-02-28',
    reagentOpenedAt: '2026-10-15',
    openVialShelfLifeDays: 60,
    qcSchedule: 'daily',
    level1Target: { min: 4.8, max: 5.6, unit: '%' }, // Normal control
    level2Target: { min: 9.8, max: 11.2, unit: '%' }, // High control
  },
  {
    id: 'POCT-URINE-01',
    name: 'Siemens Clinitek Status+ Urine Analyzer',
    type: 'urine_analyzer',
    serialNumber: 'CLIN-77182',
    location: 'Bilik Rawatan (Treatment Room)',
    reagentLotNumber: 'LOT-MULTISTIX-10SG',
    reagentExpiryDate: '2027-06-30',
    reagentOpenedAt: '2026-10-10',
    openVialShelfLifeDays: 180,
    qcSchedule: 'daily',
    level1Target: { min: 6.0, max: 7.0, unit: 'pH' }, // Normal pH control
    level2Target: { min: 8.0, max: 9.0, unit: 'pH' }, // Alkaline control
  },
  {
    id: 'POCT-DENGUE-01',
    name: 'SD Biosensor Standard Q Dengue Duo',
    type: 'dengue_rapid',
    serialNumber: 'SD-Q-11029',
    location: 'Bilik Rawatan (Treatment Room)',
    reagentLotNumber: 'LOT-DEN-2026V',
    reagentExpiryDate: '2027-01-31',
    reagentOpenedAt: '2026-10-20',
    openVialShelfLifeDays: 90,
    qcSchedule: 'weekly',
    level1Target: { min: 0.95, max: 1.05, unit: 'Ratio' }, // Negative control
    level2Target: { min: 2.8, max: 4.2, unit: 'Ratio' }, // Positive control
  },
  {
    id: 'POCT-LIPID-01',
    name: 'CardioChek PA Lipid Profile Analyzer',
    type: 'lipid_profile',
    serialNumber: 'CC-90218',
    location: 'Bilik Konsultasi 1',
    reagentLotNumber: 'LOT-CHOL-774',
    reagentExpiryDate: '2027-03-31',
    reagentOpenedAt: '2026-10-05',
    openVialShelfLifeDays: 90,
    qcSchedule: 'weekly',
    level1Target: { min: 3.5, max: 4.5, unit: 'mmol/L' },
    level2Target: { min: 6.5, max: 8.5, unit: 'mmol/L' },
  },
];

/**
 * Evaluates whether a measured reading is within allowable clinical tolerance.
 */
export function evaluateQCReading(
  measuredValue: number,
  targetMin: number,
  targetMax: number
): { status: 'pass' | 'fail'; deviation: number } {
  const midpoint = (targetMin + targetMax) / 2;
  const deviation = Number((measuredValue - midpoint).toFixed(2));
  const status = measuredValue >= targetMin && measuredValue <= targetMax ? 'pass' : 'fail';
  return { status, deviation };
}

/**
 * Calculates the operative expiry date taking into account manufacturer expiry and open-vial shelf life.
 * Per clinical lab regulations, open vials expire earlier than unopened box expiry.
 */
export function calculateEffectiveExpiry(
  openedAt: string | null,
  shelfLifeDays: number,
  manufacturerExpiry: string
): string {
  if (!openedAt) return manufacturerExpiry;

  const openedDate = new Date(`${openedAt}T00:00:00Z`);
  const openExpiryDate = new Date(openedDate.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);
  const openExpiryStr = openExpiryDate.toISOString().split('T')[0];

  return openExpiryStr < manufacturerExpiry ? openExpiryStr : manufacturerExpiry;
}

/**
 * Checks if reagent lot is currently expired.
 */
export function isReagentLotExpired(
  openedAt: string | null,
  shelfLifeDays: number,
  manufacturerExpiry: string,
  referenceDateStr?: string
): boolean {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const effectiveExpiry = calculateEffectiveExpiry(openedAt, shelfLifeDays, manufacturerExpiry);
  return today > effectiveExpiry;
}

/**
 * Evaluates whether a POCT device has a valid passing QC log for a given date.
 * PHFSA 1998 Section 38 requires daily QC prior to reporting patient results.
 */
export function evaluateDeviceQcStatus(
  device: POCTDevice,
  records: POCTCalibrationRecord[],
  targetDateStr?: string
): {
  isValid: boolean;
  status: 'valid' | 'expired_lot' | 'missing_daily_qc' | 'failed_qc';
  reason?: string;
  lastRecord?: POCTCalibrationRecord;
} {
  const today = targetDateStr || new Date().toISOString().split('T')[0];

  // 1. Check reagent expiry
  if (isReagentLotExpired(device.reagentOpenedAt, device.openVialShelfLifeDays, device.reagentExpiryDate, today)) {
    return {
      isValid: false,
      status: 'expired_lot',
      reason: `Reagent Lot ${device.reagentLotNumber} is expired or exceeded open-vial stability (PHFSA 1998 § 38).`,
    };
  }

  // 2. Find records for this device
  const deviceRecords = records
    .filter((r) => r.deviceId === device.id)
    .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());

  const lastRecord = deviceRecords[0];

  // 3. Find record for target date
  const todayRecord = deviceRecords.find((r) => r.testedAt.startsWith(today));

  if (!todayRecord) {
    return {
      isValid: false,
      status: 'missing_daily_qc',
      reason: `Daily 2-Level QC has not been performed for ${today}. Calibration required prior to testing.`,
      lastRecord,
    };
  }

  if (todayRecord.overallStatus === 'fail') {
    return {
      isValid: false,
      status: 'failed_qc',
      reason: `Daily QC test failed today at ${new Date(todayRecord.testedAt).toLocaleTimeString('en-GB')}. Device out of service until recalibrated.`,
      lastRecord: todayRecord,
    };
  }

  return {
    isValid: true,
    status: 'valid',
    lastRecord: todayRecord,
  };
}

/**
 * Helper to construct a complete POCT Calibration Record with automatic grading.
 */
export function createPOCTCalibrationRecord(params: {
  device: POCTDevice;
  operatorStaffId: string;
  operatorStaffName: string;
  controlLot: string;
  level1Reading: number;
  level2Reading: number;
  notes?: string;
  customDate?: string;
}): POCTCalibrationRecord {
  const testedAt = params.customDate || new Date().toISOString();
  const lvl1Eval = evaluateQCReading(params.level1Reading, params.device.level1Target.min, params.device.level1Target.max);
  const lvl2Eval = evaluateQCReading(params.level2Reading, params.device.level2Target.min, params.device.level2Target.max);

  const level1: QCLevelResult = {
    level: 1,
    controlLot: params.controlLot,
    measuredValue: params.level1Reading,
    unit: params.device.level1Target.unit,
    targetMin: params.device.level1Target.min,
    targetMax: params.device.level1Target.max,
    status: lvl1Eval.status,
    deviation: lvl1Eval.deviation,
  };

  const level2: QCLevelResult = {
    level: 2,
    controlLot: params.controlLot,
    measuredValue: params.level2Reading,
    unit: params.device.level2Target.unit,
    targetMin: params.device.level2Target.min,
    targetMax: params.device.level2Target.max,
    status: lvl2Eval.status,
    deviation: lvl2Eval.deviation,
  };

  const overallStatus = lvl1Eval.status === 'pass' && lvl2Eval.status === 'pass' ? 'pass' : 'fail';

  return {
    id: `QC-${params.device.id}-${Date.now().toString(36).toUpperCase()}`,
    deviceId: params.device.id,
    deviceName: params.device.name,
    deviceType: params.device.type,
    testedAt,
    operatorStaffId: params.operatorStaffId,
    operatorStaffName: params.operatorStaffName,
    level1,
    level2,
    overallStatus,
    reagentLotVerified: true,
    notes: params.notes,
  };
}

/**
 * Initial sample QC records for today to seed operational state.
 */
export const INITIAL_POCT_QC_RECORDS: POCTCalibrationRecord[] = [
  {
    id: 'QC-GLUC-SEED-01',
    deviceId: 'POCT-GLUC-01',
    deviceName: 'Accu-Chek Instant Glucometer',
    deviceType: 'glucometer',
    testedAt: `${new Date().toISOString().split('T')[0]}T07:45:00.000Z`,
    operatorStaffId: 'STF-001',
    operatorStaffName: 'Nurse Aisyah (CA)',
    level1: {
      level: 1,
      controlLot: 'CTL-GLUC-L1-2026',
      measuredValue: 3.1,
      unit: 'mmol/L',
      targetMin: 2.2,
      targetMax: 3.8,
      status: 'pass',
      deviation: 0.1,
    },
    level2: {
      level: 2,
      controlLot: 'CTL-GLUC-L2-2026',
      measuredValue: 16.8,
      unit: 'mmol/L',
      targetMin: 14.5,
      targetMax: 19.8,
      status: 'pass',
      deviation: -0.35,
    },
    overallStatus: 'pass',
    reagentLotVerified: true,
    notes: 'Morning shift calibration verified. Normal curve.',
  },
  {
    id: 'QC-URINE-SEED-01',
    deviceId: 'POCT-URINE-01',
    deviceName: 'Siemens Clinitek Status+ Urine Analyzer',
    deviceType: 'urine_analyzer',
    testedAt: `${new Date().toISOString().split('T')[0]}T08:00:00.000Z`,
    operatorStaffId: 'STF-001',
    operatorStaffName: 'Nurse Aisyah (CA)',
    level1: {
      level: 1,
      controlLot: 'CTL-UR-L1',
      measuredValue: 6.5,
      unit: 'pH',
      targetMin: 6.0,
      targetMax: 7.0,
      status: 'pass',
      deviation: 0,
    },
    level2: {
      level: 2,
      controlLot: 'CTL-UR-L2',
      measuredValue: 8.5,
      unit: 'pH',
      targetMin: 8.0,
      targetMax: 9.0,
      status: 'pass',
      deviation: 0,
    },
    overallStatus: 'pass',
    reagentLotVerified: true,
    notes: 'Optics calibration clean. Strip tray wiped.',
  },
];
