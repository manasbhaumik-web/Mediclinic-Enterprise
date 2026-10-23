-- v34: keep the plan details a doctor enters at sign-off (lab orders, referral, MC reason).
-- Until now only the flags (mc_days, requires_referral) were saved; the rest was dropped.

ALTER TABLE public.soap_notes
  ADD COLUMN IF NOT EXISTS mc_reason text,
  ADD COLUMN IF NOT EXISTS referral_hospital text,
  ADD COLUMN IF NOT EXISTS referral_department text,
  ADD COLUMN IF NOT EXISTS referral_reason text,
  ADD COLUMN IF NOT EXISTS lab_orders text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lab_reason text;

-- Patch the live function text so nothing else in it can drift; fail loudly if the expected text is absent.
DO $$
DECLARE
  d text := pg_get_functiondef('public.signoff_consultation(json,json,json)'::regprocedure);
  n text;
BEGIN
  n := replace(d,
    E'follow_up_weeks, mc_days, requires_referral, pharmacy_memo\n  )',
    E'follow_up_weeks, mc_days, requires_referral, pharmacy_memo,\n    mc_reason, referral_hospital, referral_department, referral_reason, lab_orders, lab_reason\n  )');
  IF n = d THEN RAISE EXCEPTION 'v34: insert column list not found'; END IF;
  d := n;

  n := replace(d,
    E'    soap_payload->>''pharmacy_memo''\n  )',
    E'    soap_payload->>''pharmacy_memo'',\n    NULLIF(soap_payload->>''mc_reason'', ''''),\n    NULLIF(soap_payload->>''referral_hospital'', ''''),\n    NULLIF(soap_payload->>''referral_department'', ''''),\n    NULLIF(soap_payload->>''referral_reason'', ''''),\n    CASE WHEN json_typeof(soap_payload->''lab_orders'') = ''array''\n      THEN ARRAY(SELECT json_array_elements_text(soap_payload->''lab_orders''))\n      ELSE ''{}''::text[] END,\n    NULLIF(soap_payload->>''lab_reason'', '''')\n  )');
  IF n = d THEN RAISE EXCEPTION 'v34: values list not found'; END IF;
  d := n;

  n := replace(d,
    E'pharmacy_memo = EXCLUDED.pharmacy_memo;',
    E'pharmacy_memo = EXCLUDED.pharmacy_memo,\n    mc_reason = EXCLUDED.mc_reason,\n    referral_hospital = EXCLUDED.referral_hospital,\n    referral_department = EXCLUDED.referral_department,\n    referral_reason = EXCLUDED.referral_reason,\n    lab_orders = EXCLUDED.lab_orders,\n    lab_reason = EXCLUDED.lab_reason;');
  IF n = d THEN RAISE EXCEPTION 'v34: conflict clause not found'; END IF;

  EXECUTE n;
END $$;
