# Phase 02 Plan: Corporate TPA Panel Direct Claims & Billing Reconciliation

## Goal
Establish a real-time third-party administrator (TPA) direct billing and panel claims engine for outpatient clinics in Malaysia, preventing billing rejections, enforcing corporate policy limits, and automating remittance variance reconciliation.

## Scope & Deliverables
1. **Domain Engine (`src/domain/tpaPanelClaims.ts`)**:
   - TPA panel directory (Mednefits, MiCare, HealthMetrics, PMCare, AIA, IHP).
   - Guarantee Letter (GL) verification with valid-until, case category, and coverage amount.
   - Corporate benefit rule validation:
     - Co-payment deductions (fixed MYR or percentage).
     - Per-visit sub-limits and annual pool tracking.
     - Prescription exclusion lists (e.g. non-formulary vitamins, cosmetic dermatologicals).
   - Batch claims generation for monthly submission.
2. **Settlement & Audit Hub (`src/features/tpa/TPASettlementHub.tsx`)**:
   - Claims summary cards (Approved, Pending, Disputed, Settled).
   - Line-item remittance variance tracking (Approved Amount vs. Paid Amount) with reason codes.
   - One-click batch export to CSV and JSON formats formatted for TPA portal uploads.
3. **In-Encounter Consultation Warning Integration**:
   - Proactive warnings to prescribing doctors when adding medications or procedures that exceed panel coverage or require prior authorization.

## Verification Gate
- [x] TypeScript clean check: `npx tsc --noEmit` exits 0.
- [x] Vitest suites passing: 68/68 suites (595/595 tests).
- [x] CSV and JSON batch output adheres to standard TPA reconciliation formats.
