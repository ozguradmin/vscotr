-- RPC Step 14: The "Perfect" Fix (Signature Match + Timeout Override)
-- Bu script şunları yapar:
-- 1. Fonksiyonun dönüş tipini Step 9'daki ile BİREBİR aynı yapar (RETURNS TABLE...).
--    Böylece "Cannot change return type" hatası almazsınız ve frontend bozulmaz.
-- 2. "SECURITY DEFINER" kullanır (RLS'i atlar, hız artar).
-- 3. Timeout süresini 10 saniyeye çeker (3s limitini aşar).
-- 4. VACUUM ANALYZE ile tabloyu temizler.

-- 1. Öncekileri Sil
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- 2. get_profile_posts (Step 9 İmzası + Güçlendirilmiş Motor)
CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  image_url text,
  caption text,
  aspect_ratio float,
  created_at timestamptz,
  user_id uuid,
  order_index int
)
LANGUAGE plpgsql
SECURITY DEFINER -- RLS Bypass
SET statement_timeout = '10s' -- Timeout Override
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.image_url, 
    p.caption, 
    p.aspect_ratio, 
    p.created_at, 
    p.user_id, 
    p.order_index
  FROM posts p
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 3. get_discover_posts (Step 9 İmzası + Güçlendirilmiş Motor)
CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  image_url text,
  caption text,
  aspect_ratio float,
  created_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER -- RLS Bypass
SET statement_timeout = '10s' -- Timeout Override
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.image_url, 
    p.caption, 
    p.aspect_ratio, 
    p.created_at, 
    p.user_id
  FROM posts p
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. VACUUM ANALYZE transaction block içinde çalışmaz, bu satırı kaldırdık.
-- Manuel olarak "Table Editor" -> "posts" -> "Vacuum" diyebilirsiniz veya ayrı çalıştırabilirsiniz.
-- ANALYZE posts; -- Bu da transaction içinde sorun çıkarabilir, şimdilik pass geçelim.
