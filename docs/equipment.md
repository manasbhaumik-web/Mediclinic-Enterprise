# Equipment & Assets

Admin console > **Equipment & Assets**. Three tabs: Register, Due & alerts, History.

## How it works

- **The register** holds one record per device: asset tag (automatic if left blank), name, category, model, manufacturer, supplier, serial number, purchase date and cost, warranty end, useful life and salvage value (for depreciation), location, custodian, risk class, service interval, whether it needs calibration and how often, and the safety certificate.
- **Nobody writes equipment from the browser.** There are no client write rules on the tables. Every change goes through a database function (`eq_save`, `eq_record_service`, `eq_report_fault`, `eq_set_status`, `eq_move`, `eq_decommission`, `eq_restore`) that checks the caller's role and writes the history in the same transaction.
- **Who can do what:** administrators register, edit, record work, change status, move and decommission. Any signed-in staff member can *report a fault*, which flags the device for maintenance but does not stop it being used.

## Service records

Service, calibration, safety inspection and repair are recorded with the date done, who did it (technician or vendor), the outcome (pass, conditional, fail), findings, cost and, for a calibration, the certificate number. Rules enforced by the database:

- the date cannot be in the future or before the purchase date; findings are required unless the result is a clean pass; a calibration needs a certificate number and the device must be set up for calibration;
- a **pass** sets the last-done date and moves the next due date (from the entered date, or last done + interval);
- a **fail** takes the device **out of service** and does not move any due date;
- a passing service, repair or calibration brings a flagged or out-of-service device back to Operational.

These records are the only way the "last done" and "next due" dates change.

## Alerts

Driven by each device's own dates and a clinic-wide "due soon" window (default 30 days, administrator can change it): out of service, flagged for maintenance, service overdue or due soon, calibration overdue, due soon or never recorded, safety certificate expired or expiring, warranty ending, and devices with no service date. Overdue service on a high-risk device is critical. Decommissioned devices never alert.

## Decommission instead of delete

Deleting is blocked by the database. A device is *decommissioned* with a reason and a method (disposed, sold, donated, scrapped, returned to vendor, lost). It leaves the active register and stops alerting; its history stays. *Restore* brings it back as **Out of service**, so it must pass a service or repair before use.

## History

`equipment_events` records every registration, edit, service, calibration, inspection, repair, fault, status change, move, decommissioning and restore, with who recorded it. It is append-only: a trigger blocks update and delete, including for the service role. The old `equipment_logs` table is kept for reading and can no longer change; its rows were copied into the new history.

## Depreciation

Not stored. Book value is calculated straight-line from cost, purchase date, useful life and salvage value, and never falls below the salvage value. The Reports page's book-value card reads the register; it shows "not valued" for items missing those inputs.

## Deploying

1. Apply `supabase/migrations/20261021170000_v23_equipment_assets.sql`. The 5 existing devices get tags (EQ-0001 to EQ-0005) and keep their status and next service date.
2. Deploy the front end. No edge function is involved.
3. Run the security advisor. Expect the `eq_*` functions under "signed-in users can execute SECURITY DEFINER functions": each checks the caller's role itself.
4. Fill in the missing details on the existing devices (model, cost, purchase date, useful life, intervals, location, custodian, calibration).

## Limits

- No barcode or QR scanning, no stock of spare parts, no work-order assignment or approval step, no document uploads (certificates are recorded by number only).
- Depreciation is straight-line only.
- Location and custodian are free text, not linked to the staff list or room list.
- The screens have not been tried in a browser against the live database.
