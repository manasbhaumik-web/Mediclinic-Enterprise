-- v48: WhatsApp reminders to patients (appointment reminders, "results reviewed", follow-up due).
--
-- Nothing is sent until an administrator switches it on AND the WhatsApp provider keys are added to the
-- messages-worker function. Until then the plan still fills the queue so staff can see what would go out.
--
--   patient_message_settings  one row: the master switch, which messages, timing, quiet hours, template names.
--   message_opt_outs          phone numbers that must never be messaged (checked when queueing and again when sending).
--   message_outbox            one row per message: Queued > Sending > Sent / Failed, or Skipped / Cancelled.
--
-- Functions:
--   messages_plan     service role: queues what is due (appointments, reviewed results, follow-ups)
--   messages_claim    service role: hands the worker the messages to send now (respects quiet hours and opt-outs)
--   messages_report   service role: records how each send went, with a retry delay on temporary failures
--   messages_report_run  service role: records that the worker ran and whether the provider keys are present
--   patient_message_settings_save, message_opt_out_set, message_cancel, message_retry   staff, role-checked
--
-- Messages carry no clinical detail: a first name, a date and time, and a fixed template. Result values are never sent.

CREATE TABLE IF NOT EXISTS public.patient_message_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  appointment_enabled boolean NOT NULL DEFAULT true,
  appointment_hours integer[] NOT NULL DEFAULT '{24,2}',
  results_enabled boolean NOT NULL DEFAULT true,
  followup_enabled boolean NOT NULL DEFAULT true,
  followup_days_before integer NOT NULL DEFAULT 3 CHECK (followup_days_before BETWEEN 0 AND 30),
  template_appointment text NOT NULL DEFAULT 'appointment_reminder',
  template_results text NOT NULL DEFAULT 'results_ready',
  template_followup text NOT NULL DEFAULT 'followup_due',
  language_code text NOT NULL DEFAULT 'en',
  quiet_start time NOT NULL DEFAULT '21:00',
  quiet_end time NOT NULL DEFAULT '08:00',
  provider_configured boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.patient_message_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.message_opt_outs (
  phone text PRIMARY KEY CHECK (phone ~ '^60[1-9][0-9]{7,9}$'),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

CREATE TABLE IF NOT EXISTS public.message_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('appointment', 'results', 'followup')),
  subject_id text NOT NULL,
  variant text NOT NULL DEFAULT '1',
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  to_phone text,
  template text NOT NULL,
  params jsonb NOT NULL DEFAULT '[]',
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Sending', 'Sent', 'Failed', 'Skipped', 'Cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, subject_id, variant)
);
CREATE INDEX IF NOT EXISTS message_outbox_due_idx ON public.message_outbox (status, scheduled_for);

DROP TRIGGER IF EXISTS message_outbox_touch ON public.message_outbox;
CREATE TRIGGER message_outbox_touch BEFORE UPDATE ON public.message_outbox FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.patient_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read message settings" ON public.patient_message_settings;
CREATE POLICY "Admins can read message settings" ON public.patient_message_settings FOR SELECT USING (public.has_any_role(ARRAY['admin']));
DROP POLICY IF EXISTS "Admins and front desk can read opt-outs" ON public.message_opt_outs;
CREATE POLICY "Admins and front desk can read opt-outs" ON public.message_opt_outs FOR SELECT USING (public.has_any_role(ARRAY['admin', 'receptionist']));
DROP POLICY IF EXISTS "Admins can read the message log" ON public.message_outbox;
CREATE POLICY "Admins can read the message log" ON public.message_outbox FOR SELECT USING (public.has_any_role(ARRAY['admin']));

-- ---- phone numbers ------------------------------------------------------------------------------------------------

