# 🛒 Carrito Ligado a la Cuenta de Usuario

## Cambios Implementados

Se ha implementado un sistema de carrito persistente ligado a la cuenta del usuario, que permite:

1. **Carrito persistente en base de datos** - Los usuarios autenticados tienen su carrito guardado en Supabase
2. **Carrito independiente por usuario** - Cada usuario tiene su propio carrito único
3. **Limpieza automática al cerrar sesión** - El carrito se limpia cuando el usuario cierra sesión
4. **Recuperación al iniciar sesión** - El carrito se carga automáticamente cuando el usuario vuelve a entrar
5. **Fusión de carritos** - Si un usuario tiene items en localStorage (como invitado) y luego inicia sesión, los carritos se fusionan

## 📦 Migración de Base de Datos

### Paso 1: Ejecutar la migración

Debes ejecutar el archivo SQL de migración en tu proyecto de Supabase:

**Archivo:** `supabase/cart_migration.sql`

#### Opción A: Desde el Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `supabase/cart_migration.sql`
5. Haz clic en **Run** para ejecutar la migración

#### Opción B: Desde la CLI de Supabase

Si tienes Supabase CLI instalado:

```bash
supabase db push
```

O ejecuta directamente:

```bash
psql -h <tu-db-host> -U postgres -d postgres -f supabase/cart_migration.sql
```

### Paso 2: Verificar la migración

Después de ejecutar la migración, verifica que se haya creado:

1. **Tabla `cart_items`** con las columnas:
   - `id` (UUID)
   - `user_id` (UUID) - referencia al usuario
   - `product_id` (UUID) - referencia al producto
   - `quantity` (INTEGER)
   - `size` (TEXT)
   - `color` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

2. **Índices** para mejorar el rendimiento
3. **Políticas RLS** para seguridad

## 🔧 Cambios en el Código

### 1. Store del Carrito (`src/stores/cart.ts`)

**Nuevas funciones:**
- `loadCart(userId?)` - Carga el carrito del usuario desde la base de datos o localStorage
- `clearCartOnLogout()` - Limpia el carrito cuando el usuario cierra sesión
- `setCurrentUser(userId)` - Establece el usuario actual

**Modificaciones:**
- Todas las funciones de modificación del carrito ahora son asíncronas
- `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()` ahora retornan `Promise<void>`
- El carrito se guarda automáticamente en la base de datos para usuarios autenticados

### 2. Layout Público (`src/layouts/PublicLayout.astro`)

Se agregó lógica para:
- Cargar el carrito del usuario al cargar la página
- Escuchar cambios en el estado de autenticación
- Limpiar el carrito cuando el usuario cierra sesión

### 3. Página de Logout (`src/pages/auth/logout.astro`)

Se agregó la limpieza del carrito antes de cerrar sesión.

## 🚀 Comportamiento

### Usuario Invitado (No autenticado)
- El carrito se guarda en `localStorage`
- Persiste en el navegador hasta que se limpia manualmente
- No está ligado a ninguna cuenta

### Usuario Autenticado
- El carrito se guarda en la base de datos de Supabase
- Persiste entre sesiones y dispositivos
- Solo es accesible por el usuario propietario

### Flujo de Login
1. Usuario invitado agrega items al carrito (localStorage)
2. Usuario inicia sesión
3. El sistema carga el carrito del usuario desde la base de datos
4. Si hay items en localStorage, se fusionan con los de la base de datos
5. El carrito fusionado se guarda en la base de datos
6. Se limpia localStorage

### Flujo de Logout
1. Usuario cierra sesión
2. El carrito se limpia del estado local
3. Se elimina el carrito de localStorage
4. El carrito en la base de datos permanece intacto
5. El usuario es redirigido a la página principal

## 🔒 Seguridad

- **Row Level Security (RLS)** está habilitado en la tabla `cart_items`
- Los usuarios solo pueden ver, crear, actualizar y eliminar sus propios items
- Las políticas RLS verifican que `auth.uid() = user_id`

## 🎯 Próximos Pasos

1. **Ejecutar la migración** en Supabase
2. **Probar el flujo completo**:
   - Agregar items como invitado
   - Iniciar sesión
   - Verificar que el carrito se mantenga
   - Cerrar sesión
   - Verificar que el carrito se limpie
   - Iniciar sesión nuevamente
   - Verificar que el carrito guardado se recupere

## ⚠️ Notas Importantes

- Los componentes que usan funciones del carrito ahora deben manejarlas como promesas
- Ejemplo de uso actualizado:
  ```typescript
  // Antes
  addItem(product, 1, size, color);
  
  // Ahora
  await addItem(product, 1, size, color);
  ```

- Si encuentras errores de TypeScript sobre async/await, asegúrate de que las funciones que llaman al carrito sean `async`
