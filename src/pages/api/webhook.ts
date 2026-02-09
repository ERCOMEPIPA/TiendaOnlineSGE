import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { sendOrderConfirmationEmail } from '../../lib/email';
import { generateInvoiceForOrder } from '../../lib/invoices';
import Stripe from 'stripe';

export const prerender = false;

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');

    // If no webhook secret configured, just acknowledge (for development without webhooks)
    if (!endpointSecret) {
        console.log('No webhook secret configured, skipping verification');
        return new Response(JSON.stringify({ received: true, note: 'No webhook secret configured' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!signature) {
        return new Response('Webhook signature missing', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await request.text();
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', errorMessage);
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error handling webhook:', error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout completed via webhook:', session.id);

    // Check if order already exists (created by success page)
    const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

    if (existingOrder) {
        console.log('Order already exists, skipping webhook processing:', existingOrder.id);
        return;
    }

    // Parse items from metadata
    const items = JSON.parse(session.metadata?.items || '[]');
    const userId = session.metadata?.user_id;

    if (items.length === 0) {
        console.error('No items found in session metadata');
        return;
    }

    // Get customer details
    const customerEmail = session.customer_details?.email || session.metadata?.user_email || 'unknown@email.com';
    const customerName = session.customer_details?.name || session.metadata?.customer_name || 'Cliente';
    const customerPhone = session.customer_details?.phone || session.metadata?.customer_phone || null;

    // Get shipping address from metadata
    const shippingAddress = session.metadata?.shipping_address || 'N/A';
    const shippingAddress2 = session.metadata?.shipping_address2 || '';
    const shippingPostalCode = session.metadata?.shipping_postal_code || 'N/A';
    const shippingCity = session.metadata?.shipping_city || 'N/A';
    const shippingProvince = session.metadata?.shipping_province || 'N/A';

    // Create order in database
    const { data: order, error: orderDbError } = await supabase
        .from('orders')
        .insert({
            user_id: userId || null,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            total: session.amount_total || 0,
            status: 'pending',
            stripe_session_id: session.id,
        })
        .select()
        .single();

    if (orderDbError || !order) {
        console.error('Error creating order:', orderDbError);
        return;
    }

    // Get product info
    const productIds = items.map((item: { product_id: string }) => item.product_id);
    const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .in('id', productIds);

    if (!products) {
        console.error('Error fetching products');
        return;
    }

    // Create order items
    const orderItems = items.map((item: { product_id: string; quantity: number; size: string }) => {
        const product = products.find((p) => p.id === item.product_id);
        return {
            order_id: order.id,
            product_id: item.product_id,
            product_name: product?.name || 'Producto',
            product_price: product?.price || 0,
            quantity: item.quantity,
            size: item.size,
        };
    });

    // Insert order items
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        return;
    }

    console.log('Order created successfully via webhook:', order.id);

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

    // Generate invoice automatically
    const fullAddress = shippingAddress2
        ? `${shippingAddress}, ${shippingAddress2}`
        : shippingAddress;

    const billingData = {
        billing_name: customerName,
        billing_address: fullAddress,
        billing_postal_code: shippingPostalCode,
        billing_city: `${shippingCity}, ${shippingProvince}`,
    };

    await generateInvoiceForOrder(order.id, billingData);

    // Send order confirmation email
    const emailItems = orderItems.map((oi: { product_name: string; quantity: number; size: string; product_price: number }) => ({
        product_name: oi.product_name,
        quantity: oi.quantity,
        size: oi.size,
        price: oi.product_price,
    }));

    await sendOrderConfirmationEmail({
        customerEmail,
        customerName,
        orderId: order.id,
        items: emailItems,
        total: order.total,
        orderDate: order.created_at,
    });
}
