import { ref, onMounted } from 'vue';
import { CinemaService } from '../services/cinemaService';

export function useCinemas() {
    const cinemas = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    const fetchCinemas = async () => {
        isLoading.value = true;
        error.value = null;
        try {
            const data = await CinemaService.getCinemas();
            cinemas.value = data;
        } catch (err) {
            error.value = "Failed to load cinema data.";
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    };

    onMounted(fetchCinemas);

    return {
        cinemas,
        isLoading,
        error,
        fetchCinemas
    };
}