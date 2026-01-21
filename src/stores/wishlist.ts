import { atom, computed, map } from 'nanostores';
import type { Product } from '../lib/supabase';

// Wishlist item interface - solo necesitamos el producto
export interface WishlistItem {
    product: Product;
    addedAt: string; // fecha de cuando se añadió
}

// Wishlist state using a map for efficient updates
export const $wishlistItems = map<Record<string, WishlistItem>>({});

// Computed: Total number of items in wishlist
export const $wishlistCount = computed($wishlistItems, (items) => {
    return Object.keys(items).length;
});

// Computed: Wishlist items as array (sorted by date added, newest first)
export const $wishlistItemsArray = computed($wishlistItems, (items) => {
    return Object.values(items).sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
});

// Check if a product is in wishlist
export function isInWishlist(productId: string): boolean {
    return !!$wishlistItems.get()[productId];
}

// Computed: Get reactive check for product in wishlist
export const $isInWishlist = (productId: string) =>
    computed($wishlistItems, (items) => !!items[productId]);

// Add item to wishlist
export function addToWishlist(product: Product): void {
    const currentItems = $wishlistItems.get();

    // If already in wishlist, don't add again
    if (currentItems[product.id]) {
        return;
    }

    $wishlistItems.setKey(product.id, {
        product,
        addedAt: new Date().toISOString(),
    });

    // Save to localStorage
    saveWishlist();
}

// Remove item from wishlist
export function removeFromWishlist(productId: string): void {
    const currentItems = { ...$wishlistItems.get() };
    delete currentItems[productId];
    $wishlistItems.set(currentItems);
    saveWishlist();
}

// Toggle item in wishlist (add if not present, remove if present)
export function toggleWishlist(product: Product): boolean {
    const isCurrentlyInWishlist = isInWishlist(product.id);

    if (isCurrentlyInWishlist) {
        removeFromWishlist(product.id);
        return false; // Now NOT in wishlist
    } else {
        addToWishlist(product);
        return true; // Now IN wishlist
    }
}

// Clear entire wishlist
export function clearWishlist(): void {
    $wishlistItems.set({});
    saveWishlist();
}

// Persistence: Save to localStorage
function saveWishlist(): void {
    if (typeof window !== 'undefined') {
        const items = $wishlistItems.get();
        localStorage.setItem('hypestage-wishlist', JSON.stringify(items));
    }
}

// Persistence: Load from localStorage
export function loadWishlist(): void {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('hypestage-wishlist');
        if (saved) {
            try {
                const items = JSON.parse(saved);
                $wishlistItems.set(items);
            } catch (e) {
                console.error('Error loading wishlist:', e);
                localStorage.removeItem('hypestage-wishlist');
            }
        }
    }
}
