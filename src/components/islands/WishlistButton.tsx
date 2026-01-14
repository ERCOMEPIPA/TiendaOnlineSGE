import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
    $wishlistItems,
    toggleWishlist,
    loadWishlist,
    isInWishlist
} from '../../stores/wishlist';
import type { Product } from '../../lib/supabase';

interface WishlistButtonProps {
    product: Product;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

export default function WishlistButton({
    product,
    size = 'md',
    showText = false,
    className = ''
}: WishlistButtonProps) {
    const wishlistItems = useStore($wishlistItems);
    const [isInList, setIsInList] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Load wishlist on mount and check if product is in it
    useEffect(() => {
        loadWishlist();
    }, []);

    // Update local state when wishlist changes
    useEffect(() => {
        setIsInList(!!wishlistItems[product.id]);
    }, [wishlistItems, product.id]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);

        // Toggle wishlist
        toggleWishlist(product);
    };

    // Size classes
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <button
            onClick={handleClick}
            className={`
                inline-flex items-center justify-center gap-2
                ${sizeClasses[size]}
                rounded-full
                transition-all duration-200
                ${isInList
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
                }
                shadow-md hover:shadow-lg
                ${isAnimating ? 'scale-125' : 'scale-100'}
                ${className}
            `}
            title={isInList ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            aria-label={isInList ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
            <svg
                className={`${iconSizes[size]} transition-transform ${isAnimating ? 'scale-110' : ''}`}
                fill={isInList ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={isInList ? 0 : 2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            {showText && (
                <span className="text-sm font-medium">
                    {isInList ? 'En favoritos' : 'Favoritos'}
                </span>
            )}
        </button>
    );
}
