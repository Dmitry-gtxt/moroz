-- Support chat table (separate from booking chats)
CREATE TABLE public.support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID NOT NULL REFERENCES public.performer_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(performer_id)
);

-- Support chat messages
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('performer', 'admin')),
  text TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_chats
CREATE POLICY "Performers can view own support chat" ON public.support_chats
  FOR SELECT USING (
    performer_id IN (SELECT id FROM performer_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all support chats" ON public.support_chats
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create support chats" ON public.support_chats
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policies for support_messages
CREATE POLICY "Performers can view own chat messages" ON public.support_messages
  FOR SELECT USING (
    chat_id IN (
      SELECT sc.id FROM support_chats sc
      JOIN performer_profiles pp ON pp.id = sc.performer_id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all support messages" ON public.support_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Performers can send messages to own chat" ON public.support_messages
  FOR INSERT WITH CHECK (
    sender_type = 'performer' AND
    chat_id IN (
      SELECT sc.id FROM support_chats sc
      JOIN performer_profiles pp ON pp.id = sc.performer_id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') AND sender_type = 'admin'
  );

CREATE POLICY "Users can mark messages as read" ON public.support_messages
  FOR UPDATE USING (
    chat_id IN (
      SELECT sc.id FROM support_chats sc
      JOIN performer_profiles pp ON pp.id = sc.performer_id
      WHERE pp.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin')
  );

-- Trigger for auto-creating support chat when performer is created
CREATE OR REPLACE FUNCTION public.create_support_chat_for_performer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.support_chats (performer_id)
  VALUES (NEW.id)
  ON CONFLICT (performer_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_performer_created_create_support_chat
  AFTER INSERT ON public.performer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_support_chat_for_performer();

-- Create support chats for existing performers
INSERT INTO public.support_chats (performer_id)
SELECT id FROM public.performer_profiles
ON CONFLICT (performer_id) DO NOTHING;

-- Update trigger
CREATE TRIGGER update_support_chats_updated_at
  BEFORE UPDATE ON public.support_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();