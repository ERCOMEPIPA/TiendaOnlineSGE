import { atom, computed, map } from 'nanostores';
import type { Product } from '../lib/supabase';
import { clearReservation } from '../lib/cartReservation';
import { supabase } from '../lib/supabase';

// Cart item interface
export interface CartItem {
    product: Product;
    quantity: number;
    size: string;
    color: string; // Format: "ColorName:#HexCode" or empty string
}

// Current user ID
let currentUserId: string | null = null;

// Cart state using a map for efficient updates
export const $cartItems = map<Record<string, CartItem>>({});

// Cart visibility state
export const $isCartOpen = atom(false);

// Computed: Total number of items in cart
export const $cartCount = computed($cartItems, (items) => {
    return Object.values(items).reduce((total, item) => total + item.quantity, 0);
});

// Computed: Total price in cents (considers discount prices)
export const $cartTotal = computed($cartItems, (items) => {
    const now = new Date();
    return Object.values(items).reduce((total, item) => {
        // Check if product has active discount
        const discountPriceInCents = item.product.discount_price
            ? item.product.discount_price * 100
            : null;
        const hasDiscount =
            discountPriceInCents &&
            discountPriceInCents < item.product.price &&
            (!item.product.discount_end_date || new Date(item.product.discount_end_date) > now);
        const priceToUse = hasDiscount ? discountPriceInCents : item.product.price;
        return total + priceToUse * item.quantity;
    }, 0);
});

// Computed: Cart items as array
export const $cartItemsArray = computed($cartItems, (items) => {
    return Object.values(items);
});

// Generate unique key for cart item (product id + size + color)
function getCartKey(productId: string, size: string, color: string = ''): string {
    return `${productId}-${size}-${color}`;
}

// Helper: Get total quantity of a specific product in cart across all sizes and colors
function getProductTotalInCart(productId: string): number {
    const items = Object.values($cartItems.get());
    return items
        .filter(item => item.product.id === productId)
        .reduce((total, item) => total + item.quantity, 0);
}

// Add item to cart
export async function addItem(product: Product, quantity: number = 1, size: string, color: string = ''): Promise<boolean> {
    const key = getCartKey(product.id, size, color);

    // Check stock limit across all variants
    const currentTotal = getProductTotalInCart(product.id);
    if (currentTotal + quantity > product.stock) {
        return false;
    }

    const currentItems = $cartItems.get();
    const existingItem = currentItems[key];

    if (existingItem) {
        $cartItems.setKey(key, {
            ...existingItem,
            quantity: existingItem.quantity + quantity,
        });
    } else {
        $cartItems.setKey(key, { product, quantity, size, color });
    }

    // Save to database if user is logged in, otherwise localStorage
    await saveCart();

    // Open cart when adding item
    $isCartOpen.set(true);
    return true;
}

// Remove item from cart
export async function removeItem(productId: string, size: string, color: string = ''): Promise<void> {
    const key = getCartKey(productId, size, color);
    const currentItems = { ...$cartItems.get() };
    delete currentItems[key];
    $cartItems.set(currentItems);
    await saveCart();

    // If cart is now empty, clear the reservation and notify timer
    if (Object.keys(currentItems).length === 0) {
        clearReservation();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('reservationCleared'));
        }
    }
}

// Update item quantity
export async function updateQuantity(productId: string, size: string, color: string = '', quantity: number): Promise<boolean> {
    const key = getCartKey(productId, size, color);
    const currentItems = $cartItems.get();
    const item = currentItems[key];

    if (item) {
        if (quantity <= 0) {
            await removeItem(productId, size, color);
            return true;
        } else {
            // Check stock limit logic
            const totalOtherSizes = getProductTotalInCart(productId) - item.quantity;
            const product = item.product;

            if (totalOtherSizes + quantity > product.stock) {
                return false;
            }

            $cartItems.setKey(key, { ...item, quantity });
            await saveCart();
            return true;
        }
    }
    return false;
}

