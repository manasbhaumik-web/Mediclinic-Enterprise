# Current State: Mediclinic Enterprise

## System Health & Test Suite Status
- **Date**: 2026-11-01
- **Active Git Branch**: `Main`
- **Latest Commit**: `2c7ae07` (feat(clinical-ops): complete P1-P4 Senior Clinical Operations Suite)
- **TypeScript Static Verification**: `npx tsc --noEmit` -> **0 errors (CLEAN)**
- **Automated Test Suite**: `vitest run` -> **68 passed / 68 test suites (595 passed / 595 unit tests)**
- **Development Server**: Active on `http://localhost:3000/`

---

## Active Phase Summary
- **Current Milestone**: Phase 03 - Point-of-Care Testing (POCT) & Equipment Quality Control
- **Status**: Ready to Plan / Spec
- **Preceding Phases**:
  - Phase 01 (Senior Clinical Operations P1-P4): Completed & Verified
  - Phase 02 (Corporate TPA Direct Claims & Settlements): Completed & Verified

---

## Architectural & Domain Decisions Log
1. **Design System**: Strict adherence to flat `rounded-none` geometry with 1px border lines (`var(--color-brand)`, `border-line`). No raw un-themed Tailwind buttons (`bg-emerald-600` or `bg-blue-600` are prohibited; use semantic tokens).
2. **Role Architecture**: Clinical workflows are executed under existing roles: `clinic-assistant`, `doctor`, `pharmacist`, `billing`, `lab-technician`, `radiographer`, `inventory-manager`, `admin`. No dedicated `nurse` or `medical-assistant` role is introduced per clinic operational policy.
3. **Statutory Standards**: All clinical documentation must strictly comply with MOH Malaysia statutes (PHFSA 1998, Poison Act 1952, Act 342, OSHA 1994, LHDN e-Invoice).
