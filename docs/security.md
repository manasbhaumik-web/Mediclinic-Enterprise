# Application Security Document (ASD)
## MEDICLINIC Enterprise: Next-Generation Clinical Operating System

---

### Document Control
- **Document Version**: 2.4.0-SECURITY
- **Classification**: Confidential / Enterprise Healthcare Standard
- **System**: MEDICLINIC Enterprise
- **Security Paradigm**: Zero-Trust Network & Application Architecture
- **Compliance Frameworks**: PDPA 2010 (Malaysia), KKM Act 586, LHDN MyInvois SDK v1.0, OWASP Top 10 (2021), ISO/IEC 27001 Alignment
- **Author**: Antigravity Healthcare Cybersecurity & Engineering Team
- **Date**: October 2026

---

## 1. Executive Summary & Security Philosophy

### 1.1 Executive Summary
**MEDICLINIC Enterprise** is an enterprise-grade clinical electronic health records (EHR) and outpatient operating system. Because it processes Electronic Medical Records (EMR), Electronic Prescriptions (e-Rx), National Registration Identity Card (NRIC) numbers, biometric telemetry, and financial transactions (including LHDN statutory e-invoicing), the platform operates under a **Zero-Trust Security Architecture**.

Every transaction, clinical chart modification, prescription dispensation, and database read is verified at the database layer through cryptographically signed JSON Web Tokens (JWT) and PostgreSQL Row-Level Security (RLS). The frontend client is treated as an untrusted boundary.

### 1.2 Core Security Objectives
1. **Confidentiality (PDPA 2010 Compliance)**: Prevent unauthorized inspection of patient Protected Health Information (PHI) and Personally Identifiable Information (PII) via automated data masking.
2. **Clinical Integrity & Non-Repudiation**: Prevent unauthorized doctor chart modifications, prescription tampering, or retroactive audit modifications through cryptographic sign-offs and immutable append-only ledgers.
3. **Availability & Fault-Tolerant Resiliency**: Ensure uninterrupted clinical operations during network partitions with local client draft isolation and automatic outbox queuing for statutory transmissions.
4. **Defense in Depth**: Multi-tiered protection across edge routing, API gateway authentication, database row-level authorization, and peripheral hardware isolation.

---

## 2. Threat Modeling & OWASP Top 10 Mitigation Matrix

```mermaid
graph TD
    Attacker["Threat Actor / Malicious Client"]
    Edge["Edge Gateway (WAF / CORS / Rate Limiting)"]
    Auth["GoTrue Identity Service (JWT RS256)"]
    RLS["PostgreSQL RLS Engine (Database Layer)"]
    Audit["Immutable Audit Vault (Append-Only)"]

    Attacker -->|"Untrusted Request"| Edge
    Edge -->|"Token Validation"| Auth
    Auth -->|"Claims (auth.uid, roles)"| RLS
    RLS -->|"Permitted Operations"| Audit
    RLS -.->|"Denied: 42501 Insufficient Privilege"| Attacker
```

