# Phase 08: Adverse Event Following Immunization (AEFI) & Staff Sharps PEP Protocol

## Objective
Implement a clinical safety and occupational health workstation addressing:
1. **Adverse Event Following Immunization (AEFI)** according to KKM Bahagian Pembangunan Kesihatan Keluarga (BPKK) and NPRA Pharmacovigilance guidelines.
2. **Staff Needle-Stick & Sharps Injury Clinical Protocol** with rapid viral serology risk stratification and 72-hour Post-Exposure Prophylaxis (PEP) window countdown under OSHA 1994.

## Statutory & Regulatory References
- **KKM BPKK / NPRA**: National Immunisation Programme Adverse Events Following Immunisation Surveillance Manual (48-hour notification rule, immediate anaphylaxis protocol).
- **Occupational Safety and Health Act 1994 (Act 514)** & NADOPOD Regulations.
- **KKM Guidelines on Occupational Exposure to Bloodborne Pathogens**: Baseline serology, Hepatitis B Immunoglobulin (HBIG) within 24h, HIV PEP within 72h.

## Implementation Steps
1. **Domain Engine (`src/domain/aefiAndSharpsProtocol.ts`)**:
   - AEFI severity classification (Minor, Moderate, Severe/Anaphylaxis).
   - Weight-based IM Adrenaline 1:1000 calculation (0.01 mg/kg, max 0.5 mg).
   - Sharps injury risk stratification (Deep percutaneous vs Superficial vs Mucous splash).
   - Source patient & HCW serology matching matrix (HBsAg, Anti-HBs, Anti-HCV, HIV).
   - 72-hour PEP window countdown calculation.
   - Statutory BPKK/NPRA AEFI export & JKKP 6 Sharps incident reporting.

2. **Unit Tests (`src/domain/aefiAndSharpsProtocol.test.ts`)**:
   - Validate AEFI severity grading & adrenaline calculations.
   - Validate sharps injury risk tiering & PEP recommendations.
   - Validate BPKK AEFI export formatting.

3. **UI Workstation (`src/features/operations/AEFIAndSharpsModal.tsx`)**:
   - Multi-tab modal:
     - Tab 1: AEFI Surveillance & Anaphylaxis Protocol
     - Tab 2: Log New AEFI Incident
     - Tab 3: Needle-Stick / Sharps Injury & 72h PEP Countdown
     - Tab 4: Statutory Incident Register & Exports (NPRA / JKKP)
   - Flat enterprise styling (`rounded-none`, `var(--color-brand)`, crisp borders).

4. **Integration**:
   - Wire into `src/features/operations/OperationsHub.tsx`.
   - Wire into `src/features/operations/ProcedureStationModule.tsx`.

5. **Verification**:
   - `npx tsc --noEmit` -> 0 errors.
   - `npx vitest run` -> 74 test suites, all passing green.
