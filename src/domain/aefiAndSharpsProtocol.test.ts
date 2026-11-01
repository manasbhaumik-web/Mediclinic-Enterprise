import { describe, it, expect } from 'vitest';
import {
  calculateAdrenalineDose,
  classifyAEFISeverity,
  evaluateSharpsRiskAndPEP,
  exportAefiReportText,
  DEFAULT_AEFI_RECORDS,
  DEFAULT_SHARPS_RECORDS,
} from './aefiAndSharpsProtocol';

describe('AEFI Surveillance & Staff Sharps PEP Protocol Engine', () => {
  describe('calculateAdrenalineDose (1:1000 IM)', () => {
    it('calculates 0.01 mg/kg for pediatric patient accurately', () => {
      const result = calculateAdrenalineDose(15);
      expect(result.doseMg).toBe(0.15);
      expect(result.volumeMl).toBe(0.15);
      expect(result.route).toContain('Anterolateral Mid-Thigh');
    });

    it('calculates for infant (5 kg)', () => {
      const result = calculateAdrenalineDose(5);
      expect(result.doseMg).toBe(0.05);
      expect(result.volumeMl).toBe(0.05);
    });

    it('caps single dose at 0.5 mg for adult (70 kg or higher)', () => {
      const result = calculateAdrenalineDose(75);
      expect(result.doseMg).toBe(0.5);
      expect(result.volumeMl).toBe(0.5);
      expect(result.maxDoseMg).toBe(0.5);
    });
  });

  describe('classifyAEFISeverity', () => {
    it('flags critical anaphylaxis when circulatory or respiratory compromise occurs', () => {
      const res = classifyAEFISeverity(['Hypotension', 'Stridor', 'Urticaria'], 15);
      expect(res.severity).toBe('severe_anaphylaxis');
      expect(res.isAnaphylaxisAlert).toBe(true);
      expect(res.mandatoryHospitalTransfer).toBe(true);
      expect(res.guidance).toContain('IM Adrenaline');
      expect(res.guidance).toContain('MECC 999');
    });

    it('flags critical anaphylaxis when rapid onset (<30m) with breathing difficulty occurs', () => {
      const res = classifyAEFISeverity(['Difficulty Breathing', 'Swelling of lips'], 20);
      expect(res.severity).toBe('severe_anaphylaxis');
      expect(res.isAnaphylaxisAlert).toBe(true);
      expect(res.mandatoryHospitalTransfer).toBe(true);
    });

    it('identifies moderate AEFI with high fever or extensive local swelling', () => {
      const res = classifyAEFISeverity(['High fever >39C', 'Swelling >5cm at injection site'], 120);
      expect(res.severity).toBe('moderate');
      expect(res.isAnaphylaxisAlert).toBe(false);
      expect(res.mandatoryHospitalTransfer).toBe(false);
      expect(res.guidance).toContain('48 hours');
    });

    it('identifies minor self-limiting AEFI', () => {
      const res = classifyAEFISeverity(['Mild soreness', 'Low-grade fever <38C'], 240);
      expect(res.severity).toBe('minor');
      expect(res.isAnaphylaxisAlert).toBe(false);
      expect(res.mandatoryHospitalTransfer).toBe(false);
      expect(res.guidance).toContain('EXPECTED MINOR REACTION');
    });
  });

  describe('evaluateSharpsRiskAndPEP', () => {
    it('recommends urgent 28-day HIV PEP for deep puncture from known HIV positive source within 72h', () => {
      const res = evaluateSharpsRiskAndPEP(
        'deep_puncture',
        'Hollow-Bore Needle (Phlebotomy/IV)',
        'known_positive_hiv',
        'vaccinated_responder',
        3 // 3 hours elapsed
      );

      expect(res.pepRecommended).toBe(true);
      expect(res.pepProtocol).toContain('28-DAY 3-DRUG HIV PEP');
      expect(res.isWindowExpired).toBe(false);
      expect(res.hoursRemaining).toBe(69);
      expect(res.jkkpFormRequired).toBe(true);
    });

    it('blocks routine PEP when 72-hour window has expired', () => {
      const res = evaluateSharpsRiskAndPEP(
        'deep_puncture',
        'Hollow-Bore Needle (Phlebotomy/IV)',
        'known_positive_hiv',
        'vaccinated_responder',
        75 // 75 hours elapsed
      );

      expect(res.pepRecommended).toBe(false);
      expect(res.isWindowExpired).toBe(true);
      expect(res.hoursRemaining).toBe(0);
      expect(res.pepProtocol).toContain('PEP WINDOW EXPIRED');
    });

    it('recommends urgent HBIG for unvaccinated/non-responder HCW exposed to HBV source', () => {
      const res = evaluateSharpsRiskAndPEP(
        'superficial_cut',
        'Solid Suture Needle',
        'known_positive_hbv',
        'unvaccinated_or_unknown',
        5
      );

      expect(res.pepRecommended).toBe(false); // HIV PEP not needed
      expect(res.hbvManagement).toContain('URGENT HBV PROPHYLAXIS: Administer Hepatitis B Immunoglobulin (HBIG)');
    });

    it('recognizes immune status in vaccinated responder HCW', () => {
      const res = evaluateSharpsRiskAndPEP(
        'deep_puncture',
        'Hollow-Bore Needle',
        'known_positive_hbv',
        'vaccinated_responder',
        2
      );

      expect(res.hbvManagement).toContain('HCW immune');
      expect(res.hbvManagement).toContain('No HBIG or booster required');
    });
  });

  describe('exportAefiReportText', () => {
    it('generates complete BPKK statutory report with all clinical fields', () => {
      const report = exportAefiReportText(DEFAULT_AEFI_RECORDS[0]);
      expect(report).toContain('BAHAGIAN PEMBANGUNAN KESIHATAN KELUARGA (BPKK) & NPRA MALAYSIA');
      expect(report).toContain('Nurul Huda binti Azman');
      expect(report).toContain('Hexaxim 6-in-1');
      expect(report).toContain('HX2026-99');
      expect(report).toContain('SEVERE_ANAPHYLAXIS');
      expect(report).toContain('0.22 mg IM');
      expect(report).toContain('MMC-48912');
    });
  });

  describe('Default Datasets', () => {
    it('has baseline AEFI seed record', () => {
      expect(DEFAULT_AEFI_RECORDS.length).toBeGreaterThan(0);
      expect(DEFAULT_AEFI_RECORDS[0].severity).toBe('severe_anaphylaxis');
    });

    it('has baseline Sharps seed record', () => {
      expect(DEFAULT_SHARPS_RECORDS.length).toBeGreaterThan(0);
      expect(DEFAULT_SHARPS_RECORDS[0].firstAidCompleted).toBe(true);
    });
  });
});
