-- Allow admins to update reviews (for moderation)
CREATE POLICY "Admins can update reviews" 
ON public.reviews 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));