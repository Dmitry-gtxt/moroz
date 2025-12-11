-- Remove the direct SELECT policy for performers on bookings table
-- They should only access data via secure_bookings view which masks sensitive data
DROP POLICY IF EXISTS "Performers can view their bookings basic info" ON public.bookings;

-- Note: Keep UPDATE policy so performers can change booking status
-- The secure_bookings view handles masked reading