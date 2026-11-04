import { describe, expect, it } from 'vitest';
import {
  COMMON_CLINIC_PROCEDURES,
  createProcedureOrder,
  completeProcedure,
  completeVisitProcedure,
  calculateProcedureTotal,
  determineNextWorkflowStep,
} from './procedures';
import { SOAPNotes } from '../types';

describe('procedures domain logic', () => {
  it('contains expected standard Malaysian clinic procedures', () => {
    expect(COMMON_CLINIC_PROCEDURES.length).toBeGreaterThanOrEqual(10);
    const voltaren = COMMON_CLINIC_PROCEDURES.find((p) => p.name.includes('Voltaren'));
    expect(voltaren).toBeDefined();
    expect(voltaren?.category).toBe('Injection');
    expect(voltaren?.price).toBe(35);
  });

  it('creates a procedure order with pending status and timestamp', () => {
    const preset = COMMON_CLINIC_PROCEDURES[0];
    const order = createProcedureOrder(preset, 'doc-123', 'Severe acute lumbago');
    expect(order.id).toMatch(/^proc-/);
    expect(order.status).toBe('Pending');
    expect(order.orderedByDoctorId).toBe('doc-123');
    expect(order.clinicalNotes).toBe('Severe acute lumbago');
    expect(order.orderedAt).toBeDefined();
  });

  it('completes procedure with nurse ID, administration site, and batch number', () => {
    const preset = COMMON_CLINIC_PROCEDURES[0];
    const order = createProcedureOrder(preset, 'doc-123');
    const completed = completeProcedure(order, 'nurse-456', {
      adminSite: 'Left Ventrogluteal',
      batchNo: 'VOLT-2026-X4',
      clinicalNotes: 'Well tolerated, no acute anaphylaxis observed post 15m',
    });

    expect(completed.status).toBe('Completed');
    expect(completed.administeredByNurseId).toBe('nurse-456');
    expect(completed.adminSite).toBe('Left Ventrogluteal');
    expect(completed.batchNo).toBe('VOLT-2026-X4');
    expect(completed.administeredAt).toBeDefined();
  });

  it('calculates procedure total for completed procedures only', () => {
    const p1 = createProcedureOrder(COMMON_CLINIC_PROCEDURES[0], 'doc-1'); // RM 35
    const p2 = createProcedureOrder(COMMON_CLINIC_PROCEDURES[1], 'doc-1'); // RM 40
    const completedP1 = completeProcedure(p1, 'nurse-1', {});

    // p1 completed (RM 35), p2 pending (RM 40)
    const total = calculateProcedureTotal([completedP1, p2]);
    expect(total).toBe(35.00);
  });

  it('routes to Awaiting Procedure when pending procedure exists, otherwise Awaiting Dispensation', () => {
    const emptySoap: SOAPNotes = {
      subjective: 'Cough',
      objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 72, temperature: 36.8, respiratoryRate: 16 },
      assessment: { icdCode: 'J06.9', description: 'URTI', clinicalNotes: 'Rest' },
      plan: { prescription: [], followUpWeeks: 0, mcDays: 0, requiresReferral: false },
    };

    expect(determineNextWorkflowStep(emptySoap)).toBe('Awaiting Dispensation');

    const soapWithProc: SOAPNotes = {
      ...emptySoap,
      plan: {
        ...emptySoap.plan,
        procedures: [createProcedureOrder(COMMON_CLINIC_PROCEDURES[0], 'doc-1')],
      },
    };

    expect(determineNextWorkflowStep(soapWithProc)).toBe('Awaiting Procedure');
  });

  it('completes visit procedure, leaves the bill to the cashier, and advances status when all completed', () => {
    const order = createProcedureOrder(COMMON_CLINIC_PROCEDURES[0], 'doc-1'); // RM 35
    const dummyVisit = {
      id: 'vis-1',
      patientId: 'pat-1',
      date: '2026-01-01',
      status: 'Awaiting Procedure' as const,
      totalBill: 50.00,
      panelClaimed: 0,
      paidAmount: 0,
      soap: {
        subjective: 'Back pain',
        objective: { bpSystolic: 120, bpDiastolic: 80, heartRate: 72, temperature: 36.8, respiratoryRate: 16 },
        assessment: { icdCode: 'M54.5', description: 'Low back pain', clinicalNotes: '' },
        plan: {
          prescription: [],
          procedures: [order],
          followUpWeeks: 0,
          mcDays: 0,
          requiresReferral: false,
        },
      },
    };

    const updated = completeVisitProcedure(dummyVisit, order.id, 'nurse-1', {
      adminSite: 'Right Gluteal',
      batchNo: 'VOLT-001',
    });

    expect(updated.status).toBe('Awaiting Dispensation');
    expect(updated.totalBill).toBe(50.00); // unchanged: only the cashier sets the bill
    expect(updated.soap?.plan?.procedures?.[0].status).toBe('Completed');
    expect(updated.soap?.plan?.procedures?.[0].adminSite).toBe('Right Gluteal');
  });
});
