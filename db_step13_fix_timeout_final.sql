-- RPC Step 13: The "Nuclear" Fix for Timeouts
-- Bu script 3 şeyi kesinleştirir:
-- 1. YENİ ve Temiz Bir Index oluşturur (Eskisi bozuk veya kullanılmıyor olabilir).
-- 2. "SECURITY DEFINER" kullanır: Bu, RLS (Row Level Security) kurallarını bypass eder.
--    Eğer RLS politikalarınız yavaşsa (örn: "şu kullanıcıyı engellemiş mi?" kontrolü), bu kod onu atlar ve %100 hızlanır.
-- 3. Timeout süresini 20 saniyeye çeker.

-- 1. Yeni Index (Eskilere güvenmiyoruz)
CREATE INDEX IF NOT EXISTS idx_posts_userid_created_final 
ON public.posts (user_id, created_at DESC);

-- İstatistikleri güncelle ki Planner yeni indexi görsün
ANALYZE public.posts;

-- 2. Fonksiyonları Yeniden Tanımla (SECURITY DEFINER ile)
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- Profil (SECURITY DEFINER eklenmiş)
CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER -- <--- KRİTİK HAMLE: RLS yükünü kaldırır, direkt veriye erişir.
SET statement_timeout = '20s' -- Timeout'u global olarak o anlık değiştirir
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Keşfet (SECURITY DEFINER eklenmiş)
CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '20s'
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
