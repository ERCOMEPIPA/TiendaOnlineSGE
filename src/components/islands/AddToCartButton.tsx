import { useState, useEffect } from 'react';
import { addItem, loadCart } from '../../stores/cart';
import type { Product } from '../../lib/supabase';

interface AddToCartButtonProps {
    product: Product;
    sizes: string[];
}

export default function AddToCartButton({ product, sizes }: AddToCartButtonProps) {
    const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadCart();
    }, []);

    const handleAddToCart = () => {
        if (!selectedSize) return;

        setIsAdding(true);

        // Simulate a small delay for UX feedback
        setTimeout(() => {
            addItem(product, quantity, selectedSize);
            setIsAdding(false);
            setShowSuccess(true);

            setTimeout(() => setShowSuccess(false), 2000);
        }, 300);
    };

    const isOutOfStock = product.stock <= 0;

    return (
        <div className="space-y-4">
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
                {isOutOfStock
                    ? '❌ Agotado'
                    : product.stock <= 5
                        ? `⚠️ Solo quedan ${product.stock} unidades`
                        : `✓ ${product.stock} en stock`
                }
            </p>

            {/* Add to Cart Button */}
            <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || !selectedSize || isAdding}
                className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          transition-all duration-300 transform
          ${isOutOfStock || !selectedSize
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
                ) : isOutOfStock ? (
                    'Sin stock'
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
