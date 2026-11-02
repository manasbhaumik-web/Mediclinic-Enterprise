import { Visit, VitalSigns } from '../types';

export interface BloodPressurePoint {
  date: string;
  systolic: number;
  diastolic: number;
  map: number;
  status: 'Normal' | 'Elevated' | 'Stage 1 HTN' | 'Stage 2 HTN';
}

export interface GlycemicPoint {
  date: string;
  hba1c?: number; // %
  fbg?: number; // mmol/L
}

export interface LipidPoint {
  date: string;
  totalChol?: number; // mmol/L
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
}

export interface RenalPoint {
  date: string;
  creatinine?: number; // umol/L
  egfr?: number; // mL/min/1.73m2
}

export interface ClinicalMilestone {
  id: string;
  name: string;
  category: 'Diabetic Screening' | 'Cardiovascular' | 'Renal';
  intervalMonths: number;
  lastCompletedDate?: string;
  isOverdue: boolean;
  statusText: string;
}

export interface ChronicFlowsheetData {
  bpHistory: BloodPressurePoint[];
  glycemicHistory: GlycemicPoint[];
  lipidHistory: LipidPoint[];
  renalHistory: RenalPoint[];
  milestones: ClinicalMilestone[];
  hasChronicCondition: boolean;
  conditionsIdentified: string[];
}

export function classifyBloodPressure(systolic: number, diastolic: number): 'Normal' | 'Elevated' | 'Stage 1 HTN' | 'Stage 2 HTN' {
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 HTN';
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return 'Stage 1 HTN';
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 'Elevated';
  return 'Normal';
}

export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round((diastolic + (systolic - diastolic) / 3) * 10) / 10;
}

