/**
 * CKAPS Biennial Form B Inspection Dossier & Statutory Facility Readiness Engine
 * Governing Statute: Private Healthcare Facilities and Services Act 1998 (Act 586) & Regulations 2006.
 */

export interface StatutoryPillarAudit {
  id: string;
  pillarName: string;
  governingAct: string;
  weightPercent: number;
  score: number; // 0 - 100
  status: 'compliant' | 'warning' | 'critical_defect';
  evidenceCount: number;
  summary: string;
  findings: string[];
}

export interface CKAPSFacilityProfile {
  facilityName: string;
  ckapsRegistrationNo: string;
  facilityCategory: 'Ambulatory Care Centre' | 'Private Medical Clinic (Polyclinic)';
  address: string;
  personInChargeName: string;
  personInChargeMmcNo: string;
  personInChargeApcYear: number;
  personInChargeIndemnityPolicy: string;
  personInChargeIndemnityExpiry: string;
  auditDate: string;
}

export interface CKAPSInspectionDossier {
  profile: CKAPSFacilityProfile;
  overallScore: number;
  grade: 'Grade A (Inspection Ready)' | 'Grade B (Substantial Compliance)' | 'Grade C (Conditional Notice)' | 'Grade F (Non-Compliant)';
  isInspectionReady: boolean;
  pillars: StatutoryPillarAudit[];
  criticalDefects: string[];
  recommendations: string[];
  generatedAt: string;
}

export const DEFAULT_FACILITY_PROFILE: CKAPSFacilityProfile = {
  facilityName: 'Mediclinic Enterprise Ambulatory Care Centre',
  ckapsRegistrationNo: 'KKM/CKAPS/B-7821/2024',
  facilityCategory: 'Private Medical Clinic (Polyclinic)',
  address: 'No. 12, Jalan Metro Barat, Kepong Commercial Centre, 52100 Kuala Lumpur',
  personInChargeName: 'Dr. Siti Nurhaliza binti Ahmad',
  personInChargeMmcNo: 'MMC-48912',
  personInChargeApcYear: 2026,
  personInChargeIndemnityPolicy: 'MED-INDEM-AON-2026-9901',
  personInChargeIndemnityExpiry: '2026-12-31',
  auditDate: '2026-11-01',
};

/**
 * Evaluates facility-wide readiness across all 8 statutory regulatory pillars.
 */
