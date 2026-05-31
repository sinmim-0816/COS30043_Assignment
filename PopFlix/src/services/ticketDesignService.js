import { API_ENDPOINTS } from '@/api/apiEndpoint';
import backendClient from '@/api/backendClient';

export const ticketDesignService = {
    saveDesign: async (payload) => {
        return await backendClient.post(API_ENDPOINTS.TICKET_DESIGNS, payload);
    },

    getDesign: async (bookingId) => {
        return await backendClient.get(API_ENDPOINTS.GET_TICKET_DESIGN(bookingId));
    },

    getMyDesigns() {
        return backendClient.get(API_ENDPOINTS.GET_MY_DESIGN);
    }
};