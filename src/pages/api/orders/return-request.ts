import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getUserSession } from '../../../lib/auth';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

/**
 * POST /api/orders/return-request
 * Solicita una devolución para un pedido entregado
 * Envía un email con instrucciones al cliente
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

        // Verificar que el pedido existe, pertenece al usuario y está entregado
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .eq('customer_email', userEmail)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ success: false, error: 'Pedido no encontrado' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (order.status !== 'delivered') {
            return new Response(
                JSON.stringify({ success: false, error: 'Solo se pueden devolver pedidos entregados' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Marcar que se ha solicitado devolución
        await supabase
            .from('orders')
            .update({
                return_requested: true,
                return_requested_at: new Date().toISOString()
            })
            .eq('id', orderId);

        // Preparar lista de productos
        const productsList = order.order_items
            ?.map((item: any) => `• ${item.product_name} (Talla: ${item.size}) x${item.quantity}`)
            .join('\n') || 'No hay productos';

        // Enviar email con instrucciones de devolución
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .box { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .address { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
        .info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 15px 0; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1a1a2e; font-size: 18px; }
        ul { padding-left: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Solicitud de Devolución</h1>
            <p>Pedido #${orderId.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="content">
            <p>Hola ${order.customer_name || 'Cliente'},</p>
            <p>Hemos recibido tu solicitud de devolución. A continuación encontrarás todas las instrucciones necesarias:</p>
            
            <div class="box">
                <h2>📋 Productos a devolver:</h2>
                <pre style="font-family: inherit; white-space: pre-wrap;">${productsList}</pre>
            </div>

            <div class="address">
                <h2>📍 Dirección de envío:</h2>
                <p><strong>Debes enviar los artículos en su embalaje original a:</strong></p>
                <p style="font-size: 16px; font-weight: bold;">
                    Calle de la Moda 123<br>
                    Polígono Industrial<br>
                    28001 Madrid, España
                </p>
            </div>

            <div class="info">
                <h2>🏷️ Etiqueta de devolución:</h2>
                <p><strong>Adjuntamos la etiqueta de devolución prepagada a este correo.</strong> Imprímela y pégala en el exterior del paquete.</p>
                <p>Nombre del archivo: <code>etiqueta-devolucion-${orderId.slice(0, 8).toUpperCase()}.jpg</code></p>
            </div>

            <div class="box">
                <h2>📝 Pasos a seguir:</h2>
                <ol>
                    <li>Empaqueta los productos en su embalaje original</li>
                    <li>Imprime y pega la etiqueta de devolución</li>
                    <li>Lleva el paquete a cualquier oficina de correos o punto de recogida</li>
                    <li>Guarda el resguardo de envío</li>
                </ol>
            </div>

            <div class="warning">
                <h2>⚠️ Información importante sobre el reembolso:</h2>
                <p><strong>Una vez recibido y validado el paquete en nuestros almacenes, el reembolso se procesará en tu método de pago original en un plazo de 5 a 7 días hábiles.</strong></p>
                <p>Te notificaremos por email cuando recibamos tu devolución y cuando se procese el reembolso.</p>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Gracias por confiar en FashionStore.</p>
        </div>
        <div class="footer">
            <p>© 2024 FashionStore - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>
        `;

        // Enviar el email con la etiqueta adjunta
        try {
            // Leer la imagen de la etiqueta
            const etiquetaPath = path.join(process.cwd(), 'public', 'assets', 'etiqueta-devolucion.jpg');
            let attachments: any[] = [];

            if (fs.existsSync(etiquetaPath)) {
                const etiquetaBuffer = fs.readFileSync(etiquetaPath);
                attachments = [{
                    filename: `etiqueta-devolucion-${orderId.slice(0, 8).toUpperCase()}.jpg`,
                    content: etiquetaBuffer,
                }];
            }

            await resend.emails.send({
                from: 'FashionStore <onboarding@resend.dev>',
                to: [userEmail],
                subject: `📦 Instrucciones de devolución - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
                html: emailHtml,
                attachments: attachments,
            });
        } catch (emailError) {
            console.error('Error sending return email:', emailError);
            // Continuamos aunque falle el email
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Solicitud de devolución registrada. Hemos enviado las instrucciones a tu email.'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in return request API:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
