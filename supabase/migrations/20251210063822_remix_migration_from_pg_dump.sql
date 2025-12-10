CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'customer',
    'performer',
    'admin'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'passport',
    'id_card',
    'other'
);


--
-- Name: event_format; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_format AS ENUM (
    'home',
    'kindergarten',
    'school',
    'office',
    'corporate',
    'outdoor'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'not_paid',
    'prepayment_paid',
    'fully_paid',
    'refunded'
);


--
-- Name: performer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.performer_type AS ENUM (
    'ded_moroz',
    'snegurochka',
    'santa',
    'duo'
);


--
-- Name: slot_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.slot_status AS ENUM (
    'free',
    'booked',
    'blocked'
);


--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_status AS ENUM (
    'unverified',
    'pending',
    'verified',
    'rejected'
);


--
-- Name: create_support_chat_for_performer(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_support_chat_for_performer() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.support_chats (performer_id)
  VALUES (NEW.id)
  ON CONFLICT (performer_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Пользователь'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_performer_profile_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_performer_profile_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_booking_participant(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_booking_participant(_user_id uuid, _booking_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = _booking_id
    AND (
      b.customer_id = _user_id
      OR EXISTS (
        SELECT 1 FROM performer_profiles p 
        WHERE p.id = b.performer_id AND p.user_id = _user_id
      )
    )
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: availability_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    performer_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status public.slot_status DEFAULT 'free'::public.slot_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    price integer
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    performer_id uuid NOT NULL,
    slot_id uuid,
    status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
    children_info text,
    event_type public.event_format DEFAULT 'home'::public.event_format NOT NULL,
    address text NOT NULL,
    district_slug text NOT NULL,
    comment text,
    price_total integer NOT NULL,
    prepayment_amount integer NOT NULL,
    payment_status public.payment_status DEFAULT 'not_paid'::public.payment_status NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    booking_date date NOT NULL,
    booking_time text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cancellation_reason text,
    cancelled_by text,
    CONSTRAINT bookings_cancelled_by_check CHECK ((cancelled_by = ANY (ARRAY['customer'::text, 'performer'::text, 'admin'::text])))
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    text text NOT NULL,
    attachments text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: performer_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performer_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    display_name text NOT NULL,
    performer_types public.performer_type[] DEFAULT '{}'::public.performer_type[] NOT NULL,
    photo_urls text[] DEFAULT '{}'::text[] NOT NULL,
    base_price integer DEFAULT 3000 NOT NULL,
    price_from integer,
    price_to integer,
    experience_years integer DEFAULT 0,
    age integer,
    description text,
    costume_style text,
    formats public.event_format[] DEFAULT '{}'::public.event_format[] NOT NULL,
    district_slugs text[] DEFAULT '{}'::text[] NOT NULL,
    video_greeting_url text,
    verification_status public.verification_status DEFAULT 'unverified'::public.verification_status NOT NULL,
    rating_average numeric(2,1) DEFAULT 0.0,
    rating_count integer DEFAULT 0,
    is_active boolean DEFAULT false NOT NULL,
    commission_rate numeric(3,2) DEFAULT 0.15,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: public_performers; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_performers WITH (security_invoker='on') AS
 SELECT id,
    user_id,
    display_name,
    performer_types,
    photo_urls,
    base_price,
    price_from,
    price_to,
    experience_years,
    age,
    description,
    costume_style,
    formats,
    district_slugs,
    video_greeting_url,
    verification_status,
    rating_average,
    rating_count,
    is_active,
    created_at,
    updated_at
   FROM public.performer_profiles p
  WHERE (is_active = true);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    performer_id uuid NOT NULL,
    rating integer NOT NULL,
    text text,
    is_visible boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: public_reviews; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.public_reviews WITH (security_invoker='true') AS
 SELECT id,
    performer_id,
    rating,
    text,
    created_at,
    booking_id
   FROM public.reviews r
  WHERE (is_visible = true);


--
-- Name: secure_bookings; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.secure_bookings WITH (security_invoker='true') AS
 SELECT id,
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
        CASE
            WHEN (customer_id = auth.uid()) THEN customer_name
            WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN customer_name
            WHEN (payment_status = ANY (ARRAY['prepayment_paid'::public.payment_status, 'fully_paid'::public.payment_status])) THEN customer_name
            ELSE '*** Скрыто до оплаты ***'::text
        END AS customer_name,
        CASE
            WHEN (customer_id = auth.uid()) THEN customer_phone
            WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN customer_phone
            WHEN (payment_status = ANY (ARRAY['prepayment_paid'::public.payment_status, 'fully_paid'::public.payment_status])) THEN customer_phone
            ELSE NULL::text
        END AS customer_phone,
        CASE
            WHEN (customer_id = auth.uid()) THEN customer_email
            WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN customer_email
            WHEN (payment_status = ANY (ARRAY['prepayment_paid'::public.payment_status, 'fully_paid'::public.payment_status])) THEN customer_email
            ELSE NULL::text
        END AS customer_email,
        CASE
            WHEN (customer_id = auth.uid()) THEN address
            WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN address
            WHEN (payment_status = ANY (ARRAY['prepayment_paid'::public.payment_status, 'fully_paid'::public.payment_status])) THEN address
            ELSE '*** Адрес скрыт до оплаты ***'::text
        END AS address
   FROM public.bookings b
  WHERE ((customer_id = auth.uid()) OR (performer_id IN ( SELECT performer_profiles.id
           FROM public.performer_profiles
          WHERE (performer_profiles.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    performer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    sender_type text NOT NULL,
    text text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT support_messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['performer'::text, 'admin'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'customer'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: verification_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    performer_id uuid NOT NULL,
    document_type public.document_type NOT NULL,
    document_url text NOT NULL,
    status public.document_status DEFAULT 'pending'::public.document_status NOT NULL,
    admin_comment text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone
);


--
-- Name: availability_slots availability_slots_performer_id_date_start_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_performer_id_date_start_time_key UNIQUE (performer_id, date, start_time);


--
-- Name: availability_slots availability_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (id);


--
-- Name: districts districts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_slug_key UNIQUE (slug);


--
-- Name: performer_profiles performer_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performer_profiles
    ADD CONSTRAINT performer_profiles_pkey PRIMARY KEY (id);


--
-- Name: performer_profiles performer_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performer_profiles
    ADD CONSTRAINT performer_profiles_user_id_key UNIQUE (user_id);


--
-- Name: platform_settings platform_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_key_key UNIQUE (key);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: reviews reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: support_chats support_chats_performer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chats
    ADD CONSTRAINT support_chats_performer_id_key UNIQUE (performer_id);


--
-- Name: support_chats support_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chats
    ADD CONSTRAINT support_chats_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: verification_documents verification_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_documents
    ADD CONSTRAINT verification_documents_pkey PRIMARY KEY (id);


--
-- Name: availability_slots_performer_date_time_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX availability_slots_performer_date_time_unique ON public.availability_slots USING btree (performer_id, date, start_time);


--
-- Name: idx_availability_slots_performer_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_slots_performer_date ON public.availability_slots USING btree (performer_id, date);


--
-- Name: idx_bookings_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_customer ON public.bookings USING btree (customer_id);


--
-- Name: idx_bookings_performer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_performer ON public.bookings USING btree (performer_id);


--
-- Name: idx_chat_messages_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_booking ON public.chat_messages USING btree (booking_id);


--
-- Name: idx_performer_profiles_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performer_profiles_district ON public.performer_profiles USING gin (district_slugs);


--
-- Name: idx_performer_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performer_profiles_is_active ON public.performer_profiles USING btree (is_active);


--
-- Name: idx_reviews_performer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_performer ON public.reviews USING btree (performer_id);


--
-- Name: performer_profiles on_performer_created_create_support_chat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_performer_created_create_support_chat AFTER INSERT ON public.performer_profiles FOR EACH ROW EXECUTE FUNCTION public.create_support_chat_for_performer();


--
-- Name: performer_profiles on_performer_profile_content_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_performer_profile_content_update BEFORE UPDATE ON public.performer_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_performer_profile_update();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: performer_profiles update_performer_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_performer_profiles_updated_at BEFORE UPDATE ON public.performer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: platform_settings update_platform_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_chats update_support_chats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_chats_updated_at BEFORE UPDATE ON public.support_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: availability_slots availability_slots_performer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_slots
    ADD CONSTRAINT availability_slots_performer_id_fkey FOREIGN KEY (performer_id) REFERENCES public.performer_profiles(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_performer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_performer_id_fkey FOREIGN KEY (performer_id) REFERENCES public.performer_profiles(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.availability_slots(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_performer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_performer_id_fkey FOREIGN KEY (performer_id) REFERENCES public.performer_profiles(id) ON DELETE CASCADE;


--
-- Name: support_chats support_chats_performer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_chats
    ADD CONSTRAINT support_chats_performer_id_fkey FOREIGN KEY (performer_id) REFERENCES public.performer_profiles(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.support_chats(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: verification_documents verification_documents_performer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_documents
    ADD CONSTRAINT verification_documents_performer_id_fkey FOREIGN KEY (performer_id) REFERENCES public.performer_profiles(id) ON DELETE CASCADE;


--
-- Name: performer_profiles Active performers are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active performers are public" ON public.performer_profiles FOR SELECT USING (((is_active = true) OR (auth.uid() = user_id)));


--
-- Name: support_chats Admins can create support chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create support chats" ON public.support_chats FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: platform_settings Admins can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert settings" ON public.platform_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send messages" ON public.support_messages FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (sender_type = 'admin'::text)));


--
-- Name: bookings Admins can update any booking; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any booking" ON public.bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: performer_profiles Admins can update any performer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any performer" ON public.performer_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: verification_documents Admins can update documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update documents" ON public.verification_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reviews Admins can update reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: platform_settings Admins can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update settings" ON public.platform_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Admins can view all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: verification_documents Admins can view all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all documents" ON public.verification_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: performer_profiles Admins can view all performers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all performers" ON public.performer_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_chats Admins can view all support chats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all support chats" ON public.support_chats FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: support_messages Admins can view all support messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all support messages" ON public.support_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: bookings Customers can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = customer_id));


--
-- Name: reviews Customers can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: bookings Customers can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT TO authenticated USING ((auth.uid() = customer_id));


--
-- Name: districts Districts are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Districts are public" ON public.districts FOR SELECT USING (true);


--
-- Name: chat_messages Participants can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (((auth.uid() = sender_id) AND public.is_booking_participant(auth.uid(), booking_id)));


--
-- Name: chat_messages Participants can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (((auth.uid() = sender_id) OR public.is_booking_participant(auth.uid(), booking_id)));


--
-- Name: performer_profiles Performers can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can insert own profile" ON public.performer_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: availability_slots Performers can manage own slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can manage own slots" ON public.availability_slots USING ((performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid()))));


--
-- Name: support_messages Performers can send messages to own chat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can send messages to own chat" ON public.support_messages FOR INSERT WITH CHECK (((sender_type = 'performer'::text) AND (chat_id IN ( SELECT sc.id
   FROM (public.support_chats sc
     JOIN public.performer_profiles pp ON ((pp.id = sc.performer_id)))
  WHERE (pp.user_id = auth.uid())))));


--
-- Name: performer_profiles Performers can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can update own profile" ON public.performer_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: verification_documents Performers can upload documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can upload documents" ON public.verification_documents FOR INSERT TO authenticated WITH CHECK ((performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid()))));


--
-- Name: support_messages Performers can view own chat messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can view own chat messages" ON public.support_messages FOR SELECT USING ((chat_id IN ( SELECT sc.id
   FROM (public.support_chats sc
     JOIN public.performer_profiles pp ON ((pp.id = sc.performer_id)))
  WHERE (pp.user_id = auth.uid()))));


