export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ cookies }) => {
    try {
        // Only check user tokens for the public storefront
        // Admin tokens (sb-access-token) are for the admin panel, not for shopping
        const accessToken = cookies.get('user-access-token')?.value;
        const refreshToken = cookies.get('user-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            return new Response(
                JSON.stringify({ user: null }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error || !user) {
            return new Response(
                JSON.stringify({ user: null }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Session check error:', error);
        return new Response(
            JSON.stringify({ user: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
