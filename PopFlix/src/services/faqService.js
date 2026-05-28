import backendClient from "@/api/backendClient";
import { API_ENDPOINTS } from "@/api/apiEndpoint";

export const faqService = {
    async getAllFaqs() {
        try {
            const response = await backendClient.get(API_ENDPOINTS.FAQS);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Failed to fetch FAQs";
        }
    }
}