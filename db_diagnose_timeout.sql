-- SUPABASE TIMEOUT FIX & DIAGNOSTIC
-- Bu scripti çalıştırarak mevcut durumu görün ve düzeltin.

-- ADIM 1: Mevcut timeout ayarlarını göster
SELECT name, setting, unit, short_desc 
FROM pg_settings 
WHERE name LIKE '%timeout%';

-- ADIM 2: Veritabanı yükünü göster (Aktif bağlantılar)
SELECT count(*) as active_connections, state 
FROM pg_stat_activity 
GROUP BY state;

-- ADIM 3: Şu an çalışan uzun sorgular
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 second'
  AND state != 'idle';

-- ADIM 4: Posts tablosunda kaç satır var?
SELECT count(*) as total_posts FROM posts;

-- ADIM 5: TIMEOUT ARTIRMA (GLOBAL)
-- Bu satır 30 saniyeye ayarlar. Eğer hata verirse, Supabase dashboard'dan ayarlamanız gerekir.
-- ALTER SYSTEM SET statement_timeout = '30s'; -- COMMENTED OUT - Supabase'de çalışmayabilir

-- ADIM 6: Tüm bağlantılar için timeout'u session bazında artır
-- Bu, mevcut SQL Editor oturumu için çalışır.
SET statement_timeout = '60s';

-- ADIM 7: Basit bir sorgu testi
EXPLAIN ANALYZE 
SELECT id, image_url FROM posts ORDER BY created_at DESC LIMIT 15;
