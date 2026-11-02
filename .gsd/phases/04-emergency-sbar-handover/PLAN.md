# Phase 04 Plan: Emergency SBAR Transfer & Ambulance Handover Protocol

## 1. Context & Objectives
In Malaysian outpatient medical clinics (PHFSA 1998 / Act 586), sudden clinical deterioration (e.g. Acute Coronary Syndrome, Anaphylaxis, Severe Asthmatic Attack, Acute Stroke within thrombolysis window, Severe Dengue with plasma leakage) requires emergency stabilization and rapid transfer to a tertiary hospital.

Under the **Malaysian Medical Council (MMC) Guidelines** and international patient safety protocols, clinical transfer requires structured **SBAR** communication to prevent medical errors during handoff between the primary care clinic, ambulance paramedics (MECC 999 / private services), and receiving Emergency Department (ED) Medical Officers.

### Core Objectives:
1. **SBAR Structured Clinical Engine**:
   - **S (Situation)**: Acute trigger, transfer triage (Red / Resuscitation vs. Yellow / Urgent), referring clinician MMC number.
   - **B (Background)**: Chronic comorbidities, active medications, verified drug allergies.
   - **A (Assessment)**: Serial vital signs trend, Shock Index (`HR / SBP`), GCS/AVPU score, pre-transfer ECG / lab findings.
   - **R (Recommendation)**: Pre-hospital interventions (IV cannulation, O2 therapy, emergency meds administered: e.g. Aspirin, GTN, Adrenaline, Nebulizers), target referral hospital, escort staff, and receiving hospital ED MO acknowledgment.
2. **Dispatch & Timestamp Tracking**:
   - Precise logging of Transfer Decision Time, Ambulance Call-Out Time, Ambulance Arrival at Clinic, Departure Time.
3. **Direct Print / Handover Documentation**:
   - Clean, standardized Transfer Form viewable and printable for the ambulance paramedic and receiving ED triage counter.
   - Compact verbal summary text generator for telephone handover to MECC 999 or the receiving hospital MO.
4. **Integration**:
   - Doctor Consultation module: Fast-trigger "Emergency Hospital Transfer (SBAR)".
   - Treatment Room (Bilik Rawatan): Emergency handover access button.

---

## 2. Technical Deliverables
- **Domain File**: `src/domain/emergencyTransferSBAR.ts`
  - Interfaces: `SBARTransferRecord`, `TransferVitalSigns`, `EmergencyMedicationGiven`, `ShockIndexResult`.
  - Functions: `calculateShockIndex()`, `validateSBARCompleteness()`, `formatSBARSummary()`, `createSBARTransferRecord()`.
  - Seed list: Major Malaysian tertiary emergency departments (e.g., Hospital Kuala Lumpur, Hospital Selayang, Hospital Serdang, Hospital Pulau Pinang, Sunway Medical, Prince Court).
- **Unit Test Suite**: `src/domain/emergencyTransferSBAR.test.ts`
  - Shock Index evaluation (`> 0.9` alert threshold).
  - Validation of missing statutory transfer fields.
  - SBAR text verbal summary generator verification.
- **UI Component**: `src/features/operations/EmergencySBARModal.tsx`
  - Multi-section SBAR editor with live Shock Index calculation.
  - Printable transfer summary sheet.
  - Ambulance dispatch tracking.
- **Integration Points**:
  - `ProcedureStationModule.tsx`: Header trigger for acute patients in treatment room.
  - `OperationsHub.tsx`: Emergency Transfers status pill/action.

---

## 3. Verification Gate
- [ ] TypeScript check: `npx tsc --noEmit` exits with 0 errors.
- [ ] Vitest: `npx vitest run` passes 100% of test suites (70 suites target).
- [ ] Design Token Integrity: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- [ ] Commit cleanly to `Main` and update `.gsd/STATE.md`.
