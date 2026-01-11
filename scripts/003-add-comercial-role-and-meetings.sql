-- Adiciona role 'comercial' e tabela meetings

-- Atualiza constraint de role na tabela users para incluir 'comercial'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'comercial', 'manager', 'user'));

-- Cria tabela de reuniões
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  attendant_user_id INTEGER NOT NULL REFERENCES users(id),
  performer_user_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL CHECK (reason IN ('Mentoria', 'Planos')),
  status TEXT NOT NULL DEFAULT 'Talvez' CHECK (status IN ('Compra', 'Talvez', 'Não compra')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Impede duas reuniões no mesmo horário do mesmo dia
  UNIQUE(meeting_date, meeting_time)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meetings_updated_at_trigger ON meetings;
CREATE TRIGGER meetings_updated_at_trigger
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_attendant ON meetings(attendant_user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_performer ON meetings(performer_user_id);
