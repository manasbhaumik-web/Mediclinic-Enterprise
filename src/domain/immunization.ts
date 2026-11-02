/**
 * Malaysian Ministry of Health (KKM) National Childhood Immunization Schedule
 * (Jadual Imunisasi Kebangsaan) & Vaccine Cold-Chain Compliance Domain
 */

export interface VaccineMilestone {
  ageMonths: number;
  ageLabel: string;
  vaccines: {
    code: string;
    name: string;
    targetDiseases: string;
    route: 'Intradermal' | 'Intramuscular (IM)' | 'Subcutaneous' | 'Oral';
    site: string;
    regionalNote?: string;
  }[];
}

export const KKM_CHILDHOOD_IMMUNIZATION_SCHEDULE: VaccineMilestone[] = [
  {
    ageMonths: 0,
    ageLabel: 'At Birth',
    vaccines: [
      {
        code: 'BCG',
        name: 'BCG Vaccine',
        targetDiseases: 'Tuberculosis',
        route: 'Intradermal',
        site: 'Left Deltoid'
      },
      {
        code: 'HepB-1',
        name: 'Hepatitis B (Dose 1)',
        targetDiseases: 'Hepatitis B Virus',
        route: 'Intramuscular (IM)',
        site: 'Anterolateral Thigh'
      }
    ]
  },
  {
    ageMonths: 1,
    ageLabel: '1 Month',
    vaccines: [
      {
        code: 'HepB-2',
        name: 'Hepatitis B (Dose 2)',
        targetDiseases: 'Hepatitis B Virus',
        route: 'Intramuscular (IM)',
        site: 'Anterolateral Thigh'
      }
    ]
  },
  {
    ageMonths: 2,
    ageLabel: '2 Months',
    vaccines: [
      {
        code: 'DTaP-IPV-HepB-Hib-1',
        name: 'Hexavalent 6-in-1 (Dose 1)',
        targetDiseases: 'Diphtheria, Tetanus, Pertussis, Polio, Hep B, Hib',
        route: 'Intramuscular (IM)',
        site: 'Left Anterolateral Thigh'
      },
      {
        code: 'PCV-1',
        name: 'Pneumococcal Conjugate (Dose 1)',
        targetDiseases: 'Invasive Pneumococcal Disease (Streptococcus pneumoniae)',
        route: 'Intramuscular (IM)',
        site: 'Right Anterolateral Thigh'
      }
    ]
  },
  {
    ageMonths: 3,
    ageLabel: '3 Months',
    vaccines: [
      {
        code: 'DTaP-IPV-HepB-Hib-2',
        name: 'Hexavalent 6-in-1 (Dose 2)',
        targetDiseases: 'Diphtheria, Tetanus, Pertussis, Polio, Hep B, Hib',
        route: 'Intramuscular (IM)',
        site: 'Left Anterolateral Thigh'
      }
    ]
  },
  {
    ageMonths: 5,
    ageLabel: '5 Months',
    vaccines: [
      {
        code: 'DTaP-IPV-HepB-Hib-3',
        name: 'Hexavalent 6-in-1 (Dose 3)',
        targetDiseases: 'Diphtheria, Tetanus, Pertussis, Polio, Hep B, Hib',
        route: 'Intramuscular (IM)',
        site: 'Left Anterolateral Thigh'
      },
      {
        code: 'PCV-2',
        name: 'Pneumococcal Conjugate (Dose 2)',
        targetDiseases: 'Invasive Pneumococcal Disease',
        route: 'Intramuscular (IM)',
        site: 'Right Anterolateral Thigh'
      }
    ]
  },
  {
    ageMonths: 9,
    ageLabel: '9 Months',
    vaccines: [
      {
        code: 'JE-1',
        name: 'Japanese Encephalitis (Dose 1)',
        targetDiseases: 'Japanese Encephalitis (Sarawak Routine)',
        route: 'Subcutaneous',
        site: 'Deltoid / Anterolateral Thigh',
        regionalNote: 'Mandatory in Sarawak; elective in Peninsular Malaysia'
      }
    ]
  },
  {
    ageMonths: 12,
    ageLabel: '12 Months (1 Year)',
    vaccines: [
      {
        code: 'MMR-1',
        name: 'MMR (Dose 1)',
        targetDiseases: 'Measles, Mumps, Rubella',
        route: 'Subcutaneous',
        site: 'Left Deltoid'
      },
      {
        code: 'PCV-Booster',
        name: 'Pneumococcal Conjugate (Booster)',
        targetDiseases: 'Invasive Pneumococcal Disease',
        route: 'Intramuscular (IM)',
        site: 'Right Deltoid / Thigh'
      }
    ]
  },
  {
    ageMonths: 18,
    ageLabel: '18 Months (1.5 Years)',
    vaccines: [
      {
        code: 'DTaP-IPV-Hib-Booster',
        name: 'Hexavalent / Pentavalent (Booster)',
        targetDiseases: 'Diphtheria, Tetanus, Pertussis, Polio, Hib',
        route: 'Intramuscular (IM)',
        site: 'Left Deltoid'
      }
    ]
  }
];

