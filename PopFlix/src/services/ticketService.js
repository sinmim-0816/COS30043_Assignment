import { API_ENDPOINTS } from "@/api/apiEndpoint";
import backendClient from "@/api/backendClient";

export const ticketService = {
  async findAll() {
    const response = await backendClient.get(API_ENDPOINTS.TICKETS);
    return response.data;
  },

  async findOne(id) {
    const response = await backendClient.get(API_ENDPOINTS.TICKET_DETAILS(id));
    return response.data;
  },
};