# Phase 09: CKAPS Biennial Form B Inspection Dossier Packager

## Objective
Build an executive-grade regulatory audit and inspection dossier compiler that aggregates all statutory clinical operational records across the facility for Ministry of Health (MOH / KKM) Cawangan Kawalan Amalan Perubatan Swasta (CKAPS) biennial Form B private clinic license renewal audits.

## Statutory Backing
- **Private Healthcare Facilities and Services Act 1998 (Act 586)**:
  - Form B (Application for License to Establish or Maintain / Renew Private Clinic).
  - Regulation 12 to 38: Emergency facilities, infection control, equipment maintenance, laboratory/POCT, and drug storage.
- **Atomic Energy Licensing Act 1984 (Act 304)**: Class C diagnostic X-ray licence.
- **Poison Act 1952 & Dangerous Drugs Act 1952 (Act 234)**: Storage, safe ledger, and dual-auth registers.
- **Occupational Safety and Health Act 1994 (Act 514)**: Workplace safety and sharps injury protocols.
- **Environmental Quality Act 1974**: Scheduled Clinical Waste (SW404/SW405) consignment records.

## Architecture & Implementation Steps
1. **Domain Engine (`src/domain/ckapsDossier.ts`)**:
   - Aggregates statutory logs:
     - 1. Facility & Person In-Charge (PIC) Credentials (MMC APC / Indemnity)
     - 2. Part V Emergency Preparedness & Crash Cart Logs
     - 3. Regulation 37 Autoclave Sterilization & Spore Testing
     - 4. Regulation 38 POCT Calibration & Strip Expiry
     - 5. Vaccine Cold Chain Refrigerator (+2°C to +8°C) Logs & Excursions
     - 6. DDA 1952 Dangerous Drugs Safe & Section 21 Poison Books
     - 7. Act 304 Diagnostic Radiation & TLD Dosimetry
     - 8. OSHA 1994 Sharps Exposure, AEFI, & Incident Records
     - 9. Clinical Scheduled Waste (SW404/SW405) Consignments
   - Computes weighted Facility Inspection Readiness Score (0-100%, Grade A/B/C/F).
   - Generates full statutory Form B Inspection Dossier report.

2. **Unit Tests (`src/domain/ckapsDossier.test.ts`)**:
   - Verify score weighting and grading.
   - Verify defect detection (e.g. overdue calibration, expired APC).
   - Verify dossier generation with complete statutory sections.

3. **UI Workstation (`src/features/operations/CKAPSDossierModal.tsx`)**:
   - Executive dashboard with audit readiness meter.
   - Pillar-by-pillar evidence breakdown.
   - PIC statutory declaration signer.
   - Full dossier preview with print & download functionality.

4. **Integration**:
   - Wire into `src/features/operations/OperationsHub.tsx`.
   - Wire into Administration view.

5. **Verification**:
   - `npx tsc --noEmit` -> 0 errors.
   - `npx vitest run` -> 75 test suites, 100% green.
