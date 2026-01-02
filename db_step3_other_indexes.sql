-- Adım 3: Diğer Yardımcı Indexler
-- CONCURRENTLY kaldırıldı.

CREATE INDEX IF NOT EXISTS idx_reposts_user_post 
ON public.reposts(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_post 
ON public.likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_follows_check 
ON public.follows(follower_id, following_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON public.profiles(username);
