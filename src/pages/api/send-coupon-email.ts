import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendCouponEmail } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { couponId } = body;

        if (!couponId) {
            return new Response(JSON.stringify({
                success: false,
                error: 'ID de cupón requerido'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get coupon details
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', couponId)
            .single();

        if (couponError || !coupon) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Cupón no encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!coupon.customer_email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Este cupón no tiene un email de cliente asignado'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const customerName = coupon.customer_email.split('@')[0];

        // Send email
        const emailResult = await sendCouponEmail({
            customerEmail: coupon.customer_email,
            customerName: customerName.charAt(0).toUpperCase() + customerName.slice(1),
            couponCode: coupon.code,
            description: coupon.description || 'Descuento especial',
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value,
            validUntil: coupon.valid_until,
            minPurchase: coupon.min_purchase
        });

        if (!emailResult.success) {
            console.error('Error sending coupon email:', emailResult.error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Error al enviar el email',
                details: emailResult.error
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update coupon to mark as sent
        await supabase
            .from('coupons')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', couponId);

        // Track in coupon_emails table
        await supabase
            .from('coupon_emails')
            .insert({
                coupon_id: couponId,
                customer_email: coupon.customer_email,
                sent_at: new Date().toISOString()
            });

        return new Response(JSON.stringify({
            success: true,
            message: 'Email enviado correctamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in send-coupon-email API:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
