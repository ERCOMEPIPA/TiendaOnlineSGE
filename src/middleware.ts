import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
    const pathname = context.url.pathname;

    // Skip middleware for public routes
    const publicRoutes = ['/login', '/registro', '/api/', '/_image'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
        return next();
    }

    // Handle admin routes
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {

        // Get session from cookies
        const accessToken = context.cookies.get('sb-access-token')?.value;
        const refreshToken = context.cookies.get('sb-refresh-token')?.value;

        if (!accessToken || !refreshToken) {
            // No tokens, redirect to login
            return context.redirect('/admin/login');
        }

        try {
            // Verify the session
            const { data: { user }, error } = await supabase.auth.getUser(accessToken);

            if (error || !user) {
                // ... session refresh logic ...
            }

            // Check if user is authorized admin
            const adminEmails = (import.meta.env.ADMIN_EMAILS || "").split(",");
            if (user && !adminEmails.includes(user.email || "")) {
                // Not an authorized admin, clear cookies and redirect
                context.cookies.delete('sb-access-token', { path: '/' });
                context.cookies.delete('sb-refresh-token', { path: '/' });
                return context.redirect('/admin/login?error=unauthorized');
            }

            if (error || !user) {
                // Invalid session, try to refresh
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                    refresh_token: refreshToken
                });

                if (refreshError || !refreshData.session) {
                    // Refresh failed, clear cookies and redirect
                    context.cookies.delete('sb-access-token', { path: '/' });
                    context.cookies.delete('sb-refresh-token', { path: '/' });
                    return context.redirect('/admin/login');
                }

                // Update cookies with new tokens
                context.cookies.set('sb-access-token', refreshData.session.access_token, {
                    path: '/',
                    httpOnly: true,
                    secure: import.meta.env.PROD,
                    sameSite: 'lax',
                    maxAge: 60 * 60 // 1 hour
                });

                context.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
                    path: '/',
                    httpOnly: true,
                    secure: import.meta.env.PROD,
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 1 week
                });
            }
        } catch (e) {
            // Error in auth check, redirect to login
            context.cookies.delete('sb-access-token', { path: '/' });
            context.cookies.delete('sb-refresh-token', { path: '/' });
            return context.redirect('/admin/login');
        }
    } else {
        // Handle regular user routes - refresh tokens if needed
        const accessToken = context.cookies.get('user-access-token')?.value;
        const refreshToken = context.cookies.get('user-refresh-token')?.value;

        if (accessToken && refreshToken) {
            try {
                // Verify the session
                const { data: { user }, error } = await supabase.auth.getUser(accessToken);

                if (error || !user) {
                    // Invalid session, try to refresh
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                        refresh_token: refreshToken
                    });

                    if (refreshError || !refreshData.session) {
                        // Refresh failed, clear cookies
                        context.cookies.delete('user-access-token', { path: '/' });
                        context.cookies.delete('user-refresh-token', { path: '/' });
                    } else {
                        // Update cookies with new tokens
                        context.cookies.set('user-access-token', refreshData.session.access_token, {
                            path: '/',
                            httpOnly: true,
                            secure: import.meta.env.PROD,
                            sameSite: 'lax',
                            maxAge: 60 * 60 * 24 // 1 day
                        });

                        context.cookies.set('user-refresh-token', refreshData.session.refresh_token, {
                            path: '/',
                            httpOnly: true,
                            secure: import.meta.env.PROD,
                            sameSite: 'lax',
                            maxAge: 60 * 60 * 24 * 30 // 30 days
                        });
                    }
                }
            } catch (e) {
                // Error in auth check, clear cookies
                context.cookies.delete('user-access-token', { path: '/' });
                context.cookies.delete('user-refresh-token', { path: '/' });
            }
        }
    }

    return next();
});
