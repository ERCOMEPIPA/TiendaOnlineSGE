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
                className="fixed inset-0 bg-[#2a2622]/50 z-40 animate-fade-in backdrop-blur-sm"
                onClick={() => closeCart()}
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-50 
                      shadow-2xl animate-slide-in flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#ccc5b8] bg-[#fdfcf9]">
                    <h2 className="text-lg font-serif font-semibold text-[#2a2622]">
                        Tu Carrito
                    </h2>
                    <button
                        onClick={() => closeCart()}
                        className="p-2 text-[#6f6458] hover:text-[#2a2622] transition-colors"
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
                            <svg className="w-16 h-16 mx-auto text-[#ccc5b8] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-[#2a2622] font-medium">Tu carrito está vacío</p>
                            <p className="text-[#6f6458] text-sm mt-1">¡Añade algunos productos!</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => {
                                const colorDisplay = item.color ? item.color.split(':')[0] : '';
                                // Check if product has active discount
                                const now = new Date();
                                const discountPriceInCents = item.product.discount_price
                                    ? item.product.discount_price * 100
                                    : null;
                                const hasDiscount =
                                    discountPriceInCents &&
                                    discountPriceInCents < item.product.price &&
                                    (!item.product.discount_end_date || new Date(item.product.discount_end_date) > now);
                                const displayPrice = hasDiscount ? discountPriceInCents : item.product.price;

                                return (
                                    <li
                                        key={`${item.product.id}-${item.size}-${item.color}`}
                                        className="flex gap-4 p-4 bg-[#fdfcf9] border border-[#ccc5b8] rounded-none"
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
                                            <h3 className="font-medium text-[#2a2622] truncate">
                                                {item.product.name}
                                            </h3>
                                            <p className="text-sm text-[#6f6458]">Talla: {item.size}</p>
                                            {colorDisplay && (
                                                <p className="text-sm text-[#6f6458]">Color: {colorDisplay}</p>
                                            )}
                                            {hasDiscount ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="font-semibold text-red-600">
                                                        {formatPrice(displayPrice)}
                                                    </p>
                                                    <p className="text-sm text-[#6f6458] line-through">
                                                        {formatPrice(item.product.price)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="font-semibold text-[#8B4513] mt-1">
                                                    {formatPrice(item.product.price)}
                                                </p>
                                            )}

                                            {/* Quantity controls */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.size, item.color || '', item.quantity - 1)}
                                                    className="w-6 h-6 rounded-none border border-[#ccc5b8] 
                                   flex items-center justify-center text-[#2a2622]
                                   hover:border-[#2a2622] transition-colors"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium text-[#2a2622]">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.size, item.color || '', item.quantity + 1)}
                                                    className="w-6 h-6 rounded-none border border-[#ccc5b8] 
                                   flex items-center justify-center text-[#2a2622]
                                   hover:border-[#2a2622] transition-colors"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.product.id, item.size, item.color || '')}
                                                    className="ml-auto text-[#6f6458] hover:text-[#8B4513] transition-colors"
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
                                )
                            })}
                        </ul>
                    )}
                </div>

                {/* Footer with total and checkout */}
                {items.length > 0 && (
                    <div className="border-t border-[#ccc5b8] px-6 py-6 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[#6f6458] uppercase tracking-widest text-xs font-semibold">Subtotal</span>
                            <span className="text-2xl font-serif font-bold text-[#2a2622]">
                                {formatPrice(total)}
                            </span>
                        </div>
                        <a
                            href="/carrito"
                            className="block w-full py-4 px-6 bg-[#2a2622] text-center 
                         font-bold rounded-none hover:bg-[#3d3831] transition-all uppercase tracking-widest text-sm"
                            style={{ color: '#ffffff' }}
                        >
                            Proceder al pago
                        </a>
                        <button
                            onClick={() => closeCart()}
                            className="block w-full py-4 px-6 mt-3 text-[#6f6458] text-center 
                         font-medium hover:text-[#2a2622] transition-colors text-sm"
                        >
                            Seguir comprando
                        </button>
                    </div>
                )}
            </div >
        </>
    );
}
