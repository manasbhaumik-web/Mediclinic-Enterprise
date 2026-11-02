# Phase 01 Plan: Senior Clinical Operations Suite (PHFSA 1998 / CKAPS / OSHA 1994)

## Goal
Implement a clinical governance and statutory operational suite for outpatient private clinics in Malaysia covering:
1. P1: Clinical Incident & Near-Miss Register with OSHA NADOPOD auto-reporting.
2. P2: Clinician Credentialing & Statutory Privilege Guard with MMC/LJM 30-day alerts.
3. P3: Infection Control & Autoclave Sterilization Pack Log with biological spore checks.
4. P4: Outpatient Turnaround Time (TAT) & Station Bottleneck Heatmap.

## Requirements & Scope
- **P1 Incident Register**:
  - Domain file: `src/domain/clinicalIncidents.ts`
  - 6-tier severity levels (Near Miss, Minor, Moderate, Major, Critical, Sentinel).
  - OSHA Act 514 NADOPOD triggers for occupational exposure (sharps, chemical, body fluid) generating JKKP forms.
  - UI Modal: `src/features/operations/ClinicalIncidentModal.tsx` accessible from Operations Hub.
- **P2 Credentialing Guard**:
  - Domain file: `src/domain/staffCredentialing.ts`
  - Audit records for MMC APC, LJM ARC, and Medical Indemnity policies.
  - Status computation: Valid, Expiring Soon (within 30 days), Expired, Suspended.
  - UI Integration: `src/features/staff/StaffManagementModule.tsx` with statutory badge headers and privilege warnings.
- **P3 Infection Control & Sterilization**:
  - Domain file: `src/domain/autoclaveSterilization.ts`
  - Autoclave cycle recording with PHFSA 1998 parameters (134°C Porous @ 3.5m / 121°C Rubber @ 15m).
  - Chemical integrator and biological spore test tracking.
  - Sterile pack barcode generation and validation.
  - UI Modal: `src/features/operations/AutoclaveSterilizationModal.tsx` and Procedure encounter pack linking in `src/features/procedures/ProcedureStationModule.tsx`.
- **P4 Clinic Throughput & TAT**:
  - Domain file: `src/domain/clinicThroughput.ts`
  - Step timestamps: Check-in -> Triage -> Consultation -> Pharmacy -> Billing -> Checkout.
  - Bottleneck identification and station heatmaps.
  - UI Modal: `src/features/operations/ClinicThroughputModal.tsx` linked from Operations Hub.

## Verification Gate
- [x] TypeScript clean check: `npx tsc --noEmit` exits 0.
- [x] Vitest suites passing: 68/68 suites (595/595 tests).
- [x] Design token consistency: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- [x] Malaysian regulatory references verified against PHFSA 1998, CKAPS, and OSHA 1994.
