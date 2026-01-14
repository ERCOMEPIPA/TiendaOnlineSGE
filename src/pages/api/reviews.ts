export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch reviews for a product
export const GET: APIRoute = async ({ url, cookies }) => {
    try {
        const productId = url.searchParams.get('productId');

        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'productId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get current user (if authenticated)
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;
        let currentUserId: string | null = null;

        if (accessToken && refreshToken) {
            const { data: { user } } = await supabase.auth.getUser(accessToken);
            currentUserId = user?.id || null;
        }

        // Fetch reviews
        const { data: reviews, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
            return new Response(
                JSON.stringify({ error: 'Error al obtener reseñas' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Calculate stats
        const totalReviews = reviews?.length || 0;
        const sumRatings = reviews?.reduce((sum, r) => sum + r.rating, 0) || 0;
        const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

        const stats = {
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: totalReviews,
            rating_5: reviews?.filter(r => r.rating === 5).length || 0,
            rating_4: reviews?.filter(r => r.rating === 4).length || 0,
            rating_3: reviews?.filter(r => r.rating === 3).length || 0,
            rating_2: reviews?.filter(r => r.rating === 2).length || 0,
            rating_1: reviews?.filter(r => r.rating === 1).length || 0,
        };

        // Check if current user has reviewed
        const userHasReviewed = currentUserId
            ? reviews?.some(r => r.user_id === currentUserId)
            : false;

        return new Response(
            JSON.stringify({ reviews, stats, userHasReviewed }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Reviews GET error:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// POST: Create a new review
export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        // Get auth tokens
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            return new Response(
                JSON.stringify({ error: 'Debes iniciar sesión para dejar una reseña' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Set session
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Sesión inválida' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const body = await request.json();
        const { productId, rating, title, comment } = body;

        // Validation
        if (!productId) {
            return new Response(
                JSON.stringify({ error: 'productId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!rating || rating < 1 || rating > 5) {
            return new Response(
                JSON.stringify({ error: 'La valoración debe ser entre 1 y 5' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if user already reviewed this product
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', user.id)
            .single();

        if (existingReview) {
            return new Response(
                JSON.stringify({ error: 'Ya has dejado una reseña para este producto' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if user has purchased this product (for verified badge)
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('id, order:orders!inner(user_id, status)')
            .eq('product_id', productId)
            .eq('order.user_id', user.id)
            .eq('order.status', 'delivered');

        const verifiedPurchase = (orderItems?.length || 0) > 0;

        // Create review
        const { data: review, error: insertError } = await supabase
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: user.id,
                user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                user_email: user.email,
                rating,
                title: title || null,
                comment: comment || null,
                verified_purchase: verifiedPurchase,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating review:', insertError);
            return new Response(
                JSON.stringify({ error: 'Error al crear la reseña' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ review, message: '¡Reseña creada exitosamente!' }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Reviews POST error:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
