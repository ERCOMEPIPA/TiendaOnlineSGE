import { useState } from 'react';

interface CouponData {
    id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
}

interface CouponInputProps {
    cartTotal: number;
    onCouponApplied: (coupon: CouponData | null, discountAmount: number) => void;
}

export default function CouponInput({ cartTotal, onCouponApplied }: CouponInputProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const validateCoupon = async () => {
        if (!code.trim()) {
            setError('Introduce un código de cupón');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim(), cartTotal })
            });

            const data = await response.json();

            if (data.valid) {
                setAppliedCoupon(data.coupon);
                setDiscountAmount(data.discountAmount);
                onCouponApplied(data.coupon, data.discountAmount);
                setError('');
            } else {
                setError(data.error || 'Cupón no válido');
                setAppliedCoupon(null);
                setDiscountAmount(0);
                onCouponApplied(null, 0);
            }
        } catch (err) {
            setError('Error al validar el cupón');
            setAppliedCoupon(null);
            setDiscountAmount(0);
            onCouponApplied(null, 0);
        } finally {
            setIsLoading(false);
        }
    };

    const removeCoupon = () => {
        setCode('');
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setError('');
        onCouponApplied(null, 0);
    };

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    if (appliedCoupon) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                            <p className="text-sm text-green-600">
                                {appliedCoupon.description || `Ahorra ${formatPrice(discountAmount)}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={removeCoupon}
                        className="text-green-600 hover:text-green-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-2 text-right">
                    <span className="text-green-700 font-semibold">-{formatPrice(discountAmount)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                ¿Tienes un cupón de descuento?
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Código de cupón"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    disabled={isLoading}
                />
                <button
                    onClick={validateCoupon}
                    disabled={isLoading || !code.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        'Aplicar'
                    )}
                </button>
            </div>
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
