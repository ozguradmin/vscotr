-- Profiller tablosu
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  member_badge TEXT DEFAULT 'MEMBER',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Linkler tablosu
CREATE TABLE IF NOT EXISTS public.profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gönderiler tablosu
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  post_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0,
  aspect_ratio FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Takipler tablosu
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Repostlar tablosu
CREATE TABLE IF NOT EXISTS public.reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- RLS politikaları
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Profiller için RLS
CREATE POLICY "Herkes profilleri görebilir" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Kullanıcılar kendi profilini oluşturabilir" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Linkler için RLS
CREATE POLICY "Herkes linkleri görebilir" ON public.profile_links FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendi linklerini yönetebilir" ON public.profile_links FOR ALL USING (auth.uid() = profile_id);

-- Gönderiler için RLS
CREATE POLICY "Herkes gönderileri görebilir" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendi gönderilerini yönetebilir" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Takipler için RLS
CREATE POLICY "Herkes takipleri görebilir" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar takip edebilir" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Kullanıcılar takibi kaldırabilir" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Repostlar için RLS
CREATE POLICY "Herkes repostları görebilir" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar repost yapabilir" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar repostu kaldırabilir" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

-- Profil trigger'ı - yeni kullanıcı için otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
