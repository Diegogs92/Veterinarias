-- ============================================================
-- Agregar columna apellido a tabla owners
-- ============================================================

ALTER TABLE owners ADD COLUMN apellido TEXT;

-- Actualizar updated_at para owners existentes
UPDATE owners SET updated_at = NOW();
