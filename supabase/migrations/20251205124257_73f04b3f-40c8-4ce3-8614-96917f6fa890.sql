-- Fix RLS policies for chat_messages table
-- Simplify the logic and require explicit authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

-- Create a helper function to check if user is a participant in the booking
CREATE OR REPLACE FUNCTION public.is_booking_participant(_user_id uuid, _booking_id uuid)
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
      b.customer_id = _user_id
      OR EXISTS (
        SELECT 1 FROM performer_profiles p 
        WHERE p.id = b.performer_id AND p.user_id = _user_id
      )
    )
  )
$$;

-- Create simplified SELECT policy
-- Only direct participants can read messages: sender, booking customer, or booking performer
CREATE POLICY "Participants can view messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = sender_id 
  OR public.is_booking_participant(auth.uid(), booking_id)
);

-- Create INSERT policy with explicit auth
CREATE POLICY "Participants can send messages" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND public.is_booking_participant(auth.uid(), booking_id)
);

-- Add UPDATE policy for marking messages as read
CREATE POLICY "Recipients can mark messages as read" 
ON public.chat_messages 
FOR UPDATE 
TO authenticated
USING (
  public.is_booking_participant(auth.uid(), booking_id)
  AND auth.uid() != sender_id
)
WITH CHECK (
  public.is_booking_participant(auth.uid(), booking_id)
  AND auth.uid() != sender_id
);