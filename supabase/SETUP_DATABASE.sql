-- ============================================================
-- HAUSTIER — COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor to create all tables.
-- Project: pxvtutangqqalsbjsnrd
-- ============================================================

-- =====================
-- ENUMS
-- =====================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'professional', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_status AS ENUM ('available', 'adopted', 'reserved', 'unavailable');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_species AS ENUM ('dog', 'cat', 'rabbit', 'bird', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.adoption_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.article_category AS ENUM ('health', 'nutrition', 'training', 'adoption', 'vaccination', 'general');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================
-- SHARED TRIGGER FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================
-- PROFILES
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- USER ROLES
-- =====================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer function so RLS policies can call it without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view own roles"     ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"    ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles"      ON public.user_roles;

CREATE POLICY "Users can view own roles"  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles"   ON public.user_roles FOR ALL   USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =====================
-- VETERINARIANS
-- =====================
CREATE TABLE IF NOT EXISTS public.veterinarians (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  specialty     TEXT,
  address       TEXT,
  city          TEXT,
  phone         TEXT,
  email         TEXT,
  description   TEXT,
  image_url     TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  rating        NUMERIC(3,1) DEFAULT 4.5,
  review_count  INTEGER DEFAULT 0,
  working_hours TEXT DEFAULT 'Lun-Ven 9h-18h',
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vets viewable by everyone"              ON public.veterinarians;
DROP POLICY IF EXISTS "Professionals can insert own vet profile" ON public.veterinarians;
DROP POLICY IF EXISTS "Professionals can update own vet profile" ON public.veterinarians;
DROP POLICY IF EXISTS "Admins can manage all vets"             ON public.veterinarians;

CREATE POLICY "Vets viewable by everyone"               ON public.veterinarians FOR SELECT USING (true);
CREATE POLICY "Professionals can insert own vet profile" ON public.veterinarians FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Professionals can update own vet profile" ON public.veterinarians FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all vets"              ON public.veterinarians FOR ALL   USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_vets_updated_at ON public.veterinarians;
CREATE TRIGGER update_vets_updated_at
  BEFORE UPDATE ON public.veterinarians
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ASSOCIATIONS
-- =====================
CREATE TABLE IF NOT EXISTS public.associations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  address     TEXT,
  city        TEXT,
  phone       TEXT,
  email       TEXT,
  website     TEXT,
  image_url   TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Associations viewable by everyone"              ON public.associations;
DROP POLICY IF EXISTS "Professionals can insert own association"        ON public.associations;
DROP POLICY IF EXISTS "Professionals can update own association"        ON public.associations;
DROP POLICY IF EXISTS "Admins can manage all associations"             ON public.associations;

CREATE POLICY "Associations viewable by everyone"       ON public.associations FOR SELECT USING (true);
CREATE POLICY "Professionals can insert own association" ON public.associations FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Professionals can update own association" ON public.associations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all associations"      ON public.associations FOR ALL   USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_associations_updated_at ON public.associations;
CREATE TRIGGER update_associations_updated_at
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ANIMALS
-- =====================
CREATE TABLE IF NOT EXISTS public.animals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  species         animal_species NOT NULL DEFAULT 'dog',
  breed           TEXT,
  age_months      INTEGER,
  gender          TEXT,
  description     TEXT,
  image_url       TEXT,
  status          animal_status NOT NULL DEFAULT 'available',
  is_vaccinated   BOOLEAN DEFAULT false,
  is_sterilized   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Animals viewable by everyone"           ON public.animals;
DROP POLICY IF EXISTS "Association owners can manage animals"  ON public.animals;
DROP POLICY IF EXISTS "Admins can manage all animals"          ON public.animals;

CREATE POLICY "Animals viewable by everyone"          ON public.animals FOR SELECT USING (true);
CREATE POLICY "Association owners can manage animals" ON public.animals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all animals"         ON public.animals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_animals_updated_at ON public.animals;
CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ADOPTION REQUESTS
-- =====================
CREATE TABLE IF NOT EXISTS public.adoption_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id  UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  message    TEXT,
  status     adoption_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests"                           ON public.adoption_requests;
DROP POLICY IF EXISTS "Association owners can view requests for their animals" ON public.adoption_requests;
DROP POLICY IF EXISTS "Users can create requests"                             ON public.adoption_requests;
DROP POLICY IF EXISTS "Users can cancel own requests"                         ON public.adoption_requests;
DROP POLICY IF EXISTS "Association owners can update request status"          ON public.adoption_requests;
DROP POLICY IF EXISTS "Admins can manage all requests"                        ON public.adoption_requests;

CREATE POLICY "Users can view own requests" ON public.adoption_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Association owners can view requests for their animals" ON public.adoption_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.animals a JOIN public.associations ass ON a.association_id = ass.id WHERE a.id = animal_id AND ass.user_id = auth.uid())
);
CREATE POLICY "Users can create requests"  ON public.adoption_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own requests" ON public.adoption_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Association owners can update request status" ON public.adoption_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.animals a JOIN public.associations ass ON a.association_id = ass.id WHERE a.id = animal_id AND ass.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all requests" ON public.adoption_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_adoption_requests_updated_at ON public.adoption_requests;
CREATE TRIGGER update_adoption_requests_updated_at
  BEFORE UPDATE ON public.adoption_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- APPOINTMENTS
-- =====================
CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id           UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason           TEXT,
  status           appointment_status NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments"   ON public.appointments;
DROP POLICY IF EXISTS "Vets can view their appointments"  ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments"     ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Vets can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"    ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vets can view their appointments"   ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create appointments"      ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments"  ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vets can update their appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- VACCINATION CAMPAIGNS
-- =====================
CREATE TABLE IF NOT EXISTS public.vaccination_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  campaign_date  DATE NOT NULL,
  location       TEXT,
  city           TEXT,
  image_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccination_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaigns viewable by everyone"           ON public.vaccination_campaigns;
DROP POLICY IF EXISTS "Association owners can manage campaigns"  ON public.vaccination_campaigns;
DROP POLICY IF EXISTS "Admins can manage all campaigns"          ON public.vaccination_campaigns;

CREATE POLICY "Campaigns viewable by everyone"          ON public.vaccination_campaigns FOR SELECT USING (true);
CREATE POLICY "Association owners can manage campaigns" ON public.vaccination_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all campaigns"         ON public.vaccination_campaigns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.vaccination_campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.vaccination_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- BLOG ARTICLES
-- =====================
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  excerpt      TEXT,
  image_url    TEXT,
  category     article_category NOT NULL DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published articles viewable by everyone" ON public.blog_articles;
DROP POLICY IF EXISTS "Authors can view own articles"           ON public.blog_articles;
DROP POLICY IF EXISTS "Professionals can create articles"       ON public.blog_articles;
DROP POLICY IF EXISTS "Authors can update own articles"         ON public.blog_articles;
DROP POLICY IF EXISTS "Authors can delete own articles"         ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can manage all articles"          ON public.blog_articles;

CREATE POLICY "Published articles viewable by everyone" ON public.blog_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can view own articles"           ON public.blog_articles FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Professionals can create articles"       ON public.blog_articles FOR INSERT WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Authors can update own articles"         ON public.blog_articles FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own articles"         ON public.blog_articles FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all articles"          ON public.blog_articles FOR ALL   USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.blog_articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- CONTACT MESSAGES
-- =====================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a message"  ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage messages"   ON public.contact_messages;

CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (
  length(name) > 0 AND length(email) > 0 AND length(message) > 0
);
CREATE POLICY "Admins can view all messages" ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage messages"   ON public.contact_messages FOR ALL   USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- AVAILABILITY SLOTS
-- =====================
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id       UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Slots viewable by everyone"         ON public.availability_slots;
DROP POLICY IF EXISTS "Vet owners can manage their slots"  ON public.availability_slots;

CREATE POLICY "Slots viewable by everyone"        ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Vet owners can manage their slots" ON public.availability_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);

-- =====================
-- BOOKED SLOTS
-- =====================
CREATE TABLE IF NOT EXISTS public.booked_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id         UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  booked_date    DATE NOT NULL,
  booked_time    TIME NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  UNIQUE(vet_id, booked_date, booked_time)
);

