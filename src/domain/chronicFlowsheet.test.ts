import { describe, expect, it } from 'vitest';
import {
  classifyBloodPressure,
  calculateMAP,
  extractChronicFlowsheet,
} from './chronicFlowsheet';
import { Visit } from '../types';

describe('chronicFlowsheet domain logic', () => {
  it('classifies blood pressure accurately according to Malaysian CPG guidelines', () => {
    expect(classifyBloodPressure(118, 76)).toBe('Normal');
    expect(classifyBloodPressure(124, 78)).toBe('Elevated');
    expect(classifyBloodPressure(134, 84)).toBe('Stage 1 HTN');
    expect(classifyBloodPressure(142, 92)).toBe('Stage 2 HTN');
  });

  it('calculates mean arterial pressure (MAP) correctly', () => {
    // MAP = DBP + (SBP - DBP)/3 -> 80 + (120 - 80)/3 = 80 + 13.33 = 93.3
    expect(calculateMAP(120, 80)).toBe(93.3);
  });

  it('extracts BP trend, identifies chronic conditions, and formats milestones', () => {
    const visits: Visit[] = [
      {
        id: 'v-1',
        patientId: 'p-1',
        date: '2026-06-01',
        status: 'Paid',
        totalBill: 60,
        panelClaimed: 0,
        paidAmount: 60,
        soap: {
          subjective: 'Follow up hypertension',
          objective: { bpSystolic: 144, bpDiastolic: 92, heartRate: 76, temperature: 36.6, respiratoryRate: 16 },
          assessment: { icdCode: 'I10', description: 'Essential Hypertension', clinicalNotes: 'Fundus exam normal' },
          plan: { prescription: [], followUpWeeks: 8, mcDays: 0, requiresReferral: false },
        },
      },
      {
        id: 'v-2',
        patientId: 'p-1',
        date: '2026-08-01',
        status: 'Paid',
        totalBill: 80,
        panelClaimed: 0,
        paidAmount: 80,
        soap: {
          subjective: 'Medication titration review',
          objective: { bpSystolic: 132, bpDiastolic: 84, heartRate: 72, temperature: 36.7, respiratoryRate: 16 },
          assessment: { icdCode: 'I10', description: 'Essential Hypertension', clinicalNotes: 'HbA1c 6.8%, fasting glucose 5.9' },
          plan: { prescription: [], followUpWeeks: 12, mcDays: 0, requiresReferral: false },
        },
      },
    ];

    const flowsheet = extractChronicFlowsheet(visits, { bpSystolic: 126, bpDiastolic: 80 });

    expect(flowsheet.hasChronicCondition).toBe(true);
    expect(flowsheet.conditionsIdentified).toContain('Hypertension (I10)');
    // 2 past visits + 1 active today = 3 readings
    expect(flowsheet.bpHistory.length).toBe(3);
    expect(flowsheet.bpHistory[0].status).toBe('Stage 2 HTN');
    expect(flowsheet.bpHistory[1].status).toBe('Stage 1 HTN');
    expect(flowsheet.bpHistory[2].date).toBe('Today (Active)');
    expect(flowsheet.glycemicHistory.length).toBeGreaterThan(0);
    expect(flowsheet.glycemicHistory[0].hba1c).toBe(6.8);
    expect(flowsheet.milestones.length).toBe(4);
  });
});
