/**
 * Adverse Event Following Immunization (AEFI) & Staff Sharps / Needle-Stick PEP Engine
 * Statutory Standards: KKM BPKK NIP Surveillance, NPRA Pharmacovigilance, and OSHA 1994 (Act 514).
 */

export type AEFISeverity = 'minor' | 'moderate' | 'severe_anaphylaxis';

export interface AEFIRecord {
  id: string; // e.g. "AEFI-20261101-01"
  patientId: string;
  patientName: string;
  patientIc: string;
  patientAgeYears: number;
  weightKg: number;
  vaccineCode: string;
  vaccineName: string;
  batchNo: string;
  doseNo: number;
  fridgeId: string;
  administeredAt: string; // ISO
  reactionStartedAt: string; // ISO
  onsetMinutes: number;
  severity: AEFISeverity;
  symptoms: string[];
  adrenalineGiven: boolean;
  adrenalineDoseMg?: number;
  hospitalTransferred: boolean;
  sbarRefId?: string;
  outcome: 'Recovered Completely' | 'Under Observation' | 'Transferred to Hospital ED' | 'Fatal';
  reportedToPKD: boolean;
  pkdReportedAt?: string;
  reportingDoctorName: string;
  doctorMMC: string;
  clinicalNotes: string;
}

export type SharpsExposureType = 'deep_puncture' | 'superficial_cut' | 'mucous_membrane_splash';
export type SourcePatientStatus =
  | 'known_positive_hiv'
  | 'known_positive_hbv'
  | 'known_positive_hcv'
  | 'known_negative_all'
  | 'unknown_high_risk'
  | 'unknown_low_risk';

export type HCWImmunityStatus =
  | 'vaccinated_responder' // Anti-HBs >= 10 mIU/mL
  | 'vaccinated_non_responder' // Anti-HBs < 10 mIU/mL
  | 'unvaccinated_or_unknown';

export interface SharpsIncidentRecord {
  id: string; // e.g. "SHARPS-20261101-01"
  staffId: string;
  staffName: string;
  staffRole: string;
  occurredAt: string; // ISO
  reportedAt: string; // ISO
  exposureType: SharpsExposureType;
  deviceInvolved: 'Hollow-Bore Needle (Phlebotomy/IV)' | 'Solid Suture Needle' | 'Scalpel Blade' | 'Lancet / Glass';
  sourcePatientId?: string;
  sourcePatientStatus: SourcePatientStatus;
  hcwImmunityStatus: HCWImmunityStatus;
  firstAidCompleted: boolean;
  pepRecommended: boolean;
  pepProtocol: string;
  pepHourLimitRemaining: number;
  serologyOrdered: boolean;
  jkkpFormRequired: boolean;
  supervisingDoctorMMC: string;
  clinicalNotes: string;
}

/**
 * Computes weight-based IM Adrenaline (1:1000, 1 mg/mL) dose for anaphylaxis.
 * Dosage: 0.01 mg/kg up to a maximum single dose of 0.5 mg.
 */
export function calculateAdrenalineDose(weightKg: number): {
  doseMg: number;
  volumeMl: number;
  route: string;
  maxDoseMg: number;
} {
  const safeWeight = Math.max(1, weightKg);
  const calculatedDose = safeWeight * 0.01;
  const doseMg = Math.min(0.5, Math.round(calculatedDose * 100) / 100);
  const volumeMl = doseMg; // 1:1000 is 1 mg/mL

  return {
    doseMg,
    volumeMl,
    route: 'Intramuscular (IM) Anterolateral Mid-Thigh',
    maxDoseMg: 0.5,
  };
}

/**
 * Classifies AEFI severity according to KKM BPKK and WHO clinical criteria.
 */
export function classifyAEFISeverity(
  symptoms: string[],
  onsetMinutes: number
): {
  severity: AEFISeverity;
  isAnaphylaxisAlert: boolean;
  mandatoryHospitalTransfer: boolean;
  guidance: string;
} {
  const lowerSymptoms = symptoms.map((s) => s.toLowerCase());

  const hasAnaphylaxisSign = lowerSymptoms.some(
    (s) =>
      s.includes('hypotension') ||
      s.includes('stridor') ||
      s.includes('wheeze') ||
      s.includes('cyanosis') ||
      s.includes('shock') ||
      s.includes('loss of consciousness') ||
      s.includes('angioedema') ||
      s.includes('seizure') ||
      s.includes('hhe')
  );

  if (hasAnaphylaxisSign || onsetMinutes <= 30 && lowerSymptoms.some((s) => s.includes('breathing') || s.includes('dyspnea'))) {
    return {
      severity: 'severe_anaphylaxis',
      isAnaphylaxisAlert: true,
      mandatoryHospitalTransfer: true,
      guidance:
        'CRITICAL ANAPHYLAXIS / SEVERE AEFI: Administer immediate IM Adrenaline 1:1000 into anterolateral mid-thigh. Lay patient flat with legs elevated. High-flow O2 via non-rebreather mask (10-15 L/min). Activate MECC 999 SBAR emergency ambulance transfer. Immediate notification to PKD within 24 hours.',
    };
  }

  const hasModerateSign = lowerSymptoms.some(
    (s) =>
      s.includes('high fever') ||
      s.includes('fever >39') ||
      s.includes('swelling >5cm') ||
      s.includes('persistent crying') ||
      s.includes('abscess') ||
      s.includes('generalized urticaria')
  );

  if (hasModerateSign) {
    return {
      severity: 'moderate',
      isAnaphylaxisAlert: false,
      mandatoryHospitalTransfer: false,
      guidance:
        'MODERATE AEFI: Observe in clinic for at least 1-2 hours. Prescribe paracetamol for fever/pain. Instruct caregiver on danger signs (stridor, breathing difficulty, lethargy). Submit routine BPKK AEFI surveillance notification to PKD within 48 hours.',
    };
  }

  return {
    severity: 'minor',
    isAnaphylaxisAlert: false,
    mandatoryHospitalTransfer: false,
    guidance:
      'EXPECTED MINOR REACTION: Local injection site tenderness, low-grade fever (<38.5°C), or mild irritability. Cold compress to injection site and symptom management. Document in immunization card.',
  };
}

