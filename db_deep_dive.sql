-- BU SCRIPT SORUNU ANALİZ ETMEK İÇİNDİR
-- Lütfen çıktısını (Results kısmını) kopyalayıp paylaşın.

-- 1. Posts tablosundaki TÜM indexleri listele
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'posts';

-- 2. Hata veren sorgunun PLANINI göster (Hata vermez, sadece planı gösterir)
EXPLAIN 
SELECT id, image_url, caption, aspect_ratio, order_index, user_id, created_at
FROM posts
WHERE user_id = '0e63429b-d0be-404a-8414-c941d5f33c6e'
ORDER BY created_at DESC
LIMIT 15;
