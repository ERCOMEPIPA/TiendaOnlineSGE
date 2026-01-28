# 🎁 Sistema de Descuentos Personalizados

Este documento explica cómo utilizar el nuevo sistema de descuentos personalizados implementado en tu tienda online.

## 📋 Características

✅ **Descuentos públicos**: Cupones que cualquier cliente puede usar  
✅ **Descuentos personalizados**: Cupones exclusivos para clientes específicos  
✅ **Envío automático por email**: Los códigos se envían directamente al cliente  
✅ **Generación automática de códigos**: Códigos únicos generados automáticamente  
✅ **Múltiples tipos de descuento**: Porcentaje o cantidad fija  
✅ **Control de usos**: Límite de usos y fechas de validez  
✅ **Seguimiento**: Registro de envíos y usos de cupones

## 🚀 Instalación

### 1. Ejecutar la migración de base de datos

Primero, debes ejecutar el nuevo script SQL en Supabase:

1. Ve a tu proyecto en Supabase
2. Accede al **SQL Editor**
3. Abre y ejecuta el archivo: `supabase/personalized_coupons_migration.sql`

Este script creará:
- Nuevos campos en la tabla `coupons` para personalización
- Tabla `coupon_emails` para seguimiento de envíos
- Función `generate_unique_coupon_code()` para generar códigos únicos
- Políticas de seguridad actualizadas (RLS)

### 2. Verificar configuración de email

Asegúrate de que tienes configuradas las variables de entorno para el envío de emails en tu archivo `.env`:

```env
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
PUBLIC_SITE_URL=https://tu-tienda.com
```

## 💡 Cómo usar el sistema

### Acceder al panel de descuentos

1. Inicia sesión en el panel de administración
2. Ve a la sección **"Descuentos"** en el menú lateral
3. Verás la lista de todos los descuentos creados

### Crear un descuento público

Un descuento público puede ser usado por cualquier cliente que conozca el código.

1. En el formulario "Crear nuevo descuento":
   - **Código del cupón**: Introduce un código memorable (ej: VERANO2026)
   - **Email del cliente**: Déjalo **VACÍO** para cupón público
   - **Descripción**: Describe el descuento (ej: "Descuento de verano")
   - **Tipo de descuento**: Selecciona Porcentaje o Cantidad fija
   - **Valor del descuento**: Introduce el valor (10 para 10%, o cantidad en €)
   - **Compra mínima**: Importe mínimo requerido (opcional)
   - **Usos máximos**: Límite de usos (dejar vacío para ilimitado)
   - **Válido hasta**: Fecha de expiración (opcional)

2. Haz clic en **"Crear descuento"**

### Crear un descuento personalizado

Un descuento personalizado es exclusivo para un cliente específico.

1. En el formulario "Crear nuevo descuento":
   - **Código del cupón**: Puedes usar el botón "Generar código automático" para crear uno único
   - **Email del cliente**: **Introduce el email del cliente** (ej: cliente@ejemplo.com)
   - Rellena el resto de campos como un descuento público

2. Haz clic en **"Crear descuento"**

3. En la tabla de descuentos, verás una etiqueta morada "Personalizado" junto al código

4. Haz clic en **"Enviar por email"** para enviar el código al cliente

### Generar códigos automáticamente

Para evitar tener que pensar en códigos únicos:

1. En el formulario de creación, haz clic en **"Generar código automático"**
2. Se generará un código único del tipo: `PROMO12ABC34D`
3. Este código es garantizado único en tu base de datos

### Enviar descuentos por email

Los descuentos personalizados tienen un botón "Enviar por email":

1. Localiza el descuento en la tabla
2. Haz clic en **"Enviar por email"**
3. Confirma el envío
4. El cliente recibirá un email elegante con:
   - El código del descuento destacado
   - Detalles del descuento (valor, validez, requisitos)
   - Instrucciones de uso
   - Botón directo a la tienda

**El email incluye:**
- ✨ Diseño profesional y atractivo con gradientes
- 🎁 Código destacado en un recuadro llamativo
- 📋 Detalles completos del descuento
- 🛍️ Botón directo para comprar
- 📝 Instrucciones paso a paso de cómo usar el código

### Gestionar descuentos

En la tabla de descuentos puedes:

