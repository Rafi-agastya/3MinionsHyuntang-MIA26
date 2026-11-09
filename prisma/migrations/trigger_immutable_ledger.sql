-- ==============================================================================
-- Migrasi SQL: Trigger Immutability untuk EntriKas, VerifikasiEntri, dan AuditLog
-- Sesuai PRD Bagian 43 & 44 (Penguncian di database, append-only ledger)
-- ==============================================================================

CREATE OR REPLACE FUNCTION prevent_update_or_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operasi % pada tabel % ditolak: ledger dan audit log bersifat append-only.', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk EntriKas
DROP TRIGGER IF EXISTS trg_entrikas_immutable ON "EntriKas";
CREATE TRIGGER trg_entrikas_immutable
BEFORE UPDATE OR DELETE ON "EntriKas"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();

-- Trigger untuk VerifikasiEntri
DROP TRIGGER IF EXISTS trg_verifikasientri_immutable ON "VerifikasiEntri";
CREATE TRIGGER trg_verifikasientri_immutable
BEFORE UPDATE OR DELETE ON "VerifikasiEntri"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();

-- Trigger untuk AuditLog
DROP TRIGGER IF EXISTS trg_auditlog_immutable ON "AuditLog";
CREATE TRIGGER trg_auditlog_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_update_or_delete();

