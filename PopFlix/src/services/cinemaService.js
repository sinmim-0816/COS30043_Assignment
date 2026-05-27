import backendClient from "@/api/backendClient";
import { API_ENDPOINTS } from "@/api/apiEndpoint";

export const CinemaService = {
    async getCinemas() {
        try {
            const response = await backendClient.get(API_ENDPOINTS.CINEMAS);
            return response.data;
        } catch (error) {
            console.error('Error fetching cinemas:', error);
            return [];
        }
    }
};