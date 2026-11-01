import { describe, it, expect } from 'vitest';
import {
  getEmergencyImmediateActionProtocol,
  DEFAULT_RED_CODE_INCIDENTS,
  RedCodeSeverity,
} from './redCodeAlarm';

describe('Red-Code Resuscitation Bay Alarm & Emergency Clinical Bypass Engine', () => {
  describe('getEmergencyImmediateActionProtocol', () => {
    it('returns cardiac arrest protocol with CPR and defib action', () => {
      const protocol = getEmergencyImmediateActionProtocol('cardiac_arrest');
      expect(protocol.title).toContain('CARDIOPULMONARY ARREST');
      expect(protocol.primaryAction).toContain('chest compressions');
      expect(protocol.medication).toContain('Adrenaline 1 mg');
      expect(protocol.ambulanceAction).toContain('MECC 999');
    });

    it('returns anaphylaxis protocol with immediate IM Adrenaline thigh injection', () => {
      const protocol = getEmergencyImmediateActionProtocol('anaphylaxis');
      expect(protocol.title).toContain('ANAPHYLAXIS');
      expect(protocol.primaryAction).toContain('IM Adrenaline (1:1000)');
      expect(protocol.medication).toContain('Hydrocortisone');
    });

    it('returns respiratory protocol with nebulizer and oxygen guidance', () => {
      const protocol = getEmergencyImmediateActionProtocol('severe_respiratory');
      expect(protocol.title).toContain('ASTHMA / RESPIRATORY');
      expect(protocol.primaryAction).toContain('Salbutamol');
    });

    it('returns seizure protocol with recovery position and Midazolam / Dextrose', () => {
      const protocol = getEmergencyImmediateActionProtocol('unresponsive_seizure');
      expect(protocol.title).toContain('EPILEPTICUS / COMA');
      expect(protocol.medication).toContain('Midazolam');
    });

    it('returns massive hemorrhage protocol with tourniquet and large-bore IVs', () => {
      const protocol = getEmergencyImmediateActionProtocol('massive_hemorrhage');
      expect(protocol.title).toContain('HEMORRHAGE');
      expect(protocol.primaryAction).toContain('tourniquet');
    });
  });

  describe('DEFAULT_RED_CODE_INCIDENTS', () => {
    it('contains baseline emergency incident audit history', () => {
      expect(DEFAULT_RED_CODE_INCIDENTS.length).toBeGreaterThan(0);
      const inc = DEFAULT_RED_CODE_INCIDENTS[0];
      expect(inc.condition).toBe('cardiac_arrest');
      expect(inc.crashCartDeployed).toBe(true);
      expect(inc.mecc999Called).toBe(true);
    });
  });
});
