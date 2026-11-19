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
  it('matches a drug family, not just the name (amoxicillin is a penicillin)', () => {
    expect(conflictsWithAllergy('Amoxicillin 500mg Capsule', ['Penicillin'])).toBe(true);
    expect(conflictsWithAllergy('Augmentin (Amoxicillin/Clavulanate) 625mg', ['Penicillin'])).toBe(true);
    expect(conflictsWithAllergy('Ibuprofen 400mg', ['NSAID'])).toBe(true);
  });
  it('does not treat a cross-reactivity warning as a block', () => {
    expect(conflictsWithAllergy('Cephalexin 250mg', ['Penicillin'])).toBe(false);
  });
  it('does not flag unrelated drugs or empty records', () => {
    expect(conflictsWithAllergy('Paracetamol 500mg', ['Penicillin'])).toBe(false);
    expect(conflictsWithAllergy('Paracetamol 500mg', ['None'])).toBe(false);
    expect(conflictsWithAllergy('Paracetamol 500mg', [])).toBe(false);
  });
});
