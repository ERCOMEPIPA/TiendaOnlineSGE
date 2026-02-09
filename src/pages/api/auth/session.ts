export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { sendWelcomeEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const session = await request.json();

        if (!session || !session.access_token || !session.refresh_token) {
            return new Response(
                JSON.stringify({ error: 'Sesión inválida' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Set cookies for user session
        cookies.set('user-access-token', session.access_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        cookies.set('user-refresh-token', session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        // Check if this is a new OAuth user and send welcome email
        try {
            const { data: { user } } = await supabase.auth.getUser(session.access_token);

            if (user) {
                const createdAt = new Date(user.created_at);
                const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;

                // Check if this is an OAuth user (Google provider)
                const isOAuthUser = user.app_metadata?.provider === 'google' ||
                    user.identities?.some(i => i.provider === 'google');

                // A user is new if the difference between created_at and last_sign_in_at is very small
                let isNewUser = false;
                if (lastSignIn) {
                    const diffBetweenCreateAndLastLogin = Math.abs(lastSignIn.getTime() - createdAt.getTime()) / 1000;
                    isNewUser = diffBetweenCreateAndLastLogin < 5;
                }

                if (isOAuthUser && isNewUser) {
                    const userName = user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] || 'Usuario';

                    await sendWelcomeEmail(user.email!, userName);
                }
            }
        } catch (emailError) {
            // Don't fail the session sync if email fails
            console.error('Error sending welcome email:', emailError);
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Session sync error:', error);
        return new Response(
            JSON.stringify({ error: 'Error al sincronizar sesión' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

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
