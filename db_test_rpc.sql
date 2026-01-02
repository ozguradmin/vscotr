-- RPC Test Script
-- Ozgur'un UUID'si ile fonksiyonu manuel çağırıp veri geliyor mu bakıyoruz.

-- 1. Ozgur'un ID'sini bul (veya loglardan aldığımız ID'yi kullan)
-- Logdaki ID: 0e63429b-d0be-404a-8414-c941d5f33c6e

SELECT * FROM get_profile_posts(
  '0e63429b-d0be-404a-8414-c941d5f33c6e', -- p_user_id
  15, -- p_limit
  0   -- p_offset
);
