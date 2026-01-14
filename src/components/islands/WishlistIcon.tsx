import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $wishlistCount, loadWishlist } from '../../stores/wishlist';

export default function WishlistIcon() {
    const count = useStore($wishlistCount);

    useEffect(() => {
        loadWishlist();
    }, []);

    return (
        <a
            href="/mis-favoritos"
            className="relative p-2 text-carbon-600 hover:text-red-500 transition-colors"
            title="Mis Favoritos"
        >
            <svg
                className="w-6 h-6"
                fill={count > 0 ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={count > 0 ? 0 : 2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>

            {/* Badge */}
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </a>
    );
}
