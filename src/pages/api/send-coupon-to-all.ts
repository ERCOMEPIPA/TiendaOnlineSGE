import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
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
        const { data: coupon, error: couponError } = await supabaseAdmin
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

        if (coupon.customer_email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Este cupón es personalizado. Use la opción de envío individual.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all unique customer emails from orders
        const { data: orders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name')
            .not('customer_email', 'is', null)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching customers:', ordersError.message);
            return new Response(JSON.stringify({
                success: false,
                error: 'Error al obtener lista de clientes'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get unique emails
        const uniqueCustomers = new Map();
        orders?.forEach(order => {
            if (order.customer_email && !uniqueCustomers.has(order.customer_email)) {
                uniqueCustomers.set(order.customer_email, order.customer_name || order.customer_email.split('@')[0]);
            }
        });

        const customerList = Array.from(uniqueCustomers.entries());

        if (customerList.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No hay clientes registrados para enviar el cupón'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send emails to all customers
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const [email, name] of customerList) {
            const emailResult = await sendCouponEmail({
                customerEmail: email,
                customerName: name,
                couponCode: coupon.code,
                description: coupon.description || 'Descuento especial',
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                validUntil: coupon.valid_until,
                minPurchase: coupon.min_purchase
            });

            if (emailResult.success) {
                results.success++;
                await supabaseAdmin
                    .from('coupon_emails')
                    .insert({
                        coupon_id: couponId,
                        customer_email: email,
                        sent_at: new Date().toISOString()
                    });
            } else {
                results.failed++;
                results.errors.push(`${email}: ${emailResult.error || 'Error desconocido'}`);
            }
        }

        // Update coupon to mark as sent
        await supabaseAdmin
            .from('coupons')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', couponId);

        return new Response(JSON.stringify({
            success: true,
            message: `Cupón enviado a ${results.success} de ${customerList.length} clientes`,
            details: {
                total: customerList.length,
                success: results.success,
                failed: results.failed,
                errors: results.errors
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in send-coupon-to-all:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
