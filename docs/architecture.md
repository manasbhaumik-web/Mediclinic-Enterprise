# Code layout

```
src/
  features/     One folder per area of the clinic. A screen, its panels, forms and tests live together.
  components/ui Shared building blocks with no clinic knowledge (Button, Card, Input, ...).
  domain/       Pure business rules and role data. No React, no network. Each file has a test beside it.
  hooks/        React hooks that read data (TanStack Query) or hold UI state.
  lib/          Data access and integration engines: Supabase client, row mappers, FHIR/HL7, queues.
  utils/        Small generic helpers (formatting, PDF/CSV export, masking).
  context/      App-wide React context (auth, clinic, inventory, ...).
  routes/       Route table, guards and the role-to-tab permission map.
  theme/        Palette and chart tokens read from CSS variables.
  mocks/        Seed data used by tests and local demos.
supabase/
  migrations/   Numbered schema changes (v1 ... v34). Apply in order.
  functions/    Edge functions; shared code in `_shared`.
scripts/        One-off seed, QA and inspection scripts (see scripts/README.md).
docs/           Feature notes.
```

## Features

| Folder | Holds |
| --- | --- |
| `shell` | App frame: header, banner and navbar, help, notifications |
| `dashboard` | Role dashboards (`LandingDashboard`) and their charts |
| `registration` | Patient registration, MyKad scan, registry, waiting-room monitor |
| `appointments` | Appointment calendar |
| `triage` | Clinical readings after registration |
| `doctor` | Doctor workspace: queue rail, next patient, monthly report |
| `consultation` | Consultation suite (SOAP tabs, plan, sign-off) |
| `pharmacy` | Dispensary |
| `billing` | Billing desk, billing management, payments, revenue cycle |
| `inventory`, `equipment`, `operations` | Stock, equipment register, operations hub |
| `staff`, `leave`, `payroll` | Staff directory and access, leave and attendance, payroll |
| `reports`, `einvoice`, `integrations` | Reports and MOH dashboard, e-invoicing, integrations |
| `admin` | Admin console, settings, security, system architecture |
| `landing`, `auth` | Public site and sign-in |

## Rules

- A feature may import from `domain`, `hooks`, `lib`, `utils`, `context`, `components/ui` and `theme`. Avoid importing one feature from another; if two features need the same thing, move it to `domain`, `utils` or `components/ui`. `shell` and `admin` are the exceptions: they compose other features' screens. Some leave over-reaches remain (for example payroll and inventory helpers imported by sibling folders) and are good candidates to tidy.
- `domain` imports nothing from React, `lib` or features.
- A screen's tests and helpers sit in its feature folder; domain tests sit beside the rule they test.
- Access is decided in two places that must agree: `routes/permissions.ts` (tabs) and the database policies in `supabase/migrations`.
