// Script simplificado para recuperar order_items
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    const log: string[] = [];
    const addLog = (msg: string) => {
        console.log(msg);
        log.push(msg);
    };

    addLog('=== RECOVERING ORDER ITEMS ===');

    // Get orders
    const { data: orders } = await supabase
        .from('orders')
        .select('id, stripe_session_id')
        .not('stripe_session_id', 'is', null);

    addLog(`Found ${orders?.length || 0} orders with stripe_session_id`);

    if (!orders) return;

    for (const order of orders) {
        addLog(`\nOrder: ${order.id}`);
        addLog(`  Session: ${order.stripe_session_id}`);

        // Check existing items
        const { data: existing } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', order.id);

        if (existing && existing.length > 0) {
            addLog(`  Already has ${existing.length} items`);
            continue;
        }

        try {
            // Get Stripe session
            const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id!);

            // Parse items from metadata
            if (session.metadata?.items) {
                const items = JSON.parse(session.metadata.items);
                addLog(`  Metadata items: ${items.length}`);

                // Get product info and create order_items
                for (const item of items) {
                    const { data: product } = await supabase
                        .from('products')
                        .select('name, price')
                        .eq('id', item.product_id)
                        .single();

                    const orderItem = {
                        order_id: order.id,
                        product_id: item.product_id,
                        product_name: product?.name || 'Producto',
                        product_price: product?.price || 0,
                        quantity: item.quantity,
                        size: item.size || 'N/A',
                    };

                    const { error } = await supabase
                        .from('order_items')
                        .insert(orderItem);

                    if (error) {
                        addLog(`  Error inserting: ${error.message}`);
                    } else {
                        addLog(`  Added: ${orderItem.product_name} x${orderItem.quantity}`);
                    }
                }
            } else {
                addLog('  No metadata items found');
            }
        } catch (e: any) {
            addLog(`  Error: ${e.message}`);
        }
    }

    addLog('\n=== DONE ===');

    // Save log to file
    fs.writeFileSync('recovery-log.txt', log.join('\n'));
    addLog('Log saved to recovery-log.txt');
}

main();
