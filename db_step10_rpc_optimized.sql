-- RPC: Sürüm 2 (Optimize Edilmiş + Timeout Korumalı)
-- Bu script eski fonksiyonları siler ve yerine JOIN işlemi yapan,
-- timeout süresini kendi içinde uzatan PLPGSQL fonksiyonları koyar.

-- Önce eskileri temizle
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- 1. Profil Gönderileri (JOIN dahil + Timeout Korumalı)
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
  order_index int,
  username text,       -- Yeni: Profile tablosundan
  avatar_url text,     -- Yeni: Profile tablosundan
  member_badge text    -- Yeni: Profile tablosundan
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bu fonksiyon için timeout'u 15 saniyeye çıkar (Varsayılan 2-3sn ise patlamasın)
  SET LOCAL statement_timeout = '15s';

  RETURN QUERY
  SELECT 
    p.id, 
    p.image_url, 
    p.caption, 
    p.aspect_ratio, 
    p.created_at, 
    p.user_id, 
    p.order_index,
    pr.username,
    pr.avatar_url,
    pr.member_badge
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2. Keşfet Gönderileri (JOIN dahil + Timeout Korumalı)
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
  user_id uuid,
  username text,       -- Yeni
  avatar_url text,     -- Yeni
  member_badge text    -- Yeni
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Timeout koruması
  SET LOCAL statement_timeout = '15s';

  RETURN QUERY
  SELECT 
    p.id, 
    p.image_url, 
    p.caption, 
    p.aspect_ratio, 
    p.created_at, 
    p.user_id,
    pr.username,
    pr.avatar_url,
    pr.member_badge
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
