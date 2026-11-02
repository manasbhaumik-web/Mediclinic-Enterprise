import { describe, expect, it } from 'vitest';
import { evaluateClinicianPrivileges, ClinicianCredentials } from './staffCredentialing';

describe('Clinician Credentialing & Statutory Privilege Guard (MMC / LJM / Medefend)', () => {
  it('validates a compliant doctor with active APC and valid malpractice indemnity', () => {
    const doctorCreds: ClinicianCredentials = {
      staffId: 'doc-01',
      fullName: 'Dr. Sarah Tan',
      role: 'Doctor',
      primaryRegistrationNumber: 'MMC 54912',
      apcArcNumber: 'APC-2026-8812',
      apcArcExpiryDate: '2026-12-31',
      indemnityProvider: 'Medical Protection Society (MPS)',
      indemnityPolicyNumber: 'MPS-MY-99120',
      indemnityExpiryDate: '2026-12-31'
    };

    const evalResult = evaluateClinicianPrivileges(doctorCreds, new Date('2026-06-01'));
    expect(evalResult.status).toBe('ActiveValid');
    expect(evalResult.canPracticeClinically).toBe(true);
    expect(evalResult.warnings).toHaveLength(0);
    expect(evalResult.daysUntilEarliestExpiry).toBeGreaterThan(30);
  });

  it('hard-blocks clinical practice when a doctor’s Annual Practising Certificate (APC) is expired', () => {
    const expiredDoc: ClinicianCredentials = {
      staffId: 'doc-02',
      fullName: 'Dr. Johnathan Lim',
      role: 'Doctor',
      primaryRegistrationNumber: 'MMC 31802',
      apcArcNumber: 'APC-2025-1102',
      apcArcExpiryDate: '2025-12-31', // Expired
      indemnityProvider: 'Medefend',
      indemnityPolicyNumber: 'MED-7718',
      indemnityExpiryDate: '2026-12-31'
    };

    const evalResult = evaluateClinicianPrivileges(expiredDoc, new Date('2026-02-01'));
    expect(evalResult.status).toBe('Expired');
    expect(evalResult.canPracticeClinically).toBe(false);
    expect(evalResult.warnings[0]).toContain('EXPIRED: Malaysian Medical Council APC');
  });

  it('hard-blocks clinical practice when doctor indemnity insurance is expired even if APC is valid', () => {
    const expiredIndemnityDoc: ClinicianCredentials = {
      staffId: 'doc-03',
      fullName: 'Dr. Kevin Wong',
      role: 'Doctor',
      primaryRegistrationNumber: 'MMC 44812',
      apcArcNumber: 'APC-2026-4411',
      apcArcExpiryDate: '2026-12-31',
      indemnityProvider: 'Zurich Medical Indemnity',
      indemnityPolicyNumber: 'ZUR-8801',
      indemnityExpiryDate: '2026-05-31' // Expired on reference date
    };

    const evalResult = evaluateClinicianPrivileges(expiredIndemnityDoc, new Date('2026-06-15'));
    expect(evalResult.status).toBe('Expired');
    expect(evalResult.canPracticeClinically).toBe(false);
    expect(evalResult.warnings.some(w => w.includes('Medical Malpractice Indemnity Insurance expired'))).toBe(true);
  });

  it('alerts when credentials are within the 30-day renewal window', () => {
    const expiringNurse: ClinicianCredentials = {
      staffId: 'nurse-01',
      fullName: 'Nurse Halimah',
      role: 'Nurse',
      primaryRegistrationNumber: 'LJM 45910',
      apcArcNumber: 'ARC-2026-1299',
      apcArcExpiryDate: '2026-06-25', // 24 days away
      blsCprExpiryDate: '2027-01-01'
    };

    const evalResult = evaluateClinicianPrivileges(expiringNurse, new Date('2026-06-01'));
    expect(evalResult.status).toBe('ExpiringSoon');
    expect(evalResult.canPracticeClinically).toBe(true); // Still practicing, but warning displayed
    expect(evalResult.warnings[0]).toContain('EXPIRING SOON');
  });
});
