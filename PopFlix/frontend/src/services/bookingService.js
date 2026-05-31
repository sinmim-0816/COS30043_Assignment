import backendClient from "../api/backendClient"
import { API_ENDPOINTS } from "../api/apiEndpoint";

export const bookingService = {
    async getMyBookings() {
        const response = await backendClient.get(API_ENDPOINTS.MY_BOOKINGS);
        return response.data;
    },

    async getBookingDetails(bookingId) {
        const response = await backendClient.get(API_ENDPOINTS.BOOKING_DETAILS(bookingId));
        return response.data;
    },

    async reserveBooking(bookingData) {
        const response = await backendClient.post(API_ENDPOINTS.BOOKINGS, bookingData);
        return response.data;
    },

    async processPayment(paymentData) {
        const response = await backendClient.post(API_ENDPOINTS.PAYMENTS, paymentData);
        return response.data;
    },

    async getMyVehicles() {
        const response = await backendClient.get(API_ENDPOINTS.VEHICLES);
        return response.data;
    },

    async addVehicle(vehicleData) {
        const response = await backendClient.post(API_ENDPOINTS.VEHICLES, vehicleData);
        return response.data;
    },

    async deleteVehicle(vehicleId) {
        const response = await backendClient.delete(API_ENDPOINTS.VEHICLE_DETAILS(vehicleId));
        return response.data;
    },

    async getLockedSeats(showtimeId) {
        const response = await backendClient.get(API_ENDPOINTS.LOCKED_SEATS(showtimeId));
        return response.data;
    },

    async getLockedParking(showtimeId) {
        const response = await backendClient.get(API_ENDPOINTS.LOCKED_PARKING(showtimeId));
        return response.data;
    },
}
