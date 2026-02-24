-- Add store_policies column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_policies TEXT;
