-- BU SON ADIMDIR.
-- Kodda sıralamayı 'order_index' yerine 'created_at' (tarih) yaptık.
-- Bu yüzden veritabanının tarihi hızlı taraması için bu index ŞART.

CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);

-- İstatistikleri güncelle ki indexi hemen görsün
ANALYZE public.posts;
