/**
 * Script para migrar imágenes existentes de Supabase Storage a Cloudinary
 * 
 * Este script:
 * 1. Obtiene todos los productos de la base de datos
 * 2. Descarga las imágenes de Supabase Storage
 * 3. Las sube a Cloudinary
 * 4. Actualiza las URLs en la base de datos
 * 
 * Uso:
 * 1. Asegúrate de tener las credenciales de Cloudinary en .env
 * 2. Ejecuta: node scripts/migrate-images-to-cloudinary.js
 */

import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan credenciales de Supabase en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: Faltan credenciales de Cloudinary en .env');
    process.exit(1);
}

/**
 * Sube una imagen desde URL a Cloudinary
 */
async function uploadToCloudinary(imageUrl, productName) {
    try {
        console.log(`  📤 Subiendo: ${imageUrl}`);

        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: 'fashionstore/products',
            resource_type: 'image',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' }
            ],
        });

        console.log(`  ✅ Subida exitosa: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error(`  ❌ Error al subir imagen:`, error.message);
        return null;
    }
}

/**
 * Migrar imágenes de un producto
 */
async function migrateProductImages(product) {
    console.log(`\n📦 Producto: ${product.name} (ID: ${product.id})`);

    if (!product.images || product.images.length === 0) {
        console.log('  ⚠️  Sin imágenes para migrar');
        return { success: true, newImages: [] };
    }

    const newImages = [];

    for (const imageUrl of product.images) {
        // Si ya es una URL de Cloudinary, no migrar
        if (imageUrl.includes('cloudinary.com')) {
            console.log(`  ⏭️  Ya está en Cloudinary: ${imageUrl}`);
            newImages.push(imageUrl);
            continue;
        }

        const newUrl = await uploadToCloudinary(imageUrl, product.name);
        if (newUrl) {
            newImages.push(newUrl);
        } else {
            // Si falla, mantener la URL original
            console.log(`  ⚠️  Manteniendo URL original por error`);
            newImages.push(imageUrl);
        }
    }

    return { success: true, newImages };
}

/**
 * Actualizar producto en la base de datos
 */
async function updateProductImages(productId, newImages) {
    const { error } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', productId);

    if (error) {
        console.error(`  ❌ Error al actualizar producto:`, error.message);
        return false;
    }

    console.log(`  💾 Base de datos actualizada`);
    return true;
}

/**
 * Función principal
 */
async function main() {
    console.log('🚀 Iniciando migración de imágenes a Cloudinary\n');
    console.log('='.repeat(60));

    // Obtener todos los productos
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error al obtener productos:', error.message);
        process.exit(1);
    }

    if (!products || products.length === 0) {
        console.log('⚠️  No hay productos para migrar');
        return;
    }

    console.log(`📊 Total de productos encontrados: ${products.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
        try {
            const { success, newImages } = await migrateProductImages(product);

            if (success && newImages.length > 0) {
                const updated = await updateProductImages(product.id, newImages);
                if (updated) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }
        } catch (error) {
            console.error(`❌ Error procesando producto ${product.id}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migración completada\n');
    console.log(`✅ Productos migrados exitosamente: ${successCount}`);
    console.log(`❌ Productos con errores: ${errorCount}`);
    console.log(`📊 Total procesados: ${products.length}`);
}

// Ejecutar
main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
