import { describe, expect, it } from 'vitest';
import {
  getProceduralConsentTemplate,
  createSignedConsentRecord,
  exportConsentText,
} from './proceduralConsent';

describe('proceduralConsent domain logic', () => {
  it('selects correct statutory consent template based on procedure keyword', () => {
    const sutureTpl = getProceduralConsentTemplate('Toilet & Suture Removal');
    expect(sutureTpl.category).toBe('Minor Surgery');
    expect(sutureTpl.inherentRisks.some(r => r.includes('infection'))).toBe(true);

    const abscessTpl = getProceduralConsentTemplate('Abscess Incision & Drainage');
    expect(abscessTpl.inherentRisks.some(r => r.includes('drainage') || r.includes('fistula'))).toBe(true);

    const genericTpl = getProceduralConsentTemplate('Ear Syringing');
    expect(genericTpl.procedureName).toBe('Ear Syringing');
  });

  it('creates valid signed consent record with patient IC and clinician witness', () => {
    const consent = createSignedConsentRecord({
      procedureName: 'Abscess Incision & Drainage',
      patientId: 'p-1',
      patientName: 'Kavitha Raman',
      patientIc: '920315-10-5544',
      signerType: 'Patient',
      signerName: 'Kavitha Raman',
      signerIc: '920315-10-5544',
      doctorName: 'Dr. Sarah Tan',
      doctorMmcNo: 'MMC-44123',
    });

    expect(consent.id).toMatch(/^CON-/);
    expect(consent.consentValid).toBe(true);
    expect(consent.patientName).toBe('Kavitha Raman');
    expect(consent.doctorName).toBe('Dr. Sarah Tan');
    expect(consent.risksAcknowledged.length).toBeGreaterThan(0);
  });

  it('exports formatted statutory consent text containing PHFSA 1998 declaration', () => {
    const consent = createSignedConsentRecord({
      procedureName: 'Wound Suture',
      patientId: 'p-1',
      patientName: 'Ali bin Abu',
      patientIc: '850101-14-1234',
      signerType: 'Patient',
      signerName: 'Ali bin Abu',
      signerIc: '850101-14-1234',
    });

    const text = exportConsentText(consent);
    expect(text).toContain('PHFSA 1998');
    expect(text).toContain('Ali bin Abu');
    expect(text).toContain('850101-14-1234');
    expect(text).toContain('STATUTORY INFORMED PROCEDURAL CONSENT');
  });
});
