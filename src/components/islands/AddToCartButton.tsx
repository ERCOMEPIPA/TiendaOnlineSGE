import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { addItem, loadCart, $cartItems } from '../../stores/cart';
import type { Product } from '../../lib/supabase';
import SizeRecommender from './SizeRecommender';
import StockAlertModal from '../ui/StockAlertModal';

interface AddToCartButtonProps {
    product: Product;
    sizes: string[];
    colors?: string[]; // Format: "ColorName:#HexCode"
}

export default function AddToCartButton({ product, sizes, colors = [] }: AddToCartButtonProps) {
    const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');
    const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [notifyState, setNotifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [userEmail, setUserEmail] = useState<string>('');

    // Stock Alert State
    const [showStockAlert, setShowStockAlert] = useState(false);
    const cartItems = useStore($cartItems);

    // Helper to parse color format "Name:#HexCode"
    const parseColor = (colorStr: string) => {
        const [name, hex] = colorStr.split(':');
        return { name: name || colorStr, hex: hex || '#888888' };
    };

    useEffect(() => {
        (async () => {
            await loadCart();
            // Get user email from session
            fetch('/api/auth/session')
                .then(res => res.json())
                .then(data => {
                    if (data?.email) {
                        setUserEmail(data.email);
                    }
                })
                .catch(() => { });
        })();
    }, []);

    const handleAddToCart = async () => {
        if (!selectedSize) return;
        // Only require color if product has colors
        if (colors.length > 0 && !selectedColor) return;

        // Calculate current quantity in cart for this specific item
        const cartKey = `${product.id}-${selectedSize}-${selectedColor}`;
        const currentInCart = cartItems[cartKey]?.quantity || 0;

        // Check if adding the requested quantity exceeds stock
        if (currentInCart + quantity > product.stock) {
            setShowStockAlert(true);
            return;
        }

        setIsAdding(true);

        // Simulate a small delay for UX feedback
        setTimeout(async () => {
            await addItem(product, quantity, selectedSize, selectedColor);
            setIsAdding(false);
            setShowSuccess(true);

            setTimeout(() => setShowSuccess(false), 2000);
        }, 300);
    };

    const handleNotifyMe = async () => {
        setNotifyState('loading');

        try {
            const response = await fetch('/api/stock-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    email: userEmail,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setNotifyState('success');
                if (data.email) {
                    setUserEmail(data.email);
                }
            } else {
                setNotifyState('error');
            }
        } catch (error) {
            setNotifyState('error');
        }
    };

    const isOutOfStock = product.stock <= 0;

    // If out of stock, show only the out of stock message
    if (isOutOfStock) {
        return (
            <div className="space-y-4">
                {/* Out of Stock Banner */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Producto agotado
                    </h3>
                    <p className="text-red-600 text-sm mb-4">
                        Lo sentimos, este producto no está disponible actualmente.
                    </p>
                    <button
                        disabled
                        className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                    >
                        Sin stock disponible
                    </button>
                </div>

                {/* Notify me button - different states */}
                {notifyState === 'success' ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold">¡Te avisaremos!</span>
                        </div>
                        <p className="text-sm text-green-600">
                            Te enviaremos un correo a <strong>{userEmail}</strong> cuando este producto esté disponible.
                        </p>
                    </div>
                ) : notifyState === 'error' ? (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-yellow-700 text-sm mb-2">
                            Hubo un error. Por favor, inicia sesión e inténtalo de nuevo.
                        </p>
                        <button
                            onClick={handleNotifyMe}
                            className="text-yellow-800 underline text-sm font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleNotifyMe}
                        disabled={notifyState === 'loading'}
                        className={`
                            w-full py-3 px-6 rounded-lg font-medium border-2 
                            transition-colors flex items-center justify-center gap-2
                            ${notifyState === 'loading'
                                ? 'border-gray-300 text-gray-400 cursor-wait'
                                : 'border-navy-800 text-navy-800 hover:bg-navy-50'}
                        `}
                    >
                        {notifyState === 'loading' ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Registrando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Avisarme cuando esté disponible
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <StockAlertModal
                isOpen={showStockAlert}
                onClose={() => setShowStockAlert(false)}
                productName={product.name}
                availableStock={product.stock}
                requestedQuantity={quantity}
            />

            {/* Size Selection */}
            {sizes.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-carbon-700 mb-2">
                        Talla
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`
                  px-4 py-2 border-2 rounded-md font-medium text-sm
                  transition-all duration-200
                  ${selectedSize === size
                                        ? 'border-navy-800 bg-navy-800 text-white'
                                        : 'border-carbon-200 text-carbon-700 hover:border-navy-400'
                                    }
                `}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                    {/* Size Recommender */}
                    <div className="mt-2">
                        <SizeRecommender sizes={sizes} onSelectSize={setSelectedSize} />
                    </div>
                </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-carbon-700 mb-2">
                        Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((colorStr, index) => {
                            const { name, hex } = parseColor(colorStr);
                            const isSelected = selectedColor === colorStr;
                            return (
                                <button
                                    key={colorStr}
                                    onClick={() => {
                                        setSelectedColor(colorStr);
                                        // Dispatch event to change gallery image
                                        document.dispatchEvent(
                                            new CustomEvent('colorSelected', { detail: { colorIndex: index } })
                                        );
                                    }}
                                    className={`
                                        flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200
                                        ${isSelected
                                            ? 'bg-navy-50 ring-2 ring-navy-800'
                                            : 'hover:bg-carbon-50'
                                        }
                                    `}
                                    title={name}
                                >
                                    <span
                                        className={`
                                            w-8 h-8 rounded-full border-2 transition-all
                                            ${isSelected ? 'border-navy-800 scale-110' : 'border-carbon-200'}
                                        `}
                                        style={{ backgroundColor: hex }}
                                    />
                                    <span className={`text-xs ${isSelected ? 'font-semibold text-navy-800' : 'text-carbon-600'}`}>
                                        {name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quantity Selection */}
            <div>
                <label className="block text-sm font-medium text-carbon-700 mb-2">
                    Cantidad
                </label>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full border-2 border-carbon-200 
                       flex items-center justify-center text-carbon-600
                       hover:border-navy-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="w-12 text-center font-medium text-lg text-carbon-800">
                        {quantity}
                    </span>
                    <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-10 h-10 rounded-full border-2 border-carbon-200 
                       flex items-center justify-center text-carbon-600
                       hover:border-navy-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stock indicator */}
            <p className={`text-sm ${product.stock <= 5 ? 'text-accent-leather' : 'text-carbon-500'}`}>
                {product.stock <= 5
                    ? `⚠️ Solo quedan ${product.stock} unidades`
                    : `✓ ${product.stock} en stock`
                }
            </p>

            {/* Add to Cart Button */}
            <button
                onClick={handleAddToCart}
                disabled={!selectedSize || isAdding}
                className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          transition-all duration-300 transform
          ${!selectedSize
                        ? 'bg-carbon-200 text-carbon-500 cursor-not-allowed'
                        : showSuccess
                            ? 'bg-green-600 text-white scale-[1.02]'
                            : 'bg-navy-800 text-white hover:bg-navy-900 hover:scale-[1.02] active:scale-[0.98]'
                    }
          ${isAdding ? 'animate-pulse' : ''}
        `}
            >
                {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Añadiendo...
                    </span>
                ) : showSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ¡Añadido al carrito!
                    </span>
                ) : !selectedSize ? (
                    'Selecciona una talla'
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Añadir al carrito
                    </span>
                )}
            </button>
        </div>
    );
}
