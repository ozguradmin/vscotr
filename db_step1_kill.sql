-- Adım 1: Takılı kalmış ve sistemi kilitleyen sorguları temizleme
-- Bu komut sadece 5 dakikadan uzun süren boşta veya aktif sorguları sonlandırır.

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE (state = 'idle in transaction' AND state_change < current_timestamp - INTERVAL '5 minutes')
   OR (state = 'active' AND query_start < current_timestamp - INTERVAL '2 minutes')
   AND pid <> pg_backend_pid(); -- Kendi bağlantımızı koparmayalım
