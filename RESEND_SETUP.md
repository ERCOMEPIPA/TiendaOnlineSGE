# Configuración de Emails con Resend

## 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Regístrate con tu email
3. Verifica tu email

## 2. Obtener API Key

1. Una vez dentro, ve a **API Keys** en el menú lateral
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "FashionStore Development")
4. Selecciona los permisos: **Sending access**
5. Copia la API key que comienza con `re_...`

## 3. Configurar en tu proyecto

Actualiza el archivo `.env` con tu API key de Resend:

```env
RESEND_API_KEY=re_tu_api_key_aqui
```

## 4. Probar los emails

### Email de bienvenida:
1. Ve a `/registro` en tu aplicación
2. Crea una nueva cuenta con un email real tuyo
3. Deberías recibir un email de bienvenida

### Email de confirmación de pedido:
1. Inicia sesión
2. Agrega productos al carrito
3. Completa una compra de prueba con Stripe
4. Deberías recibir un email con el resumen del pedido

## 5. Dominio personalizado (Opcional - Para producción)

Por defecto, Resend usa `onboarding@resend.dev` como remitente. Para usar tu propio dominio:

1. Ve a **Domains** en Resend
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `fashionstore.com`)
4. Sigue las instrucciones para agregar los registros DNS
5. Una vez verificado, actualiza el remitente en `src/lib/email.ts`:

```typescript
from: 'FashionStore <noreply@tudominio.com>',
```

## 6. Límites del plan gratuito

- **100 emails por día** gratis para siempre
- Sin necesidad de tarjeta de crédito
- Perfecto para desarrollo y pruebas

Si necesitas más volumen:
- **Pro**: $20/mes - 50,000 emails
- **Enterprise**: Contactar ventas

## 7. Monitorear emails enviados

1. Ve a **Logs** en el dashboard de Resend
2. Verás todos los emails enviados, su estado y errores
3. Puedes hacer clic en cada email para ver:
   - Destinatario
   - Asunto
   - Estado de entrega
   - Contenido del email

## 8. Troubleshooting

### No recibo los emails
- Verifica que la API key esté correctamente configurada en `.env`
- Revisa la consola del servidor para ver si hay errores
- Verifica la carpeta de spam/correo no deseado
- Revisa los logs en el dashboard de Resend

### Error de autenticación
- Asegúrate de que la API key sea válida
- Verifica que no tenga espacios al inicio o final
- Genera una nueva API key si es necesario

### Límite de envíos alcanzado
- El plan gratuito tiene límite de 100 emails/día
- Espera al día siguiente o actualiza tu plan

## Recursos

- [Documentación de Resend](https://resend.com/docs)
- [Ejemplos de emails](https://resend.com/docs/send-with-nodejs)
- [Status de servicio](https://status.resend.com)
