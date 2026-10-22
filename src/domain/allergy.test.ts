import { describe, expect, it } from 'vitest';
import { conflictsWithAllergy, recordedAllergies } from './allergy';

describe('recordedAllergies', () => {
  it('drops blanks and "none"', () => {
    expect(recordedAllergies(['Penicillin', ' ', 'None', 'none'])).toEqual(['Penicillin']);
  });
  it('copes with missing data', () => {
    expect(recordedAllergies(undefined)).toEqual([]);
    expect(recordedAllergies(null)).toEqual([]);
  });
});

describe('conflictsWithAllergy', () => {
  it('matches an allergen inside the drug name, ignoring case', () => {
    expect(conflictsWithAllergy('Amoxicillin 500mg', ['amoxicillin'])).toBe(true);
    expect(conflictsWithAllergy('PENICILLIN V', ['penicillin'])).toBe(true);
  });
  it('does not flag unrelated drugs or empty records', () => {
    expect(conflictsWithAllergy('Paracetamol 500mg', ['Penicillin'])).toBe(false);
    expect(conflictsWithAllergy('Paracetamol 500mg', ['None'])).toBe(false);
    expect(conflictsWithAllergy('Paracetamol 500mg', [])).toBe(false);
  });
});
