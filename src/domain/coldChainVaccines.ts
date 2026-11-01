/**
 * Vaccine Cold Chain Temperature Monitoring & Quality Control Engine
 * Statutory Standards: PHFSA 1998 (Act 586), CKAPS Private Clinic Guidelines,
 * and KKM National Immunisation Programme (NIP) Cold Chain Protocol (+2.0°C to +8.0°C).
 */

export interface VaccineRefrigerator {
  id: string; // e.g. "FRIDGE-VACC-01"
  name: string; // e.g. "Haier Biomedical HXC-158 Pharmaceutical Refrigerator"
  serialNumber: string;
  location: string; // e.g. "Bilik Rawatan (Treatment Room)"
  targetTempRange: { min: number; max: number }; // 2.0 to 8.0 °C
  calibrationCertificateNo: string;
  lastCalibratedDate: string; // YYYY-MM-DD
  nextCalibrationDue: string; // YYYY-MM-DD
  hasBackupPower: boolean;
  status: 'operational' | 'quarantined' | 'maintenance';
}

export interface TwiceDailyTempRecord {
  id: string;
  fridgeId: string;
  date: string; // YYYY-MM-DD
  shift: 'Morning (08:00)' | 'Evening (17:00)';
  loggedAt: string; // ISO
  currentTempC: number;
  minTempC: number;
  maxTempC: number;
  isCompliant: boolean;
  excursionType?: 'Freeze Hazard (<2°C)' | 'Heat Hazard (>8°C)';
  operatorStaffName: string;
  operatorStaffId: string;
  notes?: string;
}

export interface ColdExcursionRecord {
  id: string;
  fridgeId: string;
  occurredAt: string; // ISO
  detectedAt: string; // ISO
  excursionType: 'Freeze Hazard (<2°C)' | 'Heat Hazard (>8°C)';
  lowestTempRecordedC: number;
  highestTempRecordedC: number;
  durationHours: number;
  cause: 'Power Interruption' | 'Door Ajar / Gasket Failure' | 'Compressor Defect' | 'Ambient Heatwave';
  actionTaken: 'Quarantined & Shake Test Run' | 'Transferred to Cold Box with Ice Packs' | 'Stock Discarded';
  investigationReportRef: string;
  reportedByStaff: string;
  isResolved: boolean;
}

export interface ShakeTestRecord {
  id: string;
  vaccineCode: string;
  vaccineName: string;
  batchNo: string;
  testedAt: string; // ISO
  sedimentationTimeMinutes: number;
  result: 'Pass' | 'Fail';
  disposition: 'Approved for Use' | 'Quarantined & Discarded';
  testedByStaff: string;
  notes: string;
}

/**
 * Evaluates a temperature reading against statutory KKM limits (+2.0°C to +8.0°C).
 */
export function evaluateTemperatureExcursion(
  currentTemp: number,
  minTemp: number,
  maxTemp: number
): {
  isCompliant: boolean;
  excursionType?: 'Freeze Hazard (<2°C)' | 'Heat Hazard (>8°C)';
  severity: 'normal' | 'freeze_hazard' | 'heat_hazard';
  message: string;
} {
  // Check freeze risk first (freeze is more destructive to adsorbed vaccines)
  if (currentTemp < 2.0 || minTemp < 2.0) {
    const lowest = Math.min(currentTemp, minTemp);
    return {
      isCompliant: false,
      excursionType: 'Freeze Hazard (<2°C)',
      severity: 'freeze_hazard',
      message: `CRITICAL FREEZE EXCURSION (${lowest}°C < +2.0°C). High risk of aluminum adjuvant precipitation and denaturation in DTaP, HepB, PCV, and HPV vaccines. Mandatory WHO/KKM Shake Test required.`,
    };
  }

  // Check heat excursion
  if (currentTemp > 8.0 || maxTemp > 8.0) {
    const highest = Math.max(currentTemp, maxTemp);
    return {
      isCompliant: false,
      excursionType: 'Heat Hazard (>8°C)',
      severity: 'heat_hazard',
      message: `HEAT EXCURSION (${highest}°C > +8.0°C). Potency loss risk for live vaccines (MMR, Varicella). Inspect refrigerator gasket seal and backup power.`,
    };
  }

  return {
    isCompliant: true,
    severity: 'normal',
    message: `Temperature compliant (+2.0°C to +8.0°C). Vaccine potency preserved.`,
  };
}

/**
 * Evaluates WHO / MOH Shake Test (Ujian Goncang) for suspected frozen adsorbed vaccines.
 * In a frozen vaccine, aluminum adjuvant clusters precipitate rapidly (clearing in <15-30 mins).
 */
export function evaluateShakeTestResult(
  isRapidSedimentation: boolean,
  vaccineName: string,
  batchNo: string
): {
  result: 'Pass' | 'Fail';
  disposition: 'Approved for Use' | 'Quarantined & Discarded';
  message: string;
} {
  if (isRapidSedimentation) {
    return {
      result: 'Fail',
      disposition: 'Quarantined & Discarded',
      message: `SHAKE TEST FAILED: Rapid sedimentation observed in ${vaccineName} (Batch ${batchNo}). Aluminum lattice irreversibly destroyed by freezing. Vaccine must be condemned and safely disposed.`,
    };
  }

  return {
    result: 'Pass',
    disposition: 'Approved for Use',
    message: `SHAKE TEST PASSED: Homogeneous cloudy suspension maintained comparable to control vial. ${vaccineName} (Batch ${batchNo}) approved for clinical administration.`,
  };
}