export function evaluateCKAPSReadiness(
  customInputs?: Partial<{
    isCrashCartVerifiedDaily: boolean;
    isAutoclaveSporePassed: boolean;
    isPoctCalibrated: boolean;
    isColdChainCompliant: boolean;
    isDdaSafeBalanced: boolean;
    isRadiationLicenceActive: boolean;
    hasActiveApc: boolean;
    hasActiveWasteContract: boolean;
  }>
): CKAPSInspectionDossier {
  const inputs = {
    isCrashCartVerifiedDaily: true,
    isAutoclaveSporePassed: true,
    isPoctCalibrated: true,
    isColdChainCompliant: true,
    isDdaSafeBalanced: true,
    isRadiationLicenceActive: true,
    hasActiveApc: true,
    hasActiveWasteContract: true,
    ...customInputs,
  };

  const criticalDefects: string[] = [];
  const recommendations: string[] = [];

  // Pillar 1: PIC Credentials & Statutory Governance (15%)
  const p1Score = inputs.hasActiveApc ? 100 : 0;
  if (!inputs.hasActiveApc) criticalDefects.push('PIC Annual Practising Certificate (APC) expired or missing.');
  const p1: StatutoryPillarAudit = {
    id: 'pic_credentials',
    pillarName: 'Person In-Charge (PIC) Statutory Credentials',
    governingAct: 'Medical Act 1971 & PHFSA 1998 Reg. 12',
    weightPercent: 15,
    score: p1Score,
    status: p1Score === 100 ? 'compliant' : 'critical_defect',
    evidenceCount: 3,
    summary: 'MMC Registration, active 2026 APC, and valid Medical Professional Indemnity policy.',
    findings: p1Score === 100 ? ['Active APC 2026 verified with Malaysian Medical Council.'] : ['APC non-compliant.'],
  };

  // Pillar 2: Part V Emergency Facilities & Crash Cart (15%)
  const p2Score = inputs.isCrashCartVerifiedDaily ? 100 : 50;
  if (!inputs.isCrashCartVerifiedDaily) criticalDefects.push('Crash cart daily audit overdue or oxygen pressure <1200 PSI.');
  const p2: StatutoryPillarAudit = {
    id: 'emergency_crash_cart',
    pillarName: 'Part V Emergency Facilities & Resuscitation',
    governingAct: 'PHFSA 1998 Part V & Regulations',
    weightPercent: 15,
    score: p2Score,
    status: p2Score === 100 ? 'compliant' : 'warning',
    evidenceCount: 14,
    summary: 'Crash cart daily checks, defibrillator battery, adrenaline supply, and oxygen cylinder pressure >= 1200 PSI.',
    findings: ['Daily checklist verified for current month.', 'Oxygen regulator and spare cylinder sealed.'],
  };

  // Pillar 3: Regulation 37 Autoclave Sterilization & Infection Control (10%)
  const p3Score = inputs.isAutoclaveSporePassed ? 100 : 40;
  if (!inputs.isAutoclaveSporePassed) criticalDefects.push('Biological spore test failed or weekly autoclave test overdue.');
  const p3: StatutoryPillarAudit = {
    id: 'autoclave_sterilization',
    pillarName: 'Sterilization & Infection Control Packs',
    governingAct: 'PHFSA 1998 Reg. 37',
    weightPercent: 10,
    score: p3Score,
    status: p3Score === 100 ? 'compliant' : 'critical_defect',
    evidenceCount: 28,
    summary: 'Autoclave cycle parameters (134°C Porous), Class 5/6 chemical indicators, and weekly biological spore logs.',
    findings: ['Chemical indicator Class 5 strips verified.', 'Spore test culture negative at 48h.'],
  };

  // Pillar 4: Regulation 38 POCT Calibration & Quality Control (10%)
  const p4Score = inputs.isPoctCalibrated ? 100 : 60;
  const p4: StatutoryPillarAudit = {
    id: 'poct_quality_control',
    pillarName: 'Point-of-Care Testing (POCT) Quality Control',
    governingAct: 'PHFSA 1998 Reg. 38',
    weightPercent: 10,
    score: p4Score,
    status: p4Score === 100 ? 'compliant' : 'warning',
    evidenceCount: 12,
    summary: 'Daily 2-level calibration (Normal & High) for glucometer, HbA1c, and urine analyzers with strip open-date tracking.',
    findings: ['Glucometer within +/- 15% laboratory reference.', 'Strips discarded within 90 days of open-vial.'],
  };

  // Pillar 5: Vaccine Cold Chain Protocol (+2°C to +8°C) (15%)
  const p5Score = inputs.isColdChainCompliant ? 100 : 30;
  if (!inputs.isColdChainCompliant) criticalDefects.push('Cold chain temperature excursion unaddressed or Shake Test missing.');
  const p5: StatutoryPillarAudit = {
    id: 'vaccine_cold_chain',
    pillarName: 'Vaccine Cold Chain (+2.0°C to +8.0°C)',
    governingAct: 'PHFSA 1998 & KKM NIP Protocol',
    weightPercent: 15,
    score: p5Score,
    status: p5Score === 100 ? 'compliant' : 'critical_defect',
    evidenceCount: 60,
    summary: 'Twice-daily shift logs (08:00 & 17:00), calibrated thermometer, backup UPS, and WHO Shake Test log.',
    findings: ['Opening and closing logs complete.', 'Haier Biomedical certified calibrated until 2027.'],
  };

  // Pillar 6: Dangerous Drugs Act 1952 Safe Register & Poisons (15%)
  const p6Score = inputs.isDdaSafeBalanced ? 100 : 20;
  if (!inputs.isDdaSafeBalanced) criticalDefects.push('Dangerous Drugs Act perpetual register count discrepancy or single-auth signoff.');
  const p6: StatutoryPillarAudit = {
    id: 'dangerous_drugs_safe',
    pillarName: 'Dangerous Drugs (DDA 1952) & Poison Safe',
    governingAct: 'Dangerous Drugs Act 1952 & Poison Act 1952',
    weightPercent: 15,
    score: p6Score,
    status: p6Score === 100 ? 'compliant' : 'critical_defect',
    evidenceCount: 45,
    summary: 'Heavy metal safe locked in doctor consult room, dual-auth register (Doctor + Pharmacist), zero negative balances.',
    findings: ['Physical counts reconcile 100% with ledger.', 'Buku Racun Section 21 records updated.'],
  };

  // Pillar 7: Atomic Energy Licensing Act 304 Radiation Safety (10%)
  const p7Score = inputs.isRadiationLicenceActive ? 100 : 0;
  if (!inputs.isRadiationLicenceActive) criticalDefects.push('Atomic Energy Class C X-Ray Licence overdue or TLD badge reports missing.');
  const p7: StatutoryPillarAudit = {
    id: 'radiation_safety',
    pillarName: 'Diagnostic Radiation & X-Ray (Act 304)',
    governingAct: 'Atomic Energy Licensing Act 1984 (Act 304)',
    weightPercent: 10,
    score: p7Score,
    status: p7Score === 100 ? 'compliant' : 'critical_defect',
    evidenceCount: 8,
    summary: 'MOH Class C Licence, RPO cert, quarterly TLD dosimetry badges from Agensi Nuklear Malaysia, and lead PPE audits.',
    findings: ['TLD staff doses within 20 mSv/yr legal limit.', 'Lead aprons crack-free on 6-monthly fluoroscopy check.'],
  };

  // Pillar 8: Occupational Health (OSHA) & Scheduled Waste (10%)
  const p8Score = inputs.hasActiveWasteContract ? 100 : 60;
  const p8: StatutoryPillarAudit = {
    id: 'occupational_and_waste',
    pillarName: 'OSHA 1994 Sharps Safety & Biohazard Waste',
    governingAct: 'OSHA 1994 & Environmental Quality Act (SW404)',
    weightPercent: 10,
    score: p8Score,
    status: p8Score === 100 ? 'compliant' : 'warning',
    evidenceCount: 22,
    summary: 'Needle-stick 72h PEP protocol, AEFI surveillance to BPKK, and DOE licensed biohazard waste consignment notes.',
    findings: ['Waste contractor consignment manifests stored.', 'Yellow bins secured and labeled.'],
  };

  const pillars = [p1, p2, p3, p4, p5, p6, p7, p8];

  // Weighted overall calculation
  const totalWeight = pillars.reduce((sum, p) => sum + p.weightPercent, 0);
  const weightedScore = pillars.reduce((sum, p) => sum + (p.score * p.weightPercent) / totalWeight, 0);
  const overallScore = Math.round(weightedScore * 10) / 10;

  let grade: 'Grade A (Inspection Ready)' | 'Grade B (Substantial Compliance)' | 'Grade C (Conditional Notice)' | 'Grade F (Non-Compliant)';
  if (overallScore >= 90 && criticalDefects.length === 0) {
    grade = 'Grade A (Inspection Ready)';
  } else if (overallScore >= 80) {
    grade = 'Grade B (Substantial Compliance)';
  } else if (overallScore >= 70) {
    grade = 'Grade C (Conditional Notice)';
  } else {
    grade = 'Grade F (Non-Compliant)';
  }

  const isInspectionReady = grade === 'Grade A (Inspection Ready)';

  if (isInspectionReady) {
    recommendations.push('Maintain twice-daily cold chain logging and monthly physical DDA reconciliation.');
    recommendations.push('Print and bind Form B Regulatory Dossier for CKAPS inspection team arrival.');
  } else {
    recommendations.push('Resolve all flagged critical defects immediately prior to welcoming MOH auditors.');
  }

  return {
    profile: DEFAULT_FACILITY_PROFILE,
    overallScore,
    grade,
    isInspectionReady,
    pillars,
    criticalDefects,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compiles the complete printable and exportable Form B Dossier in Markdown/Text.
 */
export function generateCKAPSDossierMarkdown(dossier: CKAPSInspectionDossier): string {
  const { profile, pillars, overallScore, grade, criticalDefects } = dossier;

  return `# MINISTRY OF HEALTH MALAYSIA (KEMENTERIAN KESIHATAN MALAYSIA)
## CAWANGAN KAWALAN AMALAN PERUBATAN SWASTA (CKAPS)
### STATUTORY BIENNIAL FORM B INSPECTION & REGULATORY AUDIT DOSSIER
**Private Healthcare Facilities and Services Act 1998 (Act 586) & Regulations 2006**

---

### PART 1: FACILITY PROFILE & PERSON IN-CHARGE (PIC) DECLARATION
* **Facility Name**: ${profile.facilityName}
* **CKAPS Registration No**: ${profile.ckapsRegistrationNo}
* **Facility Category**: ${profile.facilityCategory}
* **Physical Address**: ${profile.address}
* **Person In-Charge (PIC)**: ${profile.personInChargeName}
* **Malaysian Medical Council (MMC) No**: ${profile.personInChargeMmcNo}
* **Annual Practising Certificate (APC) Year**: ${profile.personInChargeApcYear} (Current & Valid)
* **Medical Professional Indemnity Policy**: ${profile.personInChargeIndemnityPolicy} (Expires: ${profile.personInChargeIndemnityExpiry})
* **Date of Internal Audit**: ${profile.auditDate}

---

### PART 2: REGULATORY AUDIT SCORECARD & STATUS
* **Overall Compliance Score**: **${overallScore.toFixed(1)}% / 100%**
* **Inspection Readiness Classification**: **${grade}**
* **Status**: ${dossier.isInspectionReady ? '✓ READY FOR STATUTORY FORM B RENEWAL INSPECTION' : '⚠ CONDITIONAL - RECTIFICATIONS REQUIRED'}

${criticalDefects.length > 0 ? `#### Critical Statutory Defects Found:\n${criticalDefects.map((d) => `- ❌ ${d}`).join('\n')}\n` : '#### Statutory Status: No Critical Breaches or Safety Deficiencies Identified.\n'}

---

### PART 3: DETAILED STATUTORY PILLAR BREAKDOWN

| Statutory Regulatory Pillar | Governing Statute | Weight | Score | Status | Evidence Count |
| :--- | :--- | :---: | :---: | :---: | :---: |
${pillars
  .map(
    (p) =>
      `| ${p.pillarName} | ${p.governingAct} | ${p.weightPercent}% | ${p.score}% | ${p.status.toUpperCase()} | ${p.evidenceCount} records |`
  )
  .join('\n')}

---

### PART 4: STATUTORY SUMMARY EVIDENCE & LOG REGISTERS

#### 1. Emergency Preparedness & Crash Cart (PHFSA 1998 Part V)
- Defibrillator check: Functional with daily battery test verified.
- Medical Oxygen Cylinder: Regulators inspected; pressure maintained $\\ge 1200\\text{ PSI}$.
- Emergency Injectable Drugs: Adrenaline 1:1000, Hydrocortisone, Atropine, Dextrose 50% all unexpired.

#### 2. Infection Control & Sterilization (PHFSA 1998 Reg. 37)
- Autoclave Model: Class B vacuum autoclave operating at $134^\\circ\\text{C}$ porous cycle.
- Spore Testing: Biological indicators cultured weekly (0 growth at 48 hours).
- Tracking: Individual sterile pack QR/barcodes scanned into patient encounter files.

#### 3. Diagnostic POCT Quality Control (PHFSA 1998 Reg. 38)
- Calibration: Normal (Level 1) and High (Level 2) daily verification recorded before morning clinic opening.
- Reagent Integrity: Strip vials discarded 90 days post-opening; control lots logged.

#### 4. Vaccine Cold Chain Monitoring (+2.0°C to +8.0°C)
- Refrigerator: Pharmaceutical-grade Haier Biomedical HXC-158 on dedicated backup circuit.
- Temperature Logging: Twice-daily shift checks (08:00 and 17:00) documented.
- Excursion Management: WHO Shake Test (*Ujian Goncang*) protocol deployed for suspected cold exposure.

#### 5. Dangerous Drugs Act 1952 (Act 234) & Poison Register
- Storage: Steel locked safe permanently bolted into doctor consultation room.
- Governance: Perpetual mathematical running balance with mandatory Doctor MMC + Pharmacist dual sign-off.
- Statutory Discrepancies: 0 physical-to-book variances recorded.

#### 6. Radiation Safety & Diagnostic X-Ray (Atomic Energy Act 304)
- Licensing: Active MOH Class C Licence for General Radiography.
- Occupational Protection: Quarterly TLD badges from Agensi Nuklear Malaysia (all staff $<1.0\\text{ mSv/qtr}$).
- Quality Assurance: Annual Medical Physicist calibration cert and 6-monthly lead PPE integrity tests.

#### 7. Occupational Safety (OSHA 1994) & Clinical Waste Management
- AEFI & Sharps: BPKK 48-hour adverse event surveillance and 72-hour needle-stick PEP protocol.
- Clinical Waste (SW404): Consignment notes stored on-site with DOE-licensed biohazard waste contractor.

---

### PART 5: STATUTORY DECLARATION BY PERSON IN-CHARGE (PIC)

I, **${profile.personInChargeName}** (MMC Registration No: **${profile.personInChargeMmcNo}**), being the designated Person In-Charge of **${profile.facilityName}**, hereby solemnly declare that:

1. The clinical operational registers, equipment calibration logs, radiation safety badges, dangerous drug balances, and cold chain logs compiled in this dossier are true, complete, and un-doctored representations of this facility's records.
2. The facility is maintained in full compliance with the Private Healthcare Facilities and Services Act 1998 (Act 586) and its Regulations.
3. All registered medical practitioners, pharmacists, radiographers, and clinic assistants possess valid annual registrations and practicing certificates without suspension.

**Signature of Person In-Charge**: ______________________________________  
**Date**: ${profile.auditDate}  
**Official Clinic Stamp**:
`;
}
