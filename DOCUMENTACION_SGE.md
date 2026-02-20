# 📄 Documentación Técnica del Proyecto — TiendaOnlineSGE

> **Módulo:** Sistemas de Gestión Empresarial (SGE)  
> **Alumno:** Francisco Virlan Rodriguez  
> **Curso:** 2025–2026  
> **Fecha de entrega:** 20 de febrero de 2026  
> **Nombre comercial:** HYPESTAGE — E-commerce de Merch de Artistas  
> **URL de producción:** https://fvirlantienda.victoriafp.online

---

## 1. Introducción

### 1.1 Descripción del proyecto

**HYPESTAGE** es una tienda online de merchandising de artistas musicales (camisetas, sudaderas, gorras, hoodies, etc.) desarrollada como proyecto del módulo de Sistemas de Gestión Empresarial. La aplicación cubre el ciclo de vida completo de un e-commerce: desde el catálogo de productos y el registro de clientes, hasta el procesamiento de pagos, la gestión de pedidos y la comunicación post-venta por correo electrónico.

### 1.2 Objetivos

| Objetivo | Descripción |
|----------|-------------|
| **Tienda pública funcional** | Catálogo de productos navegable con filtros, detalle, carrito y checkout |
| **Pasarela de pago real** | Integración con Stripe para pagos con tarjeta en modo test |
| **Panel de administración** | CRUD completo de productos, categorías, pedidos, devoluciones y descuentos |
| **Gestión post-venta** | Historial de pedidos, cancelaciones atómicas con restauración de stock, devoluciones |
| **Comunicación con el cliente** | Emails transaccionales (bienvenida, confirmación de pedido, cambios de estado, cupones) |
| **Sistema de descuentos** | Cupones públicos y personalizados, newsletter con código de bienvenida |

---

## 2. Stack Tecnológico

### 2.1 Tabla de tecnologías

| Capa | Tecnología | Versión | Rol |
|------|-----------|---------|-----|
| **Framework web** | Astro | 5.0 | Generación del sitio (modo híbrido SSG/SSR) |
| **Estilos** | Tailwind CSS | 3.4 | Framework CSS utility-first con paleta personalizada |
| **Componentes interactivos** | React | 19 | Islas interactivas (carrito, filtros, reseñas, etc.) |
| **Estado del cliente** | Nano Stores | 1.1 | Gestión reactiva del estado del carrito |
| **Base de datos** | Supabase (PostgreSQL) | — | Tablas, RLS, Stored Procedures, Storage |
| **Autenticación** | Supabase Auth | — | Registro, login, tokens JWT, refresh |
| **Almacenamiento de imágenes** | Cloudinary | 2.8 | Upload y CDN de imágenes de productos |
| **Pasarela de pago** | Stripe | 20.1 | Checkout sessions, webhooks |
| **Emails** | Nodemailer + Gmail | 7.0 | Emails transaccionales (SMTP) |
| **Servidor de producción** | @astrojs/node | 9.5 | Adaptador standalone Node.js |
| **Lenguaje** | TypeScript | 5.9 | Tipado estático |

### 2.2 Justificación de elección

- **Astro** se eligió por su enfoque "envía cero JavaScript al cliente por defecto", lo que resulta en páginas ultrarrápidas. Su arquitectura de *islands* permite incrustar componentes React solo donde se necesita interactividad.  
- **Supabase** proporciona una base de datos PostgreSQL gestionada con autenticación integrada, API REST auto-generada y Row-Level Security (RLS), lo que simplifica enormemente el backend.  
- **Stripe** es el estándar de la industria para pagos online; su modo Checkout Sessions permite delegar la PCI compliance.  
- **Cloudinary** ofrece almacenamiento en la nube y transformación automática de imágenes (redimensionado, optimización de formato).

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENTE                           │
│   Navegador (HTML + Tailwind CSS + React Islands)        │
│   Estado local: Nano Stores (carrito)                    │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼───────────────────────────────────────┐
│               SERVIDOR ASTRO (Node.js)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  Middleware  │  │  Páginas SSR │  │  API Routes   │   │
│  │  (auth)      │  │  (carrito,   │  │  (/api/...)   │   │
│  │              │  │   admin...)  │  │               │   │
│  └─────────────┘  └──────────────┘  └───────────────┘   │
└───┬────────────────────┬──────────────────┬──────────────┘
    │                    │                  │
    ▼                    ▼                  ▼
