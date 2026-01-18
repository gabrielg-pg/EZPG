-- Adicionar Gabriel Gerber e Alisson Jordi como usuários comerciais
-- Esses são os únicos que aparecerão nas opções de atendente/realizador

-- Adicionar Gabriel Gerber (comercial)
INSERT INTO users (username, name, password_hash, role, status) 
VALUES (
  'gabriel.gerber',
  'Gabriel Gerber',
  'not_for_login',
  'comercial',
  'ativo'
) ON CONFLICT (username) DO UPDATE SET name = 'Gabriel Gerber', role = 'comercial', status = 'ativo';

-- Adicionar Alisson Jordi (comercial)
INSERT INTO users (username, name, password_hash, role, status) 
VALUES (
  'alisson.jordi',
  'Alisson Jordi',
  'not_for_login',
  'comercial',
  'ativo'
) ON CONFLICT (username) DO UPDATE SET name = 'Alisson Jordi', role = 'comercial', status = 'ativo';

-- Adicionar Guilherme (comercial)
INSERT INTO users (username, name, password_hash, role, status) 
VALUES (
  'guilherme',
  'Guilherme',
  'not_for_login',
  'comercial',
  'ativo'
) ON CONFLICT (username) DO UPDATE SET name = 'Guilherme', role = 'comercial', status = 'ativo';