-- Malaysian mobile numbers in international form without the plus (60123456789), or NULL when it cannot be one.
CREATE OR REPLACE FUNCTION public.normalize_my_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE WHEN n ~ '^60[1-9][0-9]{7,9}$' THEN n ELSE NULL END
  FROM (
    SELECT CASE
      WHEN d = '' THEN ''
      WHEN d LIKE '60%' THEN d
      WHEN d LIKE '0%' THEN '60' || substr(d, 2)
      WHEN d LIKE '1%' THEN '60' || d
      ELSE d
    END AS n
    FROM (SELECT regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') AS d) x
  ) y;
$function$;

-- ---- planning --------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.messages_plan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  s patient_message_settings%ROWTYPE;
  v_appt int := 0;
  v_res int := 0;
  v_fu int := 0;
  v_today date := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date;
BEGIN
  SELECT * INTO s FROM patient_message_settings WHERE id = 1;
  IF NOT s.enabled THEN
    RETURN jsonb_build_object('enabled', false, 'queued', 0);
  END IF;

  IF s.appointment_enabled THEN
    WITH due AS (
      SELECT a.id, h, a.patient_id,
             public.normalize_my_phone(coalesce(nullif(btrim(a.patient_phone), ''), p.phone)) AS phone,
             split_part(btrim(coalesce(nullif(a.patient_name, ''), p.full_name, 'there')), ' ', 1) AS first_name,
             to_char(a.appointment_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'DD Mon YYYY') AS d,
             to_char(a.appointment_time AT TIME ZONE 'Asia/Kuala_Lumpur', 'HH12:MI AM') AS t,
             a.appointment_time - make_interval(hours => h) AS send_at
      FROM appointments a
      LEFT JOIN patients p ON p.id = a.patient_id
      CROSS JOIN unnest(s.appointment_hours) AS h
      WHERE a.status = 'Scheduled' AND a.appointment_time > now()
    ),
    ins AS (
      INSERT INTO message_outbox (kind, subject_id, variant, patient_id, to_phone, template, params, scheduled_for, status, last_error)
      SELECT 'appointment', due.id::text, due.h::text, due.patient_id, due.phone, s.template_appointment,
             jsonb_build_array(due.first_name, due.d, due.t), due.send_at,
             CASE WHEN due.phone IS NULL THEN 'Skipped' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = due.phone) THEN 'Skipped' ELSE 'Queued' END,
             CASE WHEN due.phone IS NULL THEN 'No valid mobile number' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = due.phone) THEN 'Opted out' END
      FROM due
      -- Plan a reminder only close to its time, and never for a window that has already passed by hours.
      WHERE due.send_at <= now() + interval '15 minutes' AND due.send_at > now() - interval '3 hours'
      ON CONFLICT (kind, subject_id, variant) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_appt FROM ins;
  END IF;

  IF s.results_enabled THEN
    WITH done AS (
      SELECT DISTINCT ON (i.visit_id) i.visit_id, i.patient_id
      FROM investigations i
      WHERE i.status = 'Reviewed' AND i.reviewed_at > now() - interval '24 hours'
        AND NOT EXISTS (SELECT 1 FROM investigations o WHERE o.visit_id = i.visit_id AND o.status IN ('Ordered', 'Collected', 'Resulted'))
      ORDER BY i.visit_id, i.reviewed_at DESC
    ),
    ins AS (
      INSERT INTO message_outbox (kind, subject_id, variant, patient_id, to_phone, template, params, scheduled_for, status, last_error)
      SELECT 'results', done.visit_id::text, '1', done.patient_id, ph.phone, s.template_results,
             jsonb_build_array(split_part(btrim(coalesce(p.full_name, 'there')), ' ', 1)), now(),
             CASE WHEN ph.phone IS NULL THEN 'Skipped' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = ph.phone) THEN 'Skipped' ELSE 'Queued' END,
             CASE WHEN ph.phone IS NULL THEN 'No valid mobile number' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = ph.phone) THEN 'Opted out' END
      FROM done JOIN patients p ON p.id = done.patient_id
      CROSS JOIN LATERAL (SELECT public.normalize_my_phone(p.phone) AS phone) ph
      ON CONFLICT (kind, subject_id, variant) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_res FROM ins;
  END IF;

  IF s.followup_enabled THEN
    WITH due AS (
      SELECT v.id AS visit_id, v.patient_id, p.full_name, p.phone,
             (v.signed_off_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date + sn.follow_up_weeks * 7 AS due_date
      FROM visits v
      JOIN soap_notes sn ON sn.visit_id = v.id
      JOIN patients p ON p.id = v.patient_id
      WHERE v.signed_off_at IS NOT NULL AND coalesce(sn.follow_up_weeks, 0) > 0
    ),
    ins AS (
      INSERT INTO message_outbox (kind, subject_id, variant, patient_id, to_phone, template, params, scheduled_for, status, last_error)
      SELECT 'followup', due.visit_id::text, '1', due.patient_id, ph.phone, s.template_followup,
             jsonb_build_array(split_part(btrim(coalesce(due.full_name, 'there')), ' ', 1), to_char(due.due_date, 'DD Mon YYYY')), now(),
             CASE WHEN ph.phone IS NULL THEN 'Skipped' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = ph.phone) THEN 'Skipped' ELSE 'Queued' END,
             CASE WHEN ph.phone IS NULL THEN 'No valid mobile number' WHEN EXISTS (SELECT 1 FROM message_opt_outs o WHERE o.phone = ph.phone) THEN 'Opted out' END
      FROM due
      CROSS JOIN LATERAL (SELECT public.normalize_my_phone(due.phone) AS phone) ph
      WHERE due.due_date - s.followup_days_before <= v_today AND due.due_date >= v_today
        -- Already back, or already booked: no reminder needed.
        AND NOT EXISTS (SELECT 1 FROM visits v2 WHERE v2.patient_id = due.patient_id AND v2.id <> due.visit_id AND v2.created_at > (SELECT signed_off_at FROM visits WHERE id = due.visit_id))
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = due.patient_id AND a.status = 'Scheduled' AND a.appointment_time > now())
      ON CONFLICT (kind, subject_id, variant) DO NOTHING
      RETURNING 1
    )
    SELECT count(*) INTO v_fu FROM ins;
  END IF;

  RETURN jsonb_build_object('enabled', true, 'queued', v_appt + v_res + v_fu, 'appointments', v_appt, 'results', v_res, 'followups', v_fu);
