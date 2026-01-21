import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const isServer = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'pkce',
        autoRefreshToken: isServer ? false : true,
        persistSession: isServer ? false : true,
        detectSessionInUrl: true
    }
});

// Types for database tables
export interface Category {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number; // Price in cents
    discount_price: number | null; // Discounted price in cents
    discount_end_date: string | null; // ISO timestamp when discount expires
    stock: number;
    sizes: string[];
    colors: string[]; // Format: "ColorName:#HexCode"
    category_id: string | null;
    images: string[];
    featured: boolean;
    artist: string | null;
    created_at: string;
    updated_at: string;
    category?: Category;
}

// Helper function to format price from cents to display
export function formatPrice(priceInCents: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(priceInCents / 100);
}
