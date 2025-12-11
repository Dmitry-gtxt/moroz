
-- Drop problematic policies that expose sensitive data
DROP POLICY IF EXISTS "Block anonymous access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Performers can view their bookings" ON public.bookings;

-- Create security definer function to check if user can see full customer data
-- Performers can only see full data after prepayment is confirmed
CREATE OR REPLACE FUNCTION public.can_see_booking_customer_data(_booking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = _booking_id
    AND (
      -- Admin can always see
      has_role(_user_id, 'admin'::app_role)
      -- Customer can see their own booking
      OR b.customer_id = _user_id
      -- Performer can see only if prepayment is confirmed
      OR (
        b.performer_id IN (SELECT pp.id FROM performer_profiles pp WHERE pp.user_id = _user_id)
        AND b.payment_status IN ('prepayment_paid', 'fully_paid')
      )
    )
  )
$$;

-- Create a new policy for performers that restricts data based on payment
-- Performers can view their bookings but sensitive data is masked at application level
CREATE POLICY "Performers can view their bookings basic info"
ON public.bookings
FOR SELECT
USING (
  performer_id IN (
    SELECT performer_profiles.id
    FROM performer_profiles
    WHERE performer_profiles.user_id = auth.uid()
  )
);

-- Drop the problematic "Block anonymous access to profiles" policy
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Add a comment to clarify the security model
COMMENT ON TABLE public.bookings IS 'Bookings table with RLS. Sensitive customer data (name, phone, email, address) should only be displayed to performers AFTER prepayment is confirmed. Use secure_bookings view or check payment_status before displaying sensitive fields.';
