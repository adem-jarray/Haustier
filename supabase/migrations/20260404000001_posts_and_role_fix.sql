-- =====================
-- POSTS (profiles vets/assocs can publish)
-- =====================
CREATE TABLE public.posts (
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

CREATE POLICY "Posts viewable by everyone"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authors can insert own posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- =====================
-- POST LIKES
-- =====================
CREATE TABLE public.post_likes (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone"  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like"               ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike"             ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Function to keep likes_count in sync
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

CREATE TRIGGER post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- =====================
-- FIX: auto-create vet/assoc profile on signup
-- When role = 'veterinaire' or 'association' in user metadata,
-- create the corresponding record in veterinarians / associations table
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_professional()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_specialty TEXT;
  v_city TEXT;
  v_phone TEXT;
  v_address TEXT;
  v_description TEXT;
  v_website TEXT;
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

    -- Also insert 'professional' role
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

CREATE TRIGGER on_auth_user_created_professional
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_professional();

-- =====================
-- FAVORITES stored in DB (not just localStorage)
-- =====================
CREATE TABLE public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('vet', 'assoc', 'animal')),
  target_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
