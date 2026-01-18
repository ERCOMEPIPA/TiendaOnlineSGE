import { useState } from 'react';

interface SizeRecommenderProps {
    sizes: string[];
    onSelectSize: (size: string) => void;
}

type FitPreference = 'ajustada' | 'regular' | 'oversized';

// Orden de tallas para poder subir o bajar
const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Ajustar talla según preferencia de fit
function adjustSizeForFit(baseSize: string, fit: FitPreference): string {
    const index = sizeOrder.indexOf(baseSize);
    if (index === -1) return baseSize;

    if (fit === 'ajustada') {
        // Una talla menos
        return sizeOrder[Math.max(0, index - 1)];
    } else if (fit === 'oversized') {
        // Una talla más
        return sizeOrder[Math.min(sizeOrder.length - 1, index + 1)];
    }
    return baseSize; // regular
}

// Algoritmo de recomendación de talla base
function recommendSize(height: number, weight: number, fit: FitPreference): string {
    let baseSize: string;

    // Lógica de recomendación basada en altura y peso
    if (weight < 55) {
        baseSize = 'XS';
    } else if (weight < 65) {
        if (height < 165) baseSize = 'XS';
        else if (height < 175) baseSize = 'S';
        else baseSize = 'M';
    } else if (weight < 75) {
        if (height < 165) baseSize = 'S';
        else if (height < 175) baseSize = 'M';
        else if (height < 185) baseSize = 'M';
        else baseSize = 'L';
    } else if (weight < 85) {
        if (height < 170) baseSize = 'M';
        else if (height < 180) baseSize = 'L';
        else baseSize = 'L';
    } else if (weight < 95) {
        if (height < 175) baseSize = 'L';
        else baseSize = 'XL';
    } else {
        if (height < 180) baseSize = 'XL';
        else baseSize = 'XXL';
    }

    // Ajustar según preferencia de fit
    return adjustSizeForFit(baseSize, fit);
}

export default function SizeRecommender({ sizes, onSelectSize }: SizeRecommenderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [fit, setFit] = useState<FitPreference>('regular');
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);

        if (isNaN(h) || isNaN(w)) {
            setError('Por favor, introduce valores numéricos válidos');
            return;
        }

        if (h < 100 || h > 250) {
            setError('La altura debe estar entre 100 y 250 cm');
            return;
        }

        if (w < 30 || w > 200) {
            setError('El peso debe estar entre 30 y 200 kg');
            return;
        }

        setError('');
        const recommended = recommendSize(h, w, fit);
        setRecommendation(recommended);
    };

    const handleSelectRecommended = () => {
        if (recommendation && sizes.includes(recommendation)) {
            onSelectSize(recommendation);
            setIsOpen(false);
            setRecommendation(null);
            setHeight('');
            setWeight('');
            setFit('regular');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setRecommendation(null);
        setError('');
        setFit('regular');
    };

    return (
        <>
            {/* Button to open modal */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
                ¿Cuál es mi talla?
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Encuentra tu talla</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Introduce tus medidas para obtener una recomendación
                            </p>
                        </div>

                        {/* Form */}
                        {!recommendation ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Altura (cm)
                                    </label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        placeholder="Ej: 175"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Peso (kg)
                                    </label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="Ej: 70"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Fit Preference */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ¿Cómo te gusta que te quede?
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFit('ajustada')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${fit === 'ajustada'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            👕 Ajustada
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFit('regular')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${fit === 'regular'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            👔 Regular
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFit('oversized')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${fit === 'oversized'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            🧥 Oversized
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm">{error}</p>
                                )}

                                <button
                                    onClick={handleCalculate}
                                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Calcular mi talla
                                </button>
                            </div>
                        ) : (
                            /* Result */
                            <div className="text-center">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                                    <p className="text-green-700 text-sm mb-2">Te recomendamos la talla</p>
                                    <p className="text-4xl font-bold text-green-600">{recommendation}</p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Basado en {height} cm y {weight} kg
                                    </p>
                                </div>

                                {sizes.includes(recommendation) ? (
                                    <button
                                        onClick={handleSelectRecommended}
                                        className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Seleccionar talla {recommendation}
                                    </button>
                                ) : (
                                    <p className="text-amber-600 text-sm">
                                        Esta talla no está disponible para este producto
                                    </p>
                                )}

                                <button
                                    onClick={() => setRecommendation(null)}
                                    className="mt-3 text-gray-500 hover:text-gray-700 text-sm underline"
                                >
                                    Volver a calcular
                                </button>
                            </div>
                        )}

                        {/* Footer note */}
                        <p className="text-center text-gray-400 text-xs mt-6">
                            Esta es una recomendación orientativa. Las tallas pueden variar según el corte de la prenda.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
