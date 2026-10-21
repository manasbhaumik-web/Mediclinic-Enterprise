# Staff onboarding and system access

Admin console → People → Staff Directory. Available to `admin` and `hr`.

## What happens when you create a staff member
1. Fill in the staff form. Section **6. System Access** has an **Access role** list:
   - **No system access**: only the staff record is saved.
   - **Doctor / Pharmacist / Clinic assistant / Administrator / HR manager**: a login is created and an **invitation email** is sent to the staff member's address.
2. The staff member opens the link, **chooses their own password** (at least 10 characters, with upper-case, lower-case and a number) on the *Set your password* page, then signs in. **No password is ever generated, emailed or visible to the person who created the account.**
3. Their access follows the role:
   - the **profile role** controls which pages open (route guards) and what the database allows (row-level security);
   - the form shows a preview of exactly which pages and abilities the chosen role gets.

A job-title suggestion appears (for example *Physician* → Doctor) but is never applied automatically; Administrator and HR are never suggested.

## Who can grant what
| Caller | May grant | May manage existing access of |
| --- | --- | --- |
| Administrator | any role | anyone (but not their own account) |
| HR manager | Doctor, Pharmacist, Clinic assistant | people with no access or a non-admin / non-HR role |
| Everyone else | nothing | nobody |

Rules are enforced on the server (`staff-onboard` function), not just hidden in the form. Also enforced:
- nobody can change or revoke **their own** access;
- the **last administrator** cannot be demoted or revoked;
- access columns on `staff` (`auth_id`, `system_role`, `invited_at`) can only be changed by the function, so editing the table directly cannot grant a role;
- deleting a staff record that still has a login is blocked until access is revoked.

## The Access column
For each person: **No system access / Invited / Has access / Access revoked**, with actions:
- no login: pick a role and **Invite**
- invited: **Resend invite** (replaces the pending invitation)
- active: **Send password reset**
- any login: change role, **Revoke** (blocks sign-in, keeps the record) or **Restore access**
- Suspending a staff member also revokes their login; reactivating restores it.

## No duplicate staff records
A person can only exist once in the directory.
- **Refused outright:** the same **email** (capitals and spaces ignored) or the same **ID number** (NRIC or passport; dashes and spaces ignored). "A@x.my" and "a@x.my" are the same email; "900101-14-5555" and "900101145555" are the same NRIC.
- **Needs confirmation:** the same **name and date of birth**. Two different people can occasionally share both, so you are asked "Add anyway?" instead of being blocked.
- Checked in three places: the staff form (instantly, before anything is sent), the server function (authoritative), and the database itself (unique indexes, so even two people saving at the same moment cannot create a duplicate).
- Editing a record cannot give it another person's email or ID number.
- **CSV import** skips any row that duplicates someone already in the directory **or an earlier row in the same file**, and the preview says why ("same email", "same ID number", "same name and date of birth").
- Records with no ID number recorded are not compared on ID, so blanks never count as duplicates of each other.

## CSV import
People → Staff Directory → **Import Staff CSV**: choose a `.csv`, review the preview (ready / duplicate emails skipped / rows with problems), then import.
- Template and sample: the dialog has a template download; `docs/sample-data/staff_import.csv` is a full 15-person sample.
- Columns: `name, email, department, role, status, gender, dob, icNumber, phone, salaryBase` (common alternative header names are accepted; `name`, `email`, `role` are required).
- **Imports create staff records only.** No logins or emails are created, so nobody gets access just by appearing in a spreadsheet; grant access per person afterwards.

## One-time setup
1. **Apply** `supabase/migrations/20261021120000_v18_staff_access.sql` and then `20261021130000_v19_staff_no_duplicates.sql` (case-insensitive unique email and unique ID number) (fixes the staff table to match the app: renames `full_name` to `name`, drops the job-title check, adds the HR/payroll and access columns).
2. **Deploy** the function: `supabase functions deploy staff-onboard`.
3. **Supabase Auth settings** (dashboard → Authentication → URL Configuration):
   - **Site URL**: your app address.
   - **Redirect URLs**: add `<your app>/set-password` (for local testing `http://localhost:3000/set-password`). Without this the invitation link will not return to the app.
4. **Email**: Supabase's built-in email sender is for testing and is limited to a few emails per hour. For real onboarding, configure your own SMTP (Authentication → SMTP Settings) and, if you like, edit the *Invite user* email template.
5. Secrets (same as the other functions): `ALLOWED_ORIGIN`; optional `SITE_URL` (otherwise the first `ALLOWED_ORIGIN` is used for the invitation link).

## Not built yet
Bulk invitations, an access-change audit screen (events are recorded in `integration_events` with staff ids only), custom per-person permissions beyond the five roles, and mandatory two-factor sign-in.
