import { useState, useEffect, useRef } from 'react';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    artist?: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Search products
    useEffect(() => {
        const searchProducts = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.products || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#2a2622]/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative max-w-2xl mx-auto mt-20 bg-[#fdfcf9] rounded-none shadow-2xl overflow-hidden border border-[#ccc5b8]"
            >
                {/* Search Input */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-[#ccc5b8]">
                    <svg className="w-5 h-5 text-[#8B4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && query.length >= 2) {
                                window.location.href = `/productos?q=${encodeURIComponent(query)}`;
                            }
                        }}
                        placeholder="Buscar productos, artistas..."
                        className="flex-1 text-lg outline-none bg-transparent text-[#2a2622] placeholder:text-[#ada397]"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-[#f2ede4] rounded-none transition-colors text-[#6f6458]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-xs uppercase tracking-widest text-[#6f6458] hover:text-[#2a2622] font-semibold"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[#ccc5b8] border-t-[#8B4513] rounded-full animate-spin" />
                        </div>
                    )}

                    {!isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="py-12 text-center text-[#6f6458]">
                            <svg className="w-12 h-12 mx-auto mb-4 text-[#ccc5b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No se encontraron productos para "{query}"</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <ul className="divide-y divide-[#ccc5b8]">
                            {results.map((product) => (
                                <li key={product.id}>
                                    <a
                                        href={`/productos/${product.slug}`}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f7f2] transition-colors"
                                        onClick={onClose}
                                    >
                                        <div className="w-16 h-16 bg-[#e8e4db] rounded-none overflow-hidden flex-shrink-0">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#2a2622] truncate">{product.name}</p>
                                            {product.artist && (
                                                <p className="text-sm text-[#6f6458]">{product.artist}</p>
                                            )}
                                        </div>
                                        <div className="font-semibold text-[#8B4513]">
                                            {formatPrice(product.price)}
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!isLoading && query.length < 2 && (
                        <div className="py-12 text-center text-[#6f6458]">
                            <svg className="w-12 h-12 mx-auto mb-4 text-[#ccc5b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p>Escribe al menos 2 caracteres para buscar</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-6 py-4 bg-[#f9f7f2] border-t border-[#ccc5b8]">
                        <a
                            href={`/productos?q=${encodeURIComponent(query)}`}
                            className="text-xs uppercase tracking-widest text-[#8B4513] hover:text-[#2a2622] font-bold"
                            onClick={onClose}
                        >
                            Ver todos los resultados →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
