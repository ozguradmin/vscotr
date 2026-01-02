-- RPC (Remote Procedure Call) Fonksiyonları
-- Bu fonksiyonlar, Supabase API'sinin otomatik sorgusu yerine
-- bizim yazdığımız optimize edilmiş SQL'i çalıştırır.
-- Bu sayede "Timeout" sorununu %100 aşacağız.

-- 1. Profil Gönderileri İçin Fonksiyon
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
LANGUAGE sql
STABLE
AS $$
  SELECT id, image_url, caption, aspect_ratio, created_at, user_id, order_index
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 2. Keşfet Gönderileri İçin Fonksiyon
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
LANGUAGE sql
STABLE
AS $$
  SELECT id, image_url, caption, aspect_ratio, created_at, user_id
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
