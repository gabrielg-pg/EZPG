-- Add 'melhor_envio' to account_type constraint
ALTER TABLE store_accounts DROP CONSTRAINT IF EXISTS store_accounts_account_type_check;
ALTER TABLE store_accounts ADD CONSTRAINT store_accounts_account_type_check
  CHECK (account_type IN ('gmail', 'shopify', 'yampi', 'hostinger', 'appmax', 'hypersku', 'dsers', '1st_information', 'aliexpress', 'melhor_envio'));
