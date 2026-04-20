-- ============================================================
-- Nuevas tablas: peluquería, pensionados, consultas
-- ============================================================

-- ── PELUQUERÍA ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grooming_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id       UUID REFERENCES pets(id) ON DELETE SET NULL,
  owner_id     UUID REFERENCES owners(id) ON DELETE SET NULL,
  date         DATE NOT NULL,
  services     TEXT[] DEFAULT '{}',
  price        NUMERIC(10,2) DEFAULT 0,
  observations TEXT,
  status       TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','scheduled')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ── PENSIONADOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boarding (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id       UUID REFERENCES pets(id) ON DELETE SET NULL,
  owner_id     UUID REFERENCES owners(id) ON DELETE SET NULL,
  entry_date   DATE NOT NULL,
  exit_date    DATE,
  daily_price  NUMERIC(10,2) DEFAULT 0,
  feeding      TEXT,
  observations TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ── CONSULTAS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultas (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id               UUID REFERENCES pets(id) ON DELETE SET NULL,
  owner_id             UUID REFERENCES owners(id) ON DELETE SET NULL,
  date                 DATE NOT NULL,
  type                 TEXT NOT NULL DEFAULT 'consultorio' CHECK (type IN ('consultorio','domicilio')),
  reason               TEXT NOT NULL,
  diagnosis            TEXT,
  treatment            TEXT,
  -- consultorio
  medications_provided BOOLEAN DEFAULT FALSE,
  medications_detail   TEXT,
  xrays                BOOLEAN DEFAULT FALSE,
  xrays_notes          TEXT,
  -- domicilio
  address              TEXT,
  -- pricing
  price                NUMERIC(10,2) DEFAULT 0,
  payment_status       TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE grooming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boarding          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas         ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (same pattern as rest of app)
DROP POLICY IF EXISTS "auth_all_grooming"  ON grooming_sessions;
DROP POLICY IF EXISTS "auth_all_boarding"  ON boarding;
DROP POLICY IF EXISTS "auth_all_consultas" ON consultas;

CREATE POLICY "auth_all_grooming"  ON grooming_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_boarding"  ON boarding          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_consultas" ON consultas         FOR ALL TO authenticated USING (true) WITH CHECK (true);
