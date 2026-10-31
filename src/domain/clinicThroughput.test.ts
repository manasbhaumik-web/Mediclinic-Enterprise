import { describe, expect, it } from 'vitest';
import { 
  analyzeClinicThroughput, 
  computeStageDurationMinutes, 
  PatientVisitTimestamps 
} from './clinicThroughput';

describe('Clinic Turnaround Time (TAT) & Throughput Bottleneck Engine', () => {
  it('correctly calculates stage duration in whole minutes', () => {
    const t1 = 1700000000000;
    const t2 = t1 + 12 * 60 * 1000; // 12 mins later
    expect(computeStageDurationMinutes(t1, t2)).toBe(12);
    expect(computeStageDurationMinutes(t2, t1)).toBeNull(); // invalid sequence
  });

  it('aggregates multi-patient flow and detects bottleneck when SLA breaches exceed threshold', () => {
    const baseTime = 1700000000000;
    
    // Simulate 3 patients where Waiting Room to Doctor breaches 20 min SLA (takes 35 mins)
    const mockVisits: PatientVisitTimestamps[] = [
      {
        visitId: 'v1',
        patientName: 'Patient A',
        registeredTime: baseTime,
        triageStartTime: baseTime + 5 * 60000, // 5 min (ok)
        triageEndTime: baseTime + 8 * 60000,
        consultationStartTime: baseTime + 43 * 60000, // 35 min wait! (breach > 20m)
        consultationEndTime: baseTime + 55 * 60000,   // 12 min doc (ok)
        dispensaryStartTime: baseTime + 60 * 60000,  // 5 min (ok)
        dispensaryEndTime: baseTime + 65 * 60000,
        settlementTime: baseTime + 68 * 60000        // 3 min (ok)
      },
      {
        visitId: 'v2',
        patientName: 'Patient B',
        registeredTime: baseTime + 10 * 60000,
        triageStartTime: baseTime + 15 * 60000,
        triageEndTime: baseTime + 18 * 60000,
        consultationStartTime: baseTime + 58 * 60000, // 40 min wait! (breach > 20m)
        consultationEndTime: baseTime + 70 * 60000,
        dispensaryStartTime: baseTime + 73 * 60000,
        dispensaryEndTime: baseTime + 77 * 60000,
        settlementTime: baseTime + 80 * 60000
      }
    ];

    const result = analyzeClinicThroughput(mockVisits);

    expect(result.totalVisitsAnalyzed).toBe(2);
    expect(result.primaryBottleneckStage).toBe('Waiting Room to Doctor');

    const triageToDocStage = result.stageBreakdown.find(s => s.stage === 'TriageToDoctor');
    expect(triageToDocStage?.isBottleneck).toBe(true);
    expect(triageToDocStage?.slaBreachCount).toBe(2);
    expect(triageToDocStage?.averageMinutes).toBeGreaterThanOrEqual(35);
  });

  it('handles empty visit queues gracefully with 100% compliance', () => {
    const emptyResult = analyzeClinicThroughput([]);
    expect(emptyResult.totalVisitsAnalyzed).toBe(0);
    expect(emptyResult.overallSlaComplianceRatePercent).toBe(100);
    expect(emptyResult.primaryBottleneckStage).toBeUndefined();
  });
});
