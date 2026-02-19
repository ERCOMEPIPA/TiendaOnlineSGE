import React, { useEffect, useState } from 'react';

interface StockAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    availableStock: number;
    requestedQuantity: number;
}

export default function StockAlertModal({
    isOpen,
    onClose,
    productName,
    availableStock,
    requestedQuantity,
}: StockAlertModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Prevent scrolling when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`
          relative bg-[#1a2332] text-white rounded-xl shadow-2xl w-full max-w-md p-6 
          transform transition-all duration-300 border border-gray-700
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 font-serif tracking-wide">
                        Stock Insuficiente
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                        Lo sentimos, no hay suficiente stock disponible de <span className="text-white font-semibold">"{productName}"</span>.
                        <br />
                        <br />
                        <span className="text-sm bg-gray-800 px-3 py-1 rounded-full border border-gray-600">
                            Solo quedan <span className="text-red-400 font-bold">{availableStock}</span> unidades
                        </span>
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 bg-white text-[#1a2332] font-bold rounded-lg hover:bg-gray-200 transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
