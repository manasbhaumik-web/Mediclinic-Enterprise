-- v16: Address Supabase security advisor warnings.
--
-- * Pin search_path on functions that had a role-mutable one.
-- * match_clinical_embeddings is SECURITY DEFINER and read clinical content for anyone, including
--   signed-out callers: restrict it to signed-in users.
--
-- Not changed on purpose: get_user_role() stays executable by anon. Several RLS policies call it without
-- a TO clause, so revoking EXECUTE would turn signed-out reads from "no rows" into permission errors.
-- It returns NULL for signed-out callers and exposes nothing.
--
-- Dashboard setting (not SQL): enable "Leaked password protection" under Authentication > Policies.

ALTER FUNCTION public.get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.match_clinical_embeddings(public.vector, double precision, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.visit_local_date(public.visits) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.match_clinical_embeddings(public.vector, double precision, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_clinical_embeddings(public.vector, double precision, integer) TO authenticated;
