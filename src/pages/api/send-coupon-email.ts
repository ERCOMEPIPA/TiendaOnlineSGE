import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendCouponEmail } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('📧 [API] Iniciando envío de cupón por email...');
        
        const body = await request.json();
        const { couponId } = body;

        console.log('📧 [API] Coupon ID recibido:', couponId);

        if (!couponId) {
            console.error('❌ [API] Error: ID de cupón no proporcionado');
            return new Response(JSON.stringify({
                success: false,
                error: 'ID de cupón requerido'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get coupon details
        console.log('📧 [API] Buscando cupón en base de datos...');
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('id', couponId)
            .single();

        console.log('📧 [API] Resultado de búsqueda:', { coupon, error: couponError });

        if (couponError || !coupon) {
            console.error('❌ [API] Error: Cupón no encontrado');
            return new Response(JSON.stringify({
                success: false,
                error: 'Cupón no encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!coupon.customer_email) {
            console.error('❌ [API] Error: Cupón sin email de cliente');
            return new Response(JSON.stringify({
                success: false,
                error: 'Este cupón no tiene un email de cliente asignado'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Extract customer name from email (optional - could be improved with a users table lookup)
        const customerName = coupon.customer_email.split('@')[0];

        console.log('📧 [API] Preparando envío a:', coupon.customer_email);

        // Send email
        console.log('📧 [API] Llamando a sendCouponEmail...');
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

        console.log('📧 [API] Resultado del envío:', emailResult);

        if (!emailResult.success) {
            console.error('❌ [API] Error al enviar email:', emailResult.error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Error al enviar el email',
                details: emailResult.error
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('✅ [API] Email enviado correctamente');

        // Update coupon to mark as sent
        const { error: updateError } = await supabase
            .from('coupons')
            .update({
                sent_at: new Date().toISOString()
            })
            .eq('id', couponId);

        if (updateError) {
            console.error('⚠️ [API] Error updating coupon sent status:', updateError);
            // Continue anyway - email was sent successfully
        }

        // Track in coupon_emails table
        const { error: trackingError } = await supabase
            .from('coupon_emails')
            .insert({
                coupon_id: couponId,
                customer_email: coupon.customer_email,
                sent_at: new Date().toISOString()
            });

        if (trackingError) {
            console.error('⚠️ [API] Error tracking coupon email:', trackingError);
            // Continue anyway
        }

        console.log('✅ [API] Proceso completado exitosamente');
        
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
