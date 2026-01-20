-- Migration: Add discount fields to products table
-- Run this in your Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_price INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN products.discount_price IS 'Discounted price in cents (null = no discount)';
COMMENT ON COLUMN products.discount_end_date IS 'When the discount expires (null = no expiration)';

-- Optional: Create index for querying active discounts
CREATE INDEX IF NOT EXISTS idx_products_discount_active 
ON products (discount_end_date) 
WHERE discount_price IS NOT NULL;
