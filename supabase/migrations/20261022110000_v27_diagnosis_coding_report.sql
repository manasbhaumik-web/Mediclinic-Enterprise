-- v27: Diagnosis coding completeness for the compliance page.
--
-- Same access model as v13: administrators never read clinical notes, so this returns only two counts
-- for the period: visits whose consultation has finished, and how many of those carry a real ICD-10 code.

CREATE OR REPLACE FUNCTION public.report_diagnosis_coding(p_from date, p_to date)
RETURNS TABLE (consulted integer, coded integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.require_role(ARRAY['admin']);
  RETURN QUERY
  SELECT count(*)::int,
         (count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM soap_notes s
            WHERE s.visit_id = v.id AND upper(coalesce(nullif(btrim(s.icd_code), ''), 'N/A')) <> 'N/A'
         )))::int
  FROM visits v
  WHERE public.visit_local_date(v) BETWEEN p_from AND p_to
    AND v.status IN ('Awaiting Dispensation', 'Dispensing', 'Awaiting Billing', 'Paid');
END;
$$;

REVOKE ALL ON FUNCTION public.report_diagnosis_coding(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_diagnosis_coding(date, date) TO authenticated;
