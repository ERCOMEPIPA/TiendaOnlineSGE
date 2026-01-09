import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    stock: number;
    sizes: string[];
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

// Helper to get public URL for storage images
export function getImageUrl(path: string): string {
    const { data } = supabase.storage.from('products-images').getPublicUrl(path);
    return data.publicUrl;
}
