-- Add zona_execucao role by updating the CHECK constraints

-- Update user_roles table constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'comercial', 'manager', 'user', 'zona_execucao'));

-- Update users table constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'comercial', 'manager', 'user', 'zona_execucao'));
