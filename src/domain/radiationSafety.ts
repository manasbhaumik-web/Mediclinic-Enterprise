/**
 * Radiation Safety & Diagnostic Imaging Quality Assurance Engine
 * Statutory Standards: Atomic Energy Licensing Act 1984 (Act 304),
 * Radiation Protection (Basic Safety Standard) Regulations 2010,
 * & PHFSA 1998 (Act 586) Regulations 45–54 (Radiological Services).
 */

export interface RadiationApparatus {
  id: string; // e.g. "XR-RAD-01"
  name: string; // e.g. "Shimadzu Radspeed Digital Radiography"
  type: 'General Radiography' | 'Dental OPG' | 'Mobile C-Arm' | 'Ultrasound';
  serialNumber: string;
  roomLocation: string; // e.g. "Bilik X-Ray 1 (Lead Shielding 2mm Pb)"
  licenceClassCNumber: string; // e.g. "KKM/CKSP/LKC-2026-8812"
  licenceExpiryDate: string; // YYYY-MM-DD
  rpoName: string; // Radiation Protection Officer (PPS)
  rpoCertificateNo: string;
  medicalPhysicistName: string;
  qaCalibrationDate: string; // YYYY-MM-DD
  nextQaDueDate: string; // YYYY-MM-DD
}

export interface TLDBadgeReading {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  badgeNumber: string;
  monitoringPeriod: string; // e.g. "Q3 2026 (Jul-Sep)"
  quarter: 1 | 2 | 3 | 4;
  year: number;
  deepDoseHp10Msv: number; // in mSv
  shallowDoseHp007Msv: number; // in mSv
  cumulativeAnnualMsv: number; // in mSv
  status: 'normal' | 'investigation_required' | 'limit_exceeded';
  laboratoryReportRef: string; // Agensi Nuklear Malaysia report number
}

export interface LeadApronItem {
  id: string; // e.g. "APR-01"
  label: string; // e.g. "Lead Apron 0.5mm Pb"
  leadEquivalenceMm: number; // 0.35 or 0.5 mm Pb
  location: string;
  lastInspectedDate: string; // YYYY-MM-DD
  nextInspectionDue: string; // YYYY-MM-DD (every 6 months)
  status: 'Pass / Intact' | 'Minor Surface Wear' | 'Condemned / Cracked';
  inspectionTechnique: 'Fluoroscopy' | 'Tactile / Visual';
  inspectedByStaff: string;
  notes?: string;
}

export interface XRayExposureRecord {
  id: string;
  timestamp: string; // ISO
  patientId: string;
  patientName: string;
  examination: string; // e.g. "Chest PA", "Lumbosacral Spine AP/Lat"
  kVp: number;
  mAs: number;
  isRejectRetake: boolean;
  rejectReason?: 'Patient Motion' | 'Positioning Error' | 'Exposure Factor Error' | 'Artifact';
  operatorStaffName: string;
}

/**
 * Evaluates TLD personal radiation dose reading under Act 304 & Basic Safety Standards.
 * - Investigation level: > 1.0 mSv/quarter.
 * - Legal annual occupational dose limit: 20 mSv/year.
 */
export function evaluateTLDReading(
  quarterlyMsv: number,
  cumulativeYearMsv: number
): {
  status: 'normal' | 'investigation_required' | 'limit_exceeded';
  message: string;
} {
  if (cumulativeYearMsv >= 20.0) {
    return {
      status: 'limit_exceeded',
      message: `CRITICAL STATUTORY BREACH: Annual cumulative dose (${cumulativeYearMsv} mSv) has reached or exceeded statutory occupational worker limit of 20 mSv/year (Act 304). Staff must be removed from radiation duties immediately.`,
    };
  }

  if (quarterlyMsv >= 1.0) {
    return {
      status: 'investigation_required',
      message: `INVESTIGATION REQUIRED: Quarterly dose of ${quarterlyMsv} mSv exceeds the 1.0 mSv investigation threshold. Radiation Protection Officer (RPO) must initiate workload and shielding audit.`,
    };
  }

  return {
    status: 'normal',
    message: `Normal occupational dose (${quarterlyMsv} mSv/quarter). Well below statutory limits.`,
  };
}

/**
 * Calculates retake/reject rate percentage.
 * Statutory benchmark: < 5.0% reject rate across all radiological procedures.
 */
