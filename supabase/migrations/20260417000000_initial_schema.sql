-- ============================================================
-- VetAdmin — Schema inicial
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USUARIOS (perfiles) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  username    TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('developer','owner','employee','vet','receptionist')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- ── PROPIETARIOS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  address     TEXT,
  discount    NUMERIC(5,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- ── MASCOTAS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT,
  breed       TEXT,
  birth_date  DATE,
  weight      NUMERIC(6,2),
  sex         TEXT CHECK (sex IN ('male','female','unknown')),
  notes       TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- ── TURNOS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID REFERENCES pets(id) ON DELETE SET NULL,
  owner_id    UUID REFERENCES owners(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  time        TIME,
  reason      TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- ── CONSULTAS (HISTORIAL CLÍNICO) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id          UUID REFERENCES pets(id) ON DELETE SET NULL,
  date            DATE NOT NULL,
  reason          TEXT NOT NULL,
  diagnosis       TEXT,
  treatment       TEXT,
  medication      TEXT,
  observations    TEXT,
  price           NUMERIC(12,2) DEFAULT 0,
  payment_status  TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid','partial')),
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- ── VACUNAS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vaccines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  next_date   DATE,
  batch       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- ── CATEGORÍAS DE PRODUCTOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCTOS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  category_id  UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  in_stock     BOOLEAN DEFAULT TRUE,
  barcode      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ── VENTAS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID REFERENCES owners(id) ON DELETE SET NULL,
  pet_id          UUID REFERENCES pets(id) ON DELETE SET NULL,
  discount        NUMERIC(5,2) DEFAULT 0,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  payment_status  TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid','partial')),
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  date            DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- ── ITEMS DE VENTA ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id       UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price    NUMERIC(12,2) NOT NULL,
  subtotal      NUMERIC(12,2) NOT NULL
);

-- ── INTERNACIONES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id          UUID REFERENCES pets(id) ON DELETE SET NULL,
  owner_id        UUID REFERENCES owners(id) ON DELETE SET NULL,
  reason          TEXT,
  admission_date  DATE NOT NULL,
  estimated_days  INTEGER,
  daily_rate      NUMERIC(12,2) DEFAULT 0,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','discharged')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- ── NOTAS DIARIAS DE INTERNACIÓN ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internment_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internment_id   UUID NOT NULL REFERENCES internments(id) ON DELETE CASCADE,
  note            TEXT NOT NULL,
  date            TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MOVIMIENTOS DE CAJA (solo egresos manuales) ───────────────────────────────
CREATE TABLE IF NOT EXISTS cash_movements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income','expense')),
  category     TEXT,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date         DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ── DEUDAS (generadas automáticamente) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES owners(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL CHECK (source_type IN ('sale','consultation')),
  source_id     UUID NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  paid_amount   NUMERIC(12,2) DEFAULT 0,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','partial','paid')),
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ,
  UNIQUE (source_type, source_id)
);

-- ── PAGOS DE DEUDA ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debt_payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id     UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  owner_id    UUID REFERENCES owners(id) ON DELETE SET NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date        DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_username     ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active    ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_pets_owner_id         ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id   ON appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_owner_id ON appointments(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date     ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_consultations_pet_id  ON consultations(pet_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date    ON consultations(date);
CREATE INDEX IF NOT EXISTS idx_vaccines_pet_id       ON vaccines(pet_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode      ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_owner_id        ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_date            ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_internments_pet_id    ON internments(pet_id);
CREATE INDEX IF NOT EXISTS idx_internment_notes_id   ON internment_notes(internment_id);
CREATE INDEX IF NOT EXISTS idx_debts_owner_id        ON debts(owner_id);
CREATE INDEX IF NOT EXISTS idx_debts_source          ON debts(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE internments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE internment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments    ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total para usuarios autenticados (todos los roles)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','owners','pets','appointments','consultations','vaccines',
    'product_categories','products','sales','sale_items',
    'internments','internment_notes','cash_movements','debts','debt_payments'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "authenticated_full_access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- ── FUNCIÓN updated_at AUTOMÁTICO ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','owners','pets','appointments','consultations','vaccines',
    'products','sales','internments','cash_movements','debts'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;
