# Leave and attendance

Admin console > People > **Leave & Attendance** (HR and administrators), and **My Leave** in the top navigation for every signed-in role.

## Leave requests

1. An employee (or HR on their behalf) files a request: type, dates, optional half day, reason. The form shows the working days and whether the balance covers it before filing.
2. HR or an administrator approves or rejects it (a reason is required to reject). There is no manager hierarchy in the system, so "manager" means HR or an administrator.
3. Nobody approves their own leave while another admin or HR user exists. With a single approver, they can approve their own.
4. A pending request can be cancelled by the employee or HR. An approved one can only be cancelled by HR or an administrator, with a reason.

Rules enforced by the `leave` edge function and by database triggers (which apply to the service role too):

- dates, type and person of a request cannot change after filing; file a new one instead,
- decided requests are immutable except approved -> cancelled, and nothing can be deleted,
- overlapping pending/approved requests for one person are refused,
- employees can only file up to N days in the past (setting, default 30); HR can back-date further.

## Balances and entitlements

A balance is never stored. It is the entitlement for the calendar year minus approved days (pending days are also reserved when filing). Entitlements come from **rules** (`leave_rules`), edited and verified by an administrator, the same way as payroll rates:

- `fixed`: a set number of days; `service_tiers`: days by completed years of service; `unlimited`,
- eligibility by gender and minimum months of service, effective-from dates, priority, optional first-year proration,
- editing a rule clears its Verified flag. Requests still work with unverified rules but show a warning.

Service is measured at 1 January of the leave year. If a hire date is not set, the lowest tier is used and a warning is shown; service-based eligibility rules do not apply.

### Seeded rules are NOT verified

Entered from public guidance on the Employment Act 1955 as amended from 1 January 2023: annual leave 8 / 12 / 16 days (under 2 years / 2 to 5 / over 5), sick leave 14 / 18 / 22, hospitalisation 60 (separate from sick leave), maternity 98, paternity 7 (12 months of service). Check them against the statute and your contracts. The Act sets minimums only and may not cover every employee; the system does not check marital status, the confinement count or the "Act applies to this employee" threshold.

## Working week and public holidays

Settings hold the working weekdays (default Monday to Saturday), work start time, late grace and time zone. Public holidays are not pre-loaded because the dates change every year: enter them under Rules & setup. Leave is counted in working days (the working week minus public holidays). Keep the working days per month used in payroll consistent with this, because unpaid leave is deducted at the daily rate.

## Attendance

- Employees **clock in and out** on My Leave. The server's clock sets the time; clocking in after start + grace marks the day late. One clock-in per day.
- HR can record or correct any past day for anyone, with a required note. Corrections keep the previous entry in the history. Days covered by approved full-day leave cannot be given an attendance record.
- **Rate = days attended / days recorded**, calculated for any period. Approved leave and public holidays are excluded; half days count 0.5. Days with no record are shown as *unrecorded* and do not count for or against the person, so missing data does not distort the rate.

## Payroll

When a payroll run is created or recalculated, the unpaid days from **approved unpaid leave** that fall inside the month are added to the payslip automatically (shown on the payslip, kept in `payslips.leave_unpaid_days`). The manual field is now "extra unpaid days not recorded as leave". If leave is approved after a run was calculated, approval of that run is refused as stale until it is recalculated. Leave approved or cancelled for a month whose payroll is already approved or paid is not applied there; the approver is warned and it must be adjusted in the next run.

## History

`hr_events` is append-only (a trigger blocks update and delete). It records every request action, clock-in/out, attendance entry/correction/removal, and every change an administrator makes to rules, types, holidays and settings (with before and after values).

## Deploying

1. Apply `supabase/migrations/20261021150000_v21_leave_attendance.sql`.
2. Deploy the `leave` edge function (needs `ALLOWED_ORIGIN`) and redeploy `payroll`.
3. Run the security advisor.
4. Enter hire dates (Balances tab), the year's public holidays, and verify the entitlement rules.
5. Employees need their login linked to a staff record (done by staff onboarding) to use My Leave.
