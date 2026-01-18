import { useState, useEffect, useCallback } from 'react';
import {
    getReservation,
    getRemainingTime,
    formatRemainingTime,
    clearReservation,
} from '../../lib/cartReservation';

interface CheckoutTimerProps {
    onExpire?: () => void;
}

export default function CheckoutTimer({ onExpire }: CheckoutTimerProps) {
    const [remainingMs, setRemainingMs] = useState(getRemainingTime());
    const [isVisible, setIsVisible] = useState(false);

    const checkReservation = useCallback(() => {
        const reservation = getReservation();
        if (reservation) {
            setIsVisible(true);
            setRemainingMs(getRemainingTime());
        } else {
            setIsVisible(false);
        }
    }, []);

    useEffect(() => {
        // Check initial state
        checkReservation();

        // Listen for reservation started event
        const handleReservationStarted = () => {
            checkReservation();
        };

        // Listen for reservation cleared event (when cart is emptied)
        const handleReservationCleared = () => {
            setIsVisible(false);
            setRemainingMs(0);
        };

        window.addEventListener('reservationStarted', handleReservationStarted);
        window.addEventListener('reservationCleared', handleReservationCleared);

        // Update every second
        const interval = setInterval(() => {
            const remaining = getRemainingTime();
            setRemainingMs(remaining);

            if (remaining <= 0 && isVisible) {
                clearInterval(interval);
                clearReservation();
                setIsVisible(false);

                // Dispatch expiry event
                window.dispatchEvent(new CustomEvent('reservationExpired'));

                if (onExpire) {
                    onExpire();
                }
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reservationStarted', handleReservationStarted);
            window.removeEventListener('reservationCleared', handleReservationCleared);
        };
    }, [onExpire, isVisible, checkReservation]);

    if (!isVisible || remainingMs <= 0) {
        return null;
    }

    const minutes = Math.floor(remainingMs / 60000);
    const isLowTime = minutes < 5;
    const isCritical = minutes < 2;

    return (
        <div
            className={`
                fixed top-20 left-1/2 -translate-x-1/2 z-40
                px-6 py-3 rounded-full shadow-lg
                flex items-center gap-3
                transition-all duration-300
                ${isCritical
                    ? 'bg-red-500 text-white animate-pulse'
                    : isLowTime
                        ? 'bg-yellow-500 text-yellow-900'
                        : 'bg-navy-800 text-white'}
            `}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-center">
                <p className="text-xs opacity-90">Tu carrito está reservado por</p>
                <p className="font-bold text-lg font-mono tracking-wider">
                    {formatRemainingTime(remainingMs)}
                </p>
            </div>
            {isCritical && (
                <span className="animate-ping absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></span>
            )}
        </div>
    );
}
