-- Add tracking_config column to replicated_catalogs table
ALTER TABLE replicated_catalogs 
ADD COLUMN tracking_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN replicated_catalogs.tracking_config IS 'Marketing tracking configuration (Meta CAPI, TikTok, Google, etc.)';
