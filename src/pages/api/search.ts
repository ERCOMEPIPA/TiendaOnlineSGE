import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q')?.trim() || '';

    if (query.length < 2) {
        return new Response(JSON.stringify({ products: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Search by name or artist (case insensitive)
        const searchPattern = `%${query}%`;

        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, slug, price, images, artist')
            .or(`name.ilike.${searchPattern},artist.ilike.${searchPattern}`)
            .limit(10);

        if (error) {
            console.error('Search error:', error.message);
            return new Response(JSON.stringify({ products: [], error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ products: products || [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Search exception:', error);
        return new Response(JSON.stringify({ products: [], error: 'Search failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
