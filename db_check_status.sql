-- DETAYLI INDEX ANALİZİ
-- Bu script indexlerin sadece "var olup olmadığını" değil, 
-- aynı zamanda "geçerli" (valid) olup olmadığını da kontrol eder.

SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    idx.indisvalid AS is_valid, -- BURASI ÖNEMLİ: 't' (true) olmalı
    idx.indisready AS is_ready, -- BURASI ÖNEMLİ: 't' (true) olmalı
    pg_get_indexdef(idx.indexrelid) AS index_definition
FROM
    pg_class t,
    pg_class i,
    pg_index idx
WHERE
    t.oid = idx.indrelid
    AND i.oid = idx.indexrelid
    AND t.relname = 'posts'
ORDER BY
    is_valid, index_name;
