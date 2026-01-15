-- Invoicing System Migration
-- Run this in Supabase SQL Editor

-- 1. Añadir campos de facturación a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_id TEXT; -- NIF/CIF
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_city TEXT;

-- 2. Índice para búsquedas por número de factura
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);

-- 3. Función para generar el siguiente número de factura
-- Formato: FYYYY-XXXX (Ej: F2026-0001)
CREATE OR REPLACE FUNCTION generate_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    last_number INTEGER;
    new_invoice_number TEXT;
BEGIN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Obtener el último número usado este año
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 7) AS INTEGER)), 0)
    INTO last_number
    FROM orders
    WHERE invoice_number LIKE 'F' || current_year || '-%';
    
    new_invoice_number := 'F' || current_year || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
    
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;