ALTER TABLE public.booked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booked slots viewable by everyone" ON public.booked_slots;
DROP POLICY IF EXISTS "System can manage booked slots"    ON public.booked_slots;

CREATE POLICY "Booked slots viewable by everyone" ON public.booked_slots FOR SELECT USING (true);
CREATE POLICY "System can manage booked slots"    ON public.booked_slots FOR ALL   USING (auth.uid() IS NOT NULL);

-- =====================
-- POSTS
-- =====================
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('vet', 'assoc')),
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_url   TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable by everyone"   ON public.posts;
DROP POLICY IF EXISTS "Authors can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;

CREATE POLICY "Posts viewable by everyone"   ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authors can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- =====================
-- POST LIKES
-- =====================
CREATE TABLE IF NOT EXISTS public.post_likes (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like"             ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike"           ON public.post_likes;

CREATE POLICY "Likes viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like"             ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike"           ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Keep likes_count in sync automatically
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON public.post_likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- =====================
-- FAVORITES
-- =====================
CREATE TABLE IF NOT EXISTS public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('vet', 'assoc', 'animal')),
  target_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- =====================
-- AUTO-CREATE VET / ASSOC ON SIGNUP
-- Reads raw_user_meta_data.role from Auth.tsx signup call
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_professional()
RETURNS TRIGGER AS $$
DECLARE
  v_role        TEXT;
  v_name        TEXT;
  v_specialty   TEXT;
  v_city        TEXT;
  v_phone       TEXT;
  v_address     TEXT;
  v_description TEXT;
  v_website     TEXT;
