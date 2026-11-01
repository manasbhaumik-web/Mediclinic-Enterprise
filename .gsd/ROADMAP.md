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

### [COMPLETED] Phase 03: Point-of-Care Testing (POCT) & Equipment Quality Control
- **Status**: Completed (Commit `3b26743`)
- **Key Modules**:
  1. **Diagnostic POCT Instrument Directory** (`src/domain/poctCalibration.ts`):
     - In-clinic diagnostic instruments: Blood Glucometers, HbA1c Analyzers, Urine Chemistry, Rapid Strep/Flu/Dengue reader logs.
     - Reagent strip lot verification, manufacturer expiry vs. open-vial shelf-life tracking.
  2. **Two-Level Daily Quality Control Engine**:
     - Level 1 (Normal) and Level 2 (High / Pathological) daily calibration logging with deviation calculation.
     - Device calibration safety evaluation (`evaluateDeviceQcStatus`).
  3. **POCT Quality Control Modal** (`src/features/operations/POCTQualityControlModal.tsx`):
     - Interactive multi-tab interface with live tolerance evaluation and exportable MOH PHFSA § 38 audit certificates.
  4. **Station Integration**:
     - Fast-access action button in `OperationsHub.tsx`.
     - Calibration action button and in-encounter diagnostic QC verification in `ProcedureStationModule.tsx`.

---

### [COMPLETED] Phase 04: Emergency SBAR Transfer & Ambulance Handover Protocol
- **Status**: Completed (Commit `93f26ae`)
- **Key Modules**:
  1. **SBAR Clinical Transfer Engine** (`src/domain/emergencyTransferSBAR.ts`):
     - Structured Situation, Background, Assessment, Recommendation models.
     - Real-time Shock Index (HR / SBP) calculation with occult shock risk tiering (`>=0.9`).
     - Verbal radio/phone script formatter for MECC 999 or receiving ED Medical Officer handoffs.
  2. **Emergency SBAR Modal** (`src/features/operations/EmergencySBARModal.tsx`):
     - Real-time SBAR editor with emergency medication logging prior to dispatch.
     - Pre-hospital ambulance dispatch milestones (decision, call, arrival, departure).
     - Printable inter-facility transfer form and copyable verbal phone script.
  3. **Station Integration**:
     - Treatment Room (`ProcedureStationModule.tsx`) fast-access header button.
     - Operations Hub (`OperationsHub.tsx`) active transfers trigger.

---

### [COMPLETED] Phase 05: Poison Act 1952 & Dangerous Drugs Act 1952 (DDA) Safe Register
- **Status**: Completed (Commit `42950b5`)
- **Key Modules**:
  1. **Dangerous Drugs Safe Inventory & Running Balance Engine** (`src/domain/dangerousDrugsDDA.ts`):
     - Controlled dangerous drugs (Morphine, Pethidine, Fentanyl, Ketamine, Midazolam).
     - Mathematical perpetual running balance preventing negative stock.
     - Mandatory dual-authorization sign-off checks (Doctor MMC No. + Pharmacist/Witness).
     - Partial dose wastage / destruction audit logging.
     - Physical count discrepancy detection (Regulation 18 statutory loss alerts).
  2. **Dangerous Drugs Safe Register UI** (`src/features/pharmacy/DangerousDrugsSafeRegister.tsx`):
     - Safe inventory cards, dual-auth outward withdrawal form, inward supplier receipt, perpetual transaction ledger, and physical stocktake audit tool.
     - Export to CSV matching MOH Bahagian Penguatkuasaan Farmasi (BPF) inspection format.
  3. **Station Integration**:
     - Dispensary Console (`src/features/pharmacy/DispensaryDashboard.tsx`): Sub-station tab **"3. Dangerous Drugs Safe (DDA 1952)"**.
     - Operations Hub (`src/features/operations/OperationsHub.tsx`): Quick action button.

---

### [COMPLETED] Phase 06: Radiation Safety & Diagnostic X-Ray Register (Act 304 & PHFSA 1998)
- **Status**: Completed (Commit pending)
- **Key Modules**:
  1. **Radiological Apparatus & Class C Licence Directory** (`src/domain/radiationSafety.ts`):
     - General Radiography and Dental OPG machines.
     - MOH Class C Licence tracking, 60-day renewal warnings, RPO (PPS) certification, and annual medical physicist QA.
  2. **Staff Personal Radiation Dosimetry (TLD Badges)**:
     - Quarterly badge readings from Agensi Nuklear Malaysia with deep/shallow dose monitoring.
     - Statutory investigation threshold alerts (>1.0 mSv/quarter) and legal occupational limit tracking (20 mSv/year).
  3. **Lead Rubber PPE 6-Monthly Crack Inspection**:
     - Inspection log for lead aprons, thyroid collars, and gonad shields with overdue alarms.
  4. **X-Ray Exposure Log & Reject Analysis**:
     - Patient exposure tracking (kVp, mAs), reject retake reason logging, and automated reject rate KPI monitoring (<5.0% target).
  5. **Station Integration**:
     - Operations Hub (`OperationsHub.tsx`) quick action button.
     - Treatment Room (`ProcedureStationModule.tsx`) radiation safety trigger.
