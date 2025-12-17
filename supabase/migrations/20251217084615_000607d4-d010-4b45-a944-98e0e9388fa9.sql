-- Drop and recreate secure_bookings view with missing columns
DROP VIEW IF EXISTS public.secure_bookings;

CREATE VIEW public.secure_bookings AS
SELECT 
    id,
    customer_id,
    performer_id,
    slot_id,
    booking_date,
    booking_time,
    district_slug,
    event_type,
    status,
    payment_status,
    price_total,
    prepayment_amount,
    comment,
    children_info,
    cancelled_by,
    cancellation_reason,
    created_at,
    updated_at,
    payment_deadline,
    proposal_message,
    CASE
        WHEN customer_id = auth.uid() THEN customer_name
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_name
        WHEN payment_status = ANY (ARRAY['prepayment_paid'::payment_status, 'fully_paid'::payment_status]) THEN customer_name
        ELSE '*** Скрыто до оплаты ***'::text
    END AS customer_name,
    CASE
        WHEN customer_id = auth.uid() THEN customer_phone
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_phone
        WHEN payment_status = ANY (ARRAY['prepayment_paid'::payment_status, 'fully_paid'::payment_status]) THEN customer_phone
        ELSE NULL::text
    END AS customer_phone,
    CASE
        WHEN customer_id = auth.uid() THEN customer_email
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN customer_email
        WHEN payment_status = ANY (ARRAY['prepayment_paid'::payment_status, 'fully_paid'::payment_status]) THEN customer_email
        ELSE NULL::text
    END AS customer_email,
    CASE
        WHEN customer_id = auth.uid() THEN address
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN address
        WHEN payment_status = ANY (ARRAY['prepayment_paid'::payment_status, 'fully_paid'::payment_status]) THEN address
        ELSE '*** Адрес скрыт до оплаты ***'::text
    END AS address
FROM bookings b
WHERE 
    customer_id = auth.uid() 
    OR (performer_id IN (
        SELECT performer_profiles.id
        FROM performer_profiles
        WHERE performer_profiles.user_id = auth.uid()
    )) 
    OR has_role(auth.uid(), 'admin'::app_role);