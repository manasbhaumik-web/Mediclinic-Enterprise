/**
 * Emergency Transfer & SBAR Handover Engine
 * Clinical Standard: Malaysian Medical Council (MMC) & MOH Pre-Hospital Care Guidelines
 */

export type TransferPriority = 'Red' | 'Yellow';

export interface TransferVitalSigns {
  timestamp: string; // ISO
  bloodPressure: string; // e.g. "90/60"
  systolicBp: number;
  diastolicBp: number;
  heartRate: number; // bpm
  respiratoryRate: number; // /min
  spo2: number; // %
  oxygenSupport: string; // e.g. "Room Air" | "Nasal Cannula 3L/min" | "NRBM 15L/min"
  gcs: number; // 3 - 15
  bloodGlucoseMmol: number | null;
}

export interface EmergencyMedicationGiven {
  time: string; // e.g. "10:15 AM"
  drugName: string; // e.g. "Aspirin (Dispersible)"
  dose: string; // e.g. "300 mg"
  route: string; // e.g. "Oral" | "Sublingual" | "IV" | "IM" | "Nebulized"
  administeredBy: string; // Staff Name
}

export interface SBARTransferRecord {
  id: string; // e.g. "SBAR-20261101-001"
  encounterId: string;
  patientId: string;
  patientName: string;
  patientIC: string;
  gender: string;
  age: string;
  knownAllergies: string[];
  situation: {
    chiefComplaint: string;
    acuteDiagnosis: string;
    transferPriority: TransferPriority;
    referringDoctorName: string;
    referringDoctorMMC: string;
  };
  background: {
    pastMedicalHistory: string[];
    currentMedications: string[];
    resuscitationStatus: 'Full Code / CPR' | 'DNR';
    relevantNotes?: string;
  };
  assessment: {
    vitalsTrend: TransferVitalSigns[];
    ecgFindings?: string;
    clinicalSummary: string;
    gcsAvpu: string;
    shockIndex: number;
    isShockIndexElevated: boolean;
  };
  recommendation: {
    destinationHospital: string;
    ambulanceProvider: string;
    ivAccess: string;
    airwayBreathingSupport: string;
    medicationsGiven: EmergencyMedicationGiven[];
    receivingDoctorName?: string;
    receivingDoctorContact?: string;
    escortStaffName?: string;
  };
  timestamps: {
    transferDecisionAt: string; // ISO
    ambulanceCalledAt: string; // ISO
    ambulanceArrivedAt?: string; // ISO
    departedClinicAt?: string; // ISO
  };
  status: 'Active Transfer' | 'En Route' | 'Handed Over' | 'Cancelled';
}

export interface ShockIndexResult {
  shockIndex: number;
  isElevated: boolean;
  riskGrade: 'normal' | 'mild' | 'moderate' | 'severe';
  interpretation: string;
}

/**
 * Calculates Clinical Shock Index (HR / SBP).
 * Normal range: 0.5 - 0.7.
 * Shock Index >= 0.9 strongly predicts occult shock, critical care need, or massive transfusion risk.
 */
export function calculateShockIndex(heartRate: number, systolicBp: number): ShockIndexResult {
  if (systolicBp <= 0 || heartRate <= 0) {
    return {
      shockIndex: 0,
      isElevated: false,
      riskGrade: 'normal',
      interpretation: 'Invalid or zero hemodynamic inputs.',
    };
  }

  const index = Number((heartRate / systolicBp).toFixed(2));

  if (index < 0.7) {
    return {
      shockIndex: index,
      isElevated: false,
      riskGrade: 'normal',
      interpretation: 'Normal hemodynamics. Low risk of occult circulatory collapse.',
    };
  } else if (index < 0.9) {
    return {
      shockIndex: index,
      isElevated: false,
      riskGrade: 'mild',
      interpretation: 'Borderline compensation. Closely monitor peripheral perfusion.',
    };
  } else if (index < 1.1) {
    return {
      shockIndex: index,
      isElevated: true,
      riskGrade: 'moderate',
      interpretation: 'Elevated Shock Index (≥0.9). Early circulatory shock; requires urgent aggressive resuscitation.',
    };
  } else {
    return {
      shockIndex: index,
      isElevated: true,
      riskGrade: 'severe',
      interpretation: 'Severe Hemodynamic Shock (≥1.1). High mortality risk. Urgent tertiary ED resuscitation required.',
    };
  }
}

/**
 * Validates statutory completeness of an SBAR transfer sheet prior to dispatch handover.
 */
