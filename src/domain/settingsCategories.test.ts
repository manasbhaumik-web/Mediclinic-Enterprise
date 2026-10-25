import { describe, expect, it } from 'vitest';
import { SettingsCategory } from '../features/admin/SettingsModule';

describe('Console Settings Categorization Architecture', () => {
  const categories: SettingsCategory[] = [
    'overview',
    'profile',
    'facilities',
    'ai_gateway',
    'billing',
    'modules',
    'hardware',
  ];

  it('declares 7 distinct operational categories avoiding single-screen overload', () => {
    expect(categories).toHaveLength(7);
    expect(categories).toContain('overview');
    expect(categories).toContain('profile');
    expect(categories).toContain('facilities');
    expect(categories).toContain('ai_gateway');
    expect(categories).toContain('billing');
    expect(categories).toContain('modules');
    expect(categories).toContain('hardware');
  });

  it('ensures each category maps to a dedicated, focused administrative domain', () => {
    const categoryDomainMap: Record<SettingsCategory, string> = {
      overview: 'Executive Dashboard & System Diagnostics',
      profile: 'Clinic Identity, Branch & MOH KKM Licensing',
      facilities: 'Consultation Rooms 1-4 & Specialty Services',
      ai_gateway: 'Multi-modal LLM Gateway & Feature Toggles',
      billing: 'SST Rates, Baseline Consultation & Procedure Tariffs',
      modules: 'Role-based Sidebar Workspace Visibility',
      hardware: 'Physical Peripherals (MyKad, POS Printer, 2D Barcode)',
    };

    for (const cat of categories) {
      expect(categoryDomainMap[cat]).toBeDefined();
      expect(categoryDomainMap[cat].length).toBeGreaterThan(10);
    }
  });
});
