-- v40: the cashier can read the prescriptions of a visit that is at billing.
--
-- The bill's medication cost is built from the prescriptions attached to the visit. Only doctors and
-- pharmacists could read them, so for a cashier the list came back empty and the invoice left the
-- medicines out. A cashier may now read a visit's prescriptions while it is awaiting billing or once it is
-- paid (for the receipt). Nothing else changes: no other role gains access, and the cashier still cannot
-- write to prescriptions or read them for a visit that is not at billing.

DROP POLICY IF EXISTS "Cashier can read prescriptions of visits at billing" ON public.prescriptions;
CREATE POLICY "Cashier can read prescriptions of visits at billing"
  ON public.prescriptions
  FOR SELECT
  USING (
    public.has_any_role(ARRAY['cashier'])
    AND EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = prescriptions.visit_id
        AND v.status IN ('Awaiting Billing', 'Paid')
    )
  );
