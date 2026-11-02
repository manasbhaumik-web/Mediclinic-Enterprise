import { describe, it, expect } from 'vitest';
import { calculateMEWS } from './aiTriageScore';

describe('AI Triage Score (MEWS Engine)', () => {
  it('identifies healthy/normal vitals as Low risk (score 0)', () => {
    const normalVitals = {
      bpSystolic: 120,
      bpDiastolic: 80,
      heartRate: 72,
      respiratoryRate: 16,
      temperature: 36.8,
      spO2: 98,
    };

    const result = calculateMEWS(normalVitals);
    expect(result.score).toBe(1); // RR 16 gets 1 in MEWS
    expect(result.riskLevel).toBe('Low');
    expect(result.badgeTone).toBe('ok');
    expect(result.flags.length).toBe(0);
  });

  it('triggers High risk alert on severe hypotension (SBP <= 70)', () => {
    const shockVitals = {
      bpSystolic: 68,
      heartRate: 115,
      respiratoryRate: 22,
      temperature: 36.5,
    };

    const result = calculateMEWS(shockVitals);
    expect(result.riskLevel).toBe('High');
    expect(result.badgeTone).toBe('bad');
    expect(result.flags).toContain('Severe Hypotension (SBP ≤ 70)');
  });

  it('triggers High risk alert on severe hypoxia (SpO2 < 92%)', () => {
    const hypoxicVitals = {
      bpSystolic: 125,
      heartRate: 88,
      respiratoryRate: 20,
      temperature: 37.0,
      spO2: 89,
    };

    const result = calculateMEWS(hypoxicVitals);
    expect(result.riskLevel).toBe('High');
    expect(result.flags).toContain('Hypoxemia (SpO2 < 92%)');
  });

  it('identifies Medium risk for moderate pyrexia and tachycardia', () => {
    const febrileVitals = {
      bpSystolic: 110,
      heartRate: 112, // score 2
      respiratoryRate: 18, // score 1
      temperature: 38.6, // score 2
      spO2: 97,
    };

    const result = calculateMEWS(febrileVitals);
    expect(result.score).toBe(5);
    expect(result.riskLevel).toBe('High');
    expect(result.flags).toContain('High Pyrexia (Temp ≥ 38.5°C)');
    expect(result.flags).toContain('Tachycardia (HR 111-129)');
  });

  it('handles empty/zero vitals gracefully', () => {
    const emptyResult = calculateMEWS({});
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.riskLevel).toBe('Low');
  });
});
