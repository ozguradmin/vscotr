-- KEŞFET SAYFASI VE GENEL AKIŞ İÇİN KESİN ÇÖZÜM
-- Keşfet sayfası "user_id" filtresi koymaz, sadece tarihe göre sıralar.
-- Bu yüzden (user_id, created_at) indexi orada İŞE YARAMAZ.
-- Sadece (created_at DESC) indexi gerekir.

-- 1. Timeout engellemek için sınırsız süre ver
SET statement_timeout = 0;

-- 2. Eğer varsa eski/bozuk olanı temizle
DROP INDEX IF EXISTS idx_posts_created_at_desc;

-- 3. İstatistikleri güncelle
ANALYZE public.posts;

-- 4. Indexi oluştur (Keşfet sayfası bunu kullanacak)
CREATE INDEX idx_posts_created_at_desc ON public.posts(created_at DESC);