/**
 * Checks whether morning or evening checks are completed for a given target date.
 */
export function isFridgeCheckDueForToday(
  records: TwiceDailyTempRecord[],
  targetDateStr?: string
): {
  morningDone: boolean;
  eveningDone: boolean;
  isCheckDue: boolean;
} {
  const today = targetDateStr || new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === today);

  const morningDone = todayRecords.some((r) => r.shift.startsWith('Morning'));
  const eveningDone = todayRecords.some((r) => r.shift.startsWith('Evening'));
  const isCheckDue = !morningDone || !eveningDone;

  return { morningDone, eveningDone, isCheckDue };
}

/**
 * Formats cold chain temperature ledger to CSV for Pejabat Kesihatan Daerah (PKD) inspections.
 */
export function exportColdChainMonthlyCsv(records: TwiceDailyTempRecord[]): string {
  const headers = [
    'Log ID',
    'Date',
    'Shift',
    'Logged At',
    'Current Temp (°C)',
    'Min Temp (°C)',
    'Max Temp (°C)',
    'Compliance Status',
    'Excursion Type',
    'Operator Staff',
    'Notes',
  ];

  const rows = records.map((r) => [
    r.id,
    r.date,
    r.shift,
    r.loggedAt,
    r.currentTempC.toFixed(1),
    r.minTempC.toFixed(1),
    r.maxTempC.toFixed(1),
    r.isCompliant ? 'COMPLIANT' : 'EXCURSION',
    r.excursionType || 'None',
    `"${r.operatorStaffName} (${r.operatorStaffId})"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export const DEFAULT_VACCINE_FRIDGES: VaccineRefrigerator[] = [
  {
    id: 'FRIDGE-VACC-01',
    name: 'Haier Biomedical HXC-158 Vaccine Refrigerator',
    serialNumber: 'HB-HXC-881290',
    location: 'Bilik Rawatan (Treatment Room)',
    targetTempRange: { min: 2.0, max: 8.0 },
    calibrationCertificateNo: 'CAL-NIST-2026-091',
    lastCalibratedDate: '2026-05-10',
    nextCalibrationDue: '2027-05-10',
    hasBackupPower: true,
    status: 'operational',
  },
];

export const DEFAULT_COLD_CHAIN_RECORDS: TwiceDailyTempRecord[] = [
  {
    id: 'CC-LOG-20261101-01',
    fridgeId: 'FRIDGE-VACC-01',
    date: '2026-11-01',
    shift: 'Morning (08:00)',
    loggedAt: '2026-11-01T08:05:00.000Z',
    currentTempC: 4.2,
    minTempC: 3.4,
    maxTempC: 5.1,
    isCompliant: true,
    operatorStaffName: 'Staff Nurse Aisyah',
    operatorStaffId: 'STF-CA-01',
    notes: 'Morning shift opening log. Thermometer min/max reset completed.',
  },
  {
    id: 'CC-LOG-20261031-02',
    fridgeId: 'FRIDGE-VACC-01',
    date: '2026-10-31',
    shift: 'Evening (17:00)',
    loggedAt: '2026-10-31T17:00:00.000Z',
    currentTempC: 4.8,
    minTempC: 3.2,
    maxTempC: 5.6,
    isCompliant: true,
    operatorStaffName: 'Clinic Assistant Zarith',
    operatorStaffId: 'STF-CA-02',
    notes: 'Evening shift handover. Door seal intact.',
  },
  {
    id: 'CC-LOG-20261031-01',
    fridgeId: 'FRIDGE-VACC-01',
    date: '2026-10-31',
    shift: 'Morning (08:00)',
    loggedAt: '2026-10-31T08:10:00.000Z',
    currentTempC: 3.9,
    minTempC: 3.1,
    maxTempC: 4.8,
    isCompliant: true,
    operatorStaffName: 'Staff Nurse Aisyah',
    operatorStaffId: 'STF-CA-01',
    notes: 'Normal operational range.',
  },
];

export const DEFAULT_EXCURSION_RECORDS: ColdExcursionRecord[] = [
  {
    id: 'EXC-20261015-001',
    fridgeId: 'FRIDGE-VACC-01',
    occurredAt: '2026-10-15T02:00:00.000Z',
    detectedAt: '2026-10-15T07:45:00.000Z',
    excursionType: 'Heat Hazard (>8°C)',
    lowestTempRecordedC: 4.2,
    highestTempRecordedC: 9.8,
    durationHours: 3.5,
    cause: 'Power Interruption',
    actionTaken: 'Transferred to Cold Box with Ice Packs',
    investigationReportRef: 'RCA-POWER-2026-08',
    reportedByStaff: 'Staff Nurse Aisyah',
    isResolved: true,
  },
];
