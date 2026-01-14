# Migración a Cloudinary - Guía de Configuración

## ✅ Cambios Implementados

### 1. Instalación
- ✅ SDK de Cloudinary instalado (`npm install cloudinary`)

### 2. Archivos Creados/Modificados

#### Nuevos Archivos
- **`src/lib/cloudinary.ts`**: Utilidades y configuración de Cloudinary
- **`scripts/migrate-images-to-cloudinary.js`**: Script para migrar imágenes existentes

#### Archivos Modificados
- **`src/pages/api/upload.ts`**: Ahora sube a Cloudinary en lugar de Supabase Storage
- **`src/lib/supabase.ts`**: Eliminada función `getImageUrl()` obsoleta
- **`.env.example`**: Añadidas variables de Cloudinary

---

## 🔧 Configuración Requerida

### Paso 1: Añadir Credenciales a `.env`

Abre tu archivo `.env` y añade las siguientes líneas con tus credenciales de Cloudinary:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**¿Dónde encontrar estas credenciales?**
1. Ve a [cloudinary.com/console](https://cloudinary.com/console)
2. En el Dashboard verás:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (haz clic en "Reveal" para verlo)

---

## 📦 Migración de Imágenes Existentes

### Paso 2: Ejecutar Script de Migración

Una vez configuradas las credenciales, ejecuta:

```bash
node scripts/migrate-images-to-cloudinary.js
```

**¿Qué hace este script?**
1. ✅ Obtiene todos los productos de la base de datos
2. ✅ Descarga cada imagen desde Supabase Storage
3. ✅ La sube a Cloudinary (carpeta: `fashionstore/products`)
4. ✅ Actualiza las URLs en la base de datos
5. ✅ Muestra un resumen de éxitos/errores

**Nota**: Las imágenes que ya estén en Cloudinary se omitirán automáticamente.

---

## 🧪 Pruebas

### Paso 3: Verificar Funcionamiento

1. **Probar subida de nueva imagen**:
   - Ve a `/admin/productos/nuevo`
   - Sube una imagen
   - Verifica que la URL comience con `https://res.cloudinary.com/`

2. **Verificar productos existentes**:
   - Ve a `/productos`
   - Confirma que todas las imágenes se visualizan correctamente

3. **Dashboard de Cloudinary**:
   - Ve a tu dashboard de Cloudinary
   - Navega a Media Library → `fashionstore/products`
   - Verifica que las imágenes estén allí

---

## 🎯 Beneficios de Cloudinary

- ✅ **Optimización automática**: Las imágenes se optimizan en calidad y formato
- ✅ **CDN global**: Carga más rápida desde cualquier ubicación
- ✅ **Transformaciones on-the-fly**: Puedes redimensionar/recortar con URLs
- ✅ **Formato automático**: Sirve WebP a navegadores compatibles
- ✅ **25 GB gratis**: Suficiente para proyectos académicos

---

## 🔄 Cómo Funciona Ahora

### Flujo de Subida de Imágenes

1. Usuario selecciona imagen en el admin
2. `ImageUploader.tsx` envía archivo a `/api/upload`
3. `/api/upload.ts` convierte el archivo a buffer
4. Se sube a Cloudinary con optimizaciones automáticas
5. Cloudinary retorna URL segura
6. URL se guarda en la base de datos
7. Imagen se muestra en la tienda usando la URL de Cloudinary

### URLs de Ejemplo

**Antes (Supabase)**:
```
https://[proyecto].supabase.co/storage/v1/object/public/products-images/[filename]
```

**Ahora (Cloudinary)**:
```
https://res.cloudinary.com/[cloud-name]/image/upload/v[version]/fashionstore/products/[filename]
```

---

## 📝 Notas Importantes

- ⚠️ **No elimines** las imágenes de Supabase Storage hasta confirmar que la migración fue exitosa
- ✅ El componente `ImageUploader.tsx` no requiere cambios
- ✅ Las páginas de admin funcionan igual que antes
- ✅ Las imágenes antiguas seguirán funcionando hasta que ejecutes el script de migración

---

## 🆘 Solución de Problemas

### Error: "No autenticado"
- Asegúrate de estar logueado como admin

### Error: "Error al subir la imagen a Cloudinary"
- Verifica que las credenciales en `.env` sean correctas
- Confirma que tu cuenta de Cloudinary esté activa

### Las imágenes no se muestran
- Verifica que las URLs en la base de datos sean correctas
- Comprueba la consola del navegador para errores

---

## 📞 Próximos Pasos

1. ✅ Añadir credenciales a `.env`
2. ✅ Ejecutar script de migración
3. ✅ Probar subida de nuevas imágenes
4. ✅ Verificar visualización en la tienda
5. ✅ (Opcional) Eliminar imágenes de Supabase Storage después de confirmar migración exitosa
