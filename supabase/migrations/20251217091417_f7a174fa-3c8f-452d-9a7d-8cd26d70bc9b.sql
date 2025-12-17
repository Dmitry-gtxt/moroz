-- Create SMS logs table
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  reference TEXT,
  request_payload JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  success BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view SMS logs
CREATE POLICY "Admins can view SMS logs"
ON public.sms_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert SMS logs"
ON public.sms_logs
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_sms_logs_created_at ON public.sms_logs(created_at DESC);
CREATE INDEX idx_sms_logs_phone ON public.sms_logs(phone);