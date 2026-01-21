-- =====================================================
-- MIGRACIÓN COMPLETA PARA DEVOLUCIONES
-- Ejecuta esto en el SQL Editor de Supabase
-- =====================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- Asegurar que los registros existentes no tengan NULL en return_requested
UPDATE public.orders SET return_requested = FALSE WHERE return_requested IS NULL;
