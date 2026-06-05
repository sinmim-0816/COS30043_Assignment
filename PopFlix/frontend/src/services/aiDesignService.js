import { API_ENDPOINTS } from '../api/apiEndpoint';
import backendClient from '../api/backendClient';

export const aiDesignService = {
    generateTicketDesign(payload) {
        return backendClient.post(API_ENDPOINTS.AI_TICKET_DESIGN, payload);
    }
};
