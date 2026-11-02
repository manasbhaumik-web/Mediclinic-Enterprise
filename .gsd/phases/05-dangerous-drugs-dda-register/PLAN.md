# Phase 05 Plan: Poison Act 1952 & Dangerous Drugs Act 1952 (DDA) Safe Register

## 1. Context & Statutory Objectives
Under the **Dangerous Drugs Act 1952 (Act 234)** and the **Dangerous Drugs Regulations 1952** (enforced by the Ministry of Health Malaysia - Bahagian Penguatkuasaan Farmasi), clinics possessing controlled dangerous drugs (e.g. Morphine, Fentanyl, Pethidine, Ketamine, Midazolam, Oxycodone) must maintain a strictly audited **Dangerous Drugs Safe Register (Buku Daftar Dadah Berbahaya)**.

### Statutory Requirements:
1. **DDA Safe Inventory & Perpetual Running Balance**:
   - Individual ledger for each controlled drug formulation (ampoules, transdermal patches, tablets).
   - Automatic mathematical running balance: `Prior Balance + Stock In - Quantity Out - Wastage = Balance`.
2. **Dual-Authorization Sign-Off Protocol**:
   - Mandatory dual electronic signature (Doctor with MMC No. + Pharmacist/Witness with License/Staff ID) on every outward withdrawal or wastage.
3. **Partial Dose Wastage & Destruction Witness Log**:
   - When only part of an ampoule is administered (e.g., 50mg Pethidine administered from a 100mg/2mL ampoule), the remaining 50mg must be discarded immediately with dual witness countersignatures.
4. **Physical Count Discrepancy Reconciliation**:
   - Routine physical count audits.
   - Any negative discrepancy immediately flags a statutory loss investigation alert under DDA 1952 Regulation 18.
5. **MOH Pharmacy Enforcement Audit Export**:
   - One-click CSV export structured according to the official MOH Pharmacy Enforcement Division inspection ledger format.

---

## 2. Technical Deliverables
- **Domain File**: `src/domain/dangerousDrugsDDA.ts`
  - Types: `DDADrugItem`, `DDALedgerTransaction`, `DDADiscrepancyAudit`, `DualAuthorizationPin`.
  - Functions: `calculateRunningBalance()`, `evaluatePhysicalDiscrepancy()`, `validateDualAuthorization()`, `exportDDALedgerCsv()`.
  - Default Seeds: 5 common hospital/clinic emergency dangerous drugs (Morphine 10mg/mL, Fentanyl 100mcg/2mL, Pethidine 50mg/mL, Midazolam 5mg/mL, Ketamine 50mg/mL).
- **Unit Test Suite**: `src/domain/dangerousDrugsDDA.test.ts`
  - Verifying perpetual running balance arithmetic.
  - Dual-authorization completeness verification.
  - Partial wastage tracking and negative balance prevention.
  - Physical discrepancy detection.
- **UI Component**: `src/features/pharmacy/DangerousDrugsSafeRegister.tsx`
  - Sub-tabs: "Safe Balance & Stock Register", "Withdraw Drug (Dual-Auth Sign-off)", "Receive Inward Stock", "Physical Count Audit", "MOH Inspection Export".
  - Full design system compliance: Flat `rounded-none`, `var(--color-brand)`, `border-line`, crisp 1px borders.
- **Integration Points**:
  - `DispensaryDashboard.tsx`: Add 3rd tab: **"3. Dangerous Drugs Safe (DDA 1952)"**.
  - `OperationsHub.tsx`: Header action for clinic management inspection.

---

## 3. Verification Gate
- [ ] TypeScript check: `npx tsc --noEmit` exits with 0 errors.
- [ ] Vitest: `npx vitest run` passes 100% of test suites (71 suites target).
- [ ] Design Token Integrity: Flat `rounded-none`, `var(--color-brand)`, `border-line`.
- [ ] Commit cleanly to `Main` and update `.gsd/STATE.md` and `.gsd/ROADMAP.md`.