// Clear entire cart
export async function clearCart(): Promise<void> {
    $cartItems.set({});
    await saveCart();
    // Clear reservation when cart is emptied
    clearReservation();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reservationCleared'));
    }
}

// Toggle cart visibility
export function toggleCart(): void {
    $isCartOpen.set(!$isCartOpen.get());
}

export function openCart(): void {
    $isCartOpen.set(true);
}

export function closeCart(): void {
    $isCartOpen.set(false);
}

// Set current user (call this when user logs in/out)
export function setCurrentUser(userId: string | null): void {
    currentUserId = userId;
}

// Persistence: Save to database or localStorage
async function saveCart(): Promise<void> {
    if (typeof window === 'undefined') return;

    const items = $cartItems.get();

    if (currentUserId) {
        // Save to database for logged-in users
        try {
            // First, clear all existing cart items for this user
            await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', currentUserId);

            // Then insert all current items
            const itemsToInsert = Object.values(items).map(item => ({
                user_id: currentUserId,
                product_id: item.product.id,
                quantity: item.quantity,
                size: item.size,
                color: item.color
            }));

            if (itemsToInsert.length > 0) {
                await supabase
                    .from('cart_items')
                    .insert(itemsToInsert);
            }

            // Clear localStorage when saving to database
            localStorage.removeItem('hypestage-cart');
        } catch (e) {
            console.error('Error saving cart to database:', e);
            // Fallback to localStorage on error
            localStorage.setItem('hypestage-cart', JSON.stringify(items));
        }
    } else {
        // Save to localStorage for guests
        localStorage.setItem('hypestage-cart', JSON.stringify(items));
    }
}

// Persistence: Load from database or localStorage
export async function loadCart(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;

    if (userId) {
        currentUserId = userId;
        // Load from database for logged-in users
        try {
            const { data: cartItems, error } = await supabase
                .from('cart_items')
                .select(`
                    *,
                    product:products(*)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            if (cartItems && cartItems.length > 0) {
                const items: Record<string, CartItem> = {};

                cartItems.forEach((item: any) => {
                    if (item.product) {
                        const key = getCartKey(item.product.id, item.size, item.color);
                        items[key] = {
                            product: item.product,
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color
                        };
                    }
                });

                $cartItems.set(items);

                // Merge with any items in localStorage (from guest cart)
                const localItems = localStorage.getItem('hypestage-cart');
                if (localItems) {
                    try {
                        const parsedLocal = JSON.parse(localItems);
                        // Merge local items with database items
                        const merged = { ...parsedLocal, ...items };
                        $cartItems.set(merged);
                        // Save merged cart back to database
                        await saveCart();
                    } catch (e) {
                        console.error('Error merging local cart:', e);
                    }
                    localStorage.removeItem('hypestage-cart');
                }
            } else {
                // No items in database, check localStorage
                const localItems = localStorage.getItem('hypestage-cart');
                if (localItems) {
                    try {
                        const items = JSON.parse(localItems);
                        $cartItems.set(items);
                        // Save to database
                        await saveCart();
                        localStorage.removeItem('hypestage-cart');
                    } catch (e) {
                        console.error('Error loading local cart:', e);
                    }
                }
            }
        } catch (e) {
            console.error('Error loading cart from database:', e);
            // Fallback to localStorage
            loadCartFromLocalStorage();
        }
    } else {
        // Load from localStorage for guests
        currentUserId = null;
        loadCartFromLocalStorage();
    }
}

// Helper: Load from localStorage
function loadCartFromLocalStorage(): void {
    const saved = localStorage.getItem('hypestage-cart');
    if (saved) {
        try {
            const items = JSON.parse(saved);
            $cartItems.set(items);
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            localStorage.removeItem('hypestage-cart');
        }
    }
}

// Clear cart when user logs out
export async function clearCartOnLogout(): Promise<void> {
    $cartItems.set({});
    currentUserId = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('hypestage-cart');
    }
}
