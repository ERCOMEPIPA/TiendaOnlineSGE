import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { sendOrderConfirmationEmail } from '../../lib/email';
import Stripe from 'stripe';

export const prerender = false;

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');

    if (!signature || !endpointSecret) {
        return new Response('Webhook signature missing', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await request.text();
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('PaymentIntent succeeded:', paymentIntent.id);
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('PaymentIntent failed:', paymentIntent.id);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout completed:', session.id);

    // Parse items from metadata
    const items = JSON.parse(session.metadata?.items || '[]');
    const userId = session.metadata?.user_id;

    if (items.length === 0) {
        console.error('No items found in session metadata');
        return;
    }

    // Get customer details
    const customerEmail = session.customer_details?.email || session.metadata?.user_email || 'unknown@email.com';
    const customerName = session.customer_details?.name || 'Unknown';

    // Create order in database
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            customer_email: customerEmail,
            customer_name: customerName,
            total: session.amount_total || 0,
            status: 'pending',
            stripe_session_id: session.id,
        })
        .select()
        .single();

    if (orderError || !order) {
        console.error('Error creating order:', orderError);
        return;
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        price: 0, // Will be updated below
    }));

    // Get product prices and names
    const productIds = items.map((item: any) => item.product_id);
    const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);

    if (products) {
        orderItems.forEach((orderItem) => {
            const product = products.find((p) => p.id === orderItem.product_id);
            if (product) {
                orderItem.price = product.price;
            }
        });
    }

    // Insert order items
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        return;
    }

    console.log('Order created successfully:', order.id);

    // Update product stock
    for (const item of items) {
        const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

        if (product) {
            await supabase
                .from('products')
                .update({ stock: Math.max(0, product.stock - item.quantity) })
                .eq('id', item.product_id);
        }
    }

    // Send order confirmation email
    if (products) {
        const emailItems = orderItems.map((orderItem) => {
            const product = products.find((p) => p.id === orderItem.product_id);
            return {
                product_name: product?.name || 'Producto',
                quantity: orderItem.quantity,
                size: orderItem.size,
                price: orderItem.price,
            };
        });

        await sendOrderConfirmationEmail({
            customerEmail,
            customerName,
            orderId: order.id,
            items: emailItems,
            total: order.total,
            orderDate: order.created_at,
        });
    }
}
