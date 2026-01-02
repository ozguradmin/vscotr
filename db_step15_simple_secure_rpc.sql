-- RPC Step 15: Back to Basics (Simple & Secure)
-- Bu script:
-- 1. Karmaşık PLPGSQL yerine en hızlı olan "LANGUAGE sql" kullanır.
-- 2. "RETURNS SETOF posts" diyerek tablo yapısını otomatik kullanır.
-- 3. "SECURITY DEFINER" ile RLS engelini aşar.
-- 4. Timeout süresini veritabanı ayarı olarak fonksiyonun kendisine gömer.

-- 1. Temizlik
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- 2. get_profile_posts (SQL + Security Definer)
CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Timeout Ayarını Fonksiyona Göm (ALTER FUNCTION ile)
ALTER FUNCTION get_profile_posts(uuid, int, int) SET statement_timeout = '15s';

-- 3. get_discover_posts (SQL + Security Definer)
CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Timeout Ayarını Fonksiyona Göm
ALTER FUNCTION get_discover_posts(int, int) SET statement_timeout = '15s';
