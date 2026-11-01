# Phase 10: Locum Doctor MMC Session & Indemnity Log (MMC & PHFSA 1998)

## Objective
Implement an operational locum doctor shift management and credential governance workstation that:
1. Enables rapid, 60-second shift check-in for visiting/locum medical officers without full permanent HR onboarding.
2. Verifies MMC Full Registration, current Annual Practising Certificate (APC), and Medical Professional Indemnity (Medefend/MPS) prior to granting clinical prescribing sessions.
3. Calculates session hours and payout (hourly base + optional patient volume incentive) with cash drawer / petty cash voucher generation.
4. Maintains an official, exportable **CKAPS Locum Attendance & Credential Register** for surprise Ministry of Health inspections (*pemeriksaan mengejut*).

## Statutory & Ethical References
- **Private Healthcare Facilities and Services Act 1998 (Act 586)** Section 14 & 31: Person In-Charge liability for unqualified or uncredentialed medical practitioners.
- **Malaysian Medical Council (MMC) Guidelines on Locum Tenens Practice**: Mandatory APC, indemnity coverage for clinic premises, and JPA approval if public sector MO.
- **Poison Act 1952 & MMC Medical Certificate Guidelines**: Prescriptions and MCs must legally bear the actual attending locum's MMC number.

## Implementation Steps
1. Domain Engine: `src/domain/locumDoctorSession.ts`
2. Unit Tests: `src/domain/locumDoctorSession.test.ts`
3. UI Modal: `src/features/operations/LocumDoctorModal.tsx`
4. Wiring into `OperationsHub.tsx` and Staff Management.
5. Verification via `tsc` and `vitest`.
