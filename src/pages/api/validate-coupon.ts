import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        // Safely parse the request body
        let code = '';
        let cartTotal = 0;

        try {
            const body = await request.text();
            console.log('=== RAW REQUEST BODY ===', body);

            if (body) {
                const parsed = JSON.parse(body);
                code = parsed.code || '';
                cartTotal = parsed.cartTotal || 0;
            }
        } catch (parseError) {
            console.error('Error parsing body:', parseError);
            return new Response(JSON.stringify({
                valid: false,
                error: 'Error al procesar la solicitud'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
        console.log('=== VALIDATING COUPON ===');
        console.log('Code:', code.toUpperCase());
        console.log('Cart Total:', cartTotal);

        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        console.log('Query result - coupon:', coupon);
        console.log('Query result - error:', error);

        if (error || !coupon) {
            console.log('Coupon not found or error:', error?.message);
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
        console.error('=== COUPON VALIDATION ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Full error:', JSON.stringify(error, null, 2));
        return new Response(JSON.stringify({
            valid: false,
            error: 'Error al validar el cupón: ' + (error?.message || 'Error desconocido')
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
