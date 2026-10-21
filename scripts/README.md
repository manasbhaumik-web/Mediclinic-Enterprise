# Scripts

One-off maintenance and QA scripts. Run them from the repo root so `.env.local` is found, e.g. `node scripts/seed.js`.

| Script | Purpose | Key needed |
| --- | --- | --- |
| `seed.js` | Seed demo data | `SUPABASE_SERVICE_ROLE_KEY` |
| `fix_assistant.js` | Repair the clinic-assistant profile | `SUPABASE_SERVICE_ROLE_KEY` |
| `seed_10_patients.cjs`, `seed_database.ts`, `inspect_schema.ts` | Seed or inspect with the anon key | anon key (RLS applies) |
| `check_roles.js`, `e2e_test.js`, `qa_test.js` | RLS and workflow smoke checks | `VITE_SUPABASE_ANON_KEY` |
| `ui_ux_audit.cjs` | Static count of responsive/aria classes in `src/components` | none |

The service-role key bypasses RLS. Keep it in `.env.local` only and never give it a `VITE_` prefix.
