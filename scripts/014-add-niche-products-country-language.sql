-- Script 014: Add niche, num_products, country, language columns to stores
-- Also update account_type constraint to include '1st_information'

-- Add new columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS niche VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS num_products INTEGER;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS language VARCHAR(100);

-- Update account_type constraint to include '1st_information'
ALTER TABLE store_accounts DROP CONSTRAINT IF EXISTS store_accounts_account_type_check;
ALTER TABLE store_accounts ADD CONSTRAINT store_accounts_account_type_check 
CHECK (account_type IN ('gmail', 'shopify', 'yampi', 'hostinger', 'appmax', 'hypersku', 'dsers', '1st_information', 'aliexpress'));
