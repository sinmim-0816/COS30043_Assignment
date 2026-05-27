import backendClient from '@/api/backendClient';
import { API_ENDPOINTS } from '@/api/apiEndpoint';

export const authService = {
    async login(email, password) {
        const response = await backendClient.post(API_ENDPOINTS.LOGIN, {
            email,
            password,
        });
        return response.data;
    },

    async getProfile() {
        const response = await backendClient.get(API_ENDPOINTS.ME);
        return response.data;
    },

    async register(userData) {
        try {
            const response = await backendClient.post(API_ENDPOINTS.REGISTER, userData);
            return response.data;
        } catch (error) {
            if (!error.response) throw "Cannot connect to server. Please try again later.";
            throw error.response.data.message;
        }
    },

    async forgotPassword(email) {
        const response = await backendClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
        return response.data;
    },

    async resetPassword(token, newPassword) {
        const response = await backendClient.post(API_ENDPOINTS.RESET_PASSWORD, {
            token,
            newPassword
        });
        return response.data;
    }
};