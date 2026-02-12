-- Script 015: Add logo_references_url column to stores
-- Stores the Vercel Blob URL for uploaded logo reference files (.zip/.rar)

ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_references_url TEXT;
