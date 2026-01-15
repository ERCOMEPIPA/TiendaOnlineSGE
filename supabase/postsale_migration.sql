-- Post-Sale Management Migration
-- Run this in Supabase SQL Editor

-- =====================================================
-- STORED PROCEDURE: Cancelar pedido de forma atómica
-- Esta función cancela el pedido Y restaura el stock en una sola transacción
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_order_atomic(p_order_id UUID, p_user_email TEXT)
RETURNS JSON AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_result JSON;
BEGIN
    -- 1. Verificar que el pedido existe y pertenece al usuario
    SELECT * INTO v_order 
    FROM orders 
    WHERE id = p_order_id 
    AND customer_email = p_user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Pedido no encontrado o no pertenece al usuario'
        );
    END IF;
    
    -- 2. Verificar que el pedido está en estado cancelable (pending o confirmed, pero NO shipped/delivered/cancelled)
    IF v_order.status NOT IN ('pending', 'confirmed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'El pedido ya no puede ser cancelado (estado: ' || v_order.status || ')'
        );
    END IF;
    
    -- 3. Restaurar el stock de cada producto del pedido
    FOR v_item IN 
        SELECT oi.product_id, oi.quantity 
        FROM order_items oi 
        WHERE oi.order_id = p_order_id
    LOOP
        UPDATE products 
        SET stock = stock + v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id;
    END LOOP;
    
    -- 4. Cambiar el estado del pedido a 'cancelled'
    UPDATE orders 
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- 5. Devolver éxito
    RETURN json_build_object(
        'success', true,
        'message', 'Pedido cancelado correctamente y stock restaurado'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de cualquier error, la transacción se revierte automáticamente
        RETURN json_build_object(
            'success', false,
            'error', 'Error al cancelar el pedido: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION cancel_order_atomic(UUID, TEXT) TO anon, authenticated;

-- =====================================================
-- Añadir columna para tracking de devoluciones (opcional)
-- =====================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE;

COMMENT ON FUNCTION cancel_order_atomic IS 'Cancela un pedido de forma atómica: cambia el estado a cancelled y restaura el stock de todos los productos. Solo funciona para pedidos en estado pending o confirmed.';
