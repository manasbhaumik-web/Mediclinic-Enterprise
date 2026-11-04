-- v42: keep visits.updated_at current, and limit who can change appointments.
--
--   1. visits.updated_at only moved when something set it by hand (billing did; calling, holding or triage
--      did not), so a visit that was called today still showed the date it was registered. A trigger now
--      sets it on every update.
--   2. appointments let any signed-in user insert, change and delete rows, including a pharmacist or cashier.
--      Writing is now limited to the roles that manage the calendar (receptionist, doctor, admin). Reading is
--      unchanged. Online bookings and check-in go through functions that already require one of those roles
--      or run as the owner, so they keep working.

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS visits_touch_updated_at ON public.visits;
CREATE TRIGGER visits_touch_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Allow authenticated users to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to delete appointments" ON public.appointments;

CREATE POLICY "Front desk and doctors can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['receptionist', 'doctor', 'admin']));

CREATE POLICY "Front desk and doctors can update appointments"
  ON public.appointments FOR UPDATE
  USING (public.has_any_role(ARRAY['receptionist', 'doctor', 'admin']))
  WITH CHECK (public.has_any_role(ARRAY['receptionist', 'doctor', 'admin']));

CREATE POLICY "Front desk and doctors can delete appointments"
  ON public.appointments FOR DELETE
  USING (public.has_any_role(ARRAY['receptionist', 'doctor', 'admin']));
