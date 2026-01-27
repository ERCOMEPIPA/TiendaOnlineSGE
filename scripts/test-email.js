// Script para probar el envío de emails con Gmail
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=== CONFIGURACIÓN DE EMAIL ===');
console.log('Gmail User:', process.env.GMAIL_USER);
console.log('Gmail Password configurado:', process.env.GMAIL_APP_PASSWORD ? 'SÍ (longitud: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'NO');
console.log('');

async function testEmail() {
    try {
        console.log('🔄 Creando transporter de nodemailer...');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        console.log('✅ Transporter creado correctamente');
        console.log('');
        console.log('🔄 Verificando conexión con Gmail...');

        // Verificar la conexión
        await transporter.verify();
        console.log('✅ Conexión verificada correctamente');
        console.log('');

        // Enviar email de prueba
        console.log('🔄 Enviando email de prueba...');
        const info = await transporter.sendMail({
            from: `HYPESTAGE <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Enviamos al mismo email para probar
            subject: '✅ Prueba de configuración de email - HYPESTAGE',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
                        .success { background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ ¡Email configurado correctamente!</h1>
                        </div>
                        <div class="content">
                            <div class="success">
                                <strong>🎉 ¡Éxito!</strong> Tu configuración de Gmail está funcionando correctamente.
                            </div>
                            <p><strong>Detalles de la prueba:</strong></p>
                            <ul>
                                <li>Fecha: ${new Date().toLocaleString('es-ES')}</li>
                                <li>Servidor: Gmail SMTP (nodemailer)</li>
                                <li>Estado: ✅ Operativo</li>
                            </ul>
                            <p>Los usuarios ahora recibirán correctamente:</p>
                            <ul>
                                <li>Email de bienvenida al registrarse</li>
                                <li>Confirmación de pedidos</li>
                                <li>Actualizaciones de estado de pedidos</li>
                                <li>Notificaciones de stock</li>
                            </ul>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        console.log('✅ EMAIL ENVIADO CORRECTAMENTE');
        console.log('');
        console.log('📧 ID del mensaje:', info.messageId);
        console.log('📬 Revisa tu bandeja de entrada:', process.env.GMAIL_USER);
        console.log('');
        console.log('=== PRUEBA COMPLETADA CON ÉXITO ===');

    } catch (error) {
        console.error('');
        console.error('❌ ERROR AL ENVIAR EMAIL');
        console.error('');
        console.error('Detalles del error:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('');
        
        if (error.message.includes('Invalid login')) {
            console.error('🔴 PROBLEMA: Credenciales inválidas');
            console.error('');
            console.error('SOLUCIÓN:');
            console.error('1. Ve a https://myaccount.google.com/security');
            console.error('2. Activa "Verificación en 2 pasos" si no está activada');
            console.error('3. Busca "Contraseñas de aplicaciones"');
            console.error('4. Genera una nueva contraseña para "Correo"');
            console.error('5. Copia la contraseña de 16 caracteres (sin espacios)');
            console.error('6. Actualiza GMAIL_APP_PASSWORD en el archivo .env');
            console.error('7. Ejecuta este script de nuevo: node scripts/test-email.js');
        } else if (error.message.includes('Missing credentials')) {
            console.error('🔴 PROBLEMA: Faltan credenciales en el archivo .env');
            console.error('');
            console.error('SOLUCIÓN:');
            console.error('1. Verifica que el archivo .env contenga:');
            console.error('   GMAIL_USER=tu_email@gmail.com');
            console.error('   GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion');
        } else {
            console.error('🔴 PROBLEMA: Error desconocido');
            console.error('');
            console.error('Stack trace completo:');
            console.error(error);
        }
        
        console.error('');
        process.exit(1);
    }
}

// Ejecutar test
testEmail();
