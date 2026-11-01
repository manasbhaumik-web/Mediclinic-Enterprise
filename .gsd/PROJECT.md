# Project System of Record: Mediclinic Enterprise

## 1. System Architecture & Tech Stack
- **Framework**: React 19 + TypeScript (Strict Type Safety)
- **Bundler & Tooling**: Vite 6+
- **Styling Engine**: Tailwind CSS with CSS Variables / Theme Tokens (`src/index.css`)
- **Testing Suite**: Vitest (68 test suites, 595 unit tests passing)
- **Iconography**: `lucide-react`
- **Data Architecture**: Pure Domain Logic Layer (`src/domain/`), In-Memory Storage Adapters, LocalStorage Persistence Guards
- **Target Deployment**: Outpatient Primary Care & Specialist Ambulatory Centers (Malaysia)

---

## 2. Design System & UX Principles
- **Aesthetic**: Flat, authoritative clinical enterprise interface.
- **Corner Radius**: `rounded-none` standard across all buttons, inputs, modals, and container cards.
- **Interactive Focus & Borders**: Standardized 1px solid brand border (`var(--color-brand)`) with zero subpixel ring spreads.
- **Brand Tokens**:
  - Primary Brand Teal: `#0f766e` (`var(--color-brand)`)
  - Accent / Hover Teal: `#115e59` (`var(--color-brand-hover)`)
  - Border Line: `#bfeee3` (`var(--color-border)`)
  - Ink / Text: `#0f3c4c` (`var(--color-text)`)
  - Surface Backgrounds: `var(--color-surface)` / `bg-slate-50`
- **Component Design Rule**: Never use hardcoded one-off colors (e.g. raw un-themed emerald or blue buttons). Always utilize semantic color tokens (`emerald` for success, `amber` for statutory/expiry warnings, `rose` for critical alerts/hazards, `slate` for neutral controls).

---

## 3. Statutory & Regulatory Compliance Engine (Malaysia)
Every clinical and operational module must strictly comply with Malaysian Healthcare Statutes:
1. **PHFSA 1998 (Act 586) & Regulations 2006**:
   - Private Healthcare Facilities and Services (Private Medical Clinics) Regulations.
   - Statutory registers: Autoclave Sterilization Log (134°C Porous / 121°C Rubber parameters, spore test checks), Clinic Equipment Maintenance, Resuscitation Crash Cart inspection.
2. **CKAPS Standards (Cawangan Kawalan Amalan Perubatan Swasta)**:
   - Inspection-ready audit trails for staff credentialing (MMC APC, LJM ARC, Annual Indemnity policies).
3. **Poison Act 1952 & Dangerous Drugs Act 1952 (Act 234)**:
   - Group B & Group C prescription validation.
   - Dangerous Drugs Safe balance reconciliation, dual-authorization countersignatures, running balance audit logs.
4. **Prevention & Control of Infectious Diseases Act 1988 (Act 342)**:
   - Mandatory statutory e-Notifikasi for 32 schedule infectious diseases (e.g., Dengue, Tuberculosis, Pertussis, COVID-19, Malaria) within statutory window (24h/7d).
5. **OSHA 1994 (Act 514) & NADOPOD Regulations 2004**:
   - Occupational Safety and Health incident tracking (sharps injuries, blood/body fluid splash, chemical exposures).
   - JKKP 6/7/8/9 statutory form compliance.
6. **LHDN e-Invoice Guideline v1.1 (Inland Revenue Board of Malaysia)**:
   - Patient TIN, MyKad / Passport validation, MSIC codes, Consolidated e-Invoice workflows.

---

## 4. Role-Based Access Control (RBAC)
Role separation enforced across the platform:
- `admin`: Clinic Owner / Practice Manager (Operations, Financials, Audits, Credentialing, System Hubs).
- `doctor`: Registered Medical Practitioner (Clinical Consultation, Diagnosis, Prescription, Statutory e-Notifikasi, Procedure Orders, MC Issuance).
- `clinic-assistant`: Reception, Patient Registration, Queue Management, Triage Vitals, Treatment Room Support.
- `pharmacist`: Prescription Verification, Poison Register Dispensing, Dangerous Drugs Register, Drug-Drug Interaction Overrides.
- `billing`: Cashier, Corporate TPA Claims, Panel Guarantee Letters (GL), LHDN e-Invoice, Split Billing.
- `radiographer`: Medical Imaging Station (X-Ray, Ultrasound, PACS dicom review).
- `lab-technician`: Pathology & Point-of-Care Testing (POCT) station, specimen logging, reference ranges.
- `inventory-manager`: Central Pharmacy Store, Goods Received Notes (GRN), Batch Expiry Tracking, Stock Reorder Levels.

---

## 5. Engineering Guardrails & Verification Gate
Before any feature or code change is merged:
1. **Static Analysis**: `npx tsc --noEmit` must exit 0 with zero TypeScript errors.
2. **Automated Testing**: `vitest run` must execute with 100% passing suites (minimum baseline: 68 suites, 595 tests).
3. **UI Consistency**: Must adhere to flat borders, design tokens, and no regressions in existing clinical modules.