END;
$function$;

-- ---- sending -----------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.messages_claim(p_limit integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  s patient_message_settings%ROWTYPE;
  t time := (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::time;
  v_quiet boolean;
  v_rows jsonb;
BEGIN
  SELECT * INTO s FROM patient_message_settings WHERE id = 1;
  IF NOT s.enabled THEN
    RETURN '[]'::jsonb;
  END IF;
  v_quiet := CASE WHEN s.quiet_start > s.quiet_end THEN (t >= s.quiet_start OR t < s.quiet_end) ELSE (t >= s.quiet_start AND t < s.quiet_end) END;

  -- A send that never reported back (the worker stopped) goes back in the queue.
  UPDATE message_outbox SET status = 'Queued' WHERE status = 'Sending' AND updated_at < now() - interval '10 minutes';

  -- Opted out since it was queued: drop it.
  UPDATE message_outbox m SET status = 'Skipped', last_error = 'Opted out'
  WHERE m.status = 'Queued' AND m.to_phone IN (SELECT phone FROM message_opt_outs);

  IF v_quiet THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH picked AS (
    SELECT id FROM message_outbox
    WHERE status = 'Queued' AND scheduled_for <= now() AND to_phone IS NOT NULL
    ORDER BY scheduled_for
    LIMIT greatest(1, least(coalesce(p_limit, 25), 100))
    FOR UPDATE SKIP LOCKED
  ),
  upd AS (
    UPDATE message_outbox m SET status = 'Sending', attempts = m.attempts + 1
    FROM picked WHERE m.id = picked.id
    RETURNING m.id, m.to_phone, m.template, m.params
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'to_phone', to_phone, 'template', template, 'params', params, 'language', s.language_code)), '[]'::jsonb)
  INTO v_rows FROM upd;
  RETURN v_rows;
END;
$function$;

