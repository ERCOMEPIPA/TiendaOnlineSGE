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

    // Verify the session - do NOT attempt to refresh here
    // Token refresh should be handled by middleware before the page renders
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        // Session is invalid - return null
        // The middleware will handle token refresh on the next request
        return null;
    }

    return {
        user,
        accessToken
    };
}
