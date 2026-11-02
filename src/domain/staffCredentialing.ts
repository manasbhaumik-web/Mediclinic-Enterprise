export type ClinicianRoleType = 'Doctor' | 'Nurse' | 'Pharmacist' | 'AdminStaff';

export interface ClinicianCredentials {
  staffId: string;
  fullName: string;
  role: ClinicianRoleType;
  primaryRegistrationNumber: string; // MMC (Dr), LJM (Nurse), LFM (Pharm)
  apcArcNumber: string; // APC / ARC certificate number
  apcArcExpiryDate: string; // YYYY-MM-DD
  indemnityProvider?: string; // e.g. "MPS (Medical Protection Society)", "Medefend"
  indemnityPolicyNumber?: string;
  indemnityExpiryDate?: string; // YYYY-MM-DD
  blsCprExpiryDate?: string; // YYYY-MM-DD
}

export type PrivilegeStatus = 'ActiveValid' | 'ExpiringSoon' | 'Expired';

export interface PrivilegeEvaluation {
  status: PrivilegeStatus;
  canPracticeClinically: boolean;
  warnings: string[];
  daysUntilEarliestExpiry: number;
}

export function evaluateClinicianPrivileges(
  creds: ClinicianCredentials,
  referenceDate = new Date()
): PrivilegeEvaluation {
  const warnings: string[] = [];
  const refTime = referenceDate.getTime();
  let minDaysUntilExpiry = Infinity;

  const checkExpiry = (dateStr: string | undefined, label: string, isHardBlock: boolean) => {
    if (!dateStr) {
      warnings.push(`Missing mandatory statutory record: ${label}`);
      return false;
    }

    const expiryTime = new Date(dateStr + 'T23:59:59').getTime();
    const diffMs = expiryTime - refTime;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < minDaysUntilExpiry) {
      minDaysUntilExpiry = diffDays;
    }

    if (diffDays < 0) {
      warnings.push(`EXPIRED: ${label} expired on ${dateStr} (${Math.abs(diffDays)} day(s) ago).`);
      return false;
    } else if (diffDays <= 30) {
      warnings.push(`EXPIRING SOON: ${label} expires in ${diffDays} day(s) (${dateStr}).`);
    }

    return true;
  };

  let validAPC = false;
  let validIndemnity = true;

  if (creds.role === 'Doctor') {
    validAPC = checkExpiry(creds.apcArcExpiryDate, 'Malaysian Medical Council APC', true);
    validIndemnity = checkExpiry(creds.indemnityExpiryDate, 'Medical Malpractice Indemnity Insurance', true);
  } else if (creds.role === 'Nurse') {
    validAPC = checkExpiry(creds.apcArcExpiryDate, 'Malaysian Nursing Board ARC', true);
    if (creds.blsCprExpiryDate) {
      checkExpiry(creds.blsCprExpiryDate, 'Basic Life Support (BLS) Certification', false);
    }
  } else {
    validAPC = checkExpiry(creds.apcArcExpiryDate, 'Practising Certificate', false);
  }

  const isHardBlocked = !validAPC || !validIndemnity;
  const isExpiringSoon = minDaysUntilExpiry <= 30 && minDaysUntilExpiry >= 0;

  let status: PrivilegeStatus = 'ActiveValid';
  if (isHardBlocked) {
    status = 'Expired';
  } else if (isExpiringSoon) {
    status = 'ExpiringSoon';
  }

  return {
    status,
    canPracticeClinically: !isHardBlocked,
    warnings,
    daysUntilEarliestExpiry: minDaysUntilExpiry === Infinity ? 0 : minDaysUntilExpiry
  };
}
