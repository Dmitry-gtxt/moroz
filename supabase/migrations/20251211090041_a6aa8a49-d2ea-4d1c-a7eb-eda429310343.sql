-- Добавляем поля для программы исполнителя
ALTER TABLE public.performer_profiles
ADD COLUMN IF NOT EXISTS program_duration integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS program_description text;