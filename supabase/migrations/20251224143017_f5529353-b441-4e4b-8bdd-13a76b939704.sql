-- Add payment_url field to store pre-generated VTB payment links
ALTER TABLE public.bookings 
ADD COLUMN payment_url TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.payment_url IS 'Pre-generated VTB payment URL, created when booking is confirmed';