import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/';

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('OAuth Exchange Error:', error.message);
            return redirect(`/login?error=${encodeURIComponent(error.message)}`);
        }

        if (data.session) {
            // Set cookies for user session
            cookies.set('user-access-token', data.session.access_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 // 24 hours
            });

            cookies.set('user-refresh-token', data.session.refresh_token, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            return redirect(next);
        }
    }

    console.error('OAuth Callback: No code or session data');
    return redirect('/login?error=error_de_autenticacion');
};