--
-- Name: verification_documents Performers can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can view own documents" ON public.verification_documents FOR SELECT TO authenticated USING ((performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid()))));


--
-- Name: support_chats Performers can view own support chat; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can view own support chat" ON public.support_chats FOR SELECT USING ((performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid()))));


--
-- Name: bookings Performers can view their bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Performers can view their bookings" ON public.bookings FOR SELECT TO authenticated USING ((performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid()))));


--
-- Name: performer_profiles Public performers are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public performers are publicly readable" ON public.performer_profiles FOR SELECT TO authenticated, anon USING (((is_active = true) AND (verification_status = 'verified'::public.verification_status)));


--
-- Name: chat_messages Recipients can mark messages as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recipients can mark messages as read" ON public.chat_messages FOR UPDATE TO authenticated USING ((public.is_booking_participant(auth.uid(), booking_id) AND (auth.uid() <> sender_id))) WITH CHECK ((public.is_booking_participant(auth.uid(), booking_id) AND (auth.uid() <> sender_id)));


--
-- Name: platform_settings Settings are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Settings are publicly readable" ON public.platform_settings FOR SELECT USING (true);


--
-- Name: availability_slots Slots are public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Slots are public read" ON public.availability_slots FOR SELECT USING (true);


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: support_messages Users can mark messages as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can mark messages as read" ON public.support_messages FOR UPDATE USING (((chat_id IN ( SELECT sc.id
   FROM (public.support_chats sc
     JOIN public.performer_profiles pp ON ((pp.id = sc.performer_id)))
  WHERE (pp.user_id = auth.uid()))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: bookings Users can update own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (((auth.uid() = customer_id) OR (performer_id IN ( SELECT performer_profiles.id
   FROM public.performer_profiles
  WHERE (performer_profiles.user_id = auth.uid())))));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reviews Visible reviews are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Visible reviews are public" ON public.reviews FOR SELECT USING ((is_visible = true));


--
-- Name: availability_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: districts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

--
-- Name: performer_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performer_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: support_chats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

--
-- Name: support_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


