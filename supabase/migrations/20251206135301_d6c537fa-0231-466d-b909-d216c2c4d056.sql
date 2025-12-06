-- Create trigger function to handle performer profile updates
-- When performer updates their own data, profile goes to pending verification
CREATE OR REPLACE FUNCTION public.handle_performer_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if this is an admin action (changing verification_status or is_active directly)
  -- Admin actions are detected when these fields change but content fields don't
  IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status) OR 
     (OLD.is_active IS DISTINCT FROM NEW.is_active) OR
     (OLD.rating_average IS DISTINCT FROM NEW.rating_average) OR
     (OLD.rating_count IS DISTINCT FROM NEW.rating_count) OR
     (OLD.commission_rate IS DISTINCT FROM NEW.commission_rate) THEN
    -- This is likely an admin or system action, don't override
    RETURN NEW;
  END IF;

  -- Check if any content fields have changed (fields that require re-verification)
  IF (OLD.display_name IS DISTINCT FROM NEW.display_name) OR
     (OLD.description IS DISTINCT FROM NEW.description) OR
     (OLD.photo_urls IS DISTINCT FROM NEW.photo_urls) OR
     (OLD.video_greeting_url IS DISTINCT FROM NEW.video_greeting_url) OR
     (OLD.performer_types IS DISTINCT FROM NEW.performer_types) OR
     (OLD.base_price IS DISTINCT FROM NEW.base_price) OR
     (OLD.costume_style IS DISTINCT FROM NEW.costume_style) OR
     (OLD.age IS DISTINCT FROM NEW.age) OR
     (OLD.experience_years IS DISTINCT FROM NEW.experience_years) OR
     (OLD.district_slugs IS DISTINCT FROM NEW.district_slugs) OR
     (OLD.formats IS DISTINCT FROM NEW.formats) OR
     (OLD.price_from IS DISTINCT FROM NEW.price_from) OR
     (OLD.price_to IS DISTINCT FROM NEW.price_to) THEN
    
    -- Set profile to pending verification and unpublish
    NEW.verification_status := 'pending';
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_performer_profile_content_update ON public.performer_profiles;

CREATE TRIGGER on_performer_profile_content_update
  BEFORE UPDATE ON public.performer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_performer_profile_update();