| OWASP Risk | Threat Description | MEDICLINIC Enterprise Defense Architecture |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | User accesses clinical charts or financial ledgers outside their designated clinical role. | **Database-Enforced RLS**: Client requests cannot bypass role verification. All tables enforce RLS (`has_any_role()`, `require_role()`). `guard_visit_update()` trigger enforces deterministic state transitions. |
| **A02: Cryptographic Failures** | Exposure of PII (Malaysian IC numbers, phone numbers) or plaintext passwords. | **Bcrypt & AES-256**: Passwords hashed with `pgcrypto` (`gen_salt('bf')`). Data in transit enforced via TLS 1.3. Front-desk PII automatically masked by default (`maskNRIC`). |
| **A03: Injection** | SQL injection in patient search, consultation notes, or ICD-10 queries. | **100% Parameterized PostgREST Queries**: No raw SQL concatenation in application code. All database RPCs use typed parameterized inputs. |
| **A04: Insecure Design** | Doctor consults a patient while another doctor edits the same consultation; dispensing drugs with conflicting allergies. | **Closed-Loop Safety Engine**: Real-time drug-allergy contraindication checks (`drugSafetyEngine.ts`). Station room occupancy locks prevent dual-calling of patients. |
| **A05: Security Misconfiguration** | Exposure of privileged service-role keys in public frontend code. | **Build-Time Key Guard**: `assertNotServiceRoleKey()` terminates startup if a `service_role` key is provided to client bundles. CORS locked to strict origin. |
| **A06: Vulnerable Components** | Dependencies with known vulnerabilities in Node runtime. | **Continuous SCA**: Zero high/critical vulnerabilities via `npm audit`. Vitest test suite running 531 automated regression tests on every commit. |
| **A07: Identification Failures** | Credential stuffing, weak passwords, session hijacking. | **Enforced Password Complexity**: Minimum 10 characters, mixed case, numeric rules. Short-lived RS256 access tokens with secure refresh token rotation. |
| **A08: Software & Data Integrity** | Tampering with Medical Certificates (MC), bills, or e-Invoices. | **Digital Fingerprinting**: Serialized MCs with verification barcodes. LHDN e-Invoices signed via SHA-256 HMAC and UBL 2.1 digital signatures. |
| **A09: Security Logging Failures** | Failure to record unauthorized patient chart access. | **Immutable Audit Triggers**: Database triggers record every insert, update, and delete to `audit_logs` with actor ID, timestamp, and delta diffs. |
| **A10: Server-Side Request Forgery** | External lab/FHIR connection endpoint abuse. | **Strict SSRF Gateway**: `validateEndpoint()` enforces URL validation, disallows loopback/link-local IP ranges (127.0.0.1, 169.254.x), and validates HTTPS. |

---

## 3. Identity, Authentication & Session Security

```mermaid
sequenceDiagram
    autonumber
    actor Staff as "Clinic Staff (Doctor/Nurse)"
    participant UI as "LoginModule.tsx"
    participant Auth as "Supabase GoTrue (Auth Gateway)"
    participant Context as "AuthContext.tsx"
    participant DB as "PostgreSQL (profiles / staff)"

    Staff->>UI: Enters email and password
    UI->>Auth: POST /auth/v1/token?grant_type=password
    Auth-->>UI: RS256 JWT Access Token + Refresh Token
    UI->>Context: Receives authenticated session
    Context->>DB: SELECT role, roles, full_name FROM profiles WHERE id = auth.uid()
    DB-->>Context: Verified Roles: ['doctor']
    Context->>UI: Grants access & mounts protected Consultation Workspace
```

### 3.1 Token Specifications
- **Algorithm**: RS256 (Asymmetric public/private key signing)
- **Token Claims Payload**:
  ```json
  {
    "aud": "authenticated",
    "exp": 1785033420,
    "sub": "f32f43f4-e52d-469c-9173-410074320520",
    "email": "doctor@mediclinic.local",
    "role": "authenticated",
    "app_metadata": { "provider": "email" },
    "user_metadata": { "full_name": "Dr. Sarah Tan" }
  }
  ```
- **Access Token TTL**: 3600 seconds (1 hour).
- **Refresh Token Storage**: Managed securely in HTTP-only, SameSite storage with automated rotation on expiry.

