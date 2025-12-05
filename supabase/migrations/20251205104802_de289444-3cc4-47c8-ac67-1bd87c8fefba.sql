
-- Districts reference table
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert Bishkek districts
INSERT INTO public.districts (name, slug) VALUES
  ('Октябрьский', 'october'),
  ('Первомайский', 'pervomay'),
  ('Ленинский', 'lenin'),
  ('Свердловский', 'sverdlov');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User roles table (separate for security)
CREATE TYPE public.app_role AS ENUM ('customer', 'performer', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Performer type enum
CREATE TYPE public.performer_type AS ENUM ('ded_moroz', 'snegurochka', 'santa', 'duo');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE public.event_format AS ENUM ('home', 'kindergarten', 'school', 'office', 'corporate', 'outdoor');

-- Performer profiles table
CREATE TABLE public.performer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  performer_types performer_type[] NOT NULL DEFAULT '{}',
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  base_price INTEGER NOT NULL DEFAULT 3000,
  price_from INTEGER,
  price_to INTEGER,
  experience_years INTEGER DEFAULT 0,
  age INTEGER,
  description TEXT,
  costume_style TEXT,
  formats event_format[] NOT NULL DEFAULT '{}',
  district_slugs TEXT[] NOT NULL DEFAULT '{}',
  video_greeting_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  rating_average DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  commission_rate DECIMAL(3,2) DEFAULT 0.15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Availability slots
CREATE TYPE public.slot_status AS ENUM ('free', 'booked', 'blocked');

CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID NOT NULL REFERENCES public.performer_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status slot_status NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(performer_id, date, start_time)
);

-- Bookings
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('not_paid', 'prepayment_paid', 'fully_paid', 'refunded');

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performer_id UUID NOT NULL REFERENCES public.performer_profiles(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  children_info TEXT,
  event_type event_format NOT NULL DEFAULT 'home',
  address TEXT NOT NULL,
  district_slug TEXT NOT NULL,
  comment TEXT,
  price_total INTEGER NOT NULL,
  prepayment_amount INTEGER NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'not_paid',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performer_id UUID NOT NULL REFERENCES public.performer_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Verification documents
CREATE TYPE public.document_type AS ENUM ('passport', 'id_card', 'other');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performer_id UUID NOT NULL REFERENCES public.performer_profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Districts are public read
CREATE POLICY "Districts are public" ON public.districts FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Performer profiles policies (public read for active performers)
CREATE POLICY "Active performers are public" ON public.performer_profiles FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "Performers can update own profile" ON public.performer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Performers can insert own profile" ON public.performer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Availability slots policies
CREATE POLICY "Slots are public read" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Performers can manage own slots" ON public.availability_slots FOR ALL USING (
  performer_id IN (SELECT id FROM public.performer_profiles WHERE user_id = auth.uid())
);

-- Bookings policies
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Performers can view their bookings" ON public.bookings FOR SELECT USING (
  performer_id IN (SELECT id FROM public.performer_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = customer_id OR performer_id IN (SELECT id FROM public.performer_profiles WHERE user_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Visible reviews are public" ON public.reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (
  auth.uid() = sender_id OR 
  booking_id IN (SELECT id FROM public.bookings WHERE customer_id = auth.uid()) OR
  booking_id IN (SELECT b.id FROM public.bookings b JOIN public.performer_profiles p ON b.performer_id = p.id WHERE p.user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Verification documents policies
CREATE POLICY "Performers can view own documents" ON public.verification_documents FOR SELECT USING (
  performer_id IN (SELECT id FROM public.performer_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Performers can upload documents" ON public.verification_documents FOR INSERT WITH CHECK (
  performer_id IN (SELECT id FROM public.performer_profiles WHERE user_id = auth.uid())
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performer_profiles_updated_at BEFORE UPDATE ON public.performer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Пользователь'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_performer_profiles_is_active ON public.performer_profiles(is_active);
CREATE INDEX idx_performer_profiles_district ON public.performer_profiles USING GIN(district_slugs);
CREATE INDEX idx_availability_slots_performer_date ON public.availability_slots(performer_id, date);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_performer ON public.bookings(performer_id);
CREATE INDEX idx_reviews_performer ON public.reviews(performer_id);
CREATE INDEX idx_chat_messages_booking ON public.chat_messages(booking_id);
