import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        // Parse request body
        const body = await request.json();
        const code = body.code?.trim().toUpperCase() || '';
        const cartTotal = body.cartTotal || 0;

        if (!code) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Código de cupón requerido'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find the coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Cupón no válido o expirado'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check validity dates
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Este cupón aún no está activo'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Este cupón ha expirado'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check max uses
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Este cupón ha alcanzado su límite de usos'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check minimum purchase
        if (cartTotal < coupon.min_purchase) {
            const minAmount = (coupon.min_purchase / 100).toFixed(2);
            return new Response(JSON.stringify({
                valid: false,
                error: `Compra mínima de ${minAmount}€ requerida`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round(cartTotal * (coupon.discount_value / 100));
        } else {
            discountAmount = coupon.discount_value;
        }

        // Make sure discount doesn't exceed cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        return new Response(JSON.stringify({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            },
            discountAmount,
            message: coupon.description || `Descuento de ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : (coupon.discount_value / 100).toFixed(2) + '€'} aplicado`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Coupon validation error:', error?.message);
        return new Response(JSON.stringify({
            valid: false,
            error: 'Error al validar el cupón'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
