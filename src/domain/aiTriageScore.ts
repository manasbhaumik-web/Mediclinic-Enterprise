/**
 * AI-Assisted Clinical Triage & Early Warning Scoring Engine (MEWS / NEWS2).
 * Evaluates patient vital signs for early detection of clinical deterioration,
 * shock, sepsis, or acute respiratory distress.
 */

export interface TriageVitalsInput {
  bpSystolic?: number | string | null;
  bpDiastolic?: number | string | null;
  heartRate?: number | string | null;
  respiratoryRate?: number | string | null;
  temperature?: number | string | null;
  spO2?: number | string | null;
}

export type TriageRiskLevel = 'Low' | 'Medium' | 'High';

export interface TriageScoreResult {
  score: number;
  riskLevel: TriageRiskLevel;
  badgeTone: 'ok' | 'warn' | 'bad';
  actionPrompt: string;
  actionPromptBM: string;
  flags: string[];
  subscores: {
    systolicBP: number;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    spO2: number;
  };
}

export function calculateMEWS(vitals: TriageVitalsInput): TriageScoreResult {
  const sbp = Number(vitals.bpSystolic) || 0;
  const hr = Number(vitals.heartRate) || 0;
  const rr = Number(vitals.respiratoryRate) || 0;
  const temp = Number(vitals.temperature) || 0;
  const spo2 = Number(vitals.spO2) || 0;

  let sbpScore = 0;
  let hrScore = 0;
  let rrScore = 0;
  let tempScore = 0;
  let spo2Score = 0;
  const flags: string[] = [];

  // 1. Systolic Blood Pressure
  if (sbp > 0) {
    if (sbp <= 70) {
      sbpScore = 3;
      flags.push('Severe Hypotension (SBP ≤ 70)');
    } else if (sbp <= 80) {
      sbpScore = 2;
      flags.push('Hypotension (SBP 71-80)');
    } else if (sbp <= 100) {
      sbpScore = 1;
    } else if (sbp >= 200) {
      sbpScore = 2;
      flags.push('Severe Hypertensive Urgency (SBP ≥ 200)');
    }
  }

  // 2. Heart Rate
  if (hr > 0) {
    if (hr < 40) {
      hrScore = 2;
      flags.push('Severe Bradycardia (HR < 40)');
    } else if (hr <= 50) {
      hrScore = 1;
    } else if (hr >= 130) {
      hrScore = 3;
      flags.push('Severe Tachycardia (HR ≥ 130)');
    } else if (hr >= 111) {
      hrScore = 2;
      flags.push('Tachycardia (HR 111-129)');
    } else if (hr >= 101) {
      hrScore = 1;
    }
  }

  // 3. Respiratory Rate
  if (rr > 0) {
    if (rr < 9) {
      rrScore = 2;
      flags.push('Bradypnea (RR < 9)');
    } else if (rr >= 30) {
      rrScore = 3;
      flags.push('Severe Tachypnea / Respiratory Distress (RR ≥ 30)');
    } else if (rr >= 21) {
      rrScore = 2;
      flags.push('Tachypnea (RR 21-29)');
    } else if (rr >= 15) {
      rrScore = 1;
    }
  }

  // 4. Body Temperature
  if (temp > 0) {
    if (temp < 35.0) {
      tempScore = 2;
      flags.push('Hypothermia (Temp < 35°C)');
    } else if (temp >= 38.5) {
      tempScore = 2;
      flags.push('High Pyrexia (Temp ≥ 38.5°C)');
    }
  }

  // 5. Oxygen Saturation (SpO2)
  if (spo2 > 0) {
    if (spo2 < 92) {
      spo2Score = 3;
      flags.push('Hypoxemia (SpO2 < 92%)');
    } else if (spo2 <= 93) {
      spo2Score = 2;
      flags.push('Low Oxygen Saturation (SpO2 92-93%)');
    } else if (spo2 <= 95) {
      spo2Score = 1;
    }
  }

  const totalScore = sbpScore + hrScore + rrScore + tempScore + spo2Score;

  // Determine Risk Category (any single score of 3 also triggers high risk)
  let riskLevel: TriageRiskLevel = 'Low';
  let badgeTone: 'ok' | 'warn' | 'bad' = 'ok';
  let actionPrompt = 'Stable vitals. Proceed with routine outpatient consultation queue.';
  let actionPromptBM = 'Tanda vital stabil. Teruskan giliran rawatan pesakit luar seperti biasa.';

  if (totalScore >= 5 || sbpScore === 3 || hrScore === 3 || rrScore === 3 || spo2Score === 3) {
    riskLevel = 'High';
    badgeTone = 'bad';
    actionPrompt = 'CRITICAL ALERT: Clinical deterioration risk. Fast-track for immediate Medical Officer review or emergency stabilization.';
    actionPromptBM = 'AMARAN KRITIKAL: Risiko kemerosotan klinikal. Utamakan untuk penilaian segera Pegawai Perubatan atau protokol kecemasan.';
  } else if (totalScore >= 3) {
    riskLevel = 'Medium';
    badgeTone = 'warn';
    actionPrompt = 'Potential risk detected. Prioritize consultation within 20 minutes and re-check vitals.';
    actionPromptBM = 'Potensi risiko dikesan. Beri keutamaan pemeriksaan dalam 20 minit dan semak semula tanda vital.';
  }

  return {
    score: totalScore,
    riskLevel,
    badgeTone,
    actionPrompt,
    actionPromptBM,
    flags,
    subscores: {
      systolicBP: sbpScore,
      heartRate: hrScore,
      respiratoryRate: rrScore,
      temperature: tempScore,
      spO2: spo2Score,
    },
  };
}
