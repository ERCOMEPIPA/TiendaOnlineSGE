-- =====================================================
-- MIGRACIÓN: Estados de devolución
-- Ejecuta esto en el SQL Editor de Supabase
-- =====================================================

-- Añadir columnas para gestión completa del ciclo de devolución
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_status TEXT DEFAULT NULL 
  CHECK (return_status IS NULL OR return_status IN ('pending', 'approved', 'rejected', 'received', 'refunded')),
ADD COLUMN IF NOT EXISTS return_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_admin_notes TEXT;

-- Actualizar pedidos existentes con solicitud de devolución para que tengan estado 'pending'
UPDATE public.orders 
SET return_status = 'pending' 
WHERE return_requested = TRUE AND return_status IS NULL;

-- Índice para búsquedas rápidas por estado de devolución
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON public.orders(return_status);
CREATE INDEX IF NOT EXISTS idx_orders_return_requested ON public.orders(return_requested);