export function calculateRejectRate(exposures: XRayExposureRecord[]): {
  totalExposures: number;
  retakes: number;
  rejectRatePercent: number;
  isWithinBenchmark: boolean;
  message: string;
} {
  const total = exposures.length;
  if (total === 0) {
    return {
      totalExposures: 0,
      retakes: 0,
      rejectRatePercent: 0,
      isWithinBenchmark: true,
      message: 'No radiographic exposures logged for analysis.',
    };
  }

  const retakes = exposures.filter((e) => e.isRejectRetake).length;
  const rate = Number(((retakes / total) * 100).toFixed(1));
  const isWithinBenchmark = rate <= 5.0;

  return {
    totalExposures: total,
    retakes,
    rejectRatePercent: rate,
    isWithinBenchmark,
    message: isWithinBenchmark
      ? `Reject rate is ${rate}%, compliant with MOH benchmark (<5.0%). Good radiographic technique.`
      : `High reject rate of ${rate}% exceeds statutory benchmark (<5.0%). Review radiographer positioning and exposure factors.`,
  };
}

/**
 * Evaluates whether lead apron 6-monthly crack inspection is overdue.
 */
export function isLeadApronOverdue(nextInspectionDue: string, referenceDateStr?: string): boolean {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  return today > nextInspectionDue;
}

/**
 * Evaluates MOH Class C Radiation Apparatus Licence renewal status.
 */
export function evaluateLicenceRenewalStatus(
  expiryDateStr: string,
  referenceDateStr?: string
): {
  status: 'active' | 'expiring_soon' | 'expired';
  daysRemaining: number;
  message: string;
} {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.round(
    (new Date(expiryDateStr).getTime() - new Date(today).getTime()) / msPerDay
  );

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: days,
      message: `EXPIRED: Licence expired ${Math.abs(days)} days ago. X-Ray machine operation is unlawful under Act 304.`,
    };
  }

  if (days <= 60) {
    return {
      status: 'expiring_soon',
      daysRemaining: days,
      message: `RENEWAL DUE: Licence expires in ${days} days. Submit Form KKM/CKSP renewal to MOH Radiation Health Section.`,
    };
  }

  return {
    status: 'active',
    daysRemaining: days,
    message: `Active licence (${days} days remaining). Fully compliant with Act 304.`,
  };
}

export const DEFAULT_RADIATION_APPARATUS: RadiationApparatus[] = [
  {
    id: 'XR-RAD-01',
    name: 'Shimadzu Radspeed Digital Radiography System',
    type: 'General Radiography',
    serialNumber: 'SHIM-RAD-99210',
    roomLocation: 'Bilik X-Ray 1 (Lead Lined 2.0mm Pb Equiv)',
    licenceClassCNumber: 'KKM/CKSP/LKC-2026-8812',
    licenceExpiryDate: '2027-08-31',
    rpoName: 'Dr. Sarah Farhana',
    rpoCertificateNo: 'RPO-KKM-04419',
    medicalPhysicistName: 'Pn. Nurul Hidayah (Consultant Physicist)',
    qaCalibrationDate: '2026-08-15',
    nextQaDueDate: '2027-08-15',
  },
  {
    id: 'XR-DENT-01',
    name: 'Carestream CS 8100 Panoramic Dental OPG',
    type: 'Dental OPG',
    serialNumber: 'CS-8100-33291',
    roomLocation: 'Bilik Pergigian / Dental Suite',
    licenceClassCNumber: 'KKM/CKSP/LKC-2026-9041',
    licenceExpiryDate: '2026-12-15', // Expiring soon (<60 days)
    rpoName: 'Dr. Sarah Farhana',
    rpoCertificateNo: 'RPO-KKM-04419',
    medicalPhysicistName: 'Pn. Nurul Hidayah (Consultant Physicist)',
    qaCalibrationDate: '2025-12-10',
    nextQaDueDate: '2026-12-10',
  },
];

export const DEFAULT_TLD_READINGS: TLDBadgeReading[] = [
  {
    id: 'TLD-2026-Q3-001',
    staffId: 'STF-RAD-01',
    staffName: 'Radiographer Farhan bin Zaid',
    role: 'Radiographer',
    badgeNumber: 'ANM-TLD-9041',
    monitoringPeriod: 'Q3 2026 (Jul - Sep)',
    quarter: 3,
    year: 2026,
    deepDoseHp10Msv: 0.18,
    shallowDoseHp007Msv: 0.19,
    cumulativeAnnualMsv: 0.52,
    status: 'normal',
    laboratoryReportRef: 'ANM/SS/TLD/2026/0921',
  },
  {
    id: 'TLD-2026-Q3-002',
    staffId: 'STF-DOC-01',
    staffName: 'Dr. Sarah Farhana (RPO)',
    role: 'Doctor / RPO',
    badgeNumber: 'ANM-TLD-9042',
    monitoringPeriod: 'Q3 2026 (Jul - Sep)',
    quarter: 3,
    year: 2026,
    deepDoseHp10Msv: 0.05,
    shallowDoseHp007Msv: 0.05,
    cumulativeAnnualMsv: 0.14,
    status: 'normal',
    laboratoryReportRef: 'ANM/SS/TLD/2026/0921',
  },
  {
    id: 'TLD-2026-Q3-003',
    staffId: 'STF-CA-01',
    staffName: 'Staff Nurse Aisyah',
    role: 'Clinic Assistant (X-Ray Escort)',
    badgeNumber: 'ANM-TLD-9043',
    monitoringPeriod: 'Q3 2026 (Jul - Sep)',
    quarter: 3,
    year: 2026,
    deepDoseHp10Msv: 0.02,
    shallowDoseHp007Msv: 0.02,
    cumulativeAnnualMsv: 0.08,
    status: 'normal',
    laboratoryReportRef: 'ANM/SS/TLD/2026/0921',
  },
];

export const DEFAULT_LEAD_APRONS: LeadApronItem[] = [
  {
    id: 'APR-01',
    label: 'Lead Apron Double-Sided 0.5mm Pb (Blue)',
    leadEquivalenceMm: 0.5,
    location: 'X-Ray Room 1 Wall Rack',
    lastInspectedDate: '2026-06-15',
    nextInspectionDue: '2026-12-15',
    status: 'Pass / Intact',
    inspectionTechnique: 'Fluoroscopy',
    inspectedByStaff: 'Radiographer Farhan bin Zaid',
    notes: 'No cracks or pinholes. Lead rubber lining intact.',
  },
  {
    id: 'APR-02',
    label: 'Lead Apron Front-Protection 0.35mm Pb (Burgundy)',
    leadEquivalenceMm: 0.35,
    location: 'X-Ray Room 1 Wall Rack',
    lastInspectedDate: '2026-06-15',
    nextInspectionDue: '2026-12-15',
    status: 'Pass / Intact',
    inspectionTechnique: 'Fluoroscopy',
    inspectedByStaff: 'Radiographer Farhan bin Zaid',
    notes: 'Seams intact, velcro straps secure.',
  },
  {
    id: 'THY-01',
    label: 'Thyroid Collar Shield 0.5mm Pb',
    leadEquivalenceMm: 0.5,
    location: 'X-Ray Room 1 Accessory Box',
    lastInspectedDate: '2026-06-15',
    nextInspectionDue: '2026-12-15',
    status: 'Pass / Intact',
    inspectionTechnique: 'Tactile / Visual',
    inspectedByStaff: 'Radiographer Farhan bin Zaid',
  },
  {
    id: 'GON-01',
    label: 'Gonad Shield Set 1.0mm Pb',
    leadEquivalenceMm: 1.0,
    location: 'X-Ray Room 1 Accessory Box',
    lastInspectedDate: '2026-04-10',
    nextInspectionDue: '2026-10-10', // Overdue
    status: 'Minor Surface Wear',
    inspectionTechnique: 'Tactile / Visual',
    inspectedByStaff: 'Radiographer Farhan bin Zaid',
    notes: 'Surface vinyl crease noted. Recommended fluoroscopic screening check.',
  },
];

export const SAMPLE_XRAY_EXPOSURES: XRayExposureRecord[] = [
  {
    id: 'XR-EXP-001',
    timestamp: '2026-11-01T08:30:00.000Z',
    patientId: 'PT-1002',
    patientName: 'Tan Sri Dato Ahmad Razif',
    examination: 'Chest PA (Erect)',
    kVp: 110,
    mAs: 4.5,
    isRejectRetake: false,
    operatorStaffName: 'Radiographer Farhan bin Zaid',
  },
  {
    id: 'XR-EXP-002',
    timestamp: '2026-11-01T09:15:00.000Z',
    patientId: 'PT-1044',
    patientName: 'Puan Siti Aminah',
    examination: 'Right Knee AP / Lateral',
    kVp: 60,
    mAs: 3.2,
    isRejectRetake: false,
    operatorStaffName: 'Radiographer Farhan bin Zaid',
  },
  {
    id: 'XR-EXP-003',
    timestamp: '2026-11-01T09:40:00.000Z',
    patientId: 'PT-1088',
    patientName: 'En. Lee Wei Hong',
    examination: 'Left Ankle AP / Mortise / Lat',
    kVp: 55,
    mAs: 2.5,
    isRejectRetake: true,
    rejectReason: 'Patient Motion',
    operatorStaffName: 'Radiographer Farhan bin Zaid',
  },
  {
    id: 'XR-EXP-004',
    timestamp: '2026-11-01T09:45:00.000Z',
    patientId: 'PT-1088',
    patientName: 'En. Lee Wei Hong',
    examination: 'Left Ankle AP / Mortise / Lat (Repeat)',
    kVp: 55,
    mAs: 2.5,
    isRejectRetake: false,
    operatorStaffName: 'Radiographer Farhan bin Zaid',
  },
];
