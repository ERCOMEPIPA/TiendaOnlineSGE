-- =====================================================
-- FashionStore - Coupons Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL, -- Percentage (10 = 10%) or fixed amount in cents (1000 = 10€)
    min_purchase INTEGER DEFAULT 0, -- Minimum purchase amount in cents
    max_uses INTEGER, -- NULL = unlimited
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick coupon lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
CREATE POLICY "Public read active coupons" 
    ON coupons FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage coupons" 
    ON coupons FOR ALL 
    USING (auth.role() = 'authenticated');

-- Add coupon_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Sample coupons for testing
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, valid_until) VALUES
    ('WELCOME10', 'Descuento de bienvenida 10%', 'percentage', 10, 0, NULL, '2026-12-31'),
    ('SAVE5', 'Ahorra 5€ en tu compra', 'fixed', 500, 2000, 100, '2026-06-30'),
    ('VIP20', 'Descuento VIP 20%', 'percentage', 20, 5000, 50, '2026-03-31')
ON CONFLICT (code) DO NOTHING;
