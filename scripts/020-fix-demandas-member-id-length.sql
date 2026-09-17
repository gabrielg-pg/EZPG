-- Fix member_id column length to accommodate longer member identifiers
ALTER TABLE demandas ALTER COLUMN member_id TYPE VARCHAR(50);
