-- Add unique constraint for catalog subscriptions to prevent duplicates
ALTER TABLE catalog_subscriptions
ADD CONSTRAINT catalog_subscriptions_subscriber_catalog_unique 
UNIQUE (subscriber_id, original_catalog_id);