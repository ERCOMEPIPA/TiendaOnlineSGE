import { supabase } from './supabase';
import type { AstroCookies } from 'astro';

export interface UserSession {
    user: any;
    accessToken: string;
}

export async function getUserSession(cookies: AstroCookies): Promise<UserSession | null> {
    const accessToken = cookies.get('user-access-token')?.value;
    const refreshToken = cookies.get('user-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return null;
    }

    // Verify the session
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        // Try to refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (refreshError || !refreshData.session) {
            // Refresh failed, clear cookies
            cookies.delete('user-access-token', { path: '/' });
            cookies.delete('user-refresh-token', { path: '/' });
            return null;
        }

        // Update cookies with new tokens
        cookies.set('user-access-token', refreshData.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24
        });

        cookies.set('user-refresh-token', refreshData.session.refresh_token, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30
        });

        return {
            user: refreshData.user,
            accessToken: refreshData.session.access_token
        };
    }

    return {
        user,
        accessToken
    };
}
