-- Stock Notifications Migration
-- Run this in Supabase SQL Editor

-- Create stock_notifications table
CREATE TABLE IF NOT EXISTS stock_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate notifications for same product/email
    UNIQUE(product_id, user_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_id ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_notified ON stock_notifications(notified) WHERE notified = FALSE;

-- RLS Policies
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

-- Users can create their own notification requests
CREATE POLICY "Users can create stock notifications" ON stock_notifications
    FOR INSERT
    WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON stock_notifications
    FOR SELECT
    USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admin can view all notifications
CREATE POLICY "Admin can view all stock notifications" ON stock_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Function to get pending notifications for a product
CREATE OR REPLACE FUNCTION get_pending_stock_notifications(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    user_email TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.id,
        sn.user_email,
        sn.user_id,
        sn.created_at
    FROM stock_notifications sn
    WHERE sn.product_id = p_product_id
    AND sn.notified = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as sent
CREATE OR REPLACE FUNCTION mark_notifications_sent(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE stock_notifications
    SET 
        notified = TRUE,
        notified_at = NOW()
    WHERE product_id = p_product_id
    AND notified = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
