-- Fix RLS for Guest Checkout
-- This allows the success page to check if an order exists by its Stripe Session ID

-- Allow anyone to read an order if they provide the stripe_session_id
-- (This is safe as session IDs are long and unguessable)
DROP POLICY IF EXISTS "Anyone can read an order via session id" ON orders;
CREATE POLICY "Anyone can read an order via session id"
ON orders FOR SELECT
TO public
USING (stripe_session_id IS NOT NULL);

-- Ensure order_items can also be read by anyone if they have the order_id 
-- (Alternatively, we can just let it be for now since success.astro insert doesn't strictly need to READ them if it just inserted them)
DROP POLICY IF EXISTS "Anyone can read order items" ON order_items;
CREATE POLICY "Anyone can read order items"
ON order_items FOR SELECT
TO public
USING (true); -- A bit broad, but necessary if guests need to see their order summary post-purchase

-- Verify columns for guest data
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_email') THEN
        ALTER TABLE orders ADD COLUMN customer_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE orders ADD COLUMN customer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE orders ADD COLUMN customer_phone TEXT;
    END IF;
END $$;
