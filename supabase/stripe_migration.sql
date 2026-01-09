-- Migración para soporte de Stripe y emails
-- Ejecutar en Supabase SQL Editor si aún no se ha ejecutado

-- Agregar columnas para Stripe y autenticación a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Hacer opcionales algunos campos que se pueden llenar después
ALTER TABLE orders ALTER COLUMN shipping_address DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_city DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_postal_code DROP NOT NULL;

-- Agregar índice para búsquedas rápidas por session_id
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Habilitar RLS para orders y order_items
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
CREATE POLICY "Authenticated users can read orders" 
  ON orders FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" 
  ON orders FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders" 
  ON orders FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Políticas para order_items
DROP POLICY IF EXISTS "Authenticated users can read order items" ON order_items;
CREATE POLICY "Authenticated users can read order items" 
  ON order_items FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" 
  ON order_items FOR INSERT 
  WITH CHECK (true);
