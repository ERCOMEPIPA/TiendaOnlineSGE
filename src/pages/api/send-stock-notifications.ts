import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sendStockAvailableEmail } from '../../lib/email';
import { getUserSession } from '../../lib/auth';

export const prerender = false;

// This endpoint should be called when stock is updated (e.g., from admin panel)
export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Only authenticated users can trigger stock notifications
        const userSession = await getUserSession(cookies);

        if (!userSession) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { productId } = await request.json();

        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'Product ID is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get product details
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, slug, price, stock, images')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return new Response(
                JSON.stringify({ error: 'Product not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Only send notifications if product is NOW in stock
        if (product.stock <= 0) {
            return new Response(
                JSON.stringify({ error: 'Product is still out of stock' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get pending notifications for this product
        const { data: notifications, error: notifError } = await supabase
            .from('stock_notifications')
            .select('id, user_email')
            .eq('product_id', productId)
            .eq('notified', false);

        if (notifError) {
            return new Response(
                JSON.stringify({ error: 'Error fetching notifications' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!notifications || notifications.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No pending notifications', sent: 0 }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Send emails to all subscribers
        let sentCount = 0;
        const errors: string[] = [];

        for (const notif of notifications) {
            try {
                const result = await sendStockAvailableEmail({
                    customerEmail: notif.user_email,
                    productName: product.name,
                    productSlug: product.slug,
                    productImage: product.images?.[0],
                    productPrice: product.price,
                });

                if (result.success) {
                    sentCount++;
                    await supabase
                        .from('stock_notifications')
                        .update({ notified: true, notified_at: new Date().toISOString() })
                        .eq('id', notif.id);
                } else {
                    errors.push(`Failed to notify ${notif.user_email}`);
                }
            } catch (error: any) {
                errors.push(`Error notifying ${notif.user_email}: ${error.message}`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Stock notifications sent`,
                sent: sentCount,
                total: notifications.length,
                errors: errors.length > 0 ? errors : undefined,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error sending stock notifications:', error.message);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
