-- Add policy for performers to view their assigned bookings
CREATE POLICY "Performers can view assigned bookings"
ON public.bookings
FOR SELECT
USING (
  performer_id IN (
    SELECT id FROM performer_profiles WHERE user_id = auth.uid()
  )
);