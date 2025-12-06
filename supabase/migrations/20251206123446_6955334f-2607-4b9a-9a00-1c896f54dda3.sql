-- Create platform settings table for admin-configurable values
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Settings are publicly readable"
ON public.platform_settings
FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can insert settings"
ON public.platform_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default commission rate
INSERT INTO public.platform_settings (key, value, description)
VALUES ('commission_rate', '40', 'Процент наценки на цену исполнителя (комиссия платформы)');

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();