import backendClient from '../api/backendClient';
import { API_ENDPOINTS } from '../api/apiEndpoint';

export const reminderService = {
    async createReminder(movieId) {
        return await backendClient.post(API_ENDPOINTS.CREATE_REMINDER(movieId));
    },
    async checkReminder(movieId) {
        return await backendClient.get(API_ENDPOINTS.CHECK_REMINDER(movieId));
    }
};