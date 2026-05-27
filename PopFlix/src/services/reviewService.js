import backendClient from '@/api/backendClient';
import { API_ENDPOINTS } from '@/api/apiEndpoint';

export const ReviewService = {
    async getReviewsByMovie(movieId) {
        const { data } = await backendClient.get(API_ENDPOINTS.REVIEWS_BY_MOVIE(movieId));
        return data;
    },

    async postReview(reviewData) {
        const { data } = await backendClient.post(API_ENDPOINTS.REVIEWS, reviewData);
        return data;
    }
};