/** Extracts and aggregates chronic disease trends across historical visits */
export function extractChronicFlowsheet(
  pastVisits: Visit[] = [],
  currentVitals?: Partial<VitalSigns>
): ChronicFlowsheetData {
  const bpHistory: BloodPressurePoint[] = [];
  const glycemicHistory: GlycemicPoint[] = [];
  const lipidHistory: LipidPoint[] = [];
  const renalHistory: RenalPoint[] = [];
  const conditionsSet = new Set<string>();

  // Iterate chronologically through past visits
  const sortedVisits = [...pastVisits].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  for (const v of sortedVisits) {
    const visitDate = v.date || 'Unknown';
    const obj = v.soap?.objective;
    const desc = (v.soap?.assessment?.description || '').toLowerCase();
    const notes = (v.soap?.assessment?.clinicalNotes || '').toLowerCase();
    const labs = v.soap?.plan?.labOrders || [];

    // Condition identification
    if (desc.includes('hypertension') || desc.includes('htn') || (v.soap?.assessment?.icdCode || '').startsWith('I10')) {
      conditionsSet.add('Hypertension (I10)');
    }
    if (desc.includes('diabetes') || desc.includes('t2dm') || (v.soap?.assessment?.icdCode || '').startsWith('E11')) {
      conditionsSet.add('Type 2 Diabetes (E11)');
    }
    if (desc.includes('dyslipidemia') || desc.includes('cholesterol') || (v.soap?.assessment?.icdCode || '').startsWith('E78')) {
      conditionsSet.add('Dyslipidemia (E78)');
    }

    // BP Readings
    if (obj && obj.bpSystolic && obj.bpSystolic > 0) {
      const sys = obj.bpSystolic;
      const dia = obj.bpDiastolic || 80;
      bpHistory.push({
        date: visitDate,
        systolic: sys,
        diastolic: dia,
        map: calculateMAP(sys, dia),
        status: classifyBloodPressure(sys, dia),
      });
    }

    // Parse potential lab results mentioned in clinical notes or mock data
    const hba1cMatch = notes.match(/hba1c\s*[:=]?\s*(\d+(\.\d+)?)/i);
    const fbgMatch = notes.match(/(?:fbg|glucose|sugar)\s*[:=]?\s*(\d+(\.\d+)?)/i);
    if (hba1cMatch || fbgMatch || labs.some(l => l.toLowerCase().includes('hba1c') || l.toLowerCase().includes('glucose'))) {
      glycemicHistory.push({
        date: visitDate,
        hba1c: hba1cMatch ? parseFloat(hba1cMatch[1]) : undefined,
        fbg: fbgMatch ? parseFloat(fbgMatch[1]) : undefined,
      });
    }

    const ldlMatch = notes.match(/ldl\s*[:=]?\s*(\d+(\.\d+)?)/i);
    const cholMatch = notes.match(/(?:cholesterol|total chol)\s*[:=]?\s*(\d+(\.\d+)?)/i);
    if (ldlMatch || cholMatch || labs.some(l => l.toLowerCase().includes('lipid'))) {
      lipidHistory.push({
        date: visitDate,
        totalChol: cholMatch ? parseFloat(cholMatch[1]) : undefined,
        ldl: ldlMatch ? parseFloat(ldlMatch[1]) : undefined,
      });
    }

    const creatMatch = notes.match(/creatinine\s*[:=]?\s*(\d+(\.\d+)?)/i);
    const egfrMatch = notes.match(/egfr\s*[:=]?\s*(\d+(\.\d+)?)/i);
    if (creatMatch || egfrMatch || labs.some(l => l.toLowerCase().includes('renal'))) {
      renalHistory.push({
        date: visitDate,
        creatinine: creatMatch ? parseFloat(creatMatch[1]) : undefined,
        egfr: egfrMatch ? parseFloat(egfrMatch[1]) : undefined,
      });
    }
  }

  // Include current encounter vitals at the end (latest)
  if (currentVitals && currentVitals.bpSystolic && currentVitals.bpSystolic > 0) {
    const sys = currentVitals.bpSystolic;
    const dia = currentVitals.bpDiastolic || 80;
    bpHistory.push({
      date: 'Today (Active)',
      systolic: sys,
      diastolic: dia,
      map: calculateMAP(sys, dia),
      status: classifyBloodPressure(sys, dia),
    });
  }

  // Standard Malaysian CPG Clinical Milestones for Chronic Disease (T2DM & HTN)
  const milestones: ClinicalMilestone[] = [
    {
      id: 'm-eye',
      name: 'Dilated Funduscopy / Retinal Photography',
      category: 'Diabetic Screening',
      intervalMonths: 12,
      lastCompletedDate: pastVisits.find(v => (v.soap?.assessment?.clinicalNotes || '').toLowerCase().includes('fundus'))?.date,
      isOverdue: true, // Default overdue if not found in past 12 mos
      statusText: 'Annual Retinopathy Screening Due',
    },
    {
      id: 'm-foot',
      name: 'Diabetic Comprehensive Foot Exam & Monofilament',
      category: 'Diabetic Screening',
      intervalMonths: 12,
      lastCompletedDate: pastVisits.find(v => (v.soap?.assessment?.clinicalNotes || '').toLowerCase().includes('foot'))?.date,
      isOverdue: true,
      statusText: 'Annual Neuropathy & Peripheral Vascular Exam Due',
    },
    {
      id: 'm-urine',
      name: 'Urine Microalbumin / ACR Test',
      category: 'Renal',
      intervalMonths: 12,
      lastCompletedDate: pastVisits.find(v => (v.soap?.assessment?.clinicalNotes || '').toLowerCase().includes('microalbumin'))?.date,
      isOverdue: true,
      statusText: 'Annual Diabetic Nephropathy Screen Due',
    },
    {
      id: 'm-ecg',
      name: 'Resting 12-Lead Electrocardiogram (ECG)',
      category: 'Cardiovascular',
      intervalMonths: 12,
      lastCompletedDate: pastVisits.find(v => (v.soap?.plan?.procedures || []).some(p => p.name.includes('ECG')))?.date,
      isOverdue: !pastVisits.some(v => (v.soap?.plan?.procedures || []).some(p => p.name.includes('ECG'))),
      statusText: 'Annual Resting ECG Cardioprotection Baseline',
    },
  ];

  return {
    bpHistory: bpHistory.slice(-6), // Keep last 6 readings
    glycemicHistory: glycemicHistory.slice(-6),
    lipidHistory: lipidHistory.slice(-6),
    renalHistory: renalHistory.slice(-6),
    milestones,
    hasChronicCondition: conditionsSet.size > 0,
    conditionsIdentified: Array.from(conditionsSet),
  };
}
