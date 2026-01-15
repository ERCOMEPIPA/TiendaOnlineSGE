import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getUserSession } from '../../../lib/auth';

export const prerender = false;

/**
 * POST /api/orders/cancel
 * Cancela un pedido de forma atómica usando el stored procedure
 * Solo funciona si el pedido está en estado 'pending' o 'confirmed'
 */
export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Verificar autenticación
        const userSession = await getUserSession(cookies);
        if (!userSession?.user) {
            return new Response(
                JSON.stringify({ success: false, error: 'No autenticado' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(
                JSON.stringify({ success: false, error: 'ID de pedido requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const userEmail = userSession.user.email;

        // Llamar al stored procedure atómico
        const { data, error } = await supabase.rpc('cancel_order_atomic', {
            p_order_id: orderId,
            p_user_email: userEmail
        });

        if (error) {
            console.error('Error calling cancel_order_atomic:', error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // El stored procedure devuelve un JSON con { success, message/error }
        if (data && data.success) {
            return new Response(
                JSON.stringify({ success: true, message: data.message }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        } else {
            return new Response(
                JSON.stringify({ success: false, error: data?.error || 'Error desconocido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

    } catch (error: any) {
        console.error('Error in cancel order API:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
