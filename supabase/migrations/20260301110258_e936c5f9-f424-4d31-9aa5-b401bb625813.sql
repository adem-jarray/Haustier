-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('user', 'professional', 'admin');

-- Create function to update timestamps
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
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- USER ROLES
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =====================
-- VETERINARIANS
-- =====================
CREATE TABLE public.veterinarians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets viewable by everyone" ON public.veterinarians FOR SELECT USING (true);
CREATE POLICY "Professionals can insert own vet profile" ON public.veterinarians FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Professionals can update own vet profile" ON public.veterinarians FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all vets" ON public.veterinarians FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vets_updated_at BEFORE UPDATE ON public.veterinarians
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ASSOCIATIONS
-- =====================
CREATE TABLE public.associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Associations viewable by everyone" ON public.associations FOR SELECT USING (true);
CREATE POLICY "Professionals can insert own association" ON public.associations FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Professionals can update own association" ON public.associations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all associations" ON public.associations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON public.associations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ANIMALS (for adoption)
-- =====================
CREATE TYPE public.animal_status AS ENUM ('available', 'adopted', 'reserved', 'unavailable');
CREATE TYPE public.animal_species AS ENUM ('dog', 'cat', 'rabbit', 'bird', 'other');

CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species animal_species NOT NULL DEFAULT 'dog',
  breed TEXT,
  age_months INTEGER,
  gender TEXT,
  description TEXT,
  image_url TEXT,
  status animal_status NOT NULL DEFAULT 'available',
  is_vaccinated BOOLEAN DEFAULT false,
  is_sterilized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Animals viewable by everyone" ON public.animals FOR SELECT USING (true);
CREATE POLICY "Association owners can manage animals" ON public.animals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all animals" ON public.animals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON public.animals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ADOPTION REQUESTS
-- =====================
CREATE TYPE public.adoption_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE public.adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  message TEXT,
  status adoption_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.adoption_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Association owners can view requests for their animals" ON public.adoption_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.animals a JOIN public.associations ass ON a.association_id = ass.id WHERE a.id = animal_id AND ass.user_id = auth.uid())
);
CREATE POLICY "Users can create requests" ON public.adoption_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own requests" ON public.adoption_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Association owners can update request status" ON public.adoption_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.animals a JOIN public.associations ass ON a.association_id = ass.id WHERE a.id = animal_id AND ass.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all requests" ON public.adoption_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_adoption_requests_updated_at BEFORE UPDATE ON public.adoption_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- APPOINTMENTS
-- =====================
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vets can view their appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vets can update their appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- VACCINATION CAMPAIGNS
-- =====================
CREATE TABLE public.vaccination_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  campaign_date DATE NOT NULL,
  location TEXT,
  city TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccination_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns viewable by everyone" ON public.vaccination_campaigns FOR SELECT USING (true);
CREATE POLICY "Association owners can manage campaigns" ON public.vaccination_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.associations WHERE id = association_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all campaigns" ON public.vaccination_campaigns FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.vaccination_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- BLOG ARTICLES
-- =====================
CREATE TYPE public.article_category AS ENUM ('health', 'nutrition', 'training', 'adoption', 'vaccination', 'general');

CREATE TABLE public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  category article_category NOT NULL DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published articles viewable by everyone" ON public.blog_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can view own articles" ON public.blog_articles FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Professionals can create articles" ON public.blog_articles FOR INSERT WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), 'professional'));
CREATE POLICY "Authors can update own articles" ON public.blog_articles FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own articles" ON public.blog_articles FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage all articles" ON public.blog_articles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.blog_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- CONTACT MESSAGES
-- =====================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all messages" ON public.contact_messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage messages" ON public.contact_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));