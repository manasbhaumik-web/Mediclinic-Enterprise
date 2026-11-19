# Compliance and clinical-safety review

Reviewed on 19 Nov 2026 against the code on `Main` (`a9c2c9a`) and the live database configuration (policies, grants, triggers, extensions). This is a **technical review, not legal advice**. Where it mentions Malaysian law (PDPA 2010 and its 2024 amendments, private healthcare regulations), check the current wording with your lawyer or data protection officer.

Not reviewed: the Supabase and Vercel account settings (backups, MFA for dashboard users, access lists), staff training, physical security, and your contracts with Supabase and Meta.

## Summary

| ID | Area | Finding | Severity | Status |
| --- | --- | --- | --- | --- |
| H1 | Access | Seeded demo logins share the password `password123` | High | Open |
| H2 | Audit | No record of who viewed or changed patient or clinical data | High | **Fixed (v49)** |
| H3 | Clinical safety | Sign-off screen showed "Allergy Safety Verification Passed" even when the prescription conflicted | High | **Fixed** |
| H4 | Access | Too much is readable by too many roles (see below) | High | Open |
| H5 | PDPA | No privacy notice or consent is recorded at registration | High | Open |
| M1 | Access | No second factor, leaked-password check is off (idle sign-out now added) | Medium | Partly fixed |
| M2 | PDPA | Data is hosted in Tokyo; cross-border transfer is not documented | Medium | Open |
| M3 | Clinical safety | The drug-safety check is narrow and advisory | Medium | Open |
| M4 | Clinical safety | An allergy override is saved inside the drug name | Medium | Open |
| M5 | Privacy | IC masking is only in the browser | Medium | Open |
| M6 | Privacy | Consultation drafts (clinical notes) sit in browser storage | Medium | Reduced (cleared on idle sign-out) |
| M7 | PDPA | No retention schedule, no patient access/correction process | Medium | Open |
| M8 | PDPA | No written breach procedure | Medium | Open |
| M9 | Resilience | Backups and recovery are not evidenced | Medium | Open |
| L1 | Access | Two reference tables can be read without signing in | Low | **Fixed (v49)** |
| L2 | Hygiene | Remaining security-check warnings (mostly intended) | Low | Open |

## What is already in good shape
- Row-level security is **on for all 66 tables**, and every clinical write goes through a role-checked database function.
- A dispensed prescription cannot be changed or deleted. A paid or cancelled visit cannot be changed. Nobody can delete a patient or a visit.
- Sign-off is attributed to the doctor by the database, not the browser. Bill and payment fields can only be set by the cashier's function.
- The controlled-drugs register and its signatures are separate and protected.
- Device keys are stored only as a SHA-256 fingerprint. WhatsApp keys are never in the database or the app.
- Patient messages carry only a first name and a date or time, are off by default, respect an opt-out list and quiet hours, and never contain results.
- An allergy override needs a written reason. Internal database functions are closed to visitors who are not signed in (v44).

## High

### H1. Seeded demo passwords
`supabase/migrations/20260726000005_v6_auth_and_rls.sql` (doctor, pharmacist, assistant) and `20261025180000_v38_receptionist_and_cashier_logins.sql` (reception, cashier) create `@mediclinic.local` accounts with the password `password123`. If those accounts still exist with that password, anyone who has seen the repository can sign in with a clinical role. **Fix:** change or delete the accounts in Supabase (Authentication > Users). Take the seed passwords out of the migrations, or generate them per environment.

### H2. No audit trail for patient data (fixed in v49)

**Done:** `clinical_audit` is append-only (nobody can edit, delete or empty it, not even an administrator) and readable only by administrators. Triggers record every create, change and removal on patients, visits, consultation notes, prescriptions, lab and imaging orders and device results: who, when, which row, which fields (never the values). Screens record when a patient's record is opened (consultation, triage, dispensary, billing, patient administration). Administration > Patient Data Audit searches it by patient, staff member, action, kind of record and date, and downloads a page as CSV. Not covered: appointments, messages, billing and e-invoices (they have their own logs), and report downloads (aggregate tables). The original finding follows.
The audit feed in Administration > Security covers inventory, HR, payroll, equipment and integration events only. Nothing records who **opened** a patient record, who **changed** a patient, SOAP note, prescription or result, or who exported data. Without it you cannot investigate a suspected leak, and the PDPA security principle is hard to demonstrate. **Fix (needs a migration):** an append-only `clinical_audit` table fed by triggers on `patients`, `visits`, `soap_notes`, `prescriptions`, `investigations` and `device_results` (who, when, action, row id, changed field names but not values), a record when a patient record is opened, and an admin screen to search it. Admins and staff must not be able to edit or delete it.

### H3. False allergy reassurance at sign-off (fixed)
`ReviewSignoffModal` showed a green "Allergy Safety Verification Passed" whenever the patient had any allergy on file, without checking the prescription. A patient allergic to penicillin with amoxicillin prescribed would see the green tick. It now works out the real result: a red conflict panel listing each alert and any override with its reason, a green "no conflicts found" only when allergies exist and nothing conflicts, and a neutral note when no allergy is recorded ("nothing was checked"). New `src/domain/signoffSafety.ts` with tests.

### H4. Read access is broader than needed
From the live policies:
- **Every signed-in user**, including HR and admin, can read **all patients** and **all visits** (name, IC, address, phone, allergies).
- **Every signed-in user** can read **all appointments** (names, phones).
- **Pharmacists and cashiers** can read **every SOAP note**: diagnoses and clinical notes for every patient, in every visit state.
- Reference and settings tables are readable by all, which is fine.
The minimum-necessary idea is that each role sees what its task needs. **Fix (needs your decision on who needs what):** for example HR and admin-only users see no patient rows; pharmacists see notes only for visits at the dispensary; cashiers see only billing fields (and the diagnosis code only where a panel claim needs it). Changing this risks breaking screens, so each change needs a rolled-back test per role.