┌────────┐       ┌──────────────┐    ┌───────────┐
│Supabase│       │   Stripe     │    │Cloudinary │
│ - DB   │       │ - Checkout   │    │ - Imágenes│
│ - Auth │       │ - Webhooks   │    │           │
│ - RLS  │       └──────────────┘    └───────────┘
└───┬────┘       
    │            ┌──────────────┐
    │            │  Gmail SMTP  │
    └───────────►│  (Nodemailer)│
                 └──────────────┘
```

### 3.2 Modos de renderizado

| Modo | Páginas | Descripción |
|------|---------|-------------|
| **SSR** (Server-Side Rendering) | Carrito, checkout, admin, mis-pedidos, mi-cuenta | Se renderizan en cada petición; requieren datos en tiempo real |
| **SSG** (Static Site Generation) | Homepage, catálogo, detalle de producto | Pre-generadas en build; ultra-rápidas |

### 3.3 Estructura de directorios

```
TiendaOnlineSGE/
├── public/                          # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── islands/                 # 16 componentes React interactivos
│   │   │   ├── AddToCartButton.tsx  # Botón añadir al carrito (con selector de talla/color)
│   │   │   ├── CartIcon.tsx         # Icono del carrito con contador
│   │   │   ├── CartSlideOver.tsx    # Panel lateral deslizante del carrito
│   │   │   ├── CheckoutTimer.tsx    # Temporizador de reserva
│   │   │   ├── CouponInput.tsx      # Campo de entrada de cupón
│   │   │   ├── ImageUploader.tsx    # Subida de imágenes a Cloudinary
│   │   │   ├── NewsletterPopup.astro # Popup de newsletter
│   │   │   ├── ProductFilters.tsx   # Filtros avanzados
│   │   │   ├── ProductReviews.tsx   # Sistema de reseñas
│   │   │   ├── SalesChart.tsx       # Gráfico de ventas (admin)
│   │   │   ├── SearchButton.tsx     # Botón de búsqueda
│   │   │   ├── SearchModal.tsx      # Modal de búsqueda global
│   │   │   ├── SizeRecommender.tsx  # Recomendador de tallas
│   │   │   ├── StarRating.tsx       # Componente de puntuación
│   │   │   ├── WishlistButton.tsx   # Botón de favoritos
│   │   │   └── WishlistIcon.tsx     # Icono de favoritos
│   │   ├── product/                 # Componentes Astro de producto
│   │   │   ├── ProductCard.astro
│   │   │   └── ProductGallery.astro
│   │   └── ui/                      # Componentes UI genéricos
│   │       ├── Button.astro
│   │       ├── ConfirmModal.astro
│   │       ├── StockAlertModal.tsx
│   │       ├── Toast.astro
│   │       └── UserMenu.astro
│   ├── layouts/
│   │   ├── AdminLayout.astro        # Layout del panel de administración
│   │   ├── BaseLayout.astro         # Layout base (meta tags, SEO)
│   │   └── PublicLayout.astro       # Layout público (nav, footer, newsletter)
│   ├── lib/                         # Librerías y utilidades
│   │   ├── auth.ts                  # Funciones de autenticación
│   │   ├── cartReservation.ts       # Reserva temporal de stock
│   │   ├── cloudinary.ts            # Cliente Cloudinary
│   │   ├── config.ts                # Configuración general
│   │   ├── email.ts                 # 6 funciones de email (841 líneas)
│   │   ├── invoices.ts              # Generación de facturas
│   │   ├── stripe.ts                # Cliente Stripe
│   │   ├── supabase.ts              # Cliente Supabase (server + client)
│   │   └── utils.ts                 # Utilidades (formatPrice, slugify...)
│   ├── pages/
│   │   ├── index.astro              # Homepage
│   │   ├── login.astro              # Login de usuarios
│   │   ├── registro.astro           # Registro de usuarios
│   │   ├── carrito.astro            # Carrito de compras
│   │   ├── mi-cuenta.astro          # Perfil y cambio de contraseña
│   │   ├── mis-pedidos.astro        # Historial de pedidos del cliente
│   │   ├── mis-favoritos.astro      # Lista de deseos
│   │   ├── ofertas.astro            # Página de ofertas
│   │   ├── productos/               # Catálogo y detalle
│   │   ├── categoria/               # Filtro por categoría
│   │   ├── checkout/                # Éxito de pago
│   │   ├── auth/                    # Callbacks de autenticación
│   │   ├── admin/                   # Panel de administración completo
│   │   │   ├── index.astro          # Dashboard con métricas y gráficos
│   │   │   ├── login.astro          # Login de admin
│   │   │   ├── categorias.astro     # CRUD de categorías
│   │   │   ├── pedidos.astro        # Gestión de pedidos
│   │   │   ├── devoluciones.astro   # Gestión de devoluciones
│   │   │   ├── descuentos.astro     # Gestión de descuentos/cupones
│   │   │   ├── facturas/            # Facturación
│   │   │   └── productos/           # CRUD de productos
│   │   └── api/                     # 14 API endpoints REST
│   │       ├── auth/                # Login, registro, logout
│   │       ├── create-checkout-session.ts
│   │       ├── webhook.ts           # Webhook de Stripe
│   │       ├── upload.ts            # Subida de imágenes
│   │       ├── newsletter.ts
│   │       ├── validate-coupon.ts
│   │       ├── reviews.ts
│   │       ├── search.ts
│   │       ├── generate-coupon-code.ts
│   │       ├── send-coupon-email.ts
│   │       ├── send-coupon-to-all.ts
│   │       ├── send-stock-notifications.ts
│   │       ├── stock-notification.ts
│   │       └── orders/
│   │           ├── cancel.ts        # Cancelación atómica
│   │           └── return-request.ts # Solicitud de devolución
│   ├── stores/
│   │   └── cart.ts                  # Estado global del carrito (Nano Stores)
│   └── middleware.ts                # Protección de rutas (admin + user)
├── supabase/                        # 17 archivos SQL de migración
│   ├── schema.sql                   # Esquema base
│   ├── stripe_migration.sql
│   ├── cart_migration.sql
│   ├── coupons_migration.sql
│   ├── newsletter_migration.sql
│   ├── postsale_migration.sql       # Stored Procedure de cancelación
│   ├── reviews_migration.sql
│   ├── stock_notifications_migration.sql
│   └── ... (otras migraciones)
├── astro.config.mjs                 # Configuración Astro
├── tailwind.config.mjs              # Paleta personalizada
├── package.json
└── .env                             # Variables de entorno (secretas)
```

---

## 4. Base de Datos

### 4.1 Modelo de datos

La base de datos utiliza **PostgreSQL** gestionado por Supabase. Se compone de las siguientes tablas principales:

#### Tablas principales

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `categories` | Categorías de productos | `id`, `name`, `slug` |
| `products` | Catálogo de productos | `id`, `name`, `slug`, `description`, `price` (céntimos), `stock`, `sizes[]`, `images[]`, `category_id`, `featured`, `artist` |
| `orders` | Pedidos de clientes | `id`, `customer_email`, `customer_name`, `shipping_address`, `status`, `total`, `stripe_session_id`, `user_id` |
| `order_items` | Líneas de cada pedido | `id`, `order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `size` |

