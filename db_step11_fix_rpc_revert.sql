-- RPC Fix: Revert to Simple Version (Step 11)
-- Bu script, "return type mismatch" hatasını çözmek için önce fonksiyonları siler,
-- sonra Step 9'daki (Hızlı & Basit) haline geri döndürür.

-- 1. Önceki tüm versiyonları temizle (CASCADE ile bağımlılıkları da temizler gerekirse)
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- 2. get_profile_posts (Basit Versiyon - Sadece Posts tablosunu döndürür)
CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts -- Post tablosunun yapısını aynen döndür
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 3. get_discover_posts (Basit Versiyon - Sadece Posts tablosunu döndürür)
CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts -- Post tablosunun yapısını aynen döndür
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
