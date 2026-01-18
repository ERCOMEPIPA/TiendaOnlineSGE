import { atom, computed, map } from 'nanostores';
import type { Product } from '../lib/supabase';

// Cart item interface
export interface CartItem {
    product: Product;
    quantity: number;
    size: string;
    color: string; // Format: "ColorName:#HexCode" or empty string
}

// Cart state using a map for efficient updates
export const $cartItems = map<Record<string, CartItem>>({});

// Cart visibility state
export const $isCartOpen = atom(false);

// Computed: Total number of items in cart
export const $cartCount = computed($cartItems, (items) => {
    return Object.values(items).reduce((total, item) => total + item.quantity, 0);
});

// Computed: Total price in cents
export const $cartTotal = computed($cartItems, (items) => {
    return Object.values(items).reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );
});

// Computed: Cart items as array
export const $cartItemsArray = computed($cartItems, (items) => {
    return Object.values(items);
});

// Generate unique key for cart item (product id + size + color)
function getCartKey(productId: string, size: string, color: string = ''): string {
    return `${productId}-${size}-${color}`;
}

// Add item to cart
export function addItem(product: Product, quantity: number = 1, size: string, color: string = ''): void {
    const key = getCartKey(product.id, size, color);
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

    // Save to localStorage
    saveCart();

    // Open cart when adding item
    $isCartOpen.set(true);
}

// Remove item from cart
export function removeItem(productId: string, size: string, color: string = ''): void {
    const key = getCartKey(productId, size, color);
    const currentItems = { ...$cartItems.get() };
    delete currentItems[key];
    $cartItems.set(currentItems);
    saveCart();
}

// Update item quantity
export function updateQuantity(productId: string, size: string, color: string = '', quantity: number): void {
    const key = getCartKey(productId, size, color);
    const currentItems = $cartItems.get();
    const item = currentItems[key];

    if (item) {
        if (quantity <= 0) {
            removeItem(productId, size, color);
        } else {
            $cartItems.setKey(key, { ...item, quantity });
            saveCart();
        }
    }
}

// Clear entire cart
export function clearCart(): void {
    $cartItems.set({});
    saveCart();
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

// Persistence: Save to localStorage
function saveCart(): void {
    if (typeof window !== 'undefined') {
        const items = $cartItems.get();
        localStorage.setItem('fashionstore-cart', JSON.stringify(items));
    }
}

// Persistence: Load from localStorage
export function loadCart(): void {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fashionstore-cart');
        if (saved) {
            try {
                const items = JSON.parse(saved);
                $cartItems.set(items);
            } catch (e) {
                console.error('Error loading cart:', e);
                localStorage.removeItem('fashionstore-cart');
            }
        }
    }
}
