export interface PatientVisitTimestamps {
  visitId: string;
  patientName: string;
  registeredTime: number; // epoch ms
  triageStartTime?: number;
  triageEndTime?: number;
  consultationStartTime?: number;
  consultationEndTime?: number;
  dispensaryStartTime?: number;
  dispensaryEndTime?: number;
  settlementTime?: number;
}

export interface StageSlaBenchmark {
  stage: 'RegistrationToTriage' | 'TriageToDoctor' | 'ConsultationDuration' | 'DoctorToDispensary' | 'DispensaryToSettlement';
  label: string;
  targetMaxMinutes: number;
}

export const CLINIC_SLA_TARGETS: StageSlaBenchmark[] = [
  { stage: 'RegistrationToTriage', label: 'Door to Triage', targetMaxMinutes: 10 },
  { stage: 'TriageToDoctor', label: 'Waiting Room to Doctor', targetMaxMinutes: 20 },
  { stage: 'ConsultationDuration', label: 'Doctor Consultation Duration', targetMaxMinutes: 15 },
  { stage: 'DoctorToDispensary', label: 'Consultation to Medication Ready', targetMaxMinutes: 10 },
  { stage: 'DispensaryToSettlement', label: 'Dispensary to Bill Settlement', targetMaxMinutes: 5 },
];

export interface StageMetrics {
  stage: StageSlaBenchmark['stage'];
  label: string;
  averageMinutes: number;
  patientCount: number;
  slaBreachCount: number;
  targetMaxMinutes: number;
  isBottleneck: boolean;
}

export interface ClinicThroughputSummary {
  totalVisitsAnalyzed: number;
  averageTotalClinicStayMinutes: number;
  stageBreakdown: StageMetrics[];
  primaryBottleneckStage?: string;
  overallSlaComplianceRatePercent: number;
}

export function computeStageDurationMinutes(startMs?: number, endMs?: number): number | null {
  if (!startMs || !endMs || endMs < startMs) return null;
  return Math.round((endMs - startMs) / 60000);
}

export function analyzeClinicThroughput(
  visits: PatientVisitTimestamps[],
  slaTargets = CLINIC_SLA_TARGETS
): ClinicThroughputSummary {
  if (visits.length === 0) {
    return {
      totalVisitsAnalyzed: 0,
      averageTotalClinicStayMinutes: 0,
      stageBreakdown: slaTargets.map(t => ({
        stage: t.stage,
        label: t.label,
        averageMinutes: 0,
        patientCount: 0,
        slaBreachCount: 0,
        targetMaxMinutes: t.targetMaxMinutes,
        isBottleneck: false
      })),
      overallSlaComplianceRatePercent: 100
    };
  }

  const stageData: Record<StageSlaBenchmark['stage'], { totalMins: number; count: number; breaches: number }> = {
    RegistrationToTriage: { totalMins: 0, count: 0, breaches: 0 },
    TriageToDoctor: { totalMins: 0, count: 0, breaches: 0 },
    ConsultationDuration: { totalMins: 0, count: 0, breaches: 0 },
    DoctorToDispensary: { totalMins: 0, count: 0, breaches: 0 },
    DispensaryToSettlement: { totalMins: 0, count: 0, breaches: 0 },
  };

  let totalStayMinsSum = 0;
  let totalStayCount = 0;

  for (const v of visits) {
    const regToTriage = computeStageDurationMinutes(v.registeredTime, v.triageStartTime || v.triageEndTime);
    if (regToTriage !== null) {
      stageData.RegistrationToTriage.totalMins += regToTriage;
      stageData.RegistrationToTriage.count += 1;
      if (regToTriage > 10) stageData.RegistrationToTriage.breaches += 1;
    }

    const triageToDoc = computeStageDurationMinutes(v.triageEndTime, v.consultationStartTime);
    if (triageToDoc !== null) {
      stageData.TriageToDoctor.totalMins += triageToDoc;
      stageData.TriageToDoctor.count += 1;
      if (triageToDoc > 20) stageData.TriageToDoctor.breaches += 1;
    }

    const docDuration = computeStageDurationMinutes(v.consultationStartTime, v.consultationEndTime);
    if (docDuration !== null) {
      stageData.ConsultationDuration.totalMins += docDuration;
      stageData.ConsultationDuration.count += 1;
      if (docDuration > 15) stageData.ConsultationDuration.breaches += 1;
    }

    const docToPharm = computeStageDurationMinutes(v.consultationEndTime, v.dispensaryStartTime || v.dispensaryEndTime);
    if (docToPharm !== null) {
      stageData.DoctorToDispensary.totalMins += docToPharm;
      stageData.DoctorToDispensary.count += 1;
      if (docToPharm > 10) stageData.DoctorToDispensary.breaches += 1;
    }

    const pharmToSettlement = computeStageDurationMinutes(v.dispensaryEndTime, v.settlementTime);
    if (pharmToSettlement !== null) {
      stageData.DispensaryToSettlement.totalMins += pharmToSettlement;
      stageData.DispensaryToSettlement.count += 1;
      if (pharmToSettlement > 5) stageData.DispensaryToSettlement.breaches += 1;
    }

    if (v.settlementTime && v.registeredTime) {
      const stay = Math.round((v.settlementTime - v.registeredTime) / 60000);
      if (stay > 0) {
        totalStayMinsSum += stay;
        totalStayCount += 1;
      }
    }
  }

  // Find primary bottleneck by highest breach ratio
  let maxBreachRatio = -1;
  let bottleneckStage: string | undefined;

  const stageBreakdown: StageMetrics[] = slaTargets.map(t => {
    const data = stageData[t.stage];
    const avg = data.count > 0 ? Math.round(data.totalMins / data.count) : 0;
    const breachRatio = data.count > 0 ? data.breaches / data.count : 0;

    if (breachRatio > 0.25 && breachRatio > maxBreachRatio) {
      maxBreachRatio = breachRatio;
      bottleneckStage = t.label;
    }

    return {
      stage: t.stage,
      label: t.label,
      averageMinutes: avg,
      patientCount: data.count,
      slaBreachCount: data.breaches,
      targetMaxMinutes: t.targetMaxMinutes,
      isBottleneck: false
    };
  });

  // Mark the bottleneck stage
  if (bottleneckStage) {
    for (const s of stageBreakdown) {
      if (s.label === bottleneckStage) {
        s.isBottleneck = true;
      }
    }
  }

  const totalPatientsWithStages = stageBreakdown.reduce((acc, s) => acc + s.patientCount, 0);
  const totalBreaches = stageBreakdown.reduce((acc, s) => acc + s.slaBreachCount, 0);
  const complianceRate = totalPatientsWithStages > 0
    ? Math.round(((totalPatientsWithStages - totalBreaches) / totalPatientsWithStages) * 100)
    : 100;

  return {
    totalVisitsAnalyzed: visits.length,
    averageTotalClinicStayMinutes: totalStayCount > 0 ? Math.round(totalStayMinsSum / totalStayCount) : 0,
    stageBreakdown,
    primaryBottleneckStage: bottleneckStage,
    overallSlaComplianceRatePercent: complianceRate
  };
}
