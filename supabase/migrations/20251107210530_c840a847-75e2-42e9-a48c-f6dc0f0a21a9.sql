-- Add slug to replicated_catalogs for unique URLs
ALTER TABLE replicated_catalogs 
ADD COLUMN slug text UNIQUE;

-- Add replicated_catalog_id to quotes to track which replicated catalog generated the quote
ALTER TABLE quotes 
ADD COLUMN replicated_catalog_id uuid REFERENCES replicated_catalogs(id);

-- Create index for better performance
CREATE INDEX idx_quotes_replicated_catalog_id ON quotes(replicated_catalog_id);

-- Function to generate unique slug for replicated catalogs
CREATE OR REPLACE FUNCTION generate_replicated_catalog_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := 'r-' || substr(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert
CREATE TRIGGER set_replicated_catalog_slug
BEFORE INSERT ON replicated_catalogs
FOR EACH ROW
EXECUTE FUNCTION generate_replicated_catalog_slug();

-- Update existing replicated catalogs to have slugs
UPDATE replicated_catalogs 
SET slug = 'r-' || substr(md5(random()::text || id::text), 1, 8)
WHERE slug IS NULL;