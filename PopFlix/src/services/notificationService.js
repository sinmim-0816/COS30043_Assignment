import backendClient from '@/api/backendClient';
import { API_ENDPOINTS } from '@/api/apiEndpoint';

export const notificationService = {
    async getNotificationHistory(userId) {
        const response = await backendClient.get(API_ENDPOINTS.NOTIFICATIONS.FETCH_HISTORY(userId));
        return response.data;
    },

    async markAsRead(notificationId) {
        const response = await backendClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
        return response.data;
    },

    async markAllAsRead(userId) {
        const response = await backendClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ(userId));
        return response.data;
    },

    async deleteNotification(notificationId) {
        const response = await backendClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));
        return response.data;
    }
};