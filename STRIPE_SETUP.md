# Configuración de Stripe para FashionStore

## 1. Crear cuenta de Stripe

1. Ve a [https://stripe.com](https://stripe.com) y crea una cuenta
2. Activa el modo de prueba (Test Mode) para desarrollo

## 2. Obtener las claves API

1. Ve a **Developers** → **API Keys** en el dashboard de Stripe
2. Copia las siguientes claves:
   - **Secret key** (comienza con `sk_test_...`)
   - **Publishable key** (comienza con `pk_test_...`)

## 3. Configurar las variables de entorno

Actualiza tu archivo `.env` con las claves de Stripe:

```env
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
```

## 4. Ejecutar la migración en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase/stripe_migration.sql`
4. Ejecuta el script

## 5. Configurar Webhooks (Para producción)

Los webhooks permiten que Stripe notifique a tu aplicación cuando ocurre un pago exitoso.

### Para desarrollo local (usando Stripe CLI):

1. Instala Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Autentica: `stripe login`
3. Reenvía eventos a tu servidor local:
   ```bash
   stripe listen --forward-to localhost:4321/api/webhook
   ```
4. Copia el webhook secret que aparece (comienza con `whsec_...`)
5. Agrégalo al `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
   ```

### Para producción:

1. Ve a **Developers** → **Webhooks** en Stripe Dashboard
2. Haz clic en **Add endpoint**
3. URL del endpoint: `https://tudominio.com/api/webhook`
4. Selecciona los eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copia el **Signing secret** y agrégalo al `.env` de producción

## 6. Probar la integración

1. Reinicia el servidor: `npm run dev`
2. Agrega productos al carrito
3. Haz clic en "Proceder al pago"
4. Usa las tarjetas de prueba de Stripe:
   - **Tarjeta exitosa**: `4242 4242 4242 4242`
   - **Fecha**: Cualquier fecha futura
   - **CVC**: Cualquier 3 dígitos
   - **ZIP**: Cualquier código postal

## 7. Verificar pedidos

Después de completar un pago de prueba, verifica:
- En Stripe Dashboard → **Payments** deberías ver el pago
- En Supabase → **Table Editor** → `orders` deberías ver el pedido creado
- En Supabase → **Table Editor** → `order_items` deberías ver los items del pedido

## Notas importantes

- **Nunca** subas tu `STRIPE_SECRET_KEY` a un repositorio público
- Usa las claves de **test mode** (`sk_test_...`) durante el desarrollo
- Cambia a las claves de **live mode** (`sk_live_...`) solo en producción
- El webhook es **opcional** para desarrollo, pero **obligatorio** para producción
- Los precios en Stripe se manejan en centavos (3500 = 35.00€)

## Recursos

- [Documentación de Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Webhooks de Stripe](https://stripe.com/docs/webhooks)
- [Tarjetas de prueba](https://stripe.com/docs/testing)
