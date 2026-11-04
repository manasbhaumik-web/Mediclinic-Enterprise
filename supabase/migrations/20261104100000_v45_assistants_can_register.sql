-- v45: clinic assistants can register walk-in patients.
--
-- The app lets the clinic-assistant role open Patient registration (src/modules/appModules.ts), but the database only
-- accepted new patients and visits from doctors, receptionists and admins, so the form failed for an assistant who did
-- not also hold the receptionist role. Assistants may now create patients and visits. Everything else is unchanged:
-- the ticket, the one open visit per patient rule and the status guard still apply, and an assistant already had
-- permission to write the intake note.

DROP POLICY IF EXISTS "Doctors and receptionists can insert patients" ON public.patients;
CREATE POLICY "Front desk, assistants and doctors can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'admin']));

DROP POLICY IF EXISTS "Receptionists and doctors can insert visits" ON public.visits;
CREATE POLICY "Front desk, assistants and doctors can insert visits"
  ON public.visits FOR INSERT
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'admin']));
