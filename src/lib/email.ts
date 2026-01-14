import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface OrderEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    items: Array<{
        product_name: string;
        quantity: number;
        size: string;
        price: number;
    }>;
    total: number;
    orderDate: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
    const { customerEmail, customerName, orderId, items, total, orderDate } = data;

    // Format items for email
    const itemsList = items.map(item =>
        `- ${item.product_name} (Talla: ${item.size}) x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    ).join('\n');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a2332; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background-color: #ffffff; padding: 30px; }
        .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .items-list { margin: 20px 0; }
        .item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .total { font-size: 20px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #1a2332; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background-color: #1a2332; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FashionStore</h1>
            <p>¡Gracias por tu compra!</p>
        </div>
        
        <div class="content">
            <h2>Hola ${customerName},</h2>
            <p>Tu pedido ha sido confirmado y está siendo procesado. A continuación encontrarás los detalles de tu compra:</p>
            
            <div class="order-details">
                <p><strong>Número de pedido:</strong> ${orderId}</p>
                <p><strong>Fecha:</strong> ${new Date(orderDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</p>
            </div>
            
            <h3>Artículos pedidos:</h3>
            <div class="items-list">
                ${items.map(item => `
                    <div class="item">
                        <strong>${item.product_name}</strong><br>
                        Talla: ${item.size} | Cantidad: ${item.quantity}<br>
                        <strong>${formatPrice(item.price * item.quantity)}</strong>
                    </div>
                `).join('')}
            </div>
            
            <div class="total">
                Total: ${formatPrice(total)}
            </div>
            
            <p style="margin-top: 30px;">Recibirás otra notificación cuando tu pedido sea enviado con el número de seguimiento.</p>
            
            <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
Hola ${customerName},

Tu pedido ha sido confirmado y está siendo procesado.

Número de pedido: ${orderId}
Fecha: ${new Date(orderDate).toLocaleDateString('es-ES')}

Artículos pedidos:
${itemsList}

Total: ${formatPrice(total)}

Recibirás otra notificación cuando tu pedido sea enviado.

Gracias por tu compra,
FashionStore
    `;

    try {
        console.log('=== SENDING ORDER CONFIRMATION EMAIL ===');
        console.log('To:', customerEmail);
        console.log('Order ID:', orderId);
        console.log('API Key configured:', import.meta.env.RESEND_API_KEY ? 'Yes (starts with ' + import.meta.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NO - MISSING!');

        const { data: emailData, error } = await resend.emails.send({
            from: 'FashionStore <onboarding@resend.dev>', // Cambiar a tu dominio verificado
            to: [customerEmail],
            subject: `Confirmación de pedido #${orderId.slice(0, 8)}`,
            html: emailHtml,
            text: emailText,
        });

        if (error) {
            console.error('=== EMAIL SEND ERROR ===');
            console.error('Error details:', JSON.stringify(error, null, 2));
            return { success: false, error };
        }

        console.log('=== EMAIL SENT SUCCESSFULLY ===');
        console.log('Response:', JSON.stringify(emailData, null, 2));
        return { success: true, data: emailData };
    } catch (error) {
        console.error('=== EMAIL EXCEPTION ===');
        console.error('Exception:', error);
        return { success: false, error };
    }
}

function formatPrice(cents: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(cents / 100);
}

export async function sendWelcomeEmail(email: string, name: string) {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a2332; color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .welcome-text { font-size: 18px; color: #1a2332; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #1a2332; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; margin: 25px 0; font-weight: bold; }
        .features { margin: 30px 0; }
        .feature { padding: 15px 0; border-bottom: 1px solid #e0e0e0; }
        .feature:last-child { border-bottom: none; }
        .feature-icon { display: inline-block; width: 30px; height: 30px; background-color: #d4af37; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a FashionStore!</h1>
        </div>
        
        <div class="content">
            <p class="welcome-text">Hola ${name},</p>
            
            <p>¡Gracias por registrarte en FashionStore! Estamos emocionados de tenerte con nosotros.</p>
            
            <p>Tu cuenta ha sido creada exitosamente y ahora puedes disfrutar de todos los beneficios de ser parte de nuestra comunidad:</p>
            
            <div class="features">
                <div class="feature">
                    <span class="feature-icon">✓</span>
                    <strong>Compras rápidas y seguras</strong> - Checkout simplificado para tus pedidos
                </div>
                <div class="feature">
                    <span class="feature-icon">✓</span>
                    <strong>Historial de pedidos</strong> - Acceso a todos tus pedidos anteriores
                </div>
                <div class="feature">
                    <span class="feature-icon">✓</span>
                    <strong>Ofertas exclusivas</strong> - Promociones especiales para miembros
                </div>
                <div class="feature">
                    <span class="feature-icon">✓</span>
                    <strong>Envíos gratuitos</strong> - En pedidos superiores a 50€
                </div>
            </div>
            
            <center>
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4322'}/productos" class="button">
                    Explorar Productos
                </a>
            </center>
            
            <p style="margin-top: 30px;">Encuentra merch personalizado de tus artistas favoritos. Calidad premium, diseños exclusivos.</p>
            
            <p>¡Gracias por elegirnos!</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                <strong>El equipo de FashionStore</strong>
            </p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
¡Bienvenido a FashionStore!

Hola ${name},

¡Gracias por registrarte en FashionStore! Estamos emocionados de tenerte con nosotros.

Tu cuenta ha sido creada exitosamente y ahora puedes disfrutar de todos los beneficios:

✓ Compras rápidas y seguras
✓ Historial de pedidos
✓ Ofertas exclusivas
✓ Envíos gratuitos en pedidos superiores a 50€

Explora nuestra colección de merch personalizado de tus artistas favoritos.

¡Gracias por elegirnos!

El equipo de FashionStore
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'FashionStore <onboarding@resend.dev>',
            to: [email],
            subject: '¡Bienvenido a FashionStore! 🎉',
            html: emailHtml,
            text: emailText,
        });

        if (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error };
        }

        console.log('Welcome email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
    }
}

interface OrderStatusEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    newStatus: string;
    orderTotal: number;
}

