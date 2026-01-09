# FashionStore 🛍️

E-commerce de merch de artistas / moda masculina premium con Astro 5.0, Tailwind CSS y Supabase.

## Stack Tecnológico

- **Frontend**: Astro 5.0 (Híbrido SSG/SSR)
- **Estilos**: Tailwind CSS con paleta personalizada
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Estado**: Nano Stores (carrito persistente)
- **UI Islands**: React para componentes interactivos

## Estructura del Proyecto

```
fashionstore/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos
│   │   ├── product/            # Componentes de producto
│   │   └── islands/            # Componentes React interactivos
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PublicLayout.astro
│   │   └── AdminLayout.astro
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   └── utils.ts            # Funciones utilitarias
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── productos/          # Catálogo
│   │   ├── categoria/          # Filtro por categoría
│   │   ├── carrito.astro       # Carrito (SSR)
│   │   ├── admin/              # Panel admin (SSR protegido)
│   │   └── api/                # API endpoints
│   ├── stores/
│   │   └── cart.ts             # Estado del carrito
│   └── middleware.ts           # Protección de rutas
├── supabase/
│   └── schema.sql              # Esquema de base de datos
├── astro.config.mjs
├── tailwind.config.mjs
└── .env.example
```

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.example` a `.env` y añade tus credenciales:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

3. Ejecuta el esquema SQL en tu proyecto Supabase:
   - Ve a SQL Editor en Supabase Dashboard
   - Copia y ejecuta el contenido de `supabase/schema.sql`

### 3. Configurar Storage

1. Ve a Storage en Supabase Dashboard
2. Crea un bucket llamado `products-images`
3. Marca el bucket como público

### 4. Crear usuario admin

1. Ve a Authentication > Users en Supabase Dashboard
2. Crea un usuario con email/contraseña
3. Este usuario podrá acceder al panel `/admin`

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Páginas

### Tienda Pública (SSG)
- `/` - Homepage
- `/productos` - Catálogo completo
- `/productos/[slug]` - Detalle de producto
- `/categoria/[slug]` - Productos por categoría
- `/carrito` - Carrito de compras (SSR)

### Panel Admin (SSR Protegido)
- `/admin/login` - Login de administrador
- `/admin` - Dashboard
- `/admin/productos` - Gestión de productos
- `/admin/productos/nuevo` - Crear producto
- `/admin/productos/[id]` - Editar producto

## Características

✅ Diseño minimalista y sofisticado  
✅ Carrito persistente con Nano Stores  
✅ Autenticación de administradores  
✅ CRUD completo de productos  
✅ Responsive design  
✅ Animaciones y transiciones suaves  
✅ SEO optimizado  
✅ Accesibilidad

## Licencia

MIT
