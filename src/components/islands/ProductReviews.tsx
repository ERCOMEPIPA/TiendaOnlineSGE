import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import type { Product } from '../../lib/supabase';

interface Review {
    id: string;
    product_id: string;
    user_id: string;
    user_name: string;
    rating: number;
    title: string | null;
    comment: string | null;
    verified_purchase: boolean;
    created_at: string;
}

interface RatingStats {
    average_rating: number;
    total_reviews: number;
    rating_5: number;
    rating_4: number;
    rating_3: number;
    rating_2: number;
    rating_1: number;
}

interface ProductReviewsProps {
    productId: string;
    productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userHasReviewed, setUserHasReviewed] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadReviews();
        checkAuth();
    }, [productId]);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/session');
            const data = await res.json();
            setIsAuthenticated(!!data.user);
        } catch (e) {
            setIsAuthenticated(false);
        }
    };

    const loadReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reviews?productId=${productId}`);
            const data = await res.json();

            if (res.ok) {
                setReviews(data.reviews || []);
                setStats(data.stats || null);
                setUserHasReviewed(data.userHasReviewed || false);
            }
        } catch (e) {
            console.error('Error loading reviews:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    rating,
                    title: title.trim() || null,
                    comment: comment.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Error al enviar la reseña');
                return;
            }

            setSuccess('¡Gracias por tu reseña!');
            setShowForm(false);
            setRating(5);
            setTitle('');
            setComment('');
            loadReviews();
        } catch (e) {
            setError('Error de conexión');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getRatingPercentage = (count: number) => {
        if (!stats || stats.total_reviews === 0) return 0;
        return Math.round((count / stats.total_reviews) * 100);
    };

    return (
        <div className="mt-12 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">
                Opiniones de clientes
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Rating Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6">
                        {stats && stats.total_reviews > 0 ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-gray-900">
                                        {stats.average_rating.toFixed(1)}
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        <StarRating rating={stats.average_rating} size="lg" />
                                    </div>
                                    <p className="text-gray-500 mt-2">
                                        {stats.total_reviews} {stats.total_reviews === 1 ? 'reseña' : 'reseñas'}
                                    </p>
                                </div>

                                {/* Rating Bars */}
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = stats[`rating_${star}` as keyof RatingStats] as number;
                                        const percentage = getRatingPercentage(count);
                                        return (
                                            <div key={star} className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 w-3">{star}</span>
                                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-yellow-400 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8">{percentage}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Sin reseñas todavía</p>
                                <p className="text-sm text-gray-400 mt-1">¡Sé el primero en opinar!</p>
                            </div>
                        )}

                        {/* Write Review Button */}
                        <div className="mt-6">
                            {isAuthenticated ? (
                                userHasReviewed ? (
                                    <p className="text-center text-sm text-green-600">
                                        Ya has dejado tu opinión
                                    </p>
                                ) : (
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className="w-full bg-[#2a2622] text-white py-3 rounded-lg font-medium
                                                 hover:bg-[#3d3831] transition-colors"
                                        style={{ color: 'white' }}
                                    >
                                        Escribir una reseña
                                    </button>
                                )
                            ) : (
                                <a
                                    href="/login"
                                    className="block w-full text-center bg-[#2a2622] text-white py-3 rounded-lg font-medium
                                             hover:bg-[#3d3831] transition-colors"
                                    style={{ color: 'white' }}
                                >
                                    Inicia sesión para opinar
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2">
                    {/* Review Form */}
                    {showForm && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Tu opinión sobre {productName}</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Valoración
                                    </label>
                                    <StarRating
                                        rating={rating}
                                        size="lg"
                                        interactive
                                        onRatingChange={setRating}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-2">
                                        Título (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="review-title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Resume tu opinión en una frase"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                                        Comentario (opcional)
                                    </label>
                                    <textarea
                                        id="review-comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Cuéntanos más sobre tu experiencia con este producto..."
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                                        maxLength={1000}
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-600 text-sm">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-[#2a2622] text-white rounded-lg font-medium
                                                 hover:bg-[#3d3831] transition-colors disabled:opacity-50"
                                        style={{ color: 'white' }}
                                    >
                                        {submitting ? 'Enviando...' : 'Enviar reseña'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6">
                            {success}
                        </div>
                    )}

                    {/* Reviews */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            Cargando reseñas...
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={review.rating} size="sm" />
                                                {review.verified_purchase && (
                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        Compra verificada
                                                    </span>
                                                )}
                                            </div>
                                            {review.title && (
                                                <h4 className="font-semibold text-gray-900 mt-1">{review.title}</h4>
                                            )}
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="text-gray-600 mt-2">{review.comment}</p>
                                    )}

                                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                                        <span className="font-medium text-gray-600">{review.user_name}</span>
                                        <span>•</span>
                                        <span>{formatDate(review.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No hay reseñas todavía.</p>
                            <p className="text-sm mt-1">¡Sé el primero en dejar tu opinión!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
