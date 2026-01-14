import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { getUserSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { productId, email } = await request.json();

        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'Product ID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get user session if available
        const userSession = await getUserSession(cookies);
        const userEmail = email || userSession?.user?.email;

        if (!userEmail) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Verify the product exists and is out of stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, stock')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return new Response(
                JSON.stringify({ error: 'Product not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (product.stock > 0) {
            return new Response(
                JSON.stringify({ error: 'Product is already in stock' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Try to insert the notification (will fail if duplicate due to unique constraint)
        const { data, error } = await supabase
            .from('stock_notifications')
            .upsert({
                product_id: productId,
                user_email: userEmail,
                user_id: userSession?.user?.id || null,
                notified: false,
            }, {
                onConflict: 'product_id,user_email',
                ignoreDuplicates: true
            })
            .select()
            .single();

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('stock_notifications')
            .select('id')
            .eq('product_id', productId)
            .eq('user_email', userEmail)
            .single();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Te notificaremos cuando el producto esté disponible',
                email: userEmail
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error creating stock notification:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
