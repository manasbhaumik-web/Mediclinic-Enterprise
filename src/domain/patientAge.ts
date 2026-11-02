/**
 * Centralized Patient Age Calculation & Formatting Domain Module
 * 
 * Accurately calculates clinical age considering year, month, and day.
 * Formats age appropriately:
 * - Infants (< 1 year): "X Mos" or "X Days"
 * - Children & Adults (>= 1 year): "X Yrs"
 */

export interface PatientAgeDetails {
  years: number;
  months: number;
  days: number;
  isPediatric: boolean; // age < 12
  isInfant: boolean;    // age < 1
  displayAge: string;   // e.g. "8 Yrs", "6 Mos", "3 Days"
  fullLabel: string;    // e.g. "8 Yrs", "6 Months (< 1 Yr)"
}

export function calculatePatientAge(dob: string | null | undefined, now: Date = new Date()): PatientAgeDetails {
  if (!dob || !dob.trim()) {
    return {
      years: 30,
      months: 0,
      days: 0,
      isPediatric: false,
      isInfant: false,
      displayAge: '30 Yrs',
      fullLabel: '30 Yrs (Default)',
    };
  }

  // Parse YYYY-MM-DD or standard ISO date
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return {
      years: 30,
      months: 0,
      days: 0,
      isPediatric: false,
      isInfant: false,
      displayAge: '30 Yrs',
      fullLabel: '30 Yrs (Default)',
    };
  }

  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Safeguard against future dates
  if (years < 0) {
    years = 0;
    months = 0;
    days = 0;
  }

  const isInfant = years === 0;
  const isPediatric = years < 12;

  let displayAge = '';
  let fullLabel = '';

  if (years === 0) {
    if (months === 0) {
      const d = Math.max(1, days);
      displayAge = `${d} Day${d === 1 ? '' : 's'}`;
      fullLabel = `${d} Day${d === 1 ? '' : 's'} (Infant)`;
    } else {
      displayAge = `${months} Mo${months === 1 ? '' : 's'}`;
      fullLabel = `${months} Month${months === 1 ? '' : 's'} (< 1 Yr)`;
    }
  } else if (years < 3) {
    displayAge = `${years} Yrs`;
    fullLabel = months > 0 ? `${years}y ${months}m` : `${years} Yrs`;
  } else {
    displayAge = `${years} Yrs`;
    fullLabel = `${years} Yrs`;
  }

  return {
    years,
    months,
    days,
    isPediatric,
    isInfant,
    displayAge,
    fullLabel,
  };
}
