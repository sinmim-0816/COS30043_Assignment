import { ref, computed } from 'vue';
import { ReviewService } from '@/services/reviewService';

export function useReviews() {
    const reviews = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const fetchReviews = async (movieId) => {
        isLoading.value = true;
        try {
            const data = await ReviewService.getReviewsByMovie(movieId);
            console.log(movieId)
            console.log('Fetched reviews data:', data);
            reviews.value = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            console.log('Processed reviews:', reviews.value);
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