#### Tablas complementarias (migraciones)

| Tabla | Descripción |
|-------|-------------|
| `coupons` | Códigos de descuento (porcentaje o fijo, con fechas, usos máximos, compra mínima) |
| `coupon_emails` | Registro de envío de cupones personalizados |
| `newsletter_subscribers` | Suscriptores de la newsletter |
| `cart_items` | Carrito persistente por usuario (ligado a `auth.users`) |
| `product_reviews` | Reseñas de productos con puntuación |
| `stock_notifications` | Suscripciones a alertas de stock |

### 4.2 Diagrama Entidad-Relación (simplificado)

```
┌─────────────┐       ┌──────────────┐
│ categories  │1────N │  products    │
│             │       │              │
│ id (PK)     │       │ id (PK)      │
│ name        │       │ category_id  │──► FK
│ slug        │       │ name, price  │
└─────────────┘       │ stock, sizes │
                      │ images[]     │
                      │ artist       │
                      └──────┬───────┘
                             │1
                             │
                      ┌──────┴───────┐
                      │ order_items  │
                      │              │
                      │ id (PK)      │
                      │ order_id ────│──► FK
                      │ product_id   │──► FK
                      │ quantity     │
                      │ size         │
                      └──────┬───────┘
                             │N
                             │
                      ┌──────┴───────┐
                      │   orders     │
                      │              │
                      │ id (PK)      │
                      │ customer_*   │
                      │ status       │
                      │ total        │
                      │ user_id      │──► FK (auth.users)
                      └──────────────┘
```

