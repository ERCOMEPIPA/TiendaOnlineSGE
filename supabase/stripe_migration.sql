-- Migración para agregar soporte de Stripe a la tabla de orders

-- Agregar columnas para Stripe y autenticación
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Hacer opcionales algunos campos que se llenan después con el webhook
ALTER TABLE orders ALTER COLUMN shipping_address DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_city DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN shipping_postal_code DROP NOT NULL;

-- Agregar índice para búsquedas rápidas por session_id
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

-- Actualizar tabla order_items para simplificar (guardar solo el precio al momento de la compra)
ALTER TABLE order_items DROP COLUMN IF EXISTS product_name;
ALTER TABLE order_items DROP COLUMN IF EXISTS product_price;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;

-- Habilitar RLS para orders y order_items
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para orders (solo usuarios autenticados pueden ver/modificar)
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

-- Políticas para order_items (solo usuarios autenticados pueden ver/modificar)
DROP POLICY IF EXISTS "Authenticated users can read order items" ON order_items;
CREATE POLICY "Authenticated users can read order items" 
  ON order_items FOR SELECT 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" 
  ON order_items FOR INSERT 
  WITH CHECK (true);
