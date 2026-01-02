-- PERFORMANS SİMÜLASYONU VE TESTİ
-- Bu script, uygulamanın yaptığı sorguların AYNISINI çalıştırır ve süresini ölçer.
-- "Execution Time" (Çalışma Süresi) kısmına dikkat edin. Hedef < 50ms.

-- 1. ANA SAYFA / LANDING (Basit sorgu)
EXPLAIN ANALYZE
SELECT id, image_url, aspect_ratio, caption, user_id
FROM posts
ORDER BY created_at DESC
LIMIT 8;

-- 2. PROFİL SAYFASI (Özgür'ün profili için RPC testi)
-- Bu fonksiyon arka planda index kullanıp kullanmadığını gösterir.
EXPLAIN ANALYZE
SELECT * FROM get_profile_posts(
  '0e63429b-d0be-404a-8414-c941d5f33c6e', -- User ID
  15, -- Limit
  0   -- Offset
);

-- 3. KEŞFET SAYFASI (Genel akış RPC testi)
EXPLAIN ANALYZE
SELECT * FROM get_discover_posts(
  15, -- Limit
  0   -- Offset
);

-- 4. KULLANICI DETAY TESTİ (SakuragiChan profile benzeri)
-- Rastgele başka bir ID ile test (Eğer varsa)
EXPLAIN ANALYZE
SELECT * FROM get_profile_posts(
  '0e63429b-d0be-404a-8414-c941d5f33c6e', -- Buraya başka ID yazılabilir
  15,
  0
);
