# Phase 03 Plan: Point-of-Care Testing (POCT) & Diagnostic Quality Control (PHFSA 1998 § 38)

## 1. Context & Objectives
Under **Section 38 of the Private Healthcare Facilities and Services Act 1998 (PHFSA / Act 586)** and Malaysian CKAPS standards, private ambulatory clinics performing Point-of-Care Testing (POCT) must maintain verifiable equipment calibration records, reagent lot traceability, and daily quality control (QC) verification.

### Target Capabilities:
1. **POCT Instrument Directory**:
   - Manage clinic diagnostic instruments: Blood Glucometers, HbA1c Analyzers, Urine Chemistry Analyzers, Rapid Dengue/Flu Readers, Lipid Profile Analyzers.
2. **Two-Level Daily QC Logging (Normal vs. High Control)**:
   - Level 1 (Normal Range) and Level 2 (High / Pathological Range) control solution tests with target tolerance ranges.
   - Automatic pass/fail evaluation and out-of-bounds delta calculation.
3. **Reagent Lot & Open-Vial Expiry Tracking**:
   - Manufacturer expiration vs. Open-Vial Stability expiration (e.g. 90-day open-vial limit for glucose test strips).
4. **Clinical Safety Interlock & Treatment Room Linking**:
   - Device calibration status check (`isDeviceQcValidForToday`).
   - Warning/interlock in Treatment Room / Procedure Station (`ProcedureStationModule.tsx`) when recording lab results if the device's daily QC is missing or failed.
5. **Operations Hub Integration**:
   - Fast-access button in `OperationsHub.tsx` alongside Autoclave Sterilization, Incidents, and Throughput monitors.

---

## 2. Technical Deliverables
- **Domain Logic**: `src/domain/poctCalibration.ts`
  - Types: `POCTDevice`, `QCLevelLog`, `POCTCalibrationRecord`, `ReagentLotInfo`
  - Calculation functions: `evaluateQCReading()`, `isDeviceQcValidForToday()`, `calculateOpenVialExpiry()`
  - Seed / Default Devices: Preconfigured Malaysian clinic instruments (Accu-Chek, Clinitek, DCA Vantage).
- **Domain Test Suite**: `src/domain/poctCalibration.test.ts`
  - Unit tests verifying:
    - Pass/fail bounds checking for normal & high controls.
    - Open-vial expiration calculation.
    - Daily QC compliance check for active vs overdue dates.
    - Interlock status logic.
- **UI Modal**: `src/features/operations/POCTQualityControlModal.tsx`
  - Two-level QC logging form (instrument selector, control lot, measured value, tolerance comparison).
  - Reagent vial open-date logger with remaining shelf-life days.
  - Historical audit log with exportable PHFSA § 38 compliance certificate.
- **Station Integration**:
  - `ProcedureStationModule.tsx`: Surfaced POCT QC verification badge; warns staff before administering/recording POCT if instrument QC is overdue.
  - `OperationsHub.tsx`: Surfaced "POCT Device Quality Control (PHFSA § 38)" button.

---

## 3. Verification Gate
- [ ] TypeScript check: `npx tsc --noEmit` exits with 0 errors.
- [ ] Vitest: `npx vitest run` passes 100% of test suites (69 suites target).
- [ ] Design Token Integrity: Flat `rounded-none`, `var(--color-brand)`, `border-line`, consistent badge styling.
- [ ] Push clean atomic commit to `Main` and advance `.gsd/STATE.md`.
