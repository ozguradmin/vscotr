-- Likes tablosu oluştur
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- RLS politikaları
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes beğenileri görebilir" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar beğeni yapabilir" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar beğeniyi kaldırabilir" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Profiles tablosuna is_admin kolonu ekle (eğer yoksa)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
