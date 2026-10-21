# Payroll

Admin console > Finance > **Payroll** (administrators and HR).

## How a run works

1. **Draft**: HR or an admin creates a run for a month. Every *Active* staff member gets a payslip, calculated from their salary, recurring pay items and the rate tables. Use **Adjust** per person for this month's allowances, deductions, overtime, unpaid leave and a manual PCB. **Recalculate** picks up changes to salary, bank details or rates.
2. **Awaiting approval**: HR or an admin submits the run. Figures are locked unless it is returned to draft.
3. **Approved**: an *administrator* approves. A different administrator must approve if more than one exists. Approval recomputes every payslip against today's rates and refuses when figures are stale, a rate used is unverified, a net pay is negative or the run is empty. Totals and the exact rates used are stored with the run.
4. **Paid**: an administrator records the payment date. Paid runs are permanent.
5. **Cancelled**: kept on record with a reason. A paid run cannot be cancelled.

All rules are enforced by the `payroll` edge function and by database triggers (they apply to the service role too). Every action is written to the append-only `payroll_events` table. Nothing in `payroll_runs`, `payslips` or `payroll_events` can be deleted.

## Calculation

- Daily rate = basic / working days in the run (default 26). Hourly = daily / hours per day (default 8).
- Unpaid leave = daily rate x days, capped at basic. Overtime = hourly x multiplier x hours.
- Contribution wages = basic - unpaid leave + allowances marked "counts for EPF/SOCSO/EIS" (+ overtime only if a rate says `includeOvertime`).
- Net pay = gross - (employee EPF + SOCSO + EIS + PCB + other deductions). Employer contributions are reported separately.
- A missing or ineligible rate gives 0 with a warning on the payslip; the system never guesses.

## Rate tables (`payroll_rates`)

Rates are data. To change one, add a row with a new *effective from* date (or edit one) under **Statutory rates** (admin only). Each row has:

- a scheme (EPF/SOCSO/EIS employee or employer, PCB),
- eligibility (age range, citizenship),
- a rule: `percent` (rate, optional ceiling, optional round up to the ringgit), `tiered`, `bands` (wage band table, for example PCB) or `none`,
- a **verified** flag. Editing a rate clears it. Approval is refused while a run relies on an unverified rate.

### Seeded rates are NOT verified

The migration seeds starting rates from public guidance (EPF employee 11%, employer 13% up to RM5,000 wages else 12%; SOCSO 0.5% / 1.75% and EIS 0.2% / 0.2% with a RM6,000 wage ceiling; citizens and permanent residents under 60). They are all marked **unverified**. Check them against the official KWSP, PERKESO and LHDN tables before approving the first run. Published sources disagree on foreign workers and use banded tables, so foreign workers, people aged 60 and over, and PCB have no starting rows. Add them if they apply.

## Exports

From an approved or paid run: all payslips as one PDF, a payslip PDF per person (IC and bank account masked), a bank payment CSV, EPF / SOCSO / EIS / PCB schedules and a summary CSV. People with missing bank or statutory numbers are listed on screen. These are generic working files, **not** the official KWSP, PERKESO, LHDN or bank upload formats; map the columns into the layout the portal or bank asks for.

## Deploying

1. Apply `supabase/migrations/20261021140000_v20_payroll.sql`.
2. Deploy the `payroll` edge function (needs `ALLOWED_ORIGIN` set).
3. Run the Supabase security advisor.
4. Fill in each person's salary, citizenship, EPF / SOCSO / tax numbers and bank details under **Pay profiles**.