### 4.3 Seguridad (Row-Level Security)

Todas las tablas tienen **RLS** habilitado. Las políticas implementadas son:

- **Lectura pública:** `categories`, `products` → cualquier visitante puede leer.
- **Escritura restringida:** solo usuarios autenticados (administradores) pueden insertar, actualizar y eliminar productos y categorías.
- **Pedidos:** los usuarios solo pueden ver sus propios pedidos (vinculados por `user_id` o `customer_email`).
- **Carrito (`cart_items`):** cada usuario solo puede ver, modificar y eliminar su propio carrito (`auth.uid() = user_id`).

### 4.4 Stored Procedure: Cancelación Atómica

Para las cancelaciones de pedidos se implementó un **Stored Procedure** en PL/pgSQL que garantiza la atomicidad de la operación:

```sql
CREATE OR REPLACE FUNCTION cancel_order_atomic(p_order_id UUID, p_user_email TEXT)
RETURNS JSON AS $$
BEGIN
    -- 1. Verificar que el pedido existe y pertenece al usuario
    -- 2. Verificar que el estado es cancelable (pending/confirmed)
    -- 3. RESTAURAR STOCK de cada producto (loop atómico)
    -- 4. Cambiar estado a 'cancelled'
    -- 5. En caso de error: ROLLBACK automático
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Esto evita inconsistencias: si el cambio de estado falla, el stock no se modifica, y viceversa.

---

## 5. Funcionalidades Implementadas

### 5.1 Tienda Pública

| Funcionalidad | Descripción | Ruta |
|---------------|-------------|------|
| **Homepage** | Productos destacados, banner, categorías | `/` |
| **Catálogo** | Lista de todos los productos con paginación | `/productos` |
| **Detalle de producto** | Galería de imágenes, selector de talla/color, reseñas, recomendador de tallas | `/productos/[slug]` |
| **Filtros avanzados** | Por categoría, rango de precios, talla, artista | `/productos` |
| **Búsqueda global** | Modal de búsqueda con resultados en tiempo real | (modal) |
| **Filtro por categoría** | Productos de una categoría específica | `/categoria/[slug]` |
| **Ofertas** | Sección de productos con descuento | `/ofertas` |
| **Lista de deseos** | Guardar productos favoritos | `/mis-favoritos` |

### 5.2 Carrito y Checkout

| Funcionalidad | Descripción |
|---------------|-------------|
| **Carrito persistente** | Almacenado en `localStorage` (invitados) o en base de datos (usuarios registrados) |
| **Panel lateral (SlideOver)** | Se despliega al añadir un producto sin cambiar de página |
| **Fusión de carritos** | Al iniciar sesión, el carrito del invitado se fusiona con el del usuario registrado |
| **Selector de talla y color** | Integrado en el botón de añadir al carrito |
| **Control de stock** | Modal de alerta si la cantidad supera el stock disponible |
| **Aplicación de cupones** | Campo de cupón con validación en tiempo real |
| **Checkout con Stripe** | Redirección a Stripe Checkout Sessions en modo test |
| **Página de éxito** | Confirmación del pedido tras el pago `/checkout/success` |

### 5.3 Autenticación y Cuenta de Usuario

| Funcionalidad | Descripción |
|---------------|-------------|
| **Registro** | Formulario con nombre, email y contraseña; envía email de bienvenida |
| **Login** | Autenticación con Supabase Auth; tokens en cookies HttpOnly |
| **Mi cuenta** | Ver datos de perfil y cambiar contraseña (con verificación de la actual) |
| **Historial de pedidos** | Timeline visual con estados: Pendiente → Confirmado → Enviado → Entregado |
| **Cancelación** | Botón disponible si el pedido está en estado `pending` o `confirmed` |
| **Solicitud de devolución** | Modal informativo con dirección de almacén y plazo de reembolso |

### 5.4 Panel de Administración

Accesible en `/admin` (protegido por middleware; solo el email de admin autorizado).

| Sección | Funcionalidades |
|---------|-----------------|
| **Dashboard** | Métricas clave: ingresos, pedidos, clientes. Gráfico de ventas (`SalesChart.tsx` con Recharts) |
| **Productos** | CRUD completo: crear, editar, eliminar productos. Subida de imágenes a Cloudinary |
| **Categorías** | CRUD de categorías con slug automático |
| **Pedidos** | Lista de pedidos, cambiar estado (→ email automático al cliente), ver detalles |
| **Devoluciones** | Gestión de solicitudes de devolución: aprobar, rechazar, marcar como recibida/reembolsada |
| **Descuento** | Crear cupones públicos/personalizados, enviar por email, activar/desactivar |
| **Facturas** | Generación de facturas |

### 5.5 Sistema de Emails

Se implementaron **6 tipos de emails transaccionales** con plantillas HTML profesionales:

| Email | Disparador |
|-------|-----------|
| **Bienvenida** | Registro de nuevo usuario |
| **Confirmación de pedido** | Pago exitoso vía Stripe webhook |
| **Cambio de estado** | Admin actualiza el estado del pedido (confirmado, enviado, entregado, cancelado) |
| **Cupón personalizado** | Admin envía un descuento exclusivo a un cliente |
| **Stock disponible** | Producto vuelve a tener stock; se notifica a suscriptores |
| **Estado de devolución** | Cambio en la solicitud de devolución (aprobada, rechazada, recibida, reembolsada) |

### 5.6 Descuentos y Newsletter

| Funcionalidad | Descripción |
|---------------|-------------|
| **Popup de newsletter** | Aparece a los 3 s para nuevos visitantes; ofrece 10 % de descuento |
| **Código de bienvenida** | Se genera automáticamente un código único `BIENVENIDO-XXXX` |
| **Cupones públicos** | Cualquier cliente puede usarlos si conoce el código |
| **Cupones personalizados** | Vinculados a un email específico; se envían por correo desde el panel admin |
| **Validación completa** | Fecha de validez, usos máximos, compra mínima, tipo (porcentaje/fijo) |

---

## 6. APIs REST

La aplicación expone los siguientes **endpoints** bajo `/api/`:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login de usuario |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/create-checkout-session` | Crear sesión de pago en Stripe |
| POST | `/api/webhook` | Webhook de Stripe (confirma pedido, descuenta stock, envía email) |
| POST | `/api/upload` | Subida de imágenes a Cloudinary |
| POST | `/api/newsletter` | Suscripción a newsletter + generación de cupón |
| POST | `/api/validate-coupon` | Validar código de cupón |
| GET/POST | `/api/reviews` | CRUD de reseñas de productos |
| GET | `/api/search` | Búsqueda de productos |
| POST | `/api/generate-coupon-code` | Generar código de cupón único |
| POST | `/api/send-coupon-email` | Enviar cupón personalizado por email |
| POST | `/api/send-coupon-to-all` | Enviar cupón a todos los suscriptores |
| POST | `/api/orders/cancel` | Cancelar pedido (stored procedure atómico) |
| POST | `/api/orders/return-request` | Solicitar devolución |
| POST | `/api/stock-notification` | Suscribirse a alerta de stock |
| POST | `/api/send-stock-notifications` | Enviar notificaciones de stock disponible |

