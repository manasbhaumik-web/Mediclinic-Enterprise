# Scripts

One-off maintenance and QA scripts. Run them from the repo root so `.env.local` is found, e.g. `node scripts/seed/seed.js`.

| Folder | Script | Purpose | Key needed |
| --- | --- | --- | --- |
| `seed/` | `seed.js` | Seed demo data | `SUPABASE_SERVICE_ROLE_KEY` |
| `seed/` | `seed_10_patients.cjs`, `seed_database.ts` | Seed sample patients and visits | anon key (RLS applies) |
| `qa/` | `check_roles.js`, `e2e_test.js`, `qa_test.js` | RLS and workflow smoke checks | `VITE_SUPABASE_ANON_KEY` |
| `tools/` | `inspect_schema.ts` | Read the live schema | anon key |
| `tools/` | `ui_ux_audit.cjs` | Static count of responsive/aria classes in `src` (screens live in `src/features`) | none |

The service-role key bypasses RLS. Keep it in `.env.local` only and never give it a `VITE_` prefix.
