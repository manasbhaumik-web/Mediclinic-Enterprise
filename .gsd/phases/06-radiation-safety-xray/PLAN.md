# Phase 06 Plan: Radiation Safety & Diagnostic X-Ray Register (Act 304 & PHFSA 1998)

## 1. Context & Statutory Objectives
In Malaysia, private medical clinics operating diagnostic radiological apparatus (General X-Ray, Dental OPG, Mobile C-Arm) must strictly comply with the **Atomic Energy Licensing Act 1984 (Act 304)**, **Radiation Protection (Basic Safety Standard) Regulations 2010**, and **PHFSA 1998 (Act 586) Regulations 45–54** (Radiological Services).

Inspections by the MOH Radiation Health & Safety Section (*Cawangan Kawalan Sinaran Perubatan - CKSP*) and Agensi Nuklear Malaysia (ANM) require active registers for licences, staff dosimetry, PPE integrity, and reject exposure analysis.

### Core Deliverables:
1. **Radiation Apparatus & Class C Licence Directory**:
   - Machine registry: Model, serial number, room shielding (lead lining Pb mm equivalence).
   - MOH Class C Licence (*Lesen Kelas C*) number, validity, and 60-day renewal warnings.
   - Radiation Protection Officer (RPO / PPS) & certified Medical Physicist credentials.
2. **Staff Personal Radiation Dosimetry Register (TLD Badges)**:
   - Quarterly TLD badge readings from Agensi Nuklear Malaysia (mSv).
   - Cumulative 12-month occupational dose tracking against statutory limit (20 mSv/year) and investigation threshold (>1.0 mSv/quarter).
3. **Lead PPE & Thyroid Shield Integrity Log**:
   - 6-monthly fluoroscopic or visual crack inspection of lead aprons, thyroid collars, and gonad shields (0.35mm / 0.5mm Pb equivalence).
   - Defect tagging: Pass / Condemn / Replace.
4. **Patient X-Ray Exposure & Reject Analysis**:
   - Patient exposure tracking (Examination, kVp, mAs, staff radiographer).
   - Retake tracking and automated reject rate calculation (target: <5% reject rate).

---

## 2. Technical Deliverables
- **Domain File**: `src/domain/radiationSafety.ts`
  - Types: `RadiationApparatus`, `TLDBadgeReading`, `LeadApronItem`, `LeadInspectionRecord`, `XRayExposureRecord`.
  - Functions: `evaluateTLDReading()`, `calculateRejectRate()`, `evaluateLicenceRenewalStatus()`, `isApronInspectionOverdue()`.
  - Preconfigured seeds: General Radiography Unit (Shimadzu), 3 staff TLD badges, and 4 lead aprons.
- **Unit Test Suite**: `src/domain/radiationSafety.test.ts`
  - TLD threshold warnings (>1.0 mSv/quarter alert, >20 mSv annual limit breach).
  - Reject rate calculation and benchmark evaluation.
  - Licence expiration and lead apron overdue inspection detection.
- **UI Component**: `src/features/operations/RadiationSafetyModal.tsx`
  - Multi-tab workspace: "Apparatus & Licences", "TLD Badge Dosimetry", "Lead PPE Inspection", "Exposure & Reject Log".
  - Full design tokens: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- **Integration Points**:
  - `OperationsHub.tsx`: Header action button "Radiation Safety & X-Ray (Act 304)".
  - `ProcedureStationModule.tsx`: Diagnostic imaging safety badge.

---

## 3. Verification Gate
- [ ] TypeScript check: `npx tsc --noEmit` exits with 0 errors.
- [ ] Vitest: `npx vitest run` passes 100% of test suites (72 suites target).
- [ ] Design Token Integrity: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- [ ] Commit cleanly to `Main` and update `.gsd/STATE.md` and `.gsd/ROADMAP.md`.
