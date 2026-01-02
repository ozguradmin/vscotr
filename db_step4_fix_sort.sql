-- Adım 4: Eksik Index ve İstatistik Güncelleme (Çok Önemli)
-- Profil sayfasındaki 'order_index' sıralaması için bu index ŞART.
-- Ayrıca 'ANALYZE' komutu, veritabanının yeni indexleri hemen tanımasını sağlar.

CREATE INDEX IF NOT EXISTS idx_posts_user_order ON public.posts(user_id, order_index);

ANALYZE public.posts;
ANALYZE public.reposts;
ANALYZE public.likes;
ANALYZE public.follows;
ANALYZE public.profiles;
