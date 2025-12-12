-- Create function to track referral bookings when payment is confirmed
CREATE OR REPLACE FUNCTION public.track_referral_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
BEGIN
  -- Only track when payment_status changes to 'prepayment_paid'
  IF NEW.payment_status = 'prepayment_paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'prepayment_paid') THEN
    -- Check if the customer was referred by a partner
    SELECT rr.partner_id INTO v_partner_id
    FROM referral_registrations rr
    WHERE rr.user_id = NEW.customer_id
    LIMIT 1;
    
    -- If customer was referred, create referral booking record
    IF v_partner_id IS NOT NULL THEN
      INSERT INTO referral_bookings (partner_id, booking_id, status, booking_amount)
      VALUES (v_partner_id, NEW.id, 'confirmed_paid', NEW.price_total)
      ON CONFLICT (booking_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Track cancellation after payment (refund scenario)
  IF NEW.payment_status = 'refunded' AND OLD.payment_status IN ('prepayment_paid', 'fully_paid') THEN
    UPDATE referral_bookings
    SET status = 'cancelled_after_payment'
    WHERE booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS track_referral_booking_trigger ON public.bookings;
CREATE TRIGGER track_referral_booking_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.track_referral_booking();