CREATE OR REPLACE FUNCTION public.messages_report(p_id uuid, p_ok boolean, p_provider_id text, p_error text, p_retry boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_attempts int;
BEGIN
  SELECT attempts INTO v_attempts FROM message_outbox WHERE id = p_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF p_ok THEN
    UPDATE message_outbox SET status = 'Sent', sent_at = now(), provider_message_id = left(p_provider_id, 200), last_error = NULL WHERE id = p_id;
  ELSIF coalesce(p_retry, false) AND v_attempts < 5 THEN
    UPDATE message_outbox SET status = 'Queued', last_error = left(coalesce(p_error, 'Temporary failure'), 300),
      scheduled_for = now() + make_interval(mins => least(60, v_attempts * v_attempts * 2)) WHERE id = p_id;
  ELSE
    UPDATE message_outbox SET status = 'Failed', last_error = left(coalesce(p_error, 'Failed'), 300) WHERE id = p_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.messages_report_run(p_configured boolean)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  UPDATE patient_message_settings SET last_run_at = now(), provider_configured = coalesce(p_configured, false) WHERE id = 1;
$function$;

REVOKE EXECUTE ON FUNCTION public.messages_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_claim(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_report(uuid, boolean, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_report_run(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.messages_plan() TO service_role;
GRANT EXECUTE ON FUNCTION public.messages_claim(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.messages_report(uuid, boolean, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.messages_report_run(boolean) TO service_role;

-- ---- administration ----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.patient_message_settings_save(p jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_hours int[];
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  IF p ? 'appointment_hours' THEN
    SELECT coalesce(array_agg(DISTINCT h ORDER BY h DESC), '{}') INTO v_hours FROM jsonb_array_elements_text(p->'appointment_hours') x, LATERAL (SELECT x::int AS h) y;
    IF EXISTS (SELECT 1 FROM unnest(v_hours) h WHERE h < 1 OR h > 168) THEN
      RAISE EXCEPTION 'Reminder times must be between 1 and 168 hours before the appointment.' USING ERRCODE = '22023';
    END IF;
  END IF;
  UPDATE patient_message_settings SET
    enabled = coalesce((p->>'enabled')::boolean, enabled),
    appointment_enabled = coalesce((p->>'appointment_enabled')::boolean, appointment_enabled),
    appointment_hours = coalesce(v_hours, appointment_hours),
    results_enabled = coalesce((p->>'results_enabled')::boolean, results_enabled),
    followup_enabled = coalesce((p->>'followup_enabled')::boolean, followup_enabled),
    followup_days_before = coalesce((p->>'followup_days_before')::int, followup_days_before),
    template_appointment = coalesce(nullif(btrim(p->>'template_appointment'), ''), template_appointment),
    template_results = coalesce(nullif(btrim(p->>'template_results'), ''), template_results),
    template_followup = coalesce(nullif(btrim(p->>'template_followup'), ''), template_followup),
    language_code = coalesce(nullif(btrim(p->>'language_code'), ''), language_code),
    quiet_start = coalesce((p->>'quiet_start')::time, quiet_start),
    quiet_end = coalesce((p->>'quiet_end')::time, quiet_end),
    updated_at = now()
  WHERE id = 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.message_opt_out_set(p_phone text, p_on boolean, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_phone text := public.normalize_my_phone(p_phone);
BEGIN
  PERFORM public.require_role(ARRAY['admin', 'receptionist']);
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'Enter a valid Malaysian mobile number.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(p_on, true) THEN
    INSERT INTO message_opt_outs (phone, reason) VALUES (v_phone, NULLIF(left(btrim(coalesce(p_reason, '')), 200), ''))
    ON CONFLICT (phone) DO UPDATE SET reason = EXCLUDED.reason;
    UPDATE message_outbox SET status = 'Skipped', last_error = 'Opted out' WHERE status = 'Queued' AND to_phone = v_phone;
  ELSE
    DELETE FROM message_opt_outs WHERE phone = v_phone;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.message_cancel(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  UPDATE message_outbox SET status = 'Cancelled' WHERE id = p_id AND status = 'Queued';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only a message that is still waiting can be cancelled.' USING ERRCODE = '42501';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.message_retry(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  UPDATE message_outbox SET status = 'Queued', attempts = 0, last_error = NULL, scheduled_for = now() WHERE id = p_id AND status = 'Failed';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only a failed message can be retried.' USING ERRCODE = '42501';
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.patient_message_settings_save(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.message_opt_out_set(text, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.message_cancel(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.message_retry(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patient_message_settings_save(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.message_opt_out_set(text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.message_cancel(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.message_retry(uuid) TO authenticated;