/**
 * Evaluates sharps / needle-stick injury risk and Post-Exposure Prophylaxis (PEP) eligibility under OSHA 1994.
 */
export function evaluateSharpsRiskAndPEP(
  exposure: SharpsExposureType,
  device: string,
  sourceStatus: SourcePatientStatus,
  hcwStatus: HCWImmunityStatus,
  elapsedHours: number
): {
  pepRecommended: boolean;
  pepProtocol: string;
  hbvManagement: string;
  hcvManagement: string;
  isWindowExpired: boolean;
  hoursRemaining: number;
  jkkpFormRequired: boolean;
  summary: string;
} {
  const maxWindow = 72;
  const hoursRemaining = Math.max(0, maxWindow - elapsedHours);
  const isWindowExpired = elapsedHours > maxWindow;

  // HIV PEP Decision
  const isHighRiskExposure =
    exposure === 'deep_puncture' ||
    (device.toLowerCase().includes('hollow-bore') && exposure !== 'superficial_cut');

  const hivPositiveOrHighRisk =
    sourceStatus === 'known_positive_hiv' || sourceStatus === 'unknown_high_risk';

  const pepRecommended = isHighRiskExposure && hivPositiveOrHighRisk && !isWindowExpired;

  let pepProtocol = 'HIV PEP Not Indicated';
  if (pepRecommended) {
    pepProtocol =
      'START 28-DAY 3-DRUG HIV PEP REGIMEN IMMEDIATELY (e.g. Tenofovir Disoproxil + Emtricitabine/Lamivudine + Dolutegravir). First dose must be given within 2-4 hours, max 72 hours.';
  } else if (isWindowExpired && hivPositiveOrHighRisk) {
    pepProtocol =
      'PEP WINDOW EXPIRED (>72 hours). Routine prophylaxis not proven effective; refer immediately to Infectious Disease Specialist for baseline serology and surveillance.';
  }

  // HBV Prophylaxis Decision
  let hbvManagement = 'HCW immune (Anti-HBs >= 10 mIU/mL). No HBIG or booster required.';
  if (hcwStatus === 'unvaccinated_or_unknown' || hcwStatus === 'vaccinated_non_responder') {
    if (sourceStatus === 'known_positive_hbv' || sourceStatus === 'unknown_high_risk') {
      hbvManagement =
        'URGENT HBV PROPHYLAXIS: Administer Hepatitis B Immunoglobulin (HBIG) 500 IU IM ideally within 24 hours (max 7 days) + initiate accelerated HBV vaccine series.';
    } else {
      hbvManagement = 'Source patient HBsAg negative: Administer Hepatitis B vaccine booster dose to HCW.';
    }
  }

  // HCV Management (No PEP currently approved; baseline & follow-up PCR/antibody)
  const hcvManagement =
    sourceStatus === 'known_positive_hcv'
      ? 'HCV EXPOSURE: No PEP approved. Perform baseline Anti-HCV and ALT at 0, 6, 12, and 24 weeks. Early treatment with Direct-Acting Antivirals (DAAs) if seroconversion occurs.'
      : 'HCV risk low. Standard baseline serology monitoring.';

  // OSHA 1994 NADOPOD
  const jkkpFormRequired = true; // All contaminated sharps exposures in healthcare are statutory reportable workplace incidents

  return {
    pepRecommended,
    pepProtocol,
    hbvManagement,
    hcvManagement,
    isWindowExpired,
    hoursRemaining,
    jkkpFormRequired,
    summary: `Exposure: ${exposure} (${device}). Source: ${sourceStatus}. PEP Recommended: ${pepRecommended ? 'YES' : 'NO'}. ${hoursRemaining}h remaining in 72h window.`,
  };
}

/**
 * Generates official BPKK / NPRA AEFI statutory report text.
 */
