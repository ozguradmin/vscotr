-- RPC Step 12: Timeout Extension Fix
-- Olay: "Ozgur" gibi bazı profiller sunucunun varsayılan 3 saniyelik limitine takılıyor.
-- Çözüm: Fonksiyonu PLPGSQL'e çevirip içine "SET LOCAL statement_timeout" ekliyoruz.
-- Bu sayede sorgu 10 saniyeye kadar çalışabilir.

-- 1. Önceki tüm versiyonları temizle
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);

-- 2. get_profile_posts (Timeout Korumalı + Basit Select)
CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE plpgsql
AS $$
BEGIN
  -- Bu fonksiyon için süreyi uzat (Varsayılan 3sn yetmiyor)
  SET LOCAL statement_timeout = '10s';

  RETURN QUERY
  SELECT *
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 3. get_discover_posts (Timeout Korumalı + Basit Select)
CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE plpgsql
AS $$
BEGIN
  -- Timeout koruması
  SET LOCAL statement_timeout = '10s';

  RETURN QUERY
  SELECT *
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. İstatistikleri güncelle (Planner doğru karar versin)
ANALYZE posts;
