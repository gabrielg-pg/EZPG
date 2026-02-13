-- Add collections column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS collections TEXT;
