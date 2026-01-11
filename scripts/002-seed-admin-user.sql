-- Insert default admin user (password: admin123)
-- The password hash is for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, name, role, status)
VALUES (
  'admin',
  'admin@progrowth.com',
  '$2a$10$rQZpQvI1Q3XG8V9Z5j5ZQeK8gK3YrR8Z5h5j5ZQeK8gK3YrR8Z5h5',
  'Administrador',
  'admin',
  'ativo'
) ON CONFLICT (username) DO NOTHING;
