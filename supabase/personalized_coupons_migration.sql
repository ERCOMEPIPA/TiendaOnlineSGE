-- =====================================================
-- FashionStore - Personalized Coupons Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor

-- Add fields to coupons table for personalization
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_personalized BOOLEAN DEFAULT FALSE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS sent_by TEXT;

-- Create index for personalized coupons lookup
CREATE INDEX IF NOT EXISTS idx_coupons_customer_email ON coupons(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_personalized ON coupons(is_personalized);

-- Update RLS policies to allow personalized coupons
-- Drop old policy if exists
DROP POLICY IF EXISTS "Public read active coupons" ON coupons;

-- New policy: Users can see their own personalized coupons or public ones
CREATE POLICY "Public read active coupons" 
    ON coupons FOR SELECT 
    USING (
        is_active = true 
        AND (
            customer_email IS NULL  -- Public coupons
            OR customer_email = auth.jwt()->>'email'  -- User's personalized coupons
        )
    );

-- Table for tracking coupon email sends
CREATE TABLE IF NOT EXISTS coupon_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    sent_by TEXT,
    opened_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email tracking
CREATE INDEX IF NOT EXISTS idx_coupon_emails_coupon ON coupon_emails(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_emails_customer ON coupon_emails(customer_email);

-- Enable RLS
ALTER TABLE coupon_emails ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_emails
CREATE POLICY "Admin can view all coupon emails" 
    ON coupon_emails FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert coupon emails" 
    ON coupon_emails FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Function to generate unique coupon code
CREATE OR REPLACE FUNCTION generate_unique_coupon_code(prefix TEXT DEFAULT 'PROMO')
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random code: PREFIX + 8 random uppercase alphanumeric chars
        new_code := prefix || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM coupons WHERE code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sample personalized coupons for testing
-- INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, valid_until, is_personalized, customer_email) VALUES
--     ('PERSONAL10USER1', 'Descuento personal 10%', 'percentage', 10, 0, 1, NOW() + INTERVAL '30 days', true, 'user@example.com');

COMMENT ON COLUMN coupons.customer_email IS 'Email del cliente al que va dirigido el cupón personalizado. NULL = cupón público';
COMMENT ON COLUMN coupons.is_personalized IS 'Indica si el cupón es personalizado para un cliente específico';
COMMENT ON COLUMN coupons.sent_at IS 'Fecha y hora en que se envió el cupón por email';
COMMENT ON COLUMN coupons.sent_by IS 'Email del administrador que envió el cupón';
COMMENT ON TABLE coupon_emails IS 'Registro de envíos de cupones por email';
