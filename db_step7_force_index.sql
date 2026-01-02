-- ZORLA INDEX OLUŞTURMA (GENİŞLETİLMİŞ ZAMAN AŞIMI)

-- 1. Zaman aşımını devre dışı bırak (Böylece işlem ne kadar sürerse sürsün iptal olmaz)
SET statement_timeout = 0;

-- 2. Eğer yarım kalmış/bozuk index varsa temizle
DROP INDEX IF EXISTS idx_posts_user_id_created_at;

-- 3. İstatistikleri güncelle (Veritabanı tablonun boş olmadığını anlasın)
ANALYZE public.posts;

-- 4. Index'i oluştur (Bu işlem tablo boyutuna göre zaman alabilir, LÜTFEN BEKLEYİN)
-- Success mesajı gelene kadar sayfayı kapatmayın.
CREATE INDEX idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);
