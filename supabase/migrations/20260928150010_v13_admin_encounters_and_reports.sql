-- v13: Admin encounter history and aggregate clinical reports.
--
-- Access model: admins see per-patient ENCOUNTERS (date, status, diagnosis code,
-- billing) but never clinical notes, vitals or prescription details. Clinical
-- reports are aggregates computed here, so admins do not need read access to
-- soap_notes or prescriptions. Every function checks the caller's role itself
-- because SECURITY DEFINER bypasses RLS.

CREATE OR REPLACE FUNCTION public.require_role(allowed text[])
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.get_user_role() IS NULL OR NOT (public.get_user_role() = ANY (allowed)) THEN
    RAISE EXCEPTION 'Not authorised for this report' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Clinic-local calendar date of a visit.
CREATE OR REPLACE FUNCTION public.visit_local_date(v visits)
RETURNS date
LANGUAGE sql
STABLE
AS $$ SELECT (coalesce(v.visit_date, v.created_at) AT TIME ZONE 'Asia/Kuala_Lumpur')::date $$;

-- 1. Per-patient encounter history (no notes, vitals or drug names).
CREATE OR REPLACE FUNCTION public.admin_patient_encounters(p_patient_id uuid)
RETURNS TABLE (
  visit_id uuid,
  visit_date timestamptz,
  status text,
  icd_code text,
  diagnosis text,
  total_bill numeric,
  panel_claimed numeric,
  paid_amount numeric,
  payment_method text,
  gl_number text,
  mc_issued boolean,
  mc_days integer,
  requires_referral boolean,
  prescription_items integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT v.id, coalesce(v.visit_date, v.created_at), v.status,
         nullif(s.icd_code, 'N/A'), nullif(s.description, 'N/A'),
         v.total_bill, v.panel_claimed, v.paid_amount, v.payment_method, v.gl_number,
         v.mc_issued, s.mc_days, s.requires_referral,
         (SELECT count(*)::int FROM prescriptions p WHERE p.visit_id = v.id)
  FROM visits v
  LEFT JOIN soap_notes s ON s.visit_id = v.id
  WHERE v.patient_id = p_patient_id
  ORDER BY coalesce(v.visit_date, v.created_at) DESC;
END;
$$;

-- 2. Visit volume per day, including days with no visits.
CREATE OR REPLACE FUNCTION public.report_visit_volume(p_from date, p_to date)
RETURNS TABLE (day date, total integer, completed integer, cancelled integer, in_progress integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  WITH in_range AS (
    SELECT public.visit_local_date(v) AS local_day, v.status
    FROM visits v
    WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
  )
  SELECT d::date,
         count(r.local_day)::int,
         count(r.local_day) FILTER (WHERE r.status = 'Paid')::int,
         count(r.local_day) FILTER (WHERE r.status = 'Cancelled')::int,
         count(r.local_day) FILTER (WHERE r.status NOT IN ('Paid', 'Cancelled'))::int
  FROM generate_series(p_from, p_to, interval '1 day') AS d
  LEFT JOIN in_range r ON r.local_day = d::date
  GROUP BY d
  ORDER BY d;
END;
$$;

-- 3. Most frequent diagnoses among signed-off visits.
CREATE OR REPLACE FUNCTION public.report_top_diagnoses(p_from date, p_to date, p_limit integer DEFAULT 10)
RETURNS TABLE (icd_code text, diagnosis text, visits integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT s.icd_code, max(s.description), count(*)::int
  FROM visits v
  JOIN soap_notes s ON s.visit_id = v.id
  WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
    AND v.status <> 'Cancelled'
    AND coalesce(nullif(s.icd_code, ''), 'N/A') <> 'N/A'
  GROUP BY s.icd_code
  ORDER BY count(*) DESC, s.icd_code
  LIMIT p_limit;
END;
$$;

-- 4. Notifiable conditions reference list, maintained by admins.
CREATE TABLE IF NOT EXISTS notifiable_conditions (
  icd_prefix TEXT PRIMARY KEY,
  condition TEXT NOT NULL
);
ALTER TABLE notifiable_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All staff can read notifiable conditions" ON notifiable_conditions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage notifiable conditions" ON notifiable_conditions
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- Starting list drawn from the Prevention and Control of Infectious Diseases Act 1988
-- (Act 342) schedule. The clinic must verify it against the current MOH list.
INSERT INTO notifiable_conditions (icd_prefix, condition) VALUES
  ('A90', 'Dengue fever'), ('A91', 'Dengue haemorrhagic fever'), ('A97', 'Dengue'),
  ('A00', 'Cholera'), ('A01', 'Typhoid / paratyphoid fever'), ('A05', 'Food poisoning'),
  ('A15', 'Tuberculosis'), ('A16', 'Tuberculosis'), ('A17', 'Tuberculosis'), ('A18', 'Tuberculosis'), ('A19', 'Tuberculosis'),
  ('A27', 'Leptospirosis'), ('A36', 'Diphtheria'), ('A37', 'Pertussis'), ('A80', 'Acute poliomyelitis'),
  ('A82', 'Rabies'), ('B05', 'Measles'), ('B08.4', 'Hand, foot and mouth disease'),
  ('B15', 'Hepatitis A'), ('B16', 'Hepatitis B (acute)'), ('B17.1', 'Hepatitis C (acute)'),
  ('B50', 'Malaria'), ('B51', 'Malaria'), ('B52', 'Malaria'), ('B53', 'Malaria'), ('B54', 'Malaria'),
  ('U07.1', 'COVID-19')
ON CONFLICT (icd_prefix) DO NOTHING;

-- 5. Weekly case counts of notifiable conditions.
CREATE OR REPLACE FUNCTION public.report_disease_surveillance(p_from date, p_to date)
RETURNS TABLE (week_start date, condition text, icd_code text, cases integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT date_trunc('week', public.visit_local_date(v))::date, nc.condition, s.icd_code, count(*)::int
  FROM visits v
  JOIN soap_notes s ON s.visit_id = v.id
  JOIN LATERAL (
    -- Longest matching prefix wins (e.g. B08.4 over a hypothetical B08).
    SELECT n.condition FROM notifiable_conditions n
    WHERE upper(s.icd_code) LIKE upper(n.icd_prefix) || '%'
    ORDER BY length(n.icd_prefix) DESC
    LIMIT 1
  ) nc ON true
  WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
    AND v.status <> 'Cancelled'
  GROUP BY 1, 2, 3
  ORDER BY 1, 2, 3;
END;
$$;

-- 6. Prescribing summary. Controlled status comes from the inventory catalogue.
CREATE OR REPLACE FUNCTION public.report_prescribing(p_from date, p_to date, p_limit integer DEFAULT 20)
RETURNS TABLE (drug_name text, prescriptions integer, total_quantity integer, is_controlled boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT p.drug_name, count(*)::int, sum(p.quantity)::int,
         bool_or(coalesce(i.is_controlled_drug, false))
  FROM prescriptions p
  JOIN visits v ON v.id = p.visit_id
  LEFT JOIN inventory i ON lower(i.drug_name) = lower(p.drug_name)
  WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
    AND v.status <> 'Cancelled'
  GROUP BY p.drug_name
  ORDER BY sum(p.quantity) DESC, p.drug_name
  LIMIT p_limit;
END;
$$;

-- Only signed-in users may call these; the role check inside each restricts to admins.
REVOKE ALL ON FUNCTION public.require_role(text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_patient_encounters(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_visit_volume(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_top_diagnoses(date, date, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_disease_surveillance(date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_prescribing(date, date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_patient_encounters(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_visit_volume(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_top_diagnoses(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_disease_surveillance(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_prescribing(date, date, integer) TO authenticated;
