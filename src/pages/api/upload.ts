export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

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

        // Set session for authenticated upload
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        // Get file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(
                JSON.stringify({ error: 'No se proporcionó archivo' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('products-images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return new Response(
                JSON.stringify({ error: uploadError.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get public URL
        const { data } = supabase.storage
            .from('products-images')
            .getPublicUrl(fileName);

        return new Response(
            JSON.stringify({ url: data.publicUrl }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('API error:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
