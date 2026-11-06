-- ==============================================================================
-- Migrasi SQL: Ekstensi pg_trgm dan Indeks GIN Trigram untuk Proposal
-- Sesuai PRD Bagian 29.5 & Paket BE-10 (Akselerasi similarity narasi proposal)
-- ==============================================================================

-- 1. Mengaktifkan ekstensi pg_trgm jika belum aktif
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Membuat indeks GIN Trigram pada kolom narasi metode kerja
CREATE INDEX IF NOT EXISTS idx_proposal_narasi_metode_trgm 
ON "Proposal" USING gin ("narasiMetode" gin_trgm_ops);

-- 3. Membuat indeks GIN Trigram pada kolom narasi jadwal pelaksanaan
CREATE INDEX IF NOT EXISTS idx_proposal_narasi_jadwal_trgm 
ON "Proposal" USING gin ("narasiJadwal" gin_trgm_ops);

-- 4. Membuat indeks GIN Trigram pada kolom narasi mitigasi risiko
CREATE INDEX IF NOT EXISTS idx_proposal_narasi_risiko_trgm 
ON "Proposal" USING gin ("narasiRisiko" gin_trgm_ops);