const statusInfo: Record<string, { emoji: string; title: string; message: string; color: string }> = {
    confirmed: {
        emoji: '✅',
        title: '¡Tu pedido ha sido confirmado!',
        message: 'Hemos recibido tu pago correctamente y estamos preparando tu pedido.',
        color: '#3b82f6',
    },
    shipped: {
        emoji: '🚚',
        title: '¡Tu pedido está en camino!',
        message: 'Tu pedido ha sido enviado y está de camino a tu dirección.',
        color: '#8b5cf6',
    },
    delivered: {
        emoji: '🎉',
        title: '¡Tu pedido ha sido entregado!',
        message: '¡Esperamos que disfrutes tu compra! No olvides dejarnos una reseña.',
        color: '#22c55e',
    },
    cancelled: {
        emoji: '❌',
        title: 'Tu pedido ha sido cancelado',
        message: 'Lamentamos informarte que tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
        color: '#ef4444',
    },
};

export async function sendOrderStatusUpdateEmail(data: OrderStatusEmailData) {
    const { customerEmail, customerName, orderId, newStatus, orderTotal } = data;

    const status = statusInfo[newStatus];
    if (!status) {
        console.log('No email template for status:', newStatus);
        return { success: true, skipped: true };
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${status.color}; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .emoji { font-size: 48px; margin-bottom: 15px; }
        .content { background-color: #ffffff; padding: 30px; }
        .order-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .order-id { font-family: monospace; font-size: 18px; font-weight: bold; color: #1a2332; }
        .status-box { background-color: ${status.color}15; border-left: 4px solid ${status.color}; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background-color: #1a2332; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">${status.emoji}</div>
            <h1>${status.title}</h1>
        </div>
        
        <div class="content">
            <p>Hola ${customerName},</p>
            
            <div class="status-box">
                <p style="margin: 0;">${status.message}</p>
            </div>
            
            <div class="order-box">
                <p style="margin: 0 0 10px 0; color: #666;">Número de pedido</p>
                <p class="order-id">#${orderId.slice(0, 8).toUpperCase()}</p>
                <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total: ${formatPrice(orderTotal)}</p>
            </div>
            
            <center>
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/mis-pedidos" class="button">
                    Ver mi pedido
                </a>
            </center>
            
            <p style="margin-top: 30px;">Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
            
            <p>¡Gracias por confiar en nosotros!</p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} FashionStore. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
${status.title}

Hola ${customerName},

${status.message}

Número de pedido: #${orderId.slice(0, 8).toUpperCase()}
Total: ${formatPrice(orderTotal)}

Para ver el estado de tu pedido, visita: ${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/mis-pedidos

¡Gracias por confiar en nosotros!

FashionStore
    `;

    try {
        console.log('=== SENDING ORDER STATUS UPDATE EMAIL ===');
        console.log('To:', customerEmail);
        console.log('Order ID:', orderId);
        console.log('New Status:', newStatus);

        const { data: emailData, error } = await resend.emails.send({
            from: 'FashionStore <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `${status.emoji} ${status.title} - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
            html: emailHtml,
            text: emailText,
        });

        if (error) {
            console.error('Error sending status update email:', error);
            return { success: false, error };
        }

        console.log('Status update email sent successfully:', emailData);
        return { success: true, data: emailData };
    } catch (error) {
        console.error('Error sending status update email:', error);
        return { success: false, error };
    }
}

// Stock Available Notification Email
interface StockNotificationEmailData {
    customerEmail: string;
    productName: string;
    productSlug: string;
    productImage?: string;
    productPrice: number;
}

export async function sendStockAvailableEmail(data: StockNotificationEmailData) {
    const { customerEmail, productName, productSlug, productImage, productPrice } = data;

    const productUrl = `https://fashionstore.com/productos/${productSlug}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #1a2332; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background-color: #ffffff; padding: 30px; }
        .product-card { background-color: #f8f9fa; border-radius: 12px; overflow: hidden; margin: 20px 0; }
        .product-image { width: 100%; height: 200px; object-fit: cover; }
        .product-info { padding: 20px; }
        .product-name { font-size: 20px; font-weight: bold; color: #1a2332; margin-bottom: 8px; }
        .product-price { font-size: 24px; color: #d97706; font-weight: bold; }
        .button { display: inline-block; background-color: #22c55e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 15px; }
        .button:hover { background-color: #16a34a; }
        .highlight { background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 FashionStore</h1>
            <p>¡Buenas noticias!</p>
        </div>
        
        <div class="content">
            <h2>¡El producto que esperabas ya está disponible!</h2>
            
            <div class="highlight">
                <p><strong>¡Date prisa!</strong> Este producto tiene alta demanda y podría agotarse rápidamente.</p>
            </div>
            
            <div class="product-card">
                ${productImage ? `<img src="${productImage}" alt="${productName}" class="product-image">` : ''}
                <div class="product-info">
                    <div class="product-name">${productName}</div>
                    <div class="product-price">${formatPrice(productPrice)}</div>
                    <a href="${productUrl}" class="button">🛒 Comprar ahora</a>
                </div>
            </div>
            
            <p>Te avisamos porque solicitaste ser notificado cuando este producto estuviera disponible.</p>
            
            <p style="margin-top: 30px;">¡Gracias por confiar en FashionStore!</p>
        </div>
        
        <div class="footer">
            <p>Este es un email automático de FashionStore</p>
            <p>Si no solicitaste esta notificación, puedes ignorar este mensaje.</p>
        </div>
    </div>
</body>
</html>
    `;

    const emailText = `
🎉 ¡Buenas noticias de FashionStore!

El producto que esperabas ya está disponible:

${productName}
Precio: ${formatPrice(productPrice)}

¡Date prisa! Este producto tiene alta demanda y podría agotarse rápidamente.

Comprar ahora: ${productUrl}

¡Gracias por confiar en FashionStore!
    `;

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: 'FashionStore <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `🎉 ¡${productName} ya está disponible! - FashionStore`,
            html: emailHtml,
            text: emailText,
        });

        if (error) {
            console.error('Error sending stock notification email:', error);
            return { success: false, error };
        }

        console.log('Stock notification email sent successfully:', emailData);
        return { success: true, data: emailData };
    } catch (error) {
        console.error('Error sending stock notification email:', error);
        return { success: false, error };
    }
}
