import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { getUserSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Check if user is authenticated (optional now)
        // Use cookies to detect browser sessions properly
        const userSession = await getUserSession(cookies);

        // Parse request body first
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { items, guestInfo, shippingInfo } = body;

        // Determine customer info
        let customerEmail: string;
        let userId: string | null = null;
        let customerName: string | null = null;
        let customerPhone: string | null = null;
        let shippingAddress: string | null = null;
        let shippingAddress2: string | null = null;
        let shippingPostalCode: string | null = null;
        let shippingCity: string | null = null;
        let shippingProvince: string | null = null;

        if (userSession?.user) {
            customerEmail = userSession.user.email!;
            userId = userSession.user.id;
            // Get shipping info from the shipping form (logged-in users)
            if (shippingInfo) {
                shippingAddress = shippingInfo.address;
                shippingAddress2 = shippingInfo.address2 || null;
                shippingPostalCode = shippingInfo.postalCode;
                shippingCity = shippingInfo.city;
                shippingProvince = shippingInfo.province;
            }
        } else {
            // Guest mode
            if (!guestInfo || !guestInfo.email || !guestInfo.name) {
                return new Response(
                    JSON.stringify({ error: 'Guest information (email and name) is required' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }
            customerEmail = guestInfo.email;
            customerName = guestInfo.name;
            customerPhone = guestInfo.phone;
            shippingAddress = guestInfo.address;
            shippingAddress2 = guestInfo.address2 || null;
            shippingPostalCode = guestInfo.postalCode;
            shippingCity = guestInfo.city;
            shippingProvince = guestInfo.province;
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

            // Check if product has active discount
            const now = new Date();
            const discountPriceInCents = product.discount_price
                ? product.discount_price * 100
                : null;
            const hasDiscount =
                discountPriceInCents &&
                discountPriceInCents < product.price &&
                (!product.discount_end_date || new Date(product.discount_end_date) > now);
            const priceToUse = hasDiscount ? discountPriceInCents : product.price;

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
                    unit_amount: priceToUse, // Price in cents (uses discount if active)
                },
                quantity: item.quantity,
            };
        });

        // Add coupon discount if applicable
        // ... (existing logic handles amount override via logic, but here we just create session)
        // Wait, current implementation doesn't seem to pass discount to Stripe line items directly unless we add a discount coupon or negative line item.
        // The frontend sends `discountAmount` but the previous code didn't use it in Stripe session creation?
        // Checking previous file content...
        // The previous code received `couponCode` and `discountAmount` but didn't seem to use them in `stripe.checkout.sessions.create` arguments shown in line 78-94.
        // It seems the implementation of coupons was missing in the backend Stripe session creation in the provided snippet?
        // Or maybe it was truncated.
        // I will assume for now I just need to fix the guest checkout part. 
        // If discount needs to be applied, it should be done here. But I'll stick to the guest checkout task to avoid scope creep, 
        // unless I see it's critical. The snippet I replaced didn't show coupon logic in Stripe session.

        // Metadata for webhook
        const metadata: any = {
            user_email: customerEmail,
            items: JSON.stringify(items.map((item: any) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                size: item.size,
            }))),
        };

        if (userId) metadata.user_id = userId;
        if (customerName) metadata.customer_name = customerName;
        if (customerPhone) metadata.customer_phone = customerPhone;
        if (shippingAddress) metadata.shipping_address = shippingAddress;
        if (shippingAddress2) metadata.shipping_address2 = shippingAddress2;
        if (shippingPostalCode) metadata.shipping_postal_code = shippingPostalCode;
        if (shippingCity) metadata.shipping_city = shippingCity;
        if (shippingProvince) metadata.shipping_province = shippingProvince;
        metadata.is_guest = userId ? 'false' : 'true';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: customerEmail,
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/carrito`,
            metadata: metadata,
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
