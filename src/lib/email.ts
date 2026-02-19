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
        console.log('🔧 [EMAIL] Inicializando transporter de email...');

        // Verificar variables de entorno
        const gmailUser = import.meta.env.GMAIL_USER;
        const gmailPass = import.meta.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailPass) {
            console.error('❌ [EMAIL] Error: Variables de entorno no configuradas');
            console.error('   GMAIL_USER:', gmailUser ? '✓ Configurado' : '✗ Falta');
            console.error('   GMAIL_APP_PASSWORD:', gmailPass ? '✓ Configurado' : '✗ Falta');
            return null;
        }

        console.log('✓ [EMAIL] Variables de entorno verificadas');
        console.log('   Usuario:', gmailUser);

        // Dynamic import of nodemailer
        const nodemailer = await import('nodemailer');
        console.log('✓ [EMAIL] Nodemailer importado correctamente');

        transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        });

        console.log('✅ [EMAIL] Transporter creado correctamente');
        return transporter;
    } catch (error) {
        console.error('❌ [EMAIL] Error al inicializar nodemailer:', error);
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
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
    console.log('📧 [EMAIL] Intentando enviar email de bienvenida');
    console.log('   Destinatario:', email);
    console.log('   Nombre:', name);

    const transport = await getTransporter();
    if (!transport) {
        console.error('❌ [EMAIL] No se pudo crear el transporter - email no enviado');
        return { success: false, skipped: true, error: 'Transporter no disponible' };
    }

    console.log('✓ [EMAIL] Transporter obtenido, preparando email...');

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://hypestage.com';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #1a2332; color: white; padding: 40px 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
        .content { padding: 40px 30px; }
        .welcome-text { font-size: 18px; color: #1a2332; margin-bottom: 20px; }
        .features { margin: 30px 0; background-color: #f8f9fa; padding: 20px; border-radius: 8px; }
        .feature { padding: 10px 0; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; }
        .feature:last-child { border-bottom: none; }
        .feature-icon { margin-right: 15px; color: #22c55e; font-size: 20px; }
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0; background-color: #f4f4f4;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <tr>
                        <td class="header" style="background-color: #1a2332; color: white; padding: 40px 0; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; color: #ffffff;">HYPESTAGE</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <h2 class="welcome-text" style="font-size: 18px; color: #1a2332; margin-bottom: 20px;">¡Hola ${name}! 👋</h2>
                            <p style="margin-bottom: 15px;">Gracias por unirte a la comunidad de <strong>HYPESTAGE</strong>. Tu cuenta ha sido creada exitosamente y ya eres parte de nuestra familia.</p>
                            
                            <p style="margin-bottom: 15px;">Estamos emocionados de tenerte con nosotros. Aquí comienza tu experiencia con la mejor moda urbana.</p>
                            
                            <div class="features" style="margin: 30px 0; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                                <div class="feature" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">✓ Compras rápidas y 100% seguras</div>
                                <div class="feature" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">✓ Acceso a historial de pedidos</div>
                                <div class="feature" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">✓ Ofertas exclusivas para miembros</div>
                                <div class="feature" style="padding: 10px 0; border-bottom: none;">✓ Soporte prioritario</div>
                            </div>
                            
                            <!-- Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#1a2332" style="border-radius: 4px;">
                                                    <a href="${siteUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; border: 1px solid #1a2332; display: inline-block; font-weight: bold; letter-spacing: 1px;">
                                                        IR A LA TIENDA
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                                Si tienes alguna pregunta, simplemente responde a este correo. ¡Estamos aquí para ayudarte!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td class="footer" style="text-align: center; padding: 30px; color: #666; font-size: 12px; background-color: #f4f4f4;">
                            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
                            <p style="margin: 5px 0;">Has recibido este correo porque te registraste en HYPESTAGE.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    try {
        const fromEmail = getFromEmail();
        console.log('   From:', fromEmail);

        const info = await transport.sendMail({
            from: fromEmail,
            to: email,
            subject: '¡Bienvenido a HYPESTAGE! 🎉',
            html: emailHtml,
        });

        console.log('✅ [EMAIL] Email de bienvenida enviado exitosamente');
        console.log('   Message ID:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('❌ [EMAIL] Error al enviar email de bienvenida');
        console.error('   Error:', error.message);
        return { success: false, error: error.message };
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

interface CouponEmailData {
    customerEmail: string;
    customerName?: string;
    couponCode: string;
    description: string;
    discountType: string;
    discountValue: number;
    validUntil?: string;
    minPurchase?: number;
}

export async function sendCouponEmail(data: CouponEmailData) {
    const {
        customerEmail,
        customerName,
        couponCode,
        description,
        discountType,
        discountValue,
        validUntil,
        minPurchase
    } = data;

    console.log('📧 [EMAIL] Intentando enviar cupón personalizado');
    console.log('   Destinatario:', customerEmail);
    console.log('   Código:', couponCode);

    const transport = await getTransporter();
    if (!transport) {
        console.error('❌ [EMAIL] No se pudo crear el transporter - email no enviado');
        return { success: false, skipped: true, error: 'Transporter no disponible' };
    }

    console.log('✓ [EMAIL] Transporter obtenido, preparando email...');

    // Format discount display
    const discountDisplay = discountType === 'percentage'
        ? `${discountValue}%`
        : formatPrice(discountValue);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
        }
        .header { 
            background: linear-gradient(135deg, #1a2332 0%, #2c3e50 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0 0 10px 0; 
            font-size: 32px;
            font-weight: bold;
        }
        .header p {
            margin: 0;
            font-size: 18px;
            opacity: 0.9;
        }
        .content { 
            background-color: #ffffff; 
            padding: 40px 30px; 
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .coupon-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .coupon-label {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        .coupon-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 3px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            border: 2px dashed rgba(255, 255, 255, 0.5);
            margin: 15px 0;
            font-family: 'Courier New', monospace;
        }
        .discount-value {
            font-size: 28px;
            font-weight: bold;
            margin-top: 15px;
        }
        .details-box {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
        }
        .detail-item {
            margin: 12px 0;
            display: flex;
            align-items: center;
        }
        .detail-icon {
            display: inline-block;
            width: 20px;
            margin-right: 10px;
            font-size: 18px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            font-size: 16px;
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            color: #666; 
            font-size: 12px;
            background-color: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        }
        .highlight {
            color: #667eea;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎁 HYPESTAGE</h1>
            <p>¡Tenemos un regalo especial para ti!</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                ${customerName ? `Hola <strong>${customerName}</strong>,` : 'Hola,'}
            </div>
            
            <p>Nos complace ofrecerte un <strong>descuento exclusivo</strong> que hemos preparado especialmente para ti. ¡Es hora de darte ese capricho que tanto mereces!</p>
            
            <div class="coupon-box">
                <div class="coupon-label">Tu código de descuento</div>
                <div class="coupon-code">${couponCode}</div>
                <div class="discount-value">Descuento: ${discountDisplay}</div>
            </div>
            
            <div class="details-box">
                <h3 style="margin-top: 0; color: #1a2332;">📋 Detalles del descuento</h3>
                <div class="detail-item">
                    <span class="detail-icon">✨</span>
                    <span><strong>Descripción:</strong> ${description}</span>
                </div>
                ${minPurchase && minPurchase > 0 ? `
                <div class="detail-item">
                    <span class="detail-icon">🛍️</span>
                    <span><strong>Compra mínima:</strong> ${formatPrice(minPurchase)}</span>
                </div>
                ` : ''}
                ${validUntil ? `
                <div class="detail-item">
                    <span class="detail-icon">⏰</span>
                    <span><strong>Válido hasta:</strong> ${new Date(validUntil).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-icon">🎯</span>
                    <span><strong>Uso:</strong> Personalizado solo para ti</span>
                </div>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://hypestage.com'}" class="cta-button">
                    Comprar ahora
                </a>
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.8;">
                <strong>Cómo usar tu código:</strong><br>
                1. Añade tus productos favoritos al carrito<br>
                2. Ve al carrito y busca el campo "Código de descuento"<br>
                3. Introduce el código <strong>${couponCode}</strong><br>
                4. ¡Disfruta de tu descuento!
            </p>
            
            <p style="margin-top: 30px;">
                ¡Gracias por ser parte de HYPESTAGE! Esperamos que disfrutes de este descuento exclusivo.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>HYPESTAGE</strong></p>
            <p>&copy; ${new Date().getFullYear()} HYPESTAGE. Todos los derechos reservados.</p>
            <p style="margin-top: 10px;">
                Este código es personal e intransferible.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const info = await transport.sendMail({
            from: getFromEmail(),
            to: customerEmail,
            subject: `🎁 ¡Tu descuento exclusivo de ${discountDisplay} te está esperando!`,
            html: emailHtml,
        });

        console.log('✅ [EMAIL] Cupón enviado correctamente:', info.messageId);
        return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
        console.error('❌ [EMAIL] Error al enviar cupón:', error);
        return { success: false, error };
    }
}

