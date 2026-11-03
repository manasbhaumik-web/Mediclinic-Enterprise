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

- A feature may import from `domain`, `hooks`, `lib`, `utils`, `context`, `components/ui` and `theme`. Features are grouped into domains (`src/modules/domains.ts`): a feature may import another feature only inside its own domain, or from a domain it is allowed to use (today only the compliance and safety tools in `operations`). `shell` and `admin` compose other features' screens and may import any. If two features need the same thing, move it to `domain`, `utils` or `components/ui`. `src/modules/boundaries.test.ts` enforces this, and also that `domain`, `components`, `hooks`, `lib`, `utils`, `context` and `theme` never import a feature.
- `domain` imports nothing from React, hooks or features (one type-only import from `lib/einvoiceQueue` in `visitWorkflow.ts` is the single exception).
- A screen's tests and helpers sit in its feature folder; domain tests sit beside the rule they test.
- Access is decided in two places that must agree: the module registry (`src/modules`, which `routes/permissions.ts` reads) and the database policies in `supabase/migrations`.

## Modules

Pages are declared once, in `src/modules`, and everything else reads that:

- `appModules.ts`: every staff page under `/app/*` (id, English and Malay label, palette hint, icon, who may open it, whether and how it shows in the navbar or user menu). The order is the navbar order. `routes/permissions.ts` (`TAB_ROLES`, `canOpenTab`), the routes in `App.tsx`, the navbar (`features/shell/NavTabs.tsx`), the command palette and the staff access summary are all built from it.
- `adminSections.ts`: every section of the admin console, its group, who sees it, and the clinic switch (`settings.modules`) that turns it off.
- `routes/appPages.tsx` and the `sectionPages` map in `features/admin/AdminModule.tsx` hold the screen for each entry. They are typed as a record over the registry, so the build fails if a registered page has no screen.

Roles are defined once, as `SYSTEM_ROLES` in `supabase/functions/_shared/staffAccess.ts` (the edge functions share that file). `UserRole`, `ALL_ROLES`, `ADMIN_ROLES` and the registry's "everyone" list derive from it, and the label tables are typed over it, so adding a role fails the build until every table has it. `src/modules/roles.test.ts` also checks that the database role constraints in `supabase/migrations` list the same roles.

To add a staff page: add an entry to `appModules.ts`, its screen to `routes/appPages.tsx`, and the navbar label to `data.ts` (English and Malay). To add an admin section: add an entry to `adminSections.ts` and its screen to `sectionPages`. `src/modules/registry.test.ts` pins who sees what.

