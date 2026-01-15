-- Guest Checkout Migration
-- Run this in Supabase SQL Editor

-- 1. Hacer user_id nullable en orders para permitir invitados
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Asegurar que tenemos campos para datos del cliente
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
-- customer_email y customer_name ya deberían existir (verificar)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT; 
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Índice para búsquedas por email (útil para invitados que consulten pedidos)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