---

## 7. Seguridad

### 7.1 Autenticación

- **Supabase Auth** gestiona el registro/login con tokens JWT.
- Los tokens se almacenan en cookies **HttpOnly**, **Secure** (en producción) y **SameSite=Lax**.
- Se implementó **refresh automático** de tokens expirados a través del middleware.
- Existen dos tipos de tokens: `sb-access-token` / `sb-refresh-token` (admin) y `user-access-token` / `user-refresh-token` (clientes).

### 7.2 Middleware de protección

El archivo `src/middleware.ts` intercepta todas las peticiones y:

1. **Rutas admin** (`/admin/*`): verifica que el usuario autenticado sea el email de admin autorizado (`iscovr3@gmail.com`). Si no, redirige a `/admin/login`.
2. **Rutas de usuario**: refresca los tokens si están por expirar.
3. **Rutas públicas** (`/login`, `/registro`, `/api/*`): se ignoran.

### 7.3 Variables de entorno

Todas las claves sensibles se almacenan en `.env` y **nunca** se exponen al cliente:

```
PUBLIC_SUPABASE_URL         → Solo URL pública (safe)
PUBLIC_SUPABASE_ANON_KEY    → Solo clave anon (safe, limitada por RLS)
STRIPE_SECRET_KEY           → Solo server-side
STRIPE_WEBHOOK_SECRET       → Solo server-side
GMAIL_USER / GMAIL_APP_PASSWORD → Solo server-side
CLOUDINARY_*                → Solo server-side
```

