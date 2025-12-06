-- Add price column to availability_slots for dynamic pricing per slot
ALTER TABLE public.availability_slots 
ADD COLUMN price integer NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.availability_slots.price IS 'Custom price for this slot. If NULL, performer base_price is used';