// Cart Reservation System
// Reserves cart items for 15 minutes during checkout

const RESERVATION_KEY = 'cart_reservation';
const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface CartReservation {
    startTime: number;
    expiresAt: number;
    items: any[];
}

// Start a reservation
export function startReservation(items: any[]): CartReservation {
    const now = Date.now();
    const reservation: CartReservation = {
        startTime: now,
        expiresAt: now + RESERVATION_DURATION_MS,
        items: items,
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(RESERVATION_KEY, JSON.stringify(reservation));
    }

    return reservation;
}

// Get current reservation
export function getReservation(): CartReservation | null {
    if (typeof window === 'undefined') return null;

    const saved = localStorage.getItem(RESERVATION_KEY);
    if (!saved) return null;

    try {
        const reservation: CartReservation = JSON.parse(saved);

        // Check if expired
        if (Date.now() > reservation.expiresAt) {
            clearReservation();
            return null;
        }

        return reservation;
    } catch {
        return null;
    }
}

// Clear reservation
export function clearReservation(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(RESERVATION_KEY);
    }
}

// Get remaining time in milliseconds
export function getRemainingTime(): number {
    const reservation = getReservation();
    if (!reservation) return 0;

    const remaining = reservation.expiresAt - Date.now();
    return Math.max(0, remaining);
}

// Check if reservation is active
export function hasActiveReservation(): boolean {
    return getReservation() !== null;
}

// Format remaining time as MM:SS
export function formatRemainingTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Extend reservation (if user is still active)
export function extendReservation(): void {
    const reservation = getReservation();
    if (reservation) {
        reservation.expiresAt = Date.now() + RESERVATION_DURATION_MS;
        if (typeof window !== 'undefined') {
            localStorage.setItem(RESERVATION_KEY, JSON.stringify(reservation));
        }
    }
}
