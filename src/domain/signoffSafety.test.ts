import { describe, it, expect } from 'vitest';
import { signoffSafety, splitOverride } from './signoffSafety';

describe('splitOverride', () => {
  it('separates the drug from the prescriber\'s reason', () => {
    expect(splitOverride('Amoxicillin 500mg [OVERRIDDEN: tolerated before]')).toEqual({ drug: 'Amoxicillin 500mg', rationale: 'tolerated before' });
    expect(splitOverride('Paracetamol 500mg')).toEqual({ drug: 'Paracetamol 500mg', rationale: null });
  });
});

describe('signoffSafety', () => {
  it('reports a conflict instead of a pass when the prescription clashes with a recorded allergy', () => {
    const s = signoffSafety(['Amoxicillin 500mg'], ['Penicillin']);
    expect(s.status).toBe('conflict');
    expect(s.alerts[0]).toMatchObject({ type: 'allergy', severity: 'contraindicated' });
    expect(s.allergies).toEqual(['Penicillin']);
  });

  it('still reports the conflict when the doctor overrode it, and shows their reason', () => {
    const s = signoffSafety(['Amoxicillin 500mg [OVERRIDDEN: tolerated 2024]'], ['Penicillin']);
    expect(s.status).toBe('conflict');
    expect(s.overrides).toEqual([{ drug: 'Amoxicillin 500mg', rationale: 'tolerated 2024' }]);
  });

  it('is clear only when allergies are recorded and nothing conflicts', () => {
    expect(signoffSafety(['Paracetamol 500mg'], ['Penicillin']).status).toBe('clear');
  });

  it('says nothing was checked when no allergy is recorded, including "None"', () => {
    expect(signoffSafety(['Paracetamol 500mg'], []).status).toBe('none-recorded');
    expect(signoffSafety(['Paracetamol 500mg'], ['None']).status).toBe('none-recorded');
    expect(signoffSafety(['Paracetamol 500mg'], undefined).status).toBe('none-recorded');
  });

  it('flags a dangerous drug pair even when the patient has no allergy', () => {
    const s = signoffSafety(['Warfarin 5mg', 'Ibuprofen 400mg'], []);
    expect(s.status).toBe('conflict');
    expect(s.alerts.some((a) => a.type === 'drug-interaction')).toBe(true);
  });

  it('handles an empty prescription', () => {
    expect(signoffSafety([], ['Penicillin']).status).toBe('clear');
  });
});
