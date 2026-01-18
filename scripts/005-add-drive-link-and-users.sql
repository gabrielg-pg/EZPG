-- Adicionar coluna drive_link à tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS drive_link TEXT;

-- Adicionar comercial role e atualizar constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user', 'comercial'));

-- Adicionar status Pendente como default para reuniões
ALTER TABLE meetings ALTER COLUMN status SET DEFAULT 'Pendente';

-- Atualizar/Inserir usuários comerciais (Gabriel Gerber e Alisson Jordi)
INSERT INTO users (username, email, password_hash, name, role, status)
VALUES 
  ('gabriel.gerber', 'gabriel.gerber@progrowth.com', 'placeholder', 'Gabriel Gerber', 'comercial', 'ativo'),
  ('alisson.jordi', 'alisson.jordi@progrowth.com', 'placeholder', 'Alisson Jordi', 'comercial', 'ativo'),
  ('guilherme', 'guilherme@progrowth.com', 'placeholder', 'Guilherme', 'comercial', 'ativo')
ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;
