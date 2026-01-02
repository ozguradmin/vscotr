-- Data & Permission Check Script
-- Bu scripti çalıştırıp sonucunu bize gönderin.

-- 1. Ozgur kullanıcısının gerçekte kaç postu var?
SELECT 
  'Ozgur Post Count' as query_type, 
  count(*) as count 
FROM posts 
WHERE user_id = '0e63429b-d0be-404a-8414-c941d5f33c6e';

-- 2. Şu anki veritabanı kullanıcısı kim?
SELECT current_user, session_user;

-- 3. RPC fonksiyonu testi (Limit 5)
SELECT * FROM get_profile_posts('0e63429b-d0be-404a-8414-c941d5f33c6e', 5, 0);
