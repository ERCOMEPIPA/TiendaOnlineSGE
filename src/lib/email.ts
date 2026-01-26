// @ts-nocheck
// Email module using nodemailer with Gmail
// Note: Uses dynamic import to avoid CommonJS issues with Vite

function formatPrice(cents: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(cents / 100);
}

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

interface OrderStatusEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    newStatus: string;
    orderTotal: number;
}

interface StockNotificationEmailData {
    customerEmail: string;
    productName: string;
    productSlug: string;
    productImage?: string;
    productPrice: number;
}

// Lazy-loaded transporter to avoid issues at import time
let transporter: any = null;

async function getTransporter() {
    if (transporter) return transporter;

    try {
        // Dynamic import of nodemailer
        const nodemailer = await import('nodemailer');

        transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
                user: import.meta.env.GMAIL_USER,
                pass: import.meta.env.GMAIL_APP_PASSWORD
            }
        });

        return transporter;
    } catch (error) {
        console.error('Failed to initialize nodemailer:', error);
        return null;
    }
}

function getFromEmail() {
    return `HYPESTAGE <${import.meta.env.GMAIL_USER || 'noreply@hypestage.com'}>`;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
    const { customerEmail, customerName, orderId, items, total, orderDate } = data;

    const transport = await getTransporter();
    if (!transport) {
        console.log('=== EMAIL SKIPPED (no transporter) ===');
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
        .header { background-color: #1a2332; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background-color: #ffffff; padding: 30px; }
        .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .items-list { margin: 20px 0; }
        .item { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .total { font-size: 20px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #1a2332; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HYPESTAGE</h1>
            <p>¡Gracias por tu compra!</p>
        </div>
        
        <div class="content">
            <h2>Hola ${customerName},</h2>
            <p>Tu pedido ha sido confirmado y está siendo procesado.</p>
            
            <div class="order-details">
                <p><strong>Número de pedido:</strong> ${orderId}</p>
                <p><strong>Fecha:</strong> ${new Date(orderDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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
            
            <p style="margin-top: 30px;">Recibirás otra notificación cuando tu pedido sea enviado.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: customerEmail,
            subject: `Confirmación de pedido #${orderId.slice(0, 8)}`,
            html: emailHtml,
        });

        console.log('Order confirmation email sent:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return { success: false, error };
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    const transport = await getTransporter();
    if (!transport) {
        console.log('=== WELCOME EMAIL SKIPPED (no transporter) ===');
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
        .header { background-color: #1a2332; color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .features { margin: 30px 0; }
        .feature { padding: 15px 0; border-bottom: 1px solid #e0e0e0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a HYPESTAGE!</h1>
        </div>
        
        <div class="content">
            <p>Hola ${name},</p>
            <p>¡Gracias por registrarte en HYPESTAGE! Tu cuenta ha sido creada exitosamente.</p>
            
            <div class="features">
                <div class="feature">✓ Compras rápidas y seguras</div>
                <div class="feature">✓ Historial de pedidos</div>
                <div class="feature">✓ Ofertas exclusivas</div>
                <div class="feature">✓ Envíos gratuitos en pedidos superiores a 50€</div>
            </div>
            
            <p>¡Gracias por elegirnos!</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: email,
            subject: '¡Bienvenido a HYPESTAGE! 🎉',
            html: emailHtml,
        });

        console.log('Welcome email sent:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error };
    }
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
        message: '¡Esperamos que disfrutes tu compra!',
        color: '#22c55e',
    },
    cancelled: {
        emoji: '❌',
        title: 'Tu pedido ha sido cancelado',
        message: 'Lamentamos informarte que tu pedido ha sido cancelado.',
        color: '#ef4444',
    },
};

export async function sendOrderStatusUpdateEmail(data: OrderStatusEmailData) {
    const { customerEmail, customerName, orderId, newStatus, orderTotal } = data;

    const status = statusInfo[newStatus];
    if (!status) {
        return { success: true, skipped: true };
    }

    const transport = await getTransporter();
    if (!transport) {
        console.log('=== STATUS EMAIL SKIPPED (no transporter) ===');
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
        .emoji { font-size: 48px; margin-bottom: 15px; }
        .content { background-color: #ffffff; padding: 30px; }
        .order-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
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
            <p>${status.message}</p>
            
            <div class="order-box">
                <p>Número de pedido: <strong>#${orderId.slice(0, 8).toUpperCase()}</strong></p>
                <p>Total: <strong>${formatPrice(orderTotal)}</strong></p>
            </div>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: customerEmail,
            subject: `${status.emoji} ${status.title} - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
            html: emailHtml,
        });

        console.log('Status update email sent:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('Error sending status update email:', error);
        return { success: false, error };
    }
}

export async function sendStockAvailableEmail(data: StockNotificationEmailData) {
    const { customerEmail, productName, productSlug, productPrice } = data;

    const transport = await getTransporter();
    if (!transport) {
        console.log('=== STOCK EMAIL SKIPPED (no transporter) ===');
        return { success: true, skipped: true };
    }

    const productUrl = `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/productos/${productSlug}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #1a2332; color: white; padding: 30px; text-align: center; }
        .content { background-color: #ffffff; padding: 30px; }
        .product-card { background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background-color: #22c55e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 HYPESTAGE</h1>
            <p>¡Buenas noticias!</p>
        </div>
        
        <div class="content">
            <h2>¡El producto que esperabas ya está disponible!</h2>
            
            <div class="product-card">
                <h3>${productName}</h3>
                <p style="font-size: 24px; color: #d97706; font-weight: bold;">${formatPrice(productPrice)}</p>
                <a href="${productUrl}" class="button">🛒 Comprar ahora</a>
            </div>
            
            <p>¡Date prisa! Este producto tiene alta demanda.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: customerEmail,
            subject: `🎉 ¡${productName} ya está disponible! - HYPESTAGE`,
            html: emailHtml,
        });

        console.log('Stock notification email sent:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('Error sending stock notification email:', error);
        return { success: false, error };
    }
}

// Return status update email
interface ReturnStatusEmailData {
    customerEmail: string;
    customerName: string;
    orderId: string;
    newStatus: string;
    adminNotes?: string;
}

const returnStatusInfo: Record<string, { emoji: string; title: string; message: string; color: string }> = {
    approved: {
        emoji: '✅',
        title: 'Tu devolución ha sido aprobada',
        message: 'Hemos aprobado tu solicitud de devolución. Por favor, envía el producto a nuestra dirección. Recibirás un email con la etiqueta de envío.',
        color: '#3b82f6',
    },
    rejected: {
        emoji: '❌',
        title: 'Tu devolución ha sido rechazada',
        message: 'Lamentamos informarte que no podemos aceptar tu solicitud de devolución.',
        color: '#ef4444',
    },
    received: {
        emoji: '📦',
        title: 'Hemos recibido tu devolución',
        message: 'Tu paquete ha llegado a nuestro almacén y estamos procesando tu reembolso. Te notificaremos cuando se complete.',
        color: '#8b5cf6',
    },
    refunded: {
        emoji: '💰',
        title: '¡Reembolso completado!',
        message: 'El reembolso ha sido procesado y debería aparecer en tu cuenta bancaria en los próximos 5-7 días hábiles.',
        color: '#22c55e',
    },
};

export async function sendReturnStatusEmail(data: ReturnStatusEmailData) {
    const { customerEmail, customerName, orderId, newStatus, adminNotes } = data;

    const status = returnStatusInfo[newStatus];
    if (!status) {
        return { success: true, skipped: true };
    }

    const transport = await getTransporter();
    if (!transport) {
        console.log('=== RETURN STATUS EMAIL SKIPPED (no transporter) ===');
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
        .header { background-color: ${status.color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .emoji { font-size: 48px; margin-bottom: 15px; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .order-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .notes-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; }
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
            <p>${status.message}</p>
            
            <div class="order-box">
                <p>Número de pedido: <strong>#${orderId.slice(0, 8).toUpperCase()}</strong></p>
            </div>
            
            ${adminNotes ? `
            <div class="notes-box">
                <p><strong>Nota del equipo:</strong></p>
                <p>${adminNotes}</p>
            </div>
            ` : ''}
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Gracias por confiar en HYPESTAGE.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: customerEmail,
            subject: `${status.emoji} ${status.title} - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
            html: emailHtml,
        });

        console.log('Return status email sent:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('Error sending return status email:', error);
        return { success: false, error };
    }
}

