import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
    // Clear user cookies
    cookies.delete('user-access-token', { path: '/' });
    cookies.delete('user-refresh-token', { path: '/' });

    return redirect('/');
};
