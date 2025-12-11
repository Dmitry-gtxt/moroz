-- Table for storing push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Service role can read all for sending notifications
CREATE POLICY "Service can read all subscriptions"
ON public.push_subscriptions FOR SELECT
USING (true);

-- Add admin_phone to platform_settings if not exists
INSERT INTO public.platform_settings (key, value, description)
VALUES ('admin_phone', '+7(995)3829736', 'Телефон администратора для уведомлений')
ON CONFLICT (key) DO NOTHING;

-- Create notification_queue table for scheduled reminders
CREATE TABLE public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access queue
CREATE POLICY "Admin can view queue"
ON public.notification_queue FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient querying
CREATE INDEX idx_notification_queue_scheduled ON public.notification_queue(scheduled_for) WHERE sent_at IS NULL;