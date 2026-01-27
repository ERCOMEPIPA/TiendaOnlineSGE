import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

// Función para enviar email usando nodemailer (mismo sistema que otros emails)
async function sendNewsletterWelcomeEmail(email: string, name: string | null) {
    try {
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
                user: import.meta.env.GMAIL_USER,
                pass: import.meta.env.GMAIL_APP_PASSWORD
            }
        });

        const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; background: #ffffff; }
        .welcome-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: inline-block; padding: 8px 20px; border-radius: 50px; font-weight: bold; margin-bottom: 20px; }
        .benefits { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .benefit { display: flex; align-items: center; margin: 12px 0; }
        .benefit-icon { font-size: 20px; margin-right: 12px; }
        .cta-button { display: inline-block; background: #1a1a2e; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; color: #666; font-size: 12px; }
        .social-links { margin: 15px 0; }
        .social-links a { margin: 0 10px; color: #1a1a2e; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ HYPESTAGE</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Moda masculina premium</p>
        </div>
        <div class="content">
            <div class="welcome-badge">🎉 ¡Bienvenido!</div>
            <h2 style="color: #1a1a2e; margin-top: 0;">Gracias por unirte a nuestra comunidad</h2>
            <p>Hola${name ? ` ${name}` : ''},</p>
            <p>¡Estamos emocionados de tenerte con nosotros! Ahora formas parte de una comunidad exclusiva de amantes de la moda masculina.</p>
            
            <div class="benefits">
                <h3 style="margin-top: 0; color: #1a1a2e;">Como suscriptor, recibirás:</h3>
                <div class="benefit">
                    <span class="benefit-icon">🏷️</span>
                    <span><strong>Descuentos exclusivos</strong> solo para suscriptores</span>
                </div>
                <div class="benefit">
                    <span class="benefit-icon">👔</span>
                    <span><strong>Acceso anticipado</strong> a nuevas colecciones</span>
                </div>
                <div class="benefit">
                    <span class="benefit-icon">💡</span>
                    <span><strong>Tips de estilo</strong> y tendencias de moda</span>
                </div>
                <div class="benefit">
                    <span class="benefit-icon">🎁</span>
                    <span><strong>Ofertas especiales</strong> en fechas señaladas</span>
                </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">Como agradecimiento por suscribirte, usa el código <strong style="color: #1a1a2e;">BIENVENIDO10</strong> para obtener un 10% de descuento en tu primera compra.</p>
        </div>
        <div class="footer">
            <p><strong>HYPESTAGE</strong> - Moda masculina premium</p>
            <p>© ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
            <p style="font-size: 11px; color: #999;">
                Recibes este email porque te suscribiste a nuestro newsletter.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `HYPESTAGE <${import.meta.env.GMAIL_USER}>`,
            to: email,
            subject: '✨ ¡Bienvenido a HYPESTAGE! Tu código de descuento dentro',
            html: welcomeHtml,
        });

        console.log('Newsletter welcome email sent to:', email);
        return { success: true };
    } catch (error) {
        console.error('Error sending newsletter welcome email:', error);
        return { success: false, error };
    }
}

/**
 * POST /api/newsletter
 * Suscribe un email al newsletter
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, name, source = 'website' } = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ success: false, error: 'Email requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ success: false, error: 'Formato de email inválido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Intentar insertar o actualizar si ya existe pero está inactivo
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            if (existing.is_active) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Este email ya está suscrito' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            } else {
                // Reactivar suscripción
                await supabase
                    .from('newsletter_subscribers')
                    .update({
                        is_active: true,
                        unsubscribed_at: null,
                        subscribed_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
            }
        } else {
            // Nueva suscripción
            const { error: insertError } = await supabase
                .from('newsletter_subscribers')
                .insert({
                    email: email.toLowerCase(),
                    name: name || null,
                    source: source,
                });

            if (insertError) {
                console.error('Error inserting subscriber:', insertError);
                return new Response(
                    JSON.stringify({ success: false, error: 'Error al procesar la suscripción' }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Enviar email de bienvenida usando Gmail
        try {
            await sendNewsletterWelcomeEmail(email, name || null);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continuamos aunque falle el email
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: '¡Suscripción completada! Revisa tu email para tu código de descuento.'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in newsletter API:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
