-- v41: live sync, patient edits, and one open visit per patient.
--
--   1. Realtime. The app listens for changes to many tables, but only visits and appointments were published,
--      so everything else (new patients, prescriptions, payments, stock, staff, settings, audit trails) only
--      appeared after a manual refresh. Publish every table the app listens to. Row-level security still
--      decides who receives each change.
--   2. Patient edits. patients had no UPDATE rule for anyone, so an edit (an allergy added at triage, a phone
--      number corrected) changed 0 rows and the app reported success. Doctors, receptionists, clinic assistants
--      and administrators can now update a patient, the same people who can register one (plus the assistant,
--      who records allergies at triage).
--   3. One open visit. Only the booking check-in refused a second open visit for the same patient, so the
--      registry's "Create ticket" could queue someone twice. The database now refuses it.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients', 'prescriptions', 'soap_notes', 'transactions', 'clinic_settings', 'staff',
    'inventory', 'drug_batches', 'stock_movements',
    'inventory_events', 'hr_events', 'payroll_events', 'equipment_events', 'integration_events'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "Clinical staff can update patients" ON public.patients;
CREATE POLICY "Clinical staff can update patients"
  ON public.patients
  FOR UPDATE
  USING (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'admin']))
  WITH CHECK (public.has_any_role(ARRAY['doctor', 'receptionist', 'clinic-assistant', 'admin']));

CREATE UNIQUE INDEX IF NOT EXISTS visits_one_open_per_patient
  ON public.visits (patient_id)
  WHERE status NOT IN ('Paid', 'Cancelled');
