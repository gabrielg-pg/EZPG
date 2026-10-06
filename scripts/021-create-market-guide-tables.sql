CREATE TABLE IF NOT EXISTS pg_market_guides (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  flag VARCHAR(16) NOT NULL DEFAULT '🌐',
  language VARCHAR(100) NOT NULL DEFAULT '',
  currency VARCHAR(40) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pg_market_guide_sections (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES pg_market_guides(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  section_key VARCHAR(80),
  section_type VARCHAR(30) NOT NULL DEFAULT 'text' CHECK (section_type IN ('text', 'key_value', 'table')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pg_market_guide_sections_market_sort_order
  ON pg_market_guide_sections (market_id, sort_order, id);