### 7.4 Webhook de Stripe

El webhook verifica la firma del evento (`stripe-signature`) para garantizar que la petición proviene de Stripe y no ha sido manipulada.

---

## 8. Configuración y Despliegue

### 8.1 Requisitos previos

- Node.js 18+
- Cuenta en Supabase (gratuita)
- Cuenta en Stripe (modo test)
- Cuenta en Cloudinary (gratuita)
- Cuenta de Gmail con contraseña de aplicación

### 8.2 Instalación local

```bash
# 1. Clonar el repositorio
git clone <repositorio>
cd TiendaOnlineSGE

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales reales

# 4. Ejecutar migraciones SQL en Supabase Dashboard → SQL Editor
#    Archivos en orden: supabase/schema.sql, stripe_migration.sql,
#    cart_migration.sql, coupons_migration.sql, etc.

# 5. Crear bucket 'products-images' en Supabase Storage (público)

# 6. Iniciar el servidor de desarrollo
npm run dev
```

### 8.3 Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Desarrollo | `npm run dev` | Servidor local con hot reload |
| Build | `npm run build` | Compilar para producción |
| Preview | `npm run preview` | Previsualizar build de producción |

### 8.4 Despliegue en producción

El proyecto utiliza el adaptador `@astrojs/node` en modo `standalone`, lo que genera un servidor Node.js que se puede desplegar en cualquier VPS o plataforma que soporte Node.js.

**URL de producción actual:** `https://fvirlantienda.victoriafp.online`

---

## 9. Flujos Principales

### 9.1 Flujo de compra (cliente)

```
1. Cliente navega el catálogo
2. Selecciona un producto → Detalle de producto
3. Elige talla/color → Añadir al carrito
4. Revisa el carrito (panel lateral o página /carrito)
5. (Opcional) Aplica código de descuento
6. Introduce datos de envío
7. Click en "Proceder al pago" → Redirige a Stripe Checkout
8. Pago exitoso → Stripe envía webhook al servidor
9. Webhook: crea pedido, descuenta stock, envía email de confirmación
10. Cliente ve la página de éxito
11. Puede consultar su pedido en /mis-pedidos
```

### 9.2 Flujo de gestión de pedidos (admin)

```
1. Admin accede a /admin/pedidos
2. Ve todos los pedidos con su estado actual
3. Cambia el estado: pending → confirmed → shipped → delivered
4. En cada cambio se envía un email automático al cliente
5. Si el cliente cancela (pending/confirmed): stored procedure restaura stock
```

### 9.3 Flujo de devolución

