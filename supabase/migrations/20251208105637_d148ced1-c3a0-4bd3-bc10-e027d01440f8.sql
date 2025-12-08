-- Create a secure view for bookings that masks sensitive data based on payment status
-- Performers can only see contact details after prepayment is made

CREATE OR REPLACE VIEW public.secure_bookings AS
SELECT 
  b.id,
  b.customer_id,
  b.performer_id,
  b.slot_id,
  b.booking_date,
  b.booking_time,
  b.district_slug,
  b.event_type,
  b.status,
  b.payment_status,
  b.price_total,
  b.prepayment_amount,
  b.comment,
  b.children_info,
  b.cancelled_by,
  b.cancellation_reason,
  b.created_at,
  b.updated_at,
  -- Mask sensitive fields for performers until payment is made
  CASE 
    -- Customer sees their own data
    WHEN b.customer_id = auth.uid() THEN b.customer_name
    -- Admin sees all data
    WHEN has_role(auth.uid(), 'admin') THEN b.customer_name
    -- Performer sees data only after prepayment
    WHEN b.payment_status IN ('prepayment_paid', 'fully_paid') THEN b.customer_name
    ELSE '*** Скрыто до оплаты ***'
  END AS customer_name,
  
  CASE 
    WHEN b.customer_id = auth.uid() THEN b.customer_phone
    WHEN has_role(auth.uid(), 'admin') THEN b.customer_phone
    WHEN b.payment_status IN ('prepayment_paid', 'fully_paid') THEN b.customer_phone
    ELSE NULL
  END AS customer_phone,
  
  CASE 
    WHEN b.customer_id = auth.uid() THEN b.customer_email
    WHEN has_role(auth.uid(), 'admin') THEN b.customer_email
    WHEN b.payment_status IN ('prepayment_paid', 'fully_paid') THEN b.customer_email
    ELSE NULL
  END AS customer_email,
  
  CASE 
    WHEN b.customer_id = auth.uid() THEN b.address
    WHEN has_role(auth.uid(), 'admin') THEN b.address
    WHEN b.payment_status IN ('prepayment_paid', 'fully_paid') THEN b.address
    ELSE '*** Адрес скрыт до оплаты ***'
  END AS address

FROM public.bookings b
WHERE 
  -- Same access rules as bookings table
  b.customer_id = auth.uid()
  OR b.performer_id IN (
    SELECT id FROM performer_profiles WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin');

-- Grant access to the view
GRANT SELECT ON public.secure_bookings TO authenticated;