export function validateSBARCompleteness(record: Partial<SBARTransferRecord>): {
  isValid: boolean;
  missingFields: string[];
} {
  const missing: string[] = [];

  if (!record.patientName) missing.push('Patient Name');
  if (!record.patientIC) missing.push('Patient IC / Passport');
  if (!record.situation?.chiefComplaint) missing.push('Situation: Chief Complaint');
  if (!record.situation?.acuteDiagnosis) missing.push('Situation: Provisional Acute Diagnosis');
  if (!record.situation?.referringDoctorName) missing.push('Situation: Referring Doctor Name');
  if (!record.situation?.referringDoctorMMC) missing.push('Situation: Doctor MMC Number');
  if (!record.assessment?.clinicalSummary) missing.push('Assessment: Clinical Findings Summary');
  if (!record.assessment?.vitalsTrend || record.assessment.vitalsTrend.length === 0) {
    missing.push('Assessment: At least one set of Vital Signs');
  }
  if (!record.recommendation?.destinationHospital) missing.push('Recommendation: Target Referral Hospital');
  if (!record.recommendation?.ambulanceProvider) missing.push('Recommendation: Ambulance Service Provider');

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Formats a concise, verbal SBAR communication script for radio or telephone handover
 * to MECC 999 or the receiving hospital Emergency Department Medical Officer.
 */
export function formatSBARVerbalSummary(record: SBARTransferRecord): string {
  const latestVitals = record.assessment.vitalsTrend[record.assessment.vitalsTrend.length - 1];
  const vitalsText = latestVitals
    ? `BP ${latestVitals.bloodPressure} mmHg, HR ${latestVitals.heartRate} bpm, RR ${latestVitals.respiratoryRate}/min, SpO2 ${latestVitals.spo2}% on ${latestVitals.oxygenSupport}, GCS ${latestVitals.gcs}/15`
    : 'No vitals logged';

  const medsText =
    record.recommendation.medicationsGiven.length > 0
      ? record.recommendation.medicationsGiven.map((m) => `${m.drugName} ${m.dose} (${m.route})`).join(', ')
      : 'None';

  return `
[SBAR VERBAL HANDOVER - ${record.situation.transferPriority.toUpperCase()} PRIORITY]
SITUATION:
This is Dr. ${record.situation.referringDoctorName} (MMC ${record.situation.referringDoctorMMC}) from Mediclinic Enterprise.
Transferring patient ${record.patientName}, ${record.gender}/${record.age} (IC: ${record.patientIC}).
Presenting with ${record.situation.chiefComplaint}. Provisional diagnosis: ${record.situation.acuteDiagnosis}.

BACKGROUND:
Comorbidities: ${record.background.pastMedicalHistory.join(', ') || 'None known'}.
Allergies: ${record.knownAllergies.join(', ') || 'No known drug allergies'}.
Resuscitation Status: ${record.background.resuscitationStatus}.

ASSESSMENT:
Latest Vitals: ${vitalsText}.
Shock Index: ${record.assessment.shockIndex} (${record.assessment.isShockIndexElevated ? 'ELEVATED' : 'Normal'}).
Key Findings: ${record.assessment.clinicalSummary}.
${record.assessment.ecgFindings ? `ECG: ${record.assessment.ecgFindings}` : ''}

RECOMMENDATION:
Target Hospital: ${record.recommendation.destinationHospital}.
Ambulance Service: ${record.recommendation.ambulanceProvider}.
IV Access: ${record.recommendation.ivAccess || 'None'}.
Pre-Hospital Meds Given: ${medsText}.
Escort: ${record.recommendation.escortStaffName || 'Ambulance Crew'}.
  `.trim();
}

export const MALAYSIAN_TERTIARY_HOSPITALS = [
  'Hospital Kuala Lumpur (HKL) - Emergency Department',
  'Hospital Selayang - Jabatan Kecemasan & Trauma',
  'Hospital Sungai Buloh - Jabatan Kecemasan',
  'Hospital Serdang (Sultan Idris Shah) - Emergency Dept',
  'Hospital Putrajaya - Emergency Dept',
  'Hospital Tengku Ampuan Rahimah (HTAR Klang) - Emergency Dept',
  'Hospital Tuanku Jaafar (HTJ Seremban) - Emergency Dept',
  'Hospital Sultanah Aminah (HSA Johor Bahru) - Emergency Dept',
  'Hospital Pulau Pinang (HPP) - Emergency Dept',
  'Pusat Perubatan Universiti Malaya (PPUM / UMMC) - Trauma & Emergency',
  'Hospital Canselor Tuanku Muhriz (HUKM) - Emergency Dept',
  'Sunway Medical Centre - 24hr Emergency Centre',
  'Subang Jaya Medical Centre (SJMC) - Emergency Room',
  'Gleneagles Hospital Kuala Lumpur - Accident & Emergency',
  'Pantai Hospital Kuala Lumpur - A&E Department',
];

export const AMBULANCE_PROVIDERS = [
  'MECC 999 (Kementerian Kesihatan Malaysia)',
  'St. John Ambulance Malaysia (SJAM)',
  'Bulan Sabit Merah Malaysia (Malaysian Red Crescent)',
  'Hospital Panel Ambulance Service',
  'First Ambulance Private Dispatch',
];

export const INITIAL_SBAR_RECORDS: SBARTransferRecord[] = [
  {
    id: 'SBAR-20261101-001',
    encounterId: 'ENC-20261101-901',
    patientId: 'PT-1002',
    patientName: 'Tan Sri Dato Ahmad Razif',
    patientIC: '620815-10-5421',
    gender: 'Male',
    age: '64y',
    knownAllergies: ['Penicillin'],
    situation: {
      chiefComplaint: 'Acute retrosternal crushing chest pain radiating to left jaw x 45 mins',
      acuteDiagnosis: 'Acute Anterolateral ST-Elevation Myocardial Infarction (STEMI) - Killip II',
      transferPriority: 'Red',
      referringDoctorName: 'Dr. Sarah Farhana',
      referringDoctorMMC: 'MMC-58291',
    },
    background: {
      pastMedicalHistory: ['Hypertension x 15y', 'Type 2 Diabetes Mellitus x 10y', 'Dyslipidemia'],
      currentMedications: ['Amlodipine 10mg OD', 'Metformin 500mg BD', 'Atorvastatin 40mg ON'],
      resuscitationStatus: 'Full Code / CPR',
      relevantNotes: 'No previous history of PCI or CABG. Non-smoker.',
    },
    assessment: {
      vitalsTrend: [
        {
          timestamp: '2026-11-01T09:30:00.000Z',
          bloodPressure: '100/65',
          systolicBp: 100,
          diastolicBp: 65,
          heartRate: 108,
          respiratoryRate: 24,
          spo2: 93,
          oxygenSupport: 'High-Flow NRBM 12L/min',
          gcs: 15,
          bloodGlucoseMmol: 8.4,
        },
      ],
      ecgFindings: 'Sinus tachycardia, 3mm ST elevation in V2-V5, reciprocal ST depression in II, III, aVF.',
      clinicalSummary: 'Pale, diaphoretic, bibasal fine crackles heard on chest auscultation. S1 S2 present, no murmurs.',
      gcsAvpu: 'Alert (GCS 15/15)',
      shockIndex: 1.08,
      isShockIndexElevated: true,
    },
    recommendation: {
      destinationHospital: 'Hospital Serdang (Sultan Idris Shah) - Emergency Dept',
      ambulanceProvider: 'MECC 999 (Kementerian Kesihatan Malaysia)',
      ivAccess: 'Right Forearm 18G Cannula with IV Normal Saline running slowly (TKO)',
      airwayBreathingSupport: 'Oxygen via Non-Rebreather Mask (NRBM) @ 12 L/min, maintaining SpO2 98%',
      medicationsGiven: [
        {
          time: '09:35 AM',
          drugName: 'Aspirin (Dispersible)',
          dose: '300 mg',
          route: 'Oral / Chewed',
          administeredBy: 'Staff Nurse Aisyah',
        },
        {
          time: '09:36 AM',
          drugName: 'Ticagrelor',
          dose: '180 mg',
          route: 'Oral',
          administeredBy: 'Staff Nurse Aisyah',
        },
        {
          time: '09:40 AM',
          drugName: 'Glyceryl Trinitrate (GTN)',
          dose: '0.5 mg',
          route: 'Sublingual',
          administeredBy: 'Dr. Sarah Farhana',
        },
      ],
      receivingDoctorName: 'Dr. Lim (Primary PCI Registrar)',
      receivingDoctorContact: '03-8947 5555 Ext 2100',
      escortStaffName: 'Clinic Assistant Zarith',
    },
    timestamps: {
      transferDecisionAt: '2026-11-01T09:32:00.000Z',
      ambulanceCalledAt: '2026-11-01T09:34:00.000Z',
      ambulanceArrivedAt: '2026-11-01T09:46:00.000Z',
      departedClinicAt: '2026-11-01T09:50:00.000Z',
    },
    status: 'En Route',
  },
];
