-- Create demandas (tasks) table
CREATE TABLE IF NOT EXISTS demandas (
  id SERIAL PRIMARY KEY,
  member_id VARCHAR(10) NOT NULL, -- 'alisson', 'luiz_gabriel', 'luis_claudio'
  title TEXT NOT NULL,
  label VARCHAR(20) NOT NULL DEFAULT 'rotina', -- 'hoje', 'urgente', 'rotina'
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_date DATE, -- For tracking daily completions
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_demandas_member_id ON demandas(member_id);
CREATE INDEX IF NOT EXISTS idx_demandas_completed ON demandas(completed);
CREATE INDEX IF NOT EXISTS idx_demandas_completed_date ON demandas(completed_date);
