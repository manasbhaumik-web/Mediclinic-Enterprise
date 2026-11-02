import { describe, expect, it } from 'vitest';
import { EXTENDED_HISTORICAL_VISITS } from '../../mocks/historicalVisits';
import { INITIAL_PATIENTS } from '../../mocks/clinicMocks';
import { parseNric, nricError } from '../../utils/nric';

describe('Patient Administration Module', () => {
  it('validates patient NRIC correctly', () => {
    // Valid Malaysian IC format
    expect(nricError('881105-14-5391')).toBe('');
    const parsed = parseNric('881105-14-5391');
    expect(parsed).not.toBeNull();
    expect(parsed?.gender).toBe('Male');
    expect(parsed?.dob).toBe('1988-11-05');

    // Invalid IC format
    expect(nricError('12345')).toBeTruthy();
  });

  it('aggregates longitudinal clinical history for a patient', () => {
    const patientId = 'P001';
    const patientVisits = EXTENDED_HISTORICAL_VISITS.filter((v) => v.patientId === patientId);
    
    expect(patientVisits.length).toBeGreaterThanOrEqual(2);
    
    // Check diagnoses exist
    const diagnoses = patientVisits.map((v) => v.soap?.assessment?.icdCode).filter(Boolean);
    expect(diagnoses).toContain('J06.9'); // Common cold
    expect(diagnoses).toContain('I10');   // Hypertension

    // Check prescriptions exist
    const prescriptions = patientVisits.flatMap((v) => v.soap?.plan?.prescription || []);
    expect(prescriptions.length).toBeGreaterThanOrEqual(2);
    expect(prescriptions.some((p) => p.drugName.includes('Paracetamol'))).toBe(true);
    expect(prescriptions.some((p) => p.drugName.includes('Amlodipine'))).toBe(true);

    // Check financial ledger
    const totalBilled = patientVisits.reduce((acc, v) => acc + (v.totalBill || 0), 0);
    const totalPanel = patientVisits.reduce((acc, v) => acc + (v.panelClaimed || 0), 0);
    expect(totalBilled).toBe(115.00);
    expect(totalPanel).toBe(115.00);
  });

  it('filters encounters accurately by month and year for reports', () => {
    // Filter year 2026
    const visits2026 = EXTENDED_HISTORICAL_VISITS.filter((v) => v.date && v.date.startsWith('2026'));
    expect(visits2026.length).toBeGreaterThan(0);

    // Filter month 06 (June 2026)
    const visitsJune2026 = EXTENDED_HISTORICAL_VISITS.filter((v) => v.date && v.date.startsWith('2026-06'));
    expect(visitsJune2026.length).toBeGreaterThanOrEqual(2);

    // Filter month 08 (August 2026)
    const visitsAugust2026 = EXTENDED_HISTORICAL_VISITS.filter((v) => v.date && v.date.startsWith('2026-08'));
    expect(visitsAugust2026.length).toBeGreaterThanOrEqual(2);
  });

  it('filters encounters by specific patient for patient dossier report', () => {
    const targetPatient = INITIAL_PATIENTS.find((p) => p.id === 'P003')!;
    expect(targetPatient).toBeDefined();

    const p003Visits = EXTENDED_HISTORICAL_VISITS.filter((v) => v.patientId === 'P003');
    expect(p003Visits.length).toBeGreaterThanOrEqual(2);

    // Patient P003 is Self-Pay
    const selfPayTotal = p003Visits.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
    expect(selfPayTotal).toBeGreaterThan(0);
    expect(p003Visits.every((v) => v.panelClaimed === 0)).toBe(true);
  });
});
