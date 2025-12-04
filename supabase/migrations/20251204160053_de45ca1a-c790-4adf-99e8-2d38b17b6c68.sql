-- Add subdomain field to business_info for custom catalog URLs
ALTER TABLE public.business_info 
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Add constraint for valid subdomain format (lowercase, alphanumeric, hyphens)
ALTER TABLE public.business_info 
ADD CONSTRAINT valid_subdomain_format 
CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$');

-- Create index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_business_info_subdomain ON public.business_info(subdomain) WHERE subdomain IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.business_info.subdomain IS 'Custom subdomain for public catalog access (e.g., mi-tienda.catifypro.com)';