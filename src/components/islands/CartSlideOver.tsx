import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import {
    $isCartOpen,
    $cartItemsArray,
    $cartTotal,
    closeCart,
    removeItem,
    updateQuantity,
    loadCart
} from '../../stores/cart';
import { formatPrice } from '../../lib/supabase';

export default function CartSlideOver() {
    const isOpen = useStore($isCartOpen);
    const items = useStore($cartItemsArray);
    const total = useStore($cartTotal);

    useEffect(() => {
        loadCart();
    }, []);

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-carbon-900/50 z-40 animate-fade-in"
                onClick={() => closeCart()}
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-50 
                      shadow-2xl animate-slide-in flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-100">
                    <h2 className="text-lg font-serif font-semibold text-carbon-900">
                        Tu Carrito
                    </h2>
                    <button
                        onClick={() => closeCart()}
                        className="p-2 text-carbon-500 hover:text-carbon-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-carbon-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-carbon-500 font-medium">Tu carrito está vacío</p>
                            <p className="text-carbon-400 text-sm mt-1">¡Añade algunos productos!</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li
                                    key={`${item.product.id}-${item.size}`}
                                    className="flex gap-4 p-4 bg-cream-50 rounded-lg"
                                >
                                    {/* Product image */}
                                    <div className="w-20 h-20 bg-carbon-100 rounded-md overflow-hidden flex-shrink-0">
                                        {item.product.images?.[0] ? (
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-carbon-400">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-carbon-800 truncate">
                                            {item.product.name}
                                        </h3>
                                        <p className="text-sm text-carbon-500">Talla: {item.size}</p>
                                        <p className="font-semibold text-navy-800 mt-1">
                                            {formatPrice(item.product.price)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                                                className="w-6 h-6 rounded border border-carbon-200 
                                   flex items-center justify-center text-carbon-600
                                   hover:border-navy-400"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                                                className="w-6 h-6 rounded border border-carbon-200 
                                   flex items-center justify-center text-carbon-600
                                   hover:border-navy-400"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.product.id, item.size)}
                                                className="ml-auto text-carbon-400 hover:text-red-500 transition-colors"
                                                aria-label="Eliminar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer with total and checkout */}
                {items.length > 0 && (
                    <div className="border-t border-carbon-100 px-6 py-4 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-carbon-600">Subtotal</span>
                            <span className="text-xl font-serif font-semibold text-carbon-900">
                                {formatPrice(total)}
                            </span>
                        </div>
                        <a
                            href="/carrito"
                            className="block w-full py-3 px-6 bg-navy-800 text-white text-center 
                         font-semibold rounded-lg hover:bg-navy-900 transition-colors"
                        >
                            Proceder al pago
                        </a>
                        <button
                            onClick={() => closeCart()}
                            className="block w-full py-3 px-6 mt-2 text-carbon-600 text-center 
                         font-medium hover:text-navy-800 transition-colors"
                        >
                            Seguir comprando
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
