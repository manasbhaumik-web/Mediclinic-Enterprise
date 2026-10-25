import { describe, it, expect } from 'vitest';
import { checkDrugSafety } from './drugSafetyEngine';

describe('AI Clinical Drug Safety Engine', () => {
  it('detects direct allergy conflict (Penicillin allergy with Amoxicillin)', () => {
    const rx = ['Amoxicillin 500mg', 'Paracetamol 500mg'];
    const allergies = ['Penicillin'];

    const safety = checkDrugSafety(rx, allergies);
    expect(safety.hasAlerts).toBe(true);
    expect(safety.hasContraindications).toBe(true);
    expect(safety.alerts[0].title).toContain('Amoxicillin');
    expect(safety.alerts[0].severity).toBe('contraindicated');
  });

  it('detects cross-sensitivity allergy (Penicillin allergy with Cefuroxime)', () => {
    const rx = ['Cefuroxime 250mg'];
    const allergies = ['Penicillin'];

    const safety = checkDrugSafety(rx, allergies);
    expect(safety.hasAlerts).toBe(true);
    expect(safety.hasMajor).toBe(true);
    expect(safety.alerts[0].title).toContain('Cross-Sensitivity Warning');
  });

  it('detects severe drug-drug interaction (Warfarin + Aspirin)', () => {
    const rx = ['Warfarin 5mg', 'Aspirin 100mg'];
    const safety = checkDrugSafety(rx, []);

    expect(safety.hasAlerts).toBe(true);
    expect(safety.hasContraindications).toBe(true);
    expect(safety.alerts[0].title).toContain('Severe Hemorrhage Risk');
  });

  it('detects duplicate NSAID prescribing (Ibuprofen + Ponstan)', () => {
    const rx = ['Ibuprofen 400mg', 'Ponstan 500mg'];
    const safety = checkDrugSafety(rx, []);

    expect(safety.hasAlerts).toBe(true);
    expect(safety.alerts[0].type).toBe('duplicate-class');
    expect(safety.alerts[0].title).toContain('Duplicate NSAID Therapy');
  });

  it('detects Statin and Macrolide interaction (Simvastatin + Clarithromycin)', () => {
    const rx = ['Simvastatin 20mg', 'Clarithromycin 500mg'];
    const safety = checkDrugSafety(rx, []);

    expect(safety.hasAlerts).toBe(true);
    expect(safety.alerts[0].severity).toBe('major');
    expect(safety.alerts[0].title).toContain('Rhabdomyolysis Risk');
  });

  it('reports zero alerts for safe compatible prescriptions', () => {
    const rx = ['Paracetamol 500mg', 'Amoxicillin 500mg'];
    const safety = checkDrugSafety(rx, ['Sulfa']);

    expect(safety.hasAlerts).toBe(false);
    expect(safety.alerts.length).toBe(0);
  });
});