export function exportAefiReportText(record: AEFIRecord): string {
  return `========================================================================
BAHAGIAN PEMBANGUNAN KESIHATAN KELUARGA (BPKK) & NPRA MALAYSIA
STATUTORY ADVERSE EVENT FOLLOWING IMMUNISATION (AEFI) REPORT
========================================================================
Report ID          : ${record.id}
Date Reported      : ${new Date().toISOString()}
Reporting Facility : Mediclinic Enterprise Ambulatory Care Centre
Reporting Doctor   : ${record.reportingDoctorName} (MMC No: ${record.doctorMMC})

1. PATIENT IDENTIFICATION
------------------------------------------------------------------------
Patient Name       : ${record.patientName}
IC / Passport No   : ${record.patientIc}
Age / Weight       : ${record.patientAgeYears} Years / ${record.weightKg} kg
Patient Record ID  : ${record.patientId}

2. VACCINE PARTICULARS
------------------------------------------------------------------------
Vaccine Name       : ${record.vaccineName} (${record.vaccineCode})
Batch / Lot Number : ${record.batchNo}
Dose Sequence      : Dose #${record.doseNo}
Storage Fridge ID  : ${record.fridgeId}
Date Administered  : ${record.administeredAt}

3. ADVERSE EVENT DETAILS
------------------------------------------------------------------------
Onset of Symptoms  : ${record.reactionStartedAt} (Elapsed: ${record.onsetMinutes} mins)
Severity Grading   : ${record.severity.toUpperCase()}
Observed Symptoms  : ${record.symptoms.join(', ')}

4. CLINICAL MANAGEMENT & INTERVENTION
------------------------------------------------------------------------
Adrenaline 1:1000  : ${record.adrenalineGiven ? `YES (${record.adrenalineDoseMg} mg IM)` : 'NO'}
Emergency SBAR Ref : ${record.sbarRefId || 'N/A'}
Hospital Transfer  : ${record.hospitalTransferred ? 'YES (MECC 999 Activated)' : 'NO'}
Clinical Outcome   : ${record.outcome}

5. CLINICAL NOTES & STATUTORY FILING
------------------------------------------------------------------------
Clinical Notes     : ${record.clinicalNotes}
PKD Notification   : ${record.reportedToPKD ? `FMT/PKD Submitted at ${record.pkdReportedAt}` : 'PENDING NOTIFICATION'}
========================================================================`;
}

export const DEFAULT_AEFI_RECORDS: AEFIRecord[] = [
  {
    id: 'AEFI-20261020-001',
    patientId: 'PAT-6712',
    patientName: 'Nurul Huda binti Azman',
    patientIc: '190412-14-5522',
    patientAgeYears: 7,
    weightKg: 22,
    vaccineCode: 'HEXA-01',
    vaccineName: 'Hexaxim 6-in-1 (DTaP-IPV-HepB-Hib)',
    batchNo: 'HX2026-99',
    doseNo: 3,
    fridgeId: 'FRIDGE-VACC-01',
    administeredAt: '2026-10-20T10:00:00.000Z',
    reactionStartedAt: '2026-10-20T10:18:00.000Z',
    onsetMinutes: 18,
    severity: 'severe_anaphylaxis',
    symptoms: ['Angioedema', 'Stridor', 'Generalized Urticaria', 'Hypotension'],
    adrenalineGiven: true,
    adrenalineDoseMg: 0.22,
    hospitalTransferred: true,
    sbarRefId: 'SBAR-20261020-01',
    outcome: 'Transferred to Hospital ED',
    reportedToPKD: true,
    pkdReportedAt: '2026-10-20T11:30:00.000Z',
    reportingDoctorName: 'Dr. Siti Nurhaliza',
    doctorMMC: 'MMC-48912',
    clinicalNotes:
      'Acute anaphylactic reaction 18m post dose. 0.22mg IM Adrenaline administered to right anterolateral mid-thigh. Airway maintained on high-flow O2. Patient transferred via MECC 999 to Hospital Selayang ED.',
  },
];

export const DEFAULT_SHARPS_RECORDS: SharpsIncidentRecord[] = [
  {
    id: 'SHARPS-20261012-001',
    staffId: 'STF-CA-01',
    staffName: 'Staff Nurse Aisyah',
    staffRole: 'Clinic Assistant / Staff Nurse',
    occurredAt: '2026-10-12T14:30:00.000Z',
    reportedAt: '2026-10-12T14:45:00.000Z',
    exposureType: 'deep_puncture',
    deviceInvolved: 'Hollow-Bore Needle (Phlebotomy/IV)',
    sourcePatientId: 'PAT-8819',
    sourcePatientStatus: 'known_positive_hbv',
    hcwImmunityStatus: 'vaccinated_responder',
    firstAidCompleted: true,
    pepRecommended: false,
    pepProtocol: 'HIV PEP not indicated. HCW has Anti-HBs >100 mIU/mL; no HBIG required.',
    pepHourLimitRemaining: 71,
    serologyOrdered: true,
    jkkpFormRequired: true,
    supervisingDoctorMMC: 'MMC-48912',
    clinicalNotes:
      'Deep puncture to left index finger during needle recapping post blood collection. Immediate wound cleansing with soap and copious water for 5 minutes. Baseline blood taken from HCW and source patient.',
  },
];
