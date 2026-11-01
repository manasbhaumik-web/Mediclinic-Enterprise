# Phase 10: Locum Doctor MMC Session & Indemnity Log Verification

## Standards Addressed
- **Medical Act 1971 & MMC Ethical Guidelines**: Locum Tenens Practice Regulations (Annual Practising Certificate verification, Indemnity premises coverage, JPA approval if public hospital MO).
- **Private Healthcare Facilities and Services Act 1998 (Act 586)**: Section 14 (Person In-Charge vicarious liability for uncredentialed medical practitioners).
- **Poison Act 1952 & Medical Certificate Rules**: Legal mandate that prescriptions and MCs bear the actual attending doctor's MMC credentials.

## Objectives Met
1. **Locum Credential Guard (`validateLocumCredentials`)**:
   - Validates MMC registration number format, active APC year (current year), and unexpired Medical Professional Indemnity policy.
   - Prevents uncredentialed doctors from opening consulting shifts.

2. **Shift Remuneration & Payout Calculator (`calculateLocumShiftPayout`)**:
   - Calculates base hourly pay (e.g. 4 hrs @ RM 55/hr = RM 220.00) plus optional patient volume incentives.
   - Issues serialized Petty Cash payment reference on shift checkout.

3. **Statutory CKAPS Attendance Register (`exportCKAPSLocumAttendanceLedger`)**:
   - Compiles CSV attendance register with MMC credentials, indemnity policies, hours worked, and supervising staff nurse verification for MOH auditors.

4. **Interactive Workstation UI (`LocumDoctorModal.tsx`)**:
   - Tab 1: Active Consulting Locum on duty with live shift timer and end-shift voucher generator.
   - Tab 2: 60-Second Locum Onboarding without permanent HR overhead.
   - Tab 3: Pre-approved Credentialed Locum Vault.
   - Tab 4: CKAPS Attendance Ledger.

5. **Station Integration**:
   - Operations Hub (`OperationsHub.tsx`): Quick action button.

## Automated Test Results
- Test suite: `src/domain/locumDoctorSession.test.ts`
- Tests: 10 passing (100% green).
