-- Add birth date field for the listener/teacher
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS teacher_birth_date DATE;