```
1. Cliente ve su pedido en estado "Entregado"
2. Click en "Solicitar Devolución" → Modal con instrucciones
3. Se registra la solicitud en la base de datos
4. Admin ve la devolución en /admin/devoluciones
5. Admin puede: aprobar → recibida → reembolsada (cada paso envía email)
```

---

## 10. Migraciones de Base de Datos

Se crearon **17 archivos SQL** de migración, organizados incrementalmente:

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `schema.sql` | Tablas base: `categories`, `products`, `orders`, `order_items` + RLS + datos de ejemplo |
| 2 | `stripe_migration.sql` | Campos `stripe_session_id` y `user_id` en `orders` |
| 3 | `cart_migration.sql` | Tabla `cart_items` para carrito persistente |
| 4 | `coupons_migration.sql` | Tabla `coupons` + campos de validación |
| 5 | `newsletter_migration.sql` | Tabla `newsletter_subscribers` |
| 6 | `postsale_migration.sql` | Stored Procedure `cancel_order_atomic()` |
| 7 | `reviews_migration.sql` | Tabla `product_reviews` |
| 8 | `stock_notifications_migration.sql` | Tabla `stock_notifications` |
| 9 | `personalized_coupons_migration.sql` | Campos de personalización en `coupons` + tabla `coupon_emails` |
| 10 | `discount_migration.sql` | Campo de descuento en productos |
| 11 | `colors_migration.sql` | Campo de colores en productos |
| 12 | `guest_checkout_migration.sql` | Soporte para checkout como invitado |
| 13 | `fix_guest_rls.sql` | Corrección de políticas RLS para invitados |
| 14 | `invoicing_migration.sql` | Soporte de facturación |
| 15 | `returns_status_migration.sql` | Estados de devolución |
| 16 | `fix_returns_schema.sql` | Corrección del esquema de devoluciones |
| 17 | `add_return_reason.sql` | Campo de motivo de devolución |

---

## 11. Pruebas y Validación

### 11.1 Pruebas realizadas

| Prueba | Resultado |
|--------|-----------|
| Registro de usuario + email de bienvenida | ✅ Funcional |
| Login/logout con persistencia de sesión | ✅ Funcional |
| Navegación completa del catálogo con filtros | ✅ Funcional |
| Añadir productos al carrito (talla, color, cantidad) | ✅ Funcional |
| Aplicar cupón de descuento en el carrito | ✅ Funcional |
| Checkout completo con Stripe (modo test) | ✅ Funcional |
| Webhook de Stripe: creación de pedido y email | ✅ Funcional |
| Panel de administración: CRUD de productos | ✅ Funcional |
| Panel de administración: gestión de pedidos | ✅ Funcional |
| Cancelación de pedido con restauración de stock | ✅ Funcional |
| Solicitud de devolución | ✅ Funcional |
| Newsletter popup + código de descuento | ✅ Funcional |
| Responsive design (móvil/tablet/escritorio) | ✅ Funcional |

### 11.2 Tarjetas de prueba de Stripe

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Pago rechazado |

---

## 12. Conclusiones

Se ha desarrollado un e-commerce completamente funcional que cubre todas las fases del ciclo de gestión empresarial:

1. **Catálogo y venta:** Sistema completo de productos con filtros, búsqueda, reseñas y recomendador de tallas.
2. **Procesamiento de pagos:** Integración con Stripe Checkout Sessions y webhooks para confirmación automática.
3. **Gestión de pedidos:** Panel de administración con cambio de estados y notificación automática al cliente.
4. **Post-venta:** Cancelaciones atómicas con restauración de stock (stored procedures) y flujo de devoluciones.
5. **Marketing:** Sistema de cupones (públicos y personalizados), newsletter con código de bienvenida, y notificaciones de stock.
6. **Comunicación:** 6 tipos de emails transaccionales con plantillas HTML profesionales.
7. **Seguridad:** Autenticación JWT, Row-Level Security, middleware de protección, tokens HttpOnly.

El proyecto demuestra la aplicación práctica de un **sistema de gestión empresarial** en el contexto de un comercio electrónico moderno, utilizando tecnologías actuales del ecosistema web.

---

*Documento generado el 20 de febrero de 2026*
