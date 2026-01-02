-- Index Durumunu Kontrol Et
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename = 'posts'
ORDER BY indexname;

-- Aktif ve Kilitli Sorguları Göster (Durum Analizi)
SELECT pid, state, query, age(clock_timestamp(), query_start) as duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
