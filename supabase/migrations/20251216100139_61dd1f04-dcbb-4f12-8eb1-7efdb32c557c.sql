-- Add new booking statuses to enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'counter_proposed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'customer_accepted';

-- Add payment deadline and proposal message to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proposal_message TEXT;

-- Create proposals table for alternative time slots
CREATE TABLE public.booking_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.availability_slots(id),
  proposed_date DATE NOT NULL,
  proposed_time TEXT NOT NULL,
  proposed_price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.booking_proposals ENABLE ROW LEVEL SECURITY;

-- Require authentication
CREATE POLICY "Require auth for proposals"
ON public.booking_proposals FOR ALL
USING (auth.uid() IS NOT NULL);

-- Booking participants can view proposals
CREATE POLICY "Participants can view proposals"
ON public.booking_proposals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_id 
    AND (
      b.customer_id = auth.uid() 
      OR b.performer_id IN (SELECT pp.id FROM performer_profiles pp WHERE pp.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
    )
  )
);

-- Performers can create proposals for their bookings
CREATE POLICY "Performers can create proposals"
ON public.booking_proposals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_id 
    AND b.performer_id IN (SELECT pp.id FROM performer_profiles pp WHERE pp.user_id = auth.uid())
  )
);

-- Customers can update proposal status (accept/reject)
CREATE POLICY "Customers can update proposals"
ON public.booking_proposals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = booking_id 
    AND b.customer_id = auth.uid()
  )
);

-- Index for faster queries
CREATE INDEX idx_booking_proposals_booking_id ON public.booking_proposals(booking_id);
CREATE INDEX idx_booking_proposals_status ON public.booking_proposals(status);