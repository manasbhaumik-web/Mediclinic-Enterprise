# Phase 08: AEFI Surveillance & Staff Sharps PEP Protocol Verification

## Standards Addressed
- **Vaccine Safety**: KKM Bahagian Pembangunan Kesihatan Keluarga (BPKK) AEFI Surveillance Manual & National Pharmaceutical Regulatory Agency (NPRA) Pharmacovigilance.
- **Occupational Health**: Occupational Safety and Health Act 1994 (OSHA / Act 514) & NADOPOD Regulations.
- **Infection Control**: KKM Guidelines on Occupational Exposure to Bloodborne Pathogens (HIV, HBV, HCV).

## Objectives Met
1. **Weight-Based IM Adrenaline 1:1000 Engine (`calculateAdrenalineDose`)**:
   - Calculates exact $0.01\text{ mg/kg}$ dose capped at $0.5\text{ mg}$ maximum single dose for anterolateral mid-thigh injection.
   - Provides live dose calculation in both mg and mL for clinical staff during acute anaphylactic emergencies.

2. **Stratified AEFI Severity Classifier (`classifyAEFISeverity`)**:
   - Immediate anaphylaxis alert with airway/breathing/circulation compromise.
   - Clinical guidance for moderate events (high fever $>39^\circ\text{C}$, swelling $>5\text{ cm}$) requiring 48-hour PKD reporting.
   - Self-limiting minor reaction tracking.

3. **Sharps Injury & 72-Hour Post-Exposure Prophylaxis (PEP) Engine (`evaluateSharpsRiskAndPEP`)**:
   - Risk evaluates exposure type (deep puncture, hollow-bore needle) and source patient status (HIV+, HBV+, HCV+, unknown high risk).
   - Generates 28-day 3-drug HIV PEP recommendation with live 72-hour countdown tracking.
   - Stratifies HBV management based on HCW vaccination status (Anti-HBs responder vs non-responder requiring HBIG within 24h).
   - Enforces statutory OSHA JKKP 6 workplace incident reporting.

4. **Interactive Workstation UI (`AEFIAndSharpsModal.tsx`)**:
   - 4-tab clinical interface:
     - Tab 1: AEFI Surveillance & Anaphylaxis Protocol with live dosage calculator.
     - Tab 2: Log AEFI Incident with symptom multi-selector and auto-fill.
     - Tab 3: Needle-Stick / Sharps Injury with 72h PEP countdown.
     - Tab 4: Statutory Registers & Exports (BPKK / NPRA report download & JKKP 6 register).

5. **Station Integration**:
   - Operations Hub (`OperationsHub.tsx`): Quick action trigger.
   - Treatment Room (`ProcedureStationModule.tsx`): Header quick action trigger for immediate access.

## Automated Test Results
- Test suite: `src/domain/aefiAndSharpsProtocol.test.ts`
- Tests: 14 passing (100% green).
