import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async () => {
    try {
        // Call the database function to generate unique code
        const { data, error } = await supabase
            .rpc('generate_unique_coupon_code', {
                prefix: 'PROMO'
            });

        if (error) {
            console.error('Error generating coupon code:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Error al generar código'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            code: data
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in generate-coupon-code API:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