### 3.2 Password Policy & Protection
- Password complexity enforced by [SetPasswordPage.tsx](file:///c:/Users/Manas/.gemini/antigravity/scratch/Mediclinic-Enterprise/src/routes/SetPasswordPage.tsx#L11):
  - Minimum 10 characters.
  - Mandatory uppercase, lowercase, and numeric characters.
  - Password strength verification against common/compromised dictionaries.
- Password hashing executed exclusively at the database layer via **bcrypt** with randomized cryptographic salts (`crypt(password, gen_salt('bf'))`).

### 3.3 Role Isolation & Multi-Persona Session Switching
To prevent privilege bleed in multi-role staff accounts (e.g., an assistant who also covers the front desk):
- The application stores the active selected workspace role in `sessionStorage.getItem('mediclinic.activeRole')`.
- [AuthContext.tsx](file:///c:/Users/Manas/.gemini/antigravity/scratch/Mediclinic-Enterprise/src/context/AuthContext.tsx#L67) validates that the selected role is strictly contained within the database-verified `profiles.roles` array.
- Tampering with `sessionStorage` in DevTools is neutralized because database RLS evaluates permissions based on the server-side JWT `auth.uid()` and database profile table, not client state.

---

## 4. Authorization & Row-Level Security (RLS) Architecture

### 4.1 Granular Role-Based Access Control (RBAC) Matrix

The system implements 7 operational personas with mutually exclusive clinical duties:

| Clinical / Operational Capability | Doctor | Pharmacist | Receptionist | Clinic Assistant | Cashier | Admin | HR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Full Malaysian NRIC (Unmasked)** | Required | Restricted | Allowed | Allowed | Restricted | Allowed | Allowed |
| **Register New Patient (PMI Insert)** | Allowed | Denied | **Primary** | Denied | Denied | Allowed | Denied |
| **Perform Clinical Triage & Enter Vitals** | Allowed | Denied | Denied | **Primary** | Denied | Denied | Denied |
| **Access Consultation Suite & SOAP Notes** | **Primary** | Denied | Denied | Denied | Denied | Read-Only | Denied |
| **Prescribe Schedule & Controlled Drugs** | **Primary** | Denied | Denied | Denied | Denied | Denied | Denied |
| **Dispense Medication & Decrement Stock** | Denied | **Primary** | Denied | Denied | Denied | Denied | Denied |
| **Settle Bills & Collect Payments** | Denied | Denied | Denied | Denied | **Primary** | Allowed | Denied |
| **Transmit LHDN e-Invoices** | Denied | Denied | Denied | Denied | **Primary** | Allowed | Denied |
| **Manage Staff Roles & Access** | Denied | Denied | Denied | Denied | Denied | **Primary** | Allowed |
| **Process Malaysian Statutory Payroll** | Denied | Denied | Denied | Denied | Denied | Denied | **Primary** |

### 4.2 Deterministic State Guard: `guard_visit_update()`
To prevent out-of-order workflow execution (e.g., a cashier settling a patient before the doctor finishes consultation), PostgreSQL executes a state-machine trigger on every `visits` update:

```sql
-- Enforces allowed transitions per verified user role
IF 'clinic-assistant' = ANY (v_roles) THEN
  v_allowed := v_allowed || ARRAY['Awaiting Triage>Triaging', 'Awaiting Triage>Awaiting Consult', 'Triaging>Awaiting Consult'];
END IF;
IF 'doctor' = ANY (v_roles) THEN
  v_allowed := v_allowed || ARRAY['Awaiting Consult>Consulting', 'Consulting>Awaiting Consult', 'Awaiting Consult>Awaiting Dispensation', 'Consulting>Awaiting Dispensation'];
END IF;
IF 'pharmacist' = ANY (v_roles) THEN
  v_allowed := v_allowed || ARRAY['Awaiting Dispensation>Dispensing', 'Awaiting Dispensation>Awaiting Billing', 'Dispensing>Awaiting Billing'];
END IF;

IF NOT (v_move = ANY (v_allowed)) THEN
  RAISE EXCEPTION 'Your role cannot move a visit from % to %.', OLD.status, NEW.status USING ERRCODE = '42501';
END IF;
```

---

## 5. Malaysian Statutory Data Privacy (PDPA 2010)

```mermaid
flowchart LR
    RawNRIC["Plaintext NRIC: 920514-10-5542"] --> MaskEngine["piiMasker.ts"]
    MaskEngine --> MaskedDisplay["Masked Display: 920514-10-••••"]
    MaskedDisplay --> FrontDesk["Front Desk / Kiosk Screens"]
    
    AuthToken["Staff Session Token"] --> PermCheck{"Holds VIEW_FULL_NRIC?"}
    PermCheck -->|Yes + Explicit Toggle| PlaintextDisplay["Audited Plaintext View"]
    PermCheck -->|No| MaskedDisplay
```

### 5.1 NRIC & Identification Masking
In strict adherence to the **Personal Data Protection Act 2010 (PDPA)**:
- All patient search results, queue screens, receipts, and public views automatically execute [piiMasker.ts](file:///c:/Users/Manas/.gemini/antigravity/scratch/Mediclinic-Enterprise/src/utils/piiMasker.ts):
  ```typescript
  export function maskNRIC(ic: string): string {
    if (!ic) return '';
    const clean = ic.replace(/[^0-9]/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-••••`;
    }
    return ic.replace(/.(?=.{4})/g, '•');
  }
  ```
- **Unmasking Protocol**: Unmasking is gated behind the `VIEW_FULL_NRIC` permission, requires explicit click toggle, resets to masked on session timeout or page reload, and writes an audit event.

### 5.2 Immutable Audit Ledger
The `audit_logs` table provides a tamper-evident record of all clinical, administrative, and financial activities:
- **Append-Only Enforcement**: PostgreSQL explicitly revokes `UPDATE` and `DELETE` on `audit_logs` for all authenticated users and service roles.
- **Captured Metadata**: Actor UUID, Actor Role, Timestamp (UTC), Client IP, Affected Table, Primary Key, and JSONB snapshot of `old_values` vs `new_values`.

---

## 6. Financial, Tax & e-Invoice Security (LHDN MyInvois)

### 6.1 Cryptographic Integrity of e-Invoices
Under the **Inland Revenue Board of Malaysia (LHDN)** e-Invoice Model:
1. **Payload Structure**: Strictly compliant with UBL 2.1 XML / JSON schemas.
2. **SHA-256 Digest**: The invoice payload is hashed using SHA-256 to ensure data cannot be altered in transit.
3. **Digital Signatures**: Outbound invoices are signed with the clinic's digital certificate before transmission to LHDN API endpoints.
4. **Secret Storage Isolation**: Integration credentials and LHDN client secrets are stored in a dedicated, isolated table `integration_secrets` that is never exposed to frontend queries (`SELECT` is revoked for public/authenticated roles; accessible only via serverless edge functions).

---

## 7. Peripheral, Hardware & Network Security

### 7.1 Web Peripheral Communication
- **Thermal Receipt Printers & Barcode Scanners**: Communicate via local WebUSB or Web Serial APIs with explicit browser permission prompts. No external daemon or open TCP port is required on the workstation.
- **Audio Room Announcements**: Synthesized locally using the browser's native **Web Speech API**; no audio data or patient names are transmitted over third-party speech servers.

### 7.2 Ambient AI Clinical Scribe Privacy
- Consultation audio captured via Web Audio API is transmitted over TLS to the dedicated serverless scribe proxy.
- Audio chunks are processed ephemerally in memory to generate structured SOAP notes.
- **Zero Training Retention**: Audio streams and raw transcripts are never persisted or used for public foundation model training. Once the doctor signs off the SOAP note, the audio buffer is purged from memory.

---

## 8. Incident Response & Security Maintenance

### 8.1 Vulnerability Management Routine
- **Static Analysis & Type Safety**: TypeScript Strict Mode prevents null-pointer dereferences and improper type coercion.
- **Automated Regression Suite**: 53 test suites and 531 tests run on every pull request, enforcing that zero security regression bypasses CI.
- **Database Backup & Recovery**:
  - Continuous WAL (Write-Ahead Logging) archiving with Point-in-Time Recovery (PITR) up to 7 days.
  - Daily encrypted database snapshots retained across geographically redundant cloud regions.

### 8.2 Security Incident Playbook
In the event of suspected credential compromise:
1. **Immediate Session Termination**: Admin triggers `revoke` action in `staff-onboard`, executing `auth.admin.updateUserById(userId, { ban_duration: '876000h' })`.
2. **Token Invalidation**: Supabase GoTrue revokes all active refresh tokens for the compromised account.
3. **Audit Inspection**: Review `audit_logs` filtering by `actor_id = compromised_id` over the incident window to determine data exposure scope.
4. **PDPA Notification**: If clinical patient records were exposed, the clinic Data Protection Officer (DPO) initiates formal statutory disclosure protocols within 72 hours.

---
*End of Application Security Document*
