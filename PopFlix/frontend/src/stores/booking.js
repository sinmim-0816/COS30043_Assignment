import { defineStore } from "pinia";
import { bookingService } from "../services/bookingService";

export const useBookingStore = defineStore('booking', {
    state: () => ({
        currentBooking: JSON.parse(localStorage.getItem('currentBooking')) || null,
        countdownText: '08:00',
        isLoading: false,
        errorMessages: '',
        lockedSeats: [],
        lockedParkingSpots: [],
    }),

    getters: {
        isReserved: (state) => !!state.currentBooking,
    },

    actions: {
        async fetchLockedSeats(showtimeId) {
            try {
                const data = await bookingService.getLockedSeats(showtimeId);
                this.lockedSeats = data;
            } catch (err) {
                console.error("Failed to populate locked seats array:", err);
            }
        },
        async fetchLockedParking(showtimeId) {
            try {
                const data = await bookingService.getLockedParking(showtimeId);
                this.lockedParkingSpots = data;
            } catch (err) {
                console.error("Failed to populate locked parking spots array:", err);
            }
        },
        startGlobalTimer(secondsRemaining, onExpiredCallback) {
            this.stopGlobalTimer();
            let timeLeft = Number(secondsRemaining);
            this.countdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    this.stopGlobalTimer();
                    this.countdownText = '00:00';
                    this.handleReservationExpiry(onExpiredCallback);
                    return;
                }

                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;

                this.countdownText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }, 1000);
        },

        stopGlobalTimer() {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        },

        handleReservationExpiry(onExpiredCallback) {
            this.clearBookingSession();
            this.currentBooking = null;
            this.errorMessages = 'Your reservation expired! Seats have been released.';

            if (onExpiredCallback) {
                onExpiredCallback();
            }
        },

        async reserveSeats(dto, onExpiredCallback) {
            this.isLoading = true;
            this.errorMessages = '';
            try {
                const data = await bookingService.reserveBooking(dto);
                this.currentBooking = data;
                localStorage.setItem('currentBooking', JSON.stringify(data));
                const initialDeadline = new Date(data.expiresAt).getTime();
                localStorage.setItem('timerDeadline', initialDeadline.toString());
                const totalSeconds = Math.floor((initialDeadline - Date.now()) / 1000);
                this.startGlobalTimer(totalSeconds > 0 ? totalSeconds : 480, onExpiredCallback);
                return data;
            } catch (err) {
                this.errorMessages = err.response?.data?.message || 'Failed to lock selected seats.';
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        async confirmPayment(transactionId, amountPaid, paymentMethod) {
            if (!this.currentBooking) {
                return;
            }
            this.isLoading = true;
            this.errorMessages = '';
            try {
                const result = await bookingService.processPayment({
                    bookingId: this.currentBooking.id,
                    transactionId: transactionId,
                    amount: Number(amountPaid),
                    paymentMethod: paymentMethod
                });
                this.currentBooking = {
                    ...this.currentBooking,
                    status: 'PAID'
                };
                localStorage.setItem('currentBooking', JSON.stringify(this.currentBooking));
                return result;
            } catch (err) {
                this.errorMessages = err.response?.data?.message || 'Payment processing failed.';
                throw err;
            } finally {
                this.isLoading = false;
            }
        },

        clearBookingSession() {
            this.stopGlobalTimer();
            this.currentBooking = null;
            this.lockedSeats = [];
            this.lockedParkingSpots = [];
            localStorage.removeItem('currentBooking');
            localStorage.removeItem('timerDeadline');
            this.countdownText = '08:00';
        }
    }
})
