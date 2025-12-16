-- Allow performers to delete their own proposals
CREATE POLICY "Performers can delete proposals"
ON public.booking_proposals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_proposals.booking_id
    AND b.performer_id IN (
      SELECT pp.id FROM performer_profiles pp WHERE pp.user_id = auth.uid()
    )
  )
);