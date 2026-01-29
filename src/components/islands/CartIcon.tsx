import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { $cartCount, $isCartOpen, toggleCart, loadCart } from '../../stores/cart';

export default function CartIcon() {
    const count = useStore($cartCount);
    const isOpen = useStore($isCartOpen);

    useEffect(() => {
        (async () => {
            await loadCart();
        })();
    }, []);

    return (
        <button
            onClick={() => toggleCart()}
            className="relative p-2 text-[#6f6458] hover:text-[#2a2622] transition-colors"
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
                     bg-[#8B4513] text-[#fdfcf9] text-xs font-bold 
                     rounded-none flex items-center justify-center
                     animate-fade-in"
                >
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    );
}
