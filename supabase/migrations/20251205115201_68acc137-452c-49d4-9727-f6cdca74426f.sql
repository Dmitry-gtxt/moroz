-- Add unique constraint for availability slots to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS availability_slots_performer_date_time_unique 
ON public.availability_slots (performer_id, date, start_time);