-- v44: close two functions that anyone, signed in or not, could call through the API.
--
--   assign_visit_ticket()  is a trigger function. It runs when a visit is created and is never called directly,
--                          so nobody needs permission to execute it.
--   get_user_role()        tells a signed-in user their own role. Visitors who are not signed in have no role,
--                          so only signed-in users keep access.
--
-- The online booking functions (public_book_appointment, public_booking_slots, public_booking_doctors,
-- public_cancel_booking) stay open to visitors on purpose: they power the public booking page.

REVOKE EXECUTE ON FUNCTION public.assign_visit_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
