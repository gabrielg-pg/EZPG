-- Create user_roles junction table for multiple roles per user
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'comercial', 'manager', 'user')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Migrate existing roles from users table to user_roles table
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
