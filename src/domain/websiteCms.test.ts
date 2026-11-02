import { describe, expect, it } from 'vitest';
import { 
  DEFAULT_WEBSITE_CONFIG, 
  validateCmsConfig, 
  getLocalizedText, 
  WebsiteCMSConfig 
} from './websiteCms';

describe('Website CMS Domain Logic & Validation', () => {
  it('provides complete Malaysian healthcare defaults', () => {
    expect(DEFAULT_WEBSITE_CONFIG.hero.clinicName).toBe('MEDICLINIC ENTERPRISE');
    expect(DEFAULT_WEBSITE_CONFIG.hero.branchName).toBe('Shah Alam Main Branch');
    expect(DEFAULT_WEBSITE_CONFIG.operatingHours.is24Hours).toBe(true);
    expect(DEFAULT_WEBSITE_CONFIG.doctors.length).toBeGreaterThan(0);
    expect(DEFAULT_WEBSITE_CONFIG.services.length).toBeGreaterThan(0);
    expect(DEFAULT_WEBSITE_CONFIG.tpaPanels).toContain('PMCare TPA');
    expect(DEFAULT_WEBSITE_CONFIG.faqs.length).toBeGreaterThan(0);
  });

  it('validates mandatory clinic identity and address fields', () => {
    const valid = validateCmsConfig(DEFAULT_WEBSITE_CONFIG);
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid: WebsiteCMSConfig = {
      ...DEFAULT_WEBSITE_CONFIG,
      hero: {
        ...DEFAULT_WEBSITE_CONFIG.hero,
        clinicName: '', // empty
      },
      contact: {
        ...DEFAULT_WEBSITE_CONFIG.contact,
        phone: '', // empty
        address: '', // empty
      },
    };

    const result = validateCmsConfig(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('correctly resolves localized text between English and Bahasa Melayu', () => {
    const en = 'Book Appointment';
    const bm = 'Tempah Janji Temu';

    expect(getLocalizedText(false, en, bm)).toBe(en);
    expect(getLocalizedText(true, en, bm)).toBe(bm);

    // Fallback when BM is missing
    expect(getLocalizedText(true, en, '')).toBe(en);
  });
});
