-- Add additional fields for partner self-registration form
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS organization_address text,
ADD COLUMN IF NOT EXISTS contact_person_name text,
ADD COLUMN IF NOT EXISTS teacher_last_name text,
ADD COLUMN IF NOT EXISTS teacher_first_name text,
ADD COLUMN IF NOT EXISTS teacher_middle_name text,
ADD COLUMN IF NOT EXISTS teacher_position text,
ADD COLUMN IF NOT EXISTS teacher_phone text,
ADD COLUMN IF NOT EXISTS teacher_email text,
ADD COLUMN IF NOT EXISTS registered_self boolean DEFAULT false;

-- Allow public insert for self-registration (with restrictions via RLS)
CREATE POLICY "Anyone can self-register as partner"
ON public.partners
FOR INSERT
WITH CHECK (registered_self = true);