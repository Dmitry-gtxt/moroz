-- Create audit_logs table to track who accessed sensitive customer data
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs (via service role or edge function)
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Tracks sensitive data access for security compliance';