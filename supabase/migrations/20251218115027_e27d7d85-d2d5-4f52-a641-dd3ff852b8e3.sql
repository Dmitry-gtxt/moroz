-- Allow support chats for all users (not just performers)
-- Add user_id column for customers who don't have performer profiles
ALTER TABLE public.support_chats 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Make performer_id nullable (for customers without performer profiles)
ALTER TABLE public.support_chats 
ALTER COLUMN performer_id DROP NOT NULL;

-- Add constraint: either performer_id OR user_id must be set
ALTER TABLE public.support_chats
ADD CONSTRAINT support_chats_has_owner 
CHECK (performer_id IS NOT NULL OR user_id IS NOT NULL);

-- Create unique constraint on user_id (one support chat per customer)
CREATE UNIQUE INDEX IF NOT EXISTS support_chats_user_id_unique 
ON public.support_chats(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies to allow customers to access their support chats
DROP POLICY IF EXISTS "Performers can view their own support chat" ON public.support_chats;
DROP POLICY IF EXISTS "Users can view their own support chat" ON public.support_chats;

CREATE POLICY "Users can view their own support chat" 
ON public.support_chats 
FOR SELECT 
USING (
  -- Admin can see all
  has_role(auth.uid(), 'admin')
  -- Performer can see their chat
  OR performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
  -- Customer can see their chat
  OR user_id = auth.uid()
);

-- Allow users to insert their own support chat
DROP POLICY IF EXISTS "Users can create their own support chat" ON public.support_chats;
CREATE POLICY "Users can create their own support chat" 
ON public.support_chats 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update support_messages policies to allow customers
DROP POLICY IF EXISTS "Users can view messages in their support chat" ON public.support_messages;
CREATE POLICY "Users can view messages in their support chat" 
ON public.support_messages 
FOR SELECT 
USING (
  chat_id IN (
    SELECT sc.id FROM support_chats sc
    WHERE has_role(auth.uid(), 'admin')
       OR sc.performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
       OR sc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their support chat" ON public.support_messages;
CREATE POLICY "Users can send messages to their support chat" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid()
  AND chat_id IN (
    SELECT sc.id FROM support_chats sc
    WHERE has_role(auth.uid(), 'admin')
       OR sc.performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
       OR sc.user_id = auth.uid()
  )
);