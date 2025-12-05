-- Allow admins to view all performer profiles
CREATE POLICY "Admins can view all performers" 
ON public.performer_profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any performer profile
CREATE POLICY "Admins can update any performer" 
ON public.performer_profiles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any booking
CREATE POLICY "Admins can update any booking" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all verification documents
CREATE POLICY "Admins can view all documents" 
ON public.verification_documents 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update verification documents
CREATE POLICY "Admins can update documents" 
ON public.verification_documents 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));