BEGIN
  v_role        := NEW.raw_user_meta_data->>'role';
  v_name        := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_specialty   := COALESCE(NEW.raw_user_meta_data->>'specialty', 'Médecine générale');
  v_city        := COALESCE(NEW.raw_user_meta_data->>'city', '');
  v_phone       := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_address     := COALESCE(NEW.raw_user_meta_data->>'address', '');
  v_description := COALESCE(NEW.raw_user_meta_data->>'description', '');
  v_website     := COALESCE(NEW.raw_user_meta_data->>'website', '');

  IF v_role = 'veterinaire' THEN
    INSERT INTO public.veterinarians (user_id, name, specialty, city, phone, address, description, is_verified)
    VALUES (NEW.id, v_name, v_specialty, v_city, v_phone, v_address, v_description, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF v_role = 'association' THEN
    INSERT INTO public.associations (user_id, name, city, phone, address, description, website, is_verified)
    VALUES (NEW.id, v_name, v_city, v_phone, v_address, v_description, v_website, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_professional ON auth.users;
CREATE TRIGGER on_auth_user_created_professional
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_professional();

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',      'avatars',      true, 2097152,  ARRAY['image/jpeg','image/png','image/webp']),
  ('animals',      'animals',      true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('vets',         'vets',         true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('associations', 'associations', true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('blog',         'blog',         true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public read avatars"      ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars"      ON storage.objects;
DROP POLICY IF EXISTS "Public read animals"      ON storage.objects;
DROP POLICY IF EXISTS "Auth upload animals"      ON storage.objects;
DROP POLICY IF EXISTS "Public read vets"         ON storage.objects;
DROP POLICY IF EXISTS "Auth upload vets"         ON storage.objects;
DROP POLICY IF EXISTS "Public read associations" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload associations" ON storage.objects;
DROP POLICY IF EXISTS "Public read blog"         ON storage.objects;
DROP POLICY IF EXISTS "Auth upload blog"         ON storage.objects;

CREATE POLICY "Public read avatars"      ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Public read animals"      ON storage.objects FOR SELECT USING (bucket_id = 'animals');
CREATE POLICY "Auth upload animals"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'animals' AND auth.role() = 'authenticated');
CREATE POLICY "Public read vets"         ON storage.objects FOR SELECT USING (bucket_id = 'vets');
CREATE POLICY "Auth upload vets"         ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vets' AND auth.role() = 'authenticated');
CREATE POLICY "Public read associations" ON storage.objects FOR SELECT USING (bucket_id = 'associations');
CREATE POLICY "Auth upload associations" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'associations' AND auth.role() = 'authenticated');
CREATE POLICY "Public read blog"         ON storage.objects FOR SELECT USING (bucket_id = 'blog');
CREATE POLICY "Auth upload blog"         ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog' AND auth.role() = 'authenticated');

-- =====================
-- SPRINT 3 & 5 FEATURES (DONATIONS, VOLUNTEERS, CAMPAIGNS)
-- =====================

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  event_date     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Assocs can manage own campaigns" ON public.campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);

-- DONATIONS
CREATE TABLE IF NOT EXISTS public.donations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Assocs can view their donations" ON public.donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert donations" ON public.donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VOLUNTEER REQUESTS
CREATE TABLE IF NOT EXISTS public.volunteer_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.volunteer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own volunteer requests" ON public.volunteer_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Assocs can view their volunteer requests" ON public.volunteer_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert volunteer requests" ON public.volunteer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- VERIFY: show all created tables
-- =====================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================
-- PATCHES: Missing policies & columns
-- Run these if the tables already exist
-- =====================

-- Add location column to campaigns if not exists
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS location TEXT;

-- Volunteer requests: allow associations to update status (accept/reject)
DROP POLICY IF EXISTS "Assocs can update volunteer requests" ON public.volunteer_requests;
CREATE POLICY "Assocs can update volunteer requests" ON public.volunteer_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);

-- Campaigns: allow associations to update their campaigns
DROP POLICY IF EXISTS "Assocs can update own campaigns" ON public.campaigns;
CREATE POLICY "Assocs can update own campaigns" ON public.campaigns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);

-- Animals: add is_chipped column if not exists
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS is_chipped BOOLEAN DEFAULT false;

-- =====================
-- ADMIN MODERATION POLICIES
-- =====================

-- Admin can delete any post (for moderation)
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all posts (for moderation listing)
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.posts;
CREATE POLICY "Admins can manage all posts" ON public.posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view ALL blog articles (including unpublished)
DROP POLICY IF EXISTS "Admins can manage all blog articles" ON public.blog_articles;
CREATE POLICY "Admins can manage all blog articles" ON public.blog_articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- APPOINTMENTS: Add patient columns
-- =====================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_email TEXT;

-- =====================
-- REGISTRATION METADATA COLUMNS
-- =====================

-- Vet: store license/order number for admin verification
ALTER TABLE public.veterinarians ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Association: store SIRET number for admin verification
ALTER TABLE public.associations ADD COLUMN IF NOT EXISTS siret TEXT;

-- Update the professional signup trigger to also store license_number / siret
CREATE OR REPLACE FUNCTION public.handle_new_professional()
RETURNS TRIGGER AS $$
DECLARE
  v_role        TEXT;
  v_name        TEXT;
  v_specialty   TEXT;
  v_city        TEXT;
  v_phone       TEXT;
  v_address     TEXT;
  v_description TEXT;
  v_website     TEXT;
  v_license     TEXT;
  v_siret       TEXT;
BEGIN
  v_role        := NEW.raw_user_meta_data->>'role';
  v_name        := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_specialty   := COALESCE(NEW.raw_user_meta_data->>'specialty', 'Médecine générale');
  v_city        := COALESCE(NEW.raw_user_meta_data->>'city', '');
  v_phone       := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_address     := COALESCE(NEW.raw_user_meta_data->>'address', '');
  v_description := COALESCE(NEW.raw_user_meta_data->>'description', '');
  v_website     := COALESCE(NEW.raw_user_meta_data->>'website', '');
  v_license     := COALESCE(NEW.raw_user_meta_data->>'license_number', '');
  v_siret       := COALESCE(NEW.raw_user_meta_data->>'siret', '');

  IF v_role = 'veterinaire' THEN
    INSERT INTO public.veterinarians (user_id, name, specialty, city, phone, address, description, license_number, is_verified)
    VALUES (NEW.id, v_name, v_specialty, v_city, v_phone, v_address, v_description, v_license, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;

  ELSIF v_role = 'association' THEN
    INSERT INTO public.associations (user_id, name, city, phone, address, description, website, siret, is_verified)
    VALUES (NEW.id, v_name, v_city, v_phone, v_address, v_description, v_website, v_siret, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_professional ON auth.users;
CREATE TRIGGER on_auth_user_created_professional
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_professional();