### H5. No privacy notice or consent record
No screen records that the patient was shown the clinic's privacy notice, or what they agreed to (data use, WhatsApp reminders, sharing with panels or insurers). Online bookings collect name, IC and phone without a notice or consent step. **Fix:** a short notice on the registration form and booking form, a stored consent (what, when, who recorded it), and a reminders consent that the message queue checks. The notice text and legal basis are for you and your counsel to write.

## Medium

### M1. Sign-in strength (idle sign-out added)

**Done:** the staff app and the admin console now sign out after 15 minutes without activity (30 in a consultation), with a one-minute warning and a "Stay signed in" button; signing out clears cached patient data and drafts. **Still open:** a second factor and leaked-password protection (both Supabase dashboard settings). The original finding follows.
No second factor (the docs list it as not built). Supabase leaked-password protection is off (switch in the dashboard). The 10-character rule is only on the set-password page. There is no automatic sign-out after inactivity: the only lock is the manual lock in the consultation room. **Fix:** enable Supabase MFA (TOTP) for admins and doctors first, turn on leaked-password protection, add an idle timeout (for example 15 minutes) that signs out and clears drafts.

### M2. Hosting location
The project is in `ap-northeast-1` (Tokyo). Storing Malaysian patients' data outside Malaysia is a cross-border transfer under the PDPA. It is usually allowed with safeguards, but it should be documented. WhatsApp (Meta) is another third party that receives phone numbers and first names. **Fix:** record the transfer and safeguards in your data protection documents; mention both providers in the privacy notice; consider a closer region if your counsel advises it.

### M3. Drug-safety check
There is a check (`drugSafetyEngine`), and a separate allergy check at the dispensary, but:
- It knows about roughly 45 drug names and has four interaction rules (double NSAID, anticoagulant with NSAID, statin with macrolide, clopidogrel with omeprazole).
- It compares only the drugs on this prescription. It does not look at what the patient is already taking or has been prescribed recently.
- Matching is by name text. A drug not in the list produces **no alert and no "not checked" message**.
- It does not check dose, age, pregnancy, kidney or liver function (except the paediatric paracetamol calculator).
- It is advisory: even a "contraindicated" pair can be signed off without acknowledgement.
- The dispensary allergy check only matches the allergy word inside the drug name, with no class or cross-reactivity.
**Fix (staged):** show "not checked" for drugs outside the list; require an acknowledgement and reason to sign off a contraindicated pair; include the patient's recent prescriptions; for real coverage, use a licensed drug database (for example MIMS) rather than a hand-kept list.

### M4. Override stored in the drug name
When a doctor prescribes against an allergy warning, the reason is saved by appending `[OVERRIDDEN: ...]` to `drug_name`. That text then flows into stock matching, dispensing and reports, and there is no structured record of who overrode what and when. **Fix:** `override_reason`, `overridden_by` and `overridden_at` columns on `prescriptions`, set by the sign-off function; keep `drug_name` clean.

### M5. IC masking is cosmetic
Masking happens in the browser. The database returns the full IC to any signed-in staff member, and a person with a login can query it directly through the API. This ties in with H4. **Fix:** limit the rows (H4) and, where a screen only needs a masked IC, return it masked from a function or view.

### M6. Notes in browser storage
Consultation drafts, including clinical notes, are kept in `localStorage` so a doctor does not lose work. They are cleared on sign-out, but not on idle, tab close or a crash, so they stay on a shared PC. **Fix:** the idle sign-out in M1 clears them; consider session storage instead.

### M7. Retention and patient rights
There is no retention schedule and no tool to answer a patient's request for their data or a correction. Records cannot be deleted (right for medical records). Check the retention period your private-healthcare licence requires, then write it down. **Fix:** a retention policy; a "patient data export" for an access request; a note of corrections made.

### M8. Breach procedure
No written procedure. As I understand the 2024 PDPA amendments, a breach likely to cause significant harm must be reported to the Commissioner and the affected people within a set time. Confirm the current rule with counsel. Needs the audit trail (H2) to be answerable. **Fix:** a one-page response plan: who decides, who is told, how long each step may take.

### M9. Backups
I could not see the backup settings. **Fix:** confirm point-in-time recovery is on for the Supabase project, and do one test restore into a scratch project.

## Low

### L1. Two tables readable without signing in (fixed in v49)
`clinical_embeddings` (empty today) and `diseases` (reference data) have read policies for the public role, so a visitor can read them. Today this exposes nothing sensitive, but a future import of patient-derived text would. **Fix:** change both policies to signed-in users.

### L2. Security-check warnings
The remaining warnings are the four online-booking functions (intended), the many role-checked functions signed-in users can call (intended), the `vector` extension in the public schema, and leaked-password protection (M1).

## Suggested order
1. **Now, no code:** change the demo passwords (H1); turn on leaked-password protection and MFA for admins (M1); confirm backups (M9); decide where the privacy notice and a breach plan will come from (H5, M8).
2. **Next, database and code, needs your approval to apply:** the audit trail (H2); structured override record (M4); signed-in-only reference tables (L1); consent capture (H5).
3. **Needs your decision first:** who may read what (H4, M5); idle timeout length and MFA rollout (M1); retention period (M7).
4. **Larger:** a licensed drug database and patient-history checks (M3).
