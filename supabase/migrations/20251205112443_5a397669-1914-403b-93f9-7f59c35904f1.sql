-- Temporarily drop the foreign key constraint for testing
ALTER TABLE performer_profiles DROP CONSTRAINT IF EXISTS performer_profiles_user_id_fkey;

-- Make user_id nullable for test data
ALTER TABLE performer_profiles ALTER COLUMN user_id DROP NOT NULL;