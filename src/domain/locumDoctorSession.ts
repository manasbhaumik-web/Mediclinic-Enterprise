/**
 * Locum Doctor MMC Session & Statutory Credential Governance Engine
 * Standards: Malaysian Medical Council (MMC) Locum Tenens Guidelines & PHFSA 1998 (Act 586) Section 14.
 */

export interface LocumDoctorProfile {
  id: string; // e.g. "LOC-001"
  fullName: string; // e.g. "Dr. Farhan bin Razak"
  icPassport: string;
  mmcNumber: string; // e.g. "MMC-62180"
  apcYear: number; // e.g. 2026
  apcVerified: boolean;
  indemnityProvider: 'Medefend (MMA)' | 'Medical Protection Society (MPS)' | 'The MDU' | 'Other';
  indemnityPolicyNo: string;
  indemnityExpiryDate: string; // YYYY-MM-DD
  hourlyRateMyr: number; // e.g. 50.00
  primaryPracticePlace: string; // e.g. "Hospital Selayang (General MO)"
  hasHospitalHeadApproval: boolean; // JPA Kebenaran Berkhidmat Luar Waktu
  status: 'active' | 'suspended' | 'expired_credentials';
  phone: string;
}

export interface LocumShiftSession {
  id: string; // e.g. "LSHIFT-20261101-01"
  locumDoctorId: string;
  doctorName: string;
  mmcNumber: string;
  checkInTime: string; // ISO
  checkOutTime?: string; // ISO
  scheduledHours: number;
  actualHoursWorked: number;
  hourlyRateMyr: number;
  patientsConsultedCount: number;
  incentivePerPatientMyr: number;
  totalPayoutMyr: number;
  paymentStatus: 'pending_approval' | 'paid_petty_cash' | 'bank_transfer';
  paymentReference?: string;
  verifiedByStaff: string;
  activeShift: boolean;
  notes?: string;
}

/**
 * Validates a locum practitioner's statutory credentials against MMC & Act 586 rules.
 */
export function validateLocumCredentials(
  profile: LocumDoctorProfile,
  targetDateStr?: string
): {
  isValid: boolean;
  issues: string[];
  status: 'active' | 'expired_credentials';
} {
  const issues: string[] = [];
  const currentDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const currentYear = currentDate.getFullYear();

  // 1. MMC Number check
  if (!profile.mmcNumber || !profile.mmcNumber.startsWith('MMC-')) {
    issues.push('Invalid Malaysian Medical Council (MMC) registration number format.');
  }

  // 2. APC Year check
  if (profile.apcYear < currentYear) {
    issues.push(`Annual Practising Certificate (APC) is expired (${profile.apcYear} < ${currentYear}). Legal practice prohibited under Medical Act 1971.`);
  }

  // 3. Indemnity Expiry check
  const expiryDate = new Date(profile.indemnityExpiryDate);
  if (isNaN(expiryDate.getTime()) || expiryDate < currentDate) {
    issues.push(`Medical Professional Indemnity policy expired on ${profile.indemnityExpiryDate}. Mandatory under Act 586 Section 14.`);
  }

  const isValid = issues.length === 0;
  return {
    isValid,
    issues,
    status: isValid ? 'active' : 'expired_credentials',
  };
}

/**
 * Calculates locum shift payout with hourly base pay and optional volume incentives.
 */
export function calculateLocumShiftPayout(
  hoursWorked: number,
  hourlyRate: number,
  patientCount: number = 0,
  incentivePerPatient: number = 0
): {
  basePayMyr: number;
  incentivePayMyr: number;
  totalPayoutMyr: number;
} {
  const safeHours = Math.max(0, hoursWorked);
  const safeRate = Math.max(0, hourlyRate);
  const safePatients = Math.max(0, patientCount);
  const safeIncentive = Math.max(0, incentivePerPatient);

  const basePayMyr = Math.round(safeHours * safeRate * 100) / 100;
  const incentivePayMyr = Math.round(safePatients * safeIncentive * 100) / 100;
  const totalPayoutMyr = Math.round((basePayMyr + incentivePayMyr) * 100) / 100;

  return {
    basePayMyr,
    incentivePayMyr,
    totalPayoutMyr,
  };
}

/**
 * Generates an official CKAPS Locum Tenens Attendance & Credential Ledger in CSV format.
 */
export function exportCKAPSLocumAttendanceLedger(
  sessions: LocumShiftSession[],
  profiles: LocumDoctorProfile[]
): string {
  const headers = [
    'Session ID',
    'Locum Doctor Name',
    'MMC Registration No',
    'APC Year',
    'Indemnity Provider & Policy',
    'Check-In Time',
    'Check-Out Time',
    'Hours Worked',
    'Hourly Rate (MYR)',
    'Patients Seen',
    'Total Payout (MYR)',
    'Payment Status',
    'Payment Reference',
    'Supervising Staff Verified',
  ];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const rows = sessions.map((s) => {
    const prof = profileMap.get(s.locumDoctorId);
    return [
      s.id,
      `"${s.doctorName}"`,
      s.mmcNumber,
      prof?.apcYear || 2026,
      `"${prof?.indemnityProvider || 'MPS'} (${prof?.indemnityPolicyNo || 'N/A'})"`,
      s.checkInTime,
      s.checkOutTime || 'IN_PROGRESS',
      s.actualHoursWorked.toFixed(1),
      s.hourlyRateMyr.toFixed(2),
      s.patientsConsultedCount,
      s.totalPayoutMyr.toFixed(2),
      s.paymentStatus.toUpperCase(),
      `"${s.paymentReference || 'None'}"`,
      `"${s.verifiedByStaff}"`,
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export const DEFAULT_LOCUM_PROFILES: LocumDoctorProfile[] = [
  {
    id: 'LOC-001',
    fullName: 'Dr. Farhan bin Razak',
    icPassport: '900814-10-5821',
    mmcNumber: 'MMC-62180',
    apcYear: 2026,
    apcVerified: true,
    indemnityProvider: 'Medefend (MMA)',
    indemnityPolicyNo: 'MED-2026-62180',
    indemnityExpiryDate: '2026-12-31',
    hourlyRateMyr: 55.0,
    primaryPracticePlace: 'Hospital Kuala Lumpur (Emergency Medicine MO)',
    hasHospitalHeadApproval: true,
    status: 'active',
    phone: '+60 12-345 6789',
  },
  {
    id: 'LOC-002',
    fullName: 'Dr. Audrey Lim Pei Shan',
    icPassport: '920311-14-6102',
    mmcNumber: 'MMC-65490',
    apcYear: 2026,
    apcVerified: true,
    indemnityProvider: 'Medical Protection Society (MPS)',
    indemnityPolicyNo: 'MPS-MY-99210-26',
    indemnityExpiryDate: '2026-11-30',
    hourlyRateMyr: 60.0,
    primaryPracticePlace: 'Freelance General Practitioner',
    hasHospitalHeadApproval: true,
    status: 'active',
    phone: '+60 17-889 1234',
  },
];

export const DEFAULT_LOCUM_SHIFTS: LocumShiftSession[] = [
  {
    id: 'LSHIFT-20261031-01',
    locumDoctorId: 'LOC-001',
    doctorName: 'Dr. Farhan bin Razak',
    mmcNumber: 'MMC-62180',
    checkInTime: '2026-10-31T18:00:00.000Z',
    checkOutTime: '2026-10-31T22:00:00.000Z',
    scheduledHours: 4.0,
    actualHoursWorked: 4.0,
    hourlyRateMyr: 55.0,
    patientsConsultedCount: 14,
    incentivePerPatientMyr: 0,
    totalPayoutMyr: 220.0,
    paymentStatus: 'paid_petty_cash',
    paymentReference: 'VOUCHER-PC-20261031-04',
    verifiedByStaff: 'Clinic Assistant Zarith',
    activeShift: false,
    notes: 'Saturday evening shift. Handover completed smoothly.',
  },
];
