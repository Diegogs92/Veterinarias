-- Agrega columna stock a productos
-- NULL = no se lleva control de unidades
-- 0+  = cantidad disponible (se descuenta con cada venta)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;
