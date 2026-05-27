import { ref, computed } from 'vue';
import { ReviewService } from '@/services/reviewService';

export function useReviews() {
    const reviews = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const fetchReviews = async (movieId) => {
        isLoading.value = true;
        try {
            reviews.value = await ReviewService.getReviewsByMovie(movieId);
        } catch (err) {
            error.value = "Failed to load reviews";
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    };

    const submitReview = async (reviewData) => {
        return await ReviewService.postReview(reviewData);
    };

    const latestReviews = computed(() => {
        return [...reviews.value]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
    });

    return { reviews: latestReviews, isLoading, error, fetchReviews, submitReview };
}