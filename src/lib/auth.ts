import { supabase } from './supabase';
import type { AstroCookies } from 'astro';

export interface UserSession {
    user: any;
    accessToken: string;
}

export async function getUserSession(cookiesOrRequest: AstroCookies | Request): Promise<UserSession | null> {
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if ('get' in cookiesOrRequest && typeof cookiesOrRequest.get === 'function') {
        // Handle AstroCookies
        accessToken = cookiesOrRequest.get('user-access-token')?.value;
        refreshToken = cookiesOrRequest.get('user-refresh-token')?.value;
    } else if (cookiesOrRequest instanceof Request) {
        // Handle Request (for API calls from Flutter/Mobile)
        const authHeader = cookiesOrRequest.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }
    }

    if (!accessToken) {
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
