import { describe, expect, it } from 'vitest';
import { 
  createClinicalIncident, 
  generateIncidentNumber, 
  evaluateOshaNadopodReportability, 
  closeClinicalIncident 
} from './clinicalIncidents';

describe('Clinical Incident & Near-Miss Management (CKAPS / OSHA 1994)', () => {
  it('generates sequential statutory incident numbers formatted by year', () => {
    const incNumber = generateIncidentNumber(4, 2026);
    expect(incNumber).toBe('INC-2026-005');
  });

  it('automatically flags needle-stick exposures as OSHA NADOPOD reportable', () => {
    const isReportable = evaluateOshaNadopodReportability({
      category: 'NeedleStickExposure',
      severity: 'MinorHarm'
    });
    expect(isReportable).toBe(true);

    const nonReportable = evaluateOshaNadopodReportability({
      category: 'MedicationError',
      severity: 'NearMiss'
    });
    expect(nonReportable).toBe(false);
  });

  it('creates a validated clinical incident with Logged status', () => {
    const incident = createClinicalIncident({
      category: 'MedicationError',
      severity: 'NearMiss',
      location: 'PharmacyDispensary',
      reporterStaffId: 'staff-01',
      reporterStaffName: 'Nurse Siti',
      reporterRole: 'Staff Nurse',
      description: 'Prescription had 500mg instead of 250mg, intercepted at dispensing counter.',
      immediateActionTaken: 'Clarified with Dr. Lee; corrected dosage before dispensing.',
      patientName: 'Ahmad Faiz',
      existingCount: 0
    });

    expect(incident.incidentNumber).toBe('INC-' + new Date().getFullYear() + '-001');
    expect(incident.status).toBe('Logged');
    expect(incident.requiresOshaNotification).toBe(false);
    expect(incident.severity).toBe('NearMiss');
  });

  it('updates RCA and CAPA upon closure by clinical operations manager', () => {
    const incident = createClinicalIncident({
      category: 'NeedleStickExposure',
      severity: 'MinorHarm',
      location: 'ProcedureRoom',
      reporterStaffId: 'staff-02',
      reporterStaffName: 'Nurse Aminah',
      reporterRole: 'Staff Nurse',
      description: 'Superficial puncture from hollow-bore 23G needle after drawing blood.',
      immediateActionTaken: 'Washed with running water and soap, applied betadine, baseline bloods taken.',
      existingCount: 2
    });

    expect(incident.requiresOshaNotification).toBe(true);

    const closed = closeClinicalIncident(
      incident,
      'Dr. Kumar (Clinical Director)',
      'Needle recapping attempted contrary to safety guidelines.',
      'Mandatory retraining on sharps bin single-handed disposal; replaced trays with safety-needle vacutainers.'
    );

    expect(closed.status).toBe('Closed');
    expect(closed.investigatedBy).toBe('Dr. Kumar (Clinical Director)');
    expect(closed.rootCauseAnalysis).toContain('recapping');
    expect(closed.correctivePreventiveAction).toContain('retraining');
    expect(closed.closedAt).toBeDefined();
  });
});
