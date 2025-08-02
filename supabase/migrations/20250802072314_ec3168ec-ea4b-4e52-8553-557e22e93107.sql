
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic';

-- Add missing columns to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS smart_analysis JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_credits INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_cost_mxn DECIMAL(10,2) DEFAULT 0.20;
