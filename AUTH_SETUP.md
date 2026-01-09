# Configuración de Autenticación en Supabase

## Configurar Email Authentication

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a **Authentication** → **Providers**
3. Asegúrate de que **Email** esté habilitado
4. Configura las opciones:
   - **Enable email confirmations**: Puedes dejarlo deshabilitado para desarrollo (los usuarios podrán iniciar sesión inmediatamente)
   - Para producción, habilítalo para verificar emails

## Configurar Email Templates (Opcional)

Si habilitas email confirmations, puedes personalizar los templates:

1. Ve a **Authentication** → **Email Templates**
2. Personaliza los mensajes de:
   - Confirmación de registro
   - Recuperación de contraseña
   - Cambio de email

## Ejecutar Migración SQL

Después de configurar la autenticación, ejecuta el script de migración:

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido de `supabase/stripe_migration.sql`
3. Haz clic en **Run**

Esto agregará:
- Campo `user_id` en la tabla `orders` para vincular pedidos con usuarios
- Campo `stripe_session_id` para tracking de pagos
- Políticas de seguridad (RLS) para proteger datos

## Crear Usuario de Prueba

Puedes crear usuarios de prueba de dos formas:

### Opción 1: Desde la interfaz web
1. Ve a `/registro` en tu aplicación
2. Completa el formulario de registro

### Opción 2: Desde Supabase Dashboard
1. Ve a **Authentication** → **Users**
2. Haz clic en **Add user**
3. Ingresa email y contraseña
4. El usuario se creará automáticamente

## Probar el flujo completo

1. Regístrate en `/registro` o inicia sesión en `/login`
2. Navega a la tienda y agrega productos al carrito
3. Ve a `/carrito` - ahora deberías poder acceder porque estás autenticado
4. Haz clic en "Proceder al pago"
5. Usa la tarjeta de prueba de Stripe: `4242 4242 4242 4242`
6. Completa el pago
7. El pedido se guardará vinculado a tu usuario

## Seguridad

- Las contraseñas se hashean automáticamente con Supabase Auth
- Los tokens de sesión se almacenan en cookies HttpOnly
- Las cookies tienen expiración (24 horas para access token, 30 días para refresh token)
- Los endpoints de API verifican autenticación antes de procesar pagos
