-- =====================================================
-- MIGRATION: Preserve search_logs on catalog deletion
-- Changes FK constraint from CASCADE to SET NULL
-- =====================================================

-- Step 1: Make catalog_id nullable (required for SET NULL)
ALTER TABLE public.search_logs 
ALTER COLUMN catalog_id DROP NOT NULL;

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE public.search_logs 
DROP CONSTRAINT IF EXISTS search_logs_catalog_id_fkey;

-- Step 3: Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.search_logs 
ADD CONSTRAINT search_logs_catalog_id_fkey 
FOREIGN KEY (catalog_id) 
REFERENCES public.digital_catalogs(id) 
ON DELETE SET NULL;

-- Add a comment explaining the design decision
COMMENT ON COLUMN public.search_logs.catalog_id IS 
'Reference to catalog. SET NULL on delete to preserve analytics history.';