- **Ver el estado**: Badge verde "Activo" o rojo "Inactivo"
- **Activar/Desactivar**: Haz clic en el badge de estado
- **Ver usos**: Columna "Usos" muestra cuántas veces se ha usado
- **Ver cliente**: Email del cliente (si es personalizado)
- **Verificar envío**: Marca "✓ Enviado" cuando se ha enviado por email
- **Eliminar**: Botón "Eliminar" con confirmación

## 🎯 Casos de uso comunes

### 1. Descuento de bienvenida para nuevo cliente

```
Código: WELCOME15
Email del cliente: nuevo@cliente.com
Tipo: Porcentaje
Valor: 15
Compra mínima: 0€
Usos máximos: 1
Válido hasta: 30 días desde hoy
```

### 2. Compensación por problema con pedido

```
Código: [Generar automático]
Email del cliente: cliente@afectado.com
Tipo: Cantidad fija
Valor: 10
Compra mínima: 0€
Usos máximos: 1
Válido hasta: 90 días
```

### 3. Campaña de rebajas pública

```
Código: REBAJAS20
Email del cliente: [Dejar vacío]
Tipo: Porcentaje
Valor: 20
Compra mínima: 50€
Usos máximos: [Ilimitado]
Válido hasta: Fin de temporada
```

### 4. Cliente VIP fidelización

```
Código: [Generar automático]
Email del cliente: clientevip@ejemplo.com
Tipo: Porcentaje
Valor: 25
Compra mínima: 100€
Usos máximos: 3
Válido hasta: Fin de año
```

## 📊 Seguimiento y análisis

El sistema registra automáticamente:

- **Fecha de creación** de cada cupón
- **Fecha de envío** del email (si aplica)
- **Número de usos** del cupón
- **Estado del cupón** (activo/inactivo)

En la tabla `coupon_emails` (en Supabase) puedes ver:
- Historial completo de envíos
- Fecha y hora de cada envío
- Relación entre cupón y cliente

## 🔒 Seguridad

El sistema implementa políticas de seguridad (RLS):

- ✅ Los clientes solo pueden ver cupones públicos o sus propios cupones personalizados
- ✅ Solo administradores autenticados pueden crear/modificar cupones
- ✅ Los códigos personalizados están vinculados al email del cliente
- ✅ El sistema valida automáticamente la pertenencia del cupón

## ❓ Preguntas frecuentes

**P: ¿Puedo cambiar un cupón de público a personalizado?**  
R: Sí, simplemente edita el cupón y agrega un email de cliente. Luego podrás enviarlo.

**P: ¿Qué pasa si el email no se envía?**  
R: Verifica tu configuración de email en el archivo `.env`. El cupón seguirá siendo válido y el cliente podrá usarlo si conoce el código.

**P: ¿Puedo enviar el mismo cupón a varios clientes?**  
R: Es mejor crear cupones separados para cada cliente. Así tendrás mejor seguimiento y control.

**P: ¿Los clientes ven todos los cupones en su cuenta?**  
R: Los clientes solo ven cupones públicos activos y sus propios cupones personalizados en el checkout.

**P: ¿Puedo crear cupones sin fecha de expiración?**  
R: Sí, simplemente deja el campo "Válido hasta" vacío.

## 📝 Notas técnicas

### Archivos creados/modificados:

1. **Base de datos:**
   - `supabase/personalized_coupons_migration.sql` - Nueva migración

2. **Backend:**
   - `src/pages/api/generate-coupon-code.ts` - Generador de códigos
   - `src/pages/api/send-coupon-email.ts` - Envío de emails
   - `src/lib/email.ts` - Función `sendCouponEmail()` agregada

3. **Frontend:**
   - `src/pages/admin/descuentos.astro` - Panel de administración
   - `src/layouts/AdminLayout.astro` - Menú actualizado con nueva sección

### Integraciones:

- ✅ Sistema de emails existente (nodemailer + Gmail)
- ✅ Sistema de cupones existente (tabla `coupons`)
- ✅ Sistema de autenticación (políticas RLS)
- ✅ Carrito de compras (validación de cupones)

---

**¡Disfruta del nuevo sistema de descuentos personalizados!** 🎉

Si tienes alguna pregunta o necesitas ayuda, no dudes en consultar la documentación o revisar los logs del servidor.
