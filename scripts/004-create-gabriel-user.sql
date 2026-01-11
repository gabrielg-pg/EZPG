-- Remove o usuário admin padrão
DELETE FROM users WHERE username = 'admin';

-- Insere o usuário GabrielPG com permissões máximas (admin)
-- A senha 'Gab211223@' foi hasheada com bcrypt (cost 10)
INSERT INTO users (username, email, password_hash, name, role, status)
VALUES (
  'GabrielPG',
  'gabriel@progrowth.com',
  '$2a$10$Ks3J5MqT9.Y2XwZ1rQ8Kj.hN7vL4mP6oR8tW0xY2zE4fA6gC8iK3O',
  'Gabriel',
  'admin',
  'ativo'
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;
