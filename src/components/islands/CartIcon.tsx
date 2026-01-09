import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { $cartCount, $isCartOpen, toggleCart, loadCart } from '../../stores/cart';

export default function CartIcon() {
    const count = useStore($cartCount);
    const isOpen = useStore($isCartOpen);

    useEffect(() => {
        loadCart();
    }, []);

    return (
        <button
            onClick={() => toggleCart()}
            className="relative p-2 text-carbon-700 hover:text-navy-800 transition-colors"
            aria-label={`Carrito de compras (${count} items)`}
        >
            <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
            </svg>

            {/* Badge with count */}
            {count > 0 && (
                <span
                    className="absolute -top-1 -right-1 w-5 h-5 
                     bg-accent-gold text-white text-xs font-bold 
                     rounded-full flex items-center justify-center
                     animate-fade-in"
                >
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
}
