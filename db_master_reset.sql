-- MASTER RESET SCRIPT
-- Bu script:
-- 1. Tüm takılı kalmış bağlantıları ve kilitleri temizler.
-- 2. RPC fonksiyonlarını en güvenli/basit versiyona (Step 9) döndürür.
-- 3. İstatistikleri günceller.

-- [1] Kilitleri Temizle (Kendi bağlantımız hariç)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database()
  AND (state = 'idle in transaction' OR state = 'active');

-- [2] RPC Fonksiyonlarını Temizle & Yeniden Oluştur (Step 9 Versiyonu)
DROP FUNCTION IF EXISTS get_profile_posts(uuid, int, int);
DROP FUNCTION IF EXISTS get_discover_posts(int, int);
DROP FUNCTION IF EXISTS get_profile_posts(text, int, int); -- Eski imzaları da temizle

CREATE OR REPLACE FUNCTION get_profile_posts(
  p_user_id uuid,
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION get_discover_posts(
  p_limit int DEFAULT 15,
  p_offset int DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM posts
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- [3] İstatistikleri Güncelle
ANALYZE posts;
ANALYZE profiles;
ANALYZE reposts;

-- Kontrol
SELECT count(*) as posts_count FROM posts;
