import { useState, useMemo } from 'react';
import { formatPrice } from '../../lib/supabase';
import WishlistButton from './WishlistButton';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    sizes: string[] | null;
    category_id: string | null;
    images: string[] | null;
    featured: boolean;
    artist: string | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface ProductFiltersProps {
    products: Product[];
    categories: Category[];
}

export default function ProductFilters({ products, categories }: ProductFiltersProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('recent');

    // Filter products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (selectedCategories.length > 0) {
            result = result.filter(p => p.category_id && selectedCategories.includes(p.category_id));
        }

        // Filter by price
        if (selectedPriceRanges.length > 0) {
            result = result.filter(p => {
                const priceEur = p.price / 100;
                return selectedPriceRanges.some(range => {
                    if (range === 'under30') return priceEur < 30;
                    if (range === '30to50') return priceEur >= 30 && priceEur <= 50;
                    if (range === 'over50') return priceEur > 50;
                    return true;
                });
            });
        }

        // Filter by size
        if (selectedSizes.length > 0) {
            result = result.filter(p =>
                p.sizes && p.sizes.some(size => selectedSizes.includes(size))
            );
        }

        // Sort
        if (sortBy === 'price-asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [products, selectedCategories, selectedPriceRanges, selectedSizes, sortBy]);

    const toggleCategory = (id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const togglePriceRange = (range: string) => {
        setSelectedPriceRanges(prev =>
            prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
        );
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPriceRanges([]);
        setSelectedSizes([]);
    };

    const hasActiveFilters = selectedCategories.length > 0 || selectedPriceRanges.length > 0 || selectedSizes.length > 0;

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    return (
        <div className="lg:flex lg:gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Categories filter */}
                    {categories.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Categoría</h4>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => toggleCategory(cat.id)}
                                            className="rounded border-gray-300 text-blue-800 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price filter */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Precio</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPriceRanges.includes('under30')}
                                    onChange={() => togglePriceRange('under30')}
                                    className="rounded border-gray-300 text-blue-800 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Menos de 30€</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPriceRanges.includes('30to50')}
                                    onChange={() => togglePriceRange('30to50')}
                                    className="rounded border-gray-300 text-blue-800 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">30€ - 50€</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPriceRanges.includes('over50')}
                                    onChange={() => togglePriceRange('over50')}
                                    className="rounded border-gray-300 text-blue-800 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Más de 50€</span>
                            </label>
                        </div>
                    </div>

                    {/* Size filter */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Talla</h4>
                        <div className="flex flex-wrap gap-2">
                            {sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => toggleSize(size)}
                                    className={`px-3 py-1 text-sm border rounded transition-colors ${selectedSizes.includes(size)
                                        ? 'bg-blue-800 text-white border-blue-800'
                                        : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
                {/* Sort controls */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-500">
                        Mostrando {filteredProducts.length} de {products.length} productos
                    </p>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="recent">Más recientes</option>
                        <option value="price-asc">Precio: menor a mayor</option>
                        <option value="price-desc">Precio: mayor a menor</option>
                    </select>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative"
                        >
                            {/* Wishlist Button */}
                            <div className="absolute top-3 right-3 z-10">
                                <WishlistButton product={product as any} size="sm" />
                            </div>

                            <a href={`/productos/${product.slug}`}>
                                {/* Image */}
                                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                                    {product.images && product.images[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.featured && (
                                        <span className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            Destacado
                                        </span>
                                    )}
                                    {product.stock < 1 && (
                                        <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                                            <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold">
                                                Agotado
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    {product.artist && (
                                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">
                                            {product.artist}
                                        </p>
                                    )}
                                    <h3 className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <p className="mt-2 text-lg font-serif font-semibold text-gray-900">
                                        {formatPrice(product.price)}
                                    </p>
                                    {product.sizes && product.sizes.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {product.sizes.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </a>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-gray-500 font-medium">No hay productos con estos filtros</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
