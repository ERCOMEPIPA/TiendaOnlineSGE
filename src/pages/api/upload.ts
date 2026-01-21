export const prerender = false;

import type { APIRoute } from 'astro';
import { cloudinary } from '../../lib/cloudinary';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Get auth tokens from cookies
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            return new Response(
                JSON.stringify({ error: 'No autenticado' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(
                JSON.stringify({ error: 'No se proporcionó archivo' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'hypestage/products',
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(buffer);
        });

        if (!uploadResult || !uploadResult.secure_url) {
            return new Response(
                JSON.stringify({ error: 'Error al subir la imagen a Cloudinary' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('API error:', error);
        return new Response(
            JSON.stringify({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
