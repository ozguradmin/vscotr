-- BAĞLANTILARI KOPARMA KISMI KALDIRILDI (Yetki Hatası Nedeniyle)
--
-- TALİMAT:
-- 1. Supabase Panelinden "Restart Database" yapın.
-- 2. Veritabanı açılır açılmaz (dashboard yeşil olunca) BU kodu çalıştırın.
-- 3. Bu işlem o sırada siteye girenleri 1-2 saniye bekletir ama sorunu KÖKTEN çözer.

-- Eksik olan kritik index (Sıralama için)
CREATE INDEX IF NOT EXISTS idx_posts_user_order ON public.posts(user_id, order_index);

-- Veritabanının bu indexi hemen kullanması için istatistikleri güncelle
ANALYZE public.posts;
