-- Adım 2: En Kritik Index (Keşfet ve Profil Sayfaları İçin)
-- CONCURRENTLY kaldırıldı çünkü Supabase Editör 'transaction block' içinde çalıştırıyor.
-- Bu işlem tabloyu kısa süreliğine kilitleyebilir ama hata vermez.

CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at 
ON public.posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc
ON public.posts(created_at DESC);