export interface PatientVaccineStatus {
  vaccineCode: string;
  vaccineName: string;
  recommendedAgeMonths: number;
  recommendedAgeLabel: string;
  isDue: boolean;
  isOverdue: boolean;
  status: 'Administered' | 'Due' | 'Overdue' | 'Upcoming';
  administeredDate?: string;
  batchNo?: string;
  coldChainVerified?: boolean;
}

export function calculateChildAgeInMonths(birthDateStr: string, currentDate = new Date()): number {
  const dob = new Date(birthDateStr);
  if (isNaN(dob.getTime())) return 0;

  const yearsDiff = currentDate.getFullYear() - dob.getFullYear();
  const monthsDiff = currentDate.getMonth() - dob.getMonth();
  const daysDiff = currentDate.getDate() - dob.getDate();

  let totalMonths = yearsDiff * 12 + monthsDiff;
  if (daysDiff < 0) {
    totalMonths -= 1;
  }
  return Math.max(0, totalMonths);
}

export function evaluateImmunizationStatus(
  birthDateStr: string,
  administeredVaccines: { code: string; administeredDate: string; batchNo?: string }[] = [],
  currentDate = new Date()
): PatientVaccineStatus[] {
  const childAgeMonths = calculateChildAgeInMonths(birthDateStr, currentDate);
  const administeredMap = new Map(administeredVaccines.map(v => [v.code, v]));

  const result: PatientVaccineStatus[] = [];

  for (const milestone of KKM_CHILDHOOD_IMMUNIZATION_SCHEDULE) {
    for (const v of milestone.vaccines) {
      const admin = administeredMap.get(v.code);
      const isAlreadyGiven = !!admin;

      let status: 'Administered' | 'Due' | 'Overdue' | 'Upcoming';
      let isDue = false;
      let isOverdue = false;

      if (isAlreadyGiven) {
        status = 'Administered';
      } else if (childAgeMonths >= milestone.ageMonths + 2) {
        status = 'Overdue';
        isOverdue = true;
        isDue = true;
      } else if (childAgeMonths >= milestone.ageMonths) {
        status = 'Due';
        isDue = true;
      } else {
        status = 'Upcoming';
      }

      result.push({
        vaccineCode: v.code,
        vaccineName: v.name,
        recommendedAgeMonths: milestone.ageMonths,
        recommendedAgeLabel: milestone.ageLabel,
        isDue,
        isOverdue,
        status,
        administeredDate: admin?.administeredDate,
        batchNo: admin?.batchNo,
        coldChainVerified: isAlreadyGiven ? true : undefined
      });
    }
  }

  return result;
}

/**
 * Vaccine Cold Chain Log & Quality Control
 * KKM Standard: +2.0°C to +8.0°C.
 */
export interface ColdChainLogEntry {
  id: string;
  fridgeId: string;
  loggedAt: string;
  shift: 'Morning (08:00)' | 'Evening (17:00)' | 'Ad-Hoc / Pre-Administration';
  currentTempC: number;
  minTempC: number;
  maxTempC: number;
  isCompliant: boolean;
  excursionType?: 'Freeze Hazard (<2°C)' | 'Heat Hazard (>8°C)';
  loggedByNurse: string;
  correctiveActionTaken?: string;
}

export function evaluateColdChainTemp(tempC: number): {
  isCompliant: boolean;
  excursionType?: 'Freeze Hazard (<2°C)' | 'Heat Hazard (>8°C)';
  warningMessage?: string;
} {
  if (tempC < 2.0) {
    return {
      isCompliant: false,
      excursionType: 'Freeze Hazard (<2°C)',
      warningMessage: `CRITICAL COLD EXCURSION (${tempC}°C < 2.0°C). HepB, DTaP, PCV freeze denaturation risk. Quarantine fridge immediately.`
    };
  }
  if (tempC > 8.0) {
    return {
      isCompliant: false,
      excursionType: 'Heat Hazard (>8°C)',
      warningMessage: `HEAT EXCURSION (${tempC}°C > 8.0°C). Vaccine potency loss risk. Verify fridge seal & backup compressor.`
    };
  }
  return {
    isCompliant: true
  };
}
