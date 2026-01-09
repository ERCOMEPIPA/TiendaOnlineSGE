import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { getUserSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Check if user is authenticated
        const userSession = await getUserSession(cookies);
        if (!userSession) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized. Please log in.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        let items;
        try {
            const body = await request.json();
            items = body.items;
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Cart is empty' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get product details from Supabase to ensure prices are accurate
        const productIds = items.map((item: any) => item.product.id);
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

        if (error || !products) {
            return new Response(
                JSON.stringify({ error: 'Error fetching products' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create line items for Stripe
        const lineItems = items.map((item: any) => {
            const product = products.find((p) => p.id === item.product.id);
            if (!product) {
                throw new Error(`Product ${item.product.id} not found`);
            }

            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        description: `Talla: ${item.size}`,
                        images: product.images.length > 0 ? [product.images[0]] : [],
                        metadata: {
                            product_id: product.id,
                            size: item.size,
                        },
                    },
                    unit_amount: product.price, // Price in cents
                },
                quantity: item.quantity,
            };
        });

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: userSession.user.email,
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/carrito`,
            metadata: {
                user_id: userSession.user.id,
                user_email: userSession.user.email,
                items: JSON.stringify(items.map((item: any) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    size: item.size,
                }))),
            },
        });

        return new Response(
            JSON.stringify({ sessionId: session.id, url: session.url }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
