# Phase 07 Plan: Cold Chain & Vaccine Refrigerator Temperature Log (PHFSA 1998 & MOH NIP)

## 1. Context & Statutory Objectives
Under the **Private Healthcare Facilities and Services Act 1998 (PHFSA 1998 / Act 586)**, **CKAPS standards**, and the **Ministry of Health (MOH) National Immunisation Programme (NIP) Guidelines**, private medical clinics storing vaccines (Hexavalent 6-in-1, Hepatitis B, MMR, Pneumococcal, HPV, Influenza) must maintain a continuous **Cold Chain Temperature Register (+2.0°C to +8.0°C)**.

Failure to maintain cold chain logs, or administering vaccines subjected to unquarantined temperature excursions, constitutes statutory non-compliance under Act 586 and medical negligence under MMC rules.

### Core Objectives:
1. **Vaccine Refrigerator Directory**:
   - Pharmaceutical grade refrigerators (e.g. Haier Biomedical / Dometic).
   - Sensor calibration validity and power backup status.
2. **Twice-Daily Manual Temperature Checks (Morning 08:00 & Evening 17:00)**:
   - Recording of Current Temp, Minimum Temp, and Maximum Temp with daily reset.
   - Immediate automatic flagging of Freezing Excursion ($< +2.0^\circ\text{C}$) or Heat Excursion ($> +8.0^\circ\text{C}$).
3. **Cold Chain Excursion & WHO/KKM Shake Test Protocol**:
   - Mandatory WHO/KKM Shake Test (*Ujian Goncang*) protocol for freeze-sensitive adsorbed vaccines (DTaP, HepB, PCV, HPV) to detect aluminum adjuvant precipitation and denaturation.
   - Batch quarantine tagging (blocks clinical immunization administration until cleared).
4. **Power Outage & Contingency Generator Tracking**:
   - Duration of power failure, dry ice / cold box deployment, and temperature stabilization tracking.
5. **Monthly KKM PKD Audit Export**:
   - One-click monthly CSV / PDF export conforming to District Health Office (*Pejabat Kesihatan Daerah - PKD*) surveillance format.

---

## 2. Technical Deliverables
- **Domain File**: `src/domain/coldChainVaccines.ts`
  - Types: `VaccineRefrigerator`, `TwiceDailyTempRecord`, `ColdExcursionRecord`, `ShakeTestRecord`.
  - Functions: `evaluateTemperatureExcursion()`, `evaluateShakeTestResult()`, `isFridgeInspectionOverdue()`, `exportColdChainMonthlyCsv()`.
  - Preconfigured seeds: Primary Vaccine Refrigerator (Haier Biomedical HXC-158) in Bilik Rawatan, 14-day history, and active vaccine lots.
- **Unit Test Suite**: `src/domain/coldChainVaccines.test.ts`
  - Temperature compliance bounds (+2.0°C to +8.0°C).
  - Freeze hazard vs heat hazard detection.
  - WHO Shake Test validation for adsorbed vaccines.
  - Excursion quarantine locking.
- **UI Component**: `src/features/operations/ColdChainVaccineModal.tsx`
  - Multi-tab workspace: "Refrigerator Live Status", "Log Temperature Check", "Excursions & Shake Test", "Monthly Audit Register".
  - Full design tokens: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- **Integration Points**:
  - `OperationsHub.tsx`: Header button "Vaccine Cold Chain (PHFSA / NIP)".
  - `ProcedureStationModule.tsx`: Header button "Vaccine Cold Chain (2°C–8°C)".

---

## 3. Verification Gate
- [ ] TypeScript check: `npx tsc --noEmit` exits with 0 errors.
- [ ] Vitest: `npx vitest run` passes 100% of test suites (73 suites target).
- [ ] Design Token Integrity: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- [ ] Commit cleanly to `Main` and update `.gsd/STATE.md` and `.gsd/ROADMAP.md`.
