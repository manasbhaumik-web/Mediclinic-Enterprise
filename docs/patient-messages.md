# Patient messages (WhatsApp)

Administration > Clinical Ops > **Patient Messages**. Admin only.

## What is sent
| Message | When | Parameters |
| --- | --- | --- |
| Appointment reminder | The hours you set before a booked appointment (default 24 and 2) | first name, date, time |
| Results reviewed | Once the doctor has reviewed **all** of a visit's lab and imaging results | first name |
| Follow-up due | The set number of days before the follow-up date the doctor chose (default 3) | first name, date |

- **No clinical detail is ever sent**: no result values, diagnoses or medicines. Only a first name and a date or time.
- Nothing is sent until an administrator ticks **Send patient messages**. While it is off nothing is queued either.
- Nothing is sent during **quiet hours** (default 21:00 to 08:00, Malaysia time). Messages wait until the morning.
- A number on the **opt-out list** is never messaged, whether it was queued before or after.
- A follow-up reminder is skipped if the patient has already come back or has a booking.
- Numbers are read as Malaysian mobiles (`012-345 6789`, `+60 12-345 6789` and `60123456789` are the same). Anything else is logged as skipped.

## One-time setup
1. **Apply** `supabase/migrations/20261119140000_v48_patient_messages.sql`.
2. **WhatsApp Business API**: use a Meta (Cloud API) account with a business phone number. In WhatsApp Manager create three **message templates** (category *Utility*) and wait for approval. Suggested wording, with the placeholders in this order:
   - `appointment_reminder`: *Hello {{1}}, this is a reminder of your appointment at our clinic on {{2}} at {{3}}. To change or cancel, please call the clinic.*
   - `results_ready`: *Hello {{1}}, your doctor has reviewed your test results. Please contact the clinic to discuss them. Results are never sent by message.*
   - `followup_due`: *Hello {{1}}, your doctor advised a follow-up visit around {{2}}. Please call the clinic to book an appointment.*
   If you use different names or another language, set them on the Patient Messages page (the language code must match the template's).
3. **Deploy** the function: `supabase functions deploy messages-worker --no-verify-jwt`.
4. **Secrets** (Supabase dashboard > Edge Functions > Secrets, or `supabase secrets set`):
   - `MESSAGES_WORKER_SECRET`: a long random string you make up.
   - `WHATSAPP_PHONE_NUMBER_ID`: from WhatsApp Manager.
   - `WHATSAPP_ACCESS_TOKEN`: a permanent system-user token with the `whatsapp_business_messaging` permission.
   The keys are never stored in the database or shown in the app. Until both WhatsApp keys exist the page says "not set up yet" and messages stay queued.
5. **Schedule the worker** every 5 minutes (enable the `pg_cron` and `pg_net` extensions first), in the SQL editor:
   ```sql
   select cron.schedule('messages-worker', '*/5 * * * *', $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/messages-worker',
       headers := jsonb_build_object('x-worker-secret', '<MESSAGES_WORKER_SECRET>', 'Content-Type', 'application/json')
     );
   $$);
   ```
6. Open the Patient Messages page: both status lines should be green after the first run. Tick **Send patient messages** and save.

## Checking it
- The **message log** shows each message, when it is due or was sent, how many attempts, and any error.
- A temporary problem (rate limit, provider outage, expired token) is retried after 2, 8, 18 and 32 minutes, then marked **Failed**. **Retry** puts a failed message back in the queue; **Cancel** drops one that is still waiting.
- A message the provider rejects (wrong number, template not approved) is marked **Failed** straight away with the provider's reason.

## Privacy
Patients should be told at registration that the clinic sends appointment and follow-up reminders by WhatsApp, and how to opt out. Add a number to the opt-out list when a patient asks (front desk and administrators can do this).
Handling a patient replying "STOP" is not built: replies arrive in WhatsApp, not in this app.
