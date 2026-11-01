# Roadmap: Mediclinic Enterprise

## Strategic Execution Milestones

### [COMPLETED] Phase 01: Senior Clinical Operations Suite (PHFSA / CKAPS / OSHA)
- **Status**: Completed (Commit `2c7ae07`)
- **Key Modules**:
  1. **P1 - Clinical Incident & Near-Miss Register** (`src/domain/clinicalIncidents.ts`, `ClinicalIncidentModal.tsx`):
     - 6-tier severity classification (Near Miss to Sentinel Event).
     - OSHA 1994 / NADOPOD mandatory reporting trigger with JKKP 6/7/8/9 auto-generation.
     - Root Cause Analysis (5-Whys, Fishbone) & CAPA tracking.
  2. **P2 - Clinician Credentialing & Statutory Privilege Guard** (`src/domain/staffCredentialing.ts`, `StaffManagementModule.tsx`):
     - Automated statutory compliance tracking for MMC APC, LJM ARC, and Professional Medical Indemnity.
     - 30-day proactive expiry alerts and privilege status enforcement.
  3. **P3 - Infection Control & Autoclave Sterilization Pack Log** (`src/domain/autoclaveSterilization.ts`, `AutoclaveSterilizationModal.tsx`, `ProcedureStationModule.tsx`):
     - PHFSA 1998 Regulation 37 compliant cycle parameters (134°C Porous / 121°C Rubber).
     - Chemical indicator Class 4/5/6 and biological spore test tracking.
     - Sterile pack barcode scanning and procedure encounter linking.
  4. **P4 - Outpatient Turnaround Time (TAT) & Bottleneck Heatmap** (`src/domain/clinicThroughput.ts`, `ClinicThroughputModal.tsx`, `OperationsHub.tsx`):
     - Real-time station tracking (Check-in -> Triage -> Consult -> Pharmacy -> Billing).
     - Door-to-door SLA benchmarking (<45m Target) and automated bottleneck detection.

---

### [COMPLETED] Phase 02: Corporate TPA Panel Direct Claims & Billing Reconciliation
- **Status**: Completed (Commit `eab0473`)
- **Key Modules**:
  1. **Corporate Policy Engine & Real-Time GL Verification** (`src/domain/tpaPanelClaims.ts`):
     - Panel rule evaluation (co-payments, annual limits, per-visit caps, formulary restrictions).
     - Live Guarantee Letter (GL) validation and statutory exclusions.
  2. **TPA Settlement Hub** (`src/features/tpa/TPASettlementHub.tsx`):
     - Batch claims generation with automated CSV and JSON exports for major TPAs (Mednefits, MiCare, HealthMetrics, PMCare).
     - Line-item remittance variance reconciliation with dispute audit trails.
  3. **Consultation Prescribing Warning Guard**:
     - Real-time warnings during doctor drug/procedure ordering for non-formulary or ceiling breaches.

---

### [ACTIVE / NEXT] Phase 03: Point-of-Care Testing (POCT) & Equipment Quality Control
- **Target**: Outpatient Diagnostic Safety & PHFSA 1998 Section 38 Compliance.
- **Scope**:
  - In-clinic diagnostic instruments: Blood Glucometers, HbA1c Analyzers, Urine Chemistry, Rapid Strep/Flu/Dengue reader logs.
  - Daily Two-Level Quality Control (QC Level 1 Normal, Level 2 Abnormal) tracking.
  - Reagent cartridge lot verification, expiration enforcement, and calibration slope checks.
  - Interlock guard: Consultation lab ordering blocked if the diagnostic instrument fails QC calibration for the day.

---

### [BACKLOG] Phase 04: Emergency SBAR Transfer & Ambulance Handover Protocol
- **Target**: Patient Safety & Tertiary Hospital Continuity of Care.
- **Scope**:
  - SBAR (Situation, Background, Assessment, Recommendation) structured handover generator.
  - Vital signs pre-transfer trending chart and emergency medication administration record.
  - MOH Ambulance Dispatch logging and receiving hospital MO/Emergency Physician acknowledgment.

---

### [BACKLOG] Phase 05: Poison Act 1952 & Dangerous Drugs Act 1952 (DDA) Safe Register
- **Target**: Pharmacy Regulatory Compliance & Narcotic Substance Accountability.
- **Scope**:
  - Controlled substance safe register with dual-PIN authorization (Doctor + Pharmacist).
  - Perpetual running balance inventory with physical count discrepancy reporting.
  - Automated MOH Pharmacy Enforcement Division audit trail export.
