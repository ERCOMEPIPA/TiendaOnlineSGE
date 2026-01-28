import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendCouponEmail } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        console.log('📧 [API] Iniciando envío masivo de cupón...');
        
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

        if (coupon.customer_email) {
            console.error('❌ [API] Error: Este cupón es personalizado, no se puede enviar a todos');
            return new Response(JSON.stringify({
                success: false,
                error: 'Este cupón es personalizado. Use la opción de envío individual.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all unique customer emails from orders
        console.log('📧 [API] Obteniendo emails de clientes...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('customer_email, customer_name')
            .not('customer_email', 'is', null)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('❌ [API] Error al obtener clientes:', ordersError);
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
        console.log('📧 [API] Clientes únicos encontrados:', customerList.length);

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
            console.log(`📧 [API] Enviando a: ${email}`);
            
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
                
                // Track in coupon_emails table
                await supabase
                    .from('coupon_emails')
                    .insert({
                        coupon_id: couponId,
                        customer_email: email,
                        sent_at: new Date().toISOString()
                    });
            } else {
                results.failed++;
                results.errors.push(`${email}: ${emailResult.error || 'Error desconocido'}`);
                console.error(`❌ [API] Error enviando a ${email}:`, emailResult.error);
            }
        }

        // Update coupon to mark as sent
        await supabase
            .from('coupons')
            .update({
                sent_at: new Date().toISOString()
            })
            .eq('id', couponId);

        console.log('✅ [API] Proceso completado:', results);
        
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
        console.error('❌ [API] Error en send-coupon-to-